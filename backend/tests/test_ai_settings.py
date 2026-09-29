"""AI settings (R2 of the 2026-09-26 report): the chat chooses a provider, model and
reasoning level per request, only inside the backend's catalogue."""

import pytest

import app as app_module
from conftest import PNG_B64


@pytest.fixture
def keys(monkeypatch):
    """Both keys set; model listing offline (the curated list is offered as it is)."""
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setenv("GOOGLE_API_KEY", "test")
    monkeypatch.setattr(app_module, "_reachable_models", lambda provider: None)


def choice(ai):
    return app_module._ai_choice({"ai": ai} if ai is not None else {})


def test_defaults_without_a_choice(keys):
    assert choice(None) == {
        "provider": "openai",
        "model": app_module.OPENAI_MODEL,
        "reasoning": None,
    }


def test_a_listed_choice_is_kept(keys):
    assert choice(
        {"provider": "gemini", "model": "gemini-3.7-flash", "reasoning": "low"}
    ) == {"provider": "gemini", "model": "gemini-3.7-flash", "reasoning": "low"}


@pytest.mark.parametrize(
    "ai, expected",
    [
        # a model outside the list: the provider's default
        (
            {"provider": "openai", "model": "gpt-5.5-pro"},
            ("openai", app_module.OPENAI_MODEL, None),
        ),
        # an unknown level
        (
            {"provider": "openai", "model": "gpt-6-luna", "reasoning": "max"},
            ("openai", "gpt-6-luna", None),
        ),
        # a model dropped from the list (R2 of the 2026-09-27 report)
        (
            {"provider": "openai", "model": "gpt-4.1-mini"},
            ("openai", app_module.OPENAI_MODEL, None),
        ),
        # not a provider, or not a dict at all
        ({"provider": "anthropic"}, ("openai", app_module.OPENAI_MODEL, None)),
        ("gemini", ("openai", app_module.OPENAI_MODEL, None)),
    ],
)
def test_anything_else_falls_back(keys, ai, expected):
    c = choice(ai)
    assert (c["provider"], c["model"], c["reasoning"]) == expected


def test_a_provider_without_its_key_is_not_chosen(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    assert choice({"provider": "gemini"})["provider"] == "openai"


def test_requests_carry_model_and_reasoning():
    args = dict(png_b64=PNG_B64, viewport_b64=None, meta={}, history=[], message="hi")
    ai = {"provider": "openai", "model": "gpt-6-luna", "reasoning": "high"}
    req = app_module._chat_openai_request(**args, ai=ai)
    assert req["model"] == "gpt-6-luna"
    assert req["reasoning"] == {"effort": "high"}
    plain = app_module._chat_openai_request(**args)
    assert plain["model"] == app_module.OPENAI_MODEL and "reasoning" not in plain

    g = app_module._chat_gemini_request(
        **args,
        ai={"provider": "gemini", "model": "gemini-3.7-flash", "reasoning": "low"}
    )
    assert g["model"] == "gemini-3.7-flash"
    assert g["config"].thinking_config.thinking_level.value == "LOW"
    assert app_module._chat_gemini_request(**args)["config"].thinking_config is None


def test_catalogue_lists_what_each_key_reaches(client, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setattr(
        app_module,
        "_reachable_models",
        lambda p: (
            {"gpt-5.4-mini", "gpt-6-luna", app_module.TTS_MODELS["openai"][0]}
            if p == "openai"
            else None
        ),
    )
    body = client.get("/api/ai").get_json()
    assert body["default"] == "openai"
    assert [m["id"] for m in body["providers"]["openai"]["models"]] == [
        "gpt-6-luna",
        "gpt-5.4-mini",
    ]
    assert body["providers"]["gemini"] == {
        "available": False,
        "default": app_module.GEMINI_MODEL,
        "models": [],
    }
    assert body["reasoning"] == ["low", "medium", "high"]
    assert "alloy" in body["voices"]
    # read aloud: what each key can speak with, and the one used by default
    assert body["tts"]["openai"]["models"] == app_module.TTS_MODELS["openai"]
    assert "alloy" in body["tts"]["openai"]["voices"]
    assert body["tts"]["gemini"] == {"models": [], "voices": []}
    assert body["ttsDefault"] == "openai"


def test_done_frame_reports_the_model_used(client, monkeypatch):
    """The debug panel shows what really answered: the choice, not a constant."""
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setattr(app_module, "_reachable_models", lambda provider: None)
    seen = {}

    def fake(**kw):
        seen.update(kw)
        return iter(["ok"])

    monkeypatch.setitem(app_module.PROVIDERS["openai"], "stream", fake)
    cap = app_module.CAPTURES_DIR / "0123456789ab"
    cap.mkdir()
    import base64, json

    (cap / "capture.png").write_bytes(base64.b64decode(PNG_B64))
    (cap / "meta.json").write_text(json.dumps({"url": "https://x.test/"}))
    (cap / "chat.json").write_text("[]")
    res = client.post(
        "/api/chat/stream",
        json={
            "capture_id": "0123456789ab",
            "message": "hi",
            "ai": {"provider": "openai", "model": "gpt-5.4-nano", "reasoning": "low"},
        },
    )
    frames = [
        json.loads(line[6:])
        for line in res.get_data(as_text=True).split("\n\n")
        if line.startswith("data: ")
    ]
    assert frames[-1]["model"] == "gpt-5.4-nano"
    assert seen["ai"]["reasoning"] == "low"


# ── Codex's review ──────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "ai",
    [
        {"provider": []},
        {"provider": "openai", "model": {"x": 1}},
        {"provider": "openai", "model": "gpt-6-luna", "reasoning": ["high"]},
    ],
)
def test_malformed_choices_fall_back_instead_of_failing(keys, ai):
    c = choice(ai)
    assert c["provider"] == "openai" and c["reasoning"] is None


def test_a_model_the_key_does_not_reach_falls_back(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setattr(
        app_module, "_reachable_models", lambda p: {app_module.OPENAI_MODEL}
    )
    assert choice({"provider": "openai", "model": "gpt-6-sol"})["model"] == (
        app_module.OPENAI_MODEL
    )


def test_each_model_takes_only_its_levels(keys, monkeypatch):
    monkeypatch.setitem(
        app_module.AI_MODELS,
        "openai",
        [
            ("gpt-5.4", ("low", "medium", "high")),
            ("gpt-5-pro", ("high",)),
            ("gpt-4.1-mini", ()),
        ],
    )
    # a level on a model that does not reason
    assert (
        choice({"provider": "openai", "model": "gpt-4.1-mini", "reasoning": "high"})[
            "reasoning"
        ]
        is None
    )
    assert (
        choice({"provider": "openai", "model": "gpt-5-pro", "reasoning": "low"})[
            "reasoning"
        ]
        is None
    )
    assert choice({"provider": "openai", "model": "gpt-5-pro", "reasoning": "high"})[
        "reasoning"
    ] == ("high")
    assert app_module._levels_of("gpt-5.5-pro") == ("high",)
    assert app_module._levels_of("gpt-6-astra") == ("low", "medium", "high")
    assert app_module._levels_of("gpt-4.1") == ()


def test_a_failed_listing_keeps_the_last_success(monkeypatch):
    monkeypatch.setattr(app_module, "_REACHABLE", {})
    calls = {"n": 0}

    class Models:
        def list(self):
            calls["n"] += 1
            if calls["n"] > 1:
                raise ConnectionError("offline")
            return [type("M", (), {"id": "gpt-5.4"})()]

    class Client:
        models = Models()

    import openai

    monkeypatch.setattr(openai, "OpenAI", lambda **kw: Client())
    assert app_module._reachable_models("openai") == {"gpt-5.4"}
    # expire it: the next listing fails, and the last success stays
    until, ids = app_module._REACHABLE["openai"]
    app_module._REACHABLE["openai"] = (0.0, ids)
    assert app_module._reachable_models("openai") == {"gpt-5.4"}

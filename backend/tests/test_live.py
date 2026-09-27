"""Live, a spoken conversation: the session is set here, never by the browser."""

import json

import pytest

import app as app_module
from conftest import CAP_ID, PNG_B64


@pytest.fixture
def keyed(client, monkeypatch):
    """Both keys set, listing offline, and the provider calls faked: records them."""
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setenv("GOOGLE_API_KEY", "test")
    monkeypatch.setattr(app_module, "_reachable_models", lambda provider: None)
    calls = []

    def openai(sdp, choice):
        calls.append(("openai", choice))
        return "v=0 answer"

    def gemini(choice):
        calls.append(("gemini", choice))
        return "auth_tokens/x", "wss://example/ws"

    monkeypatch.setattr(app_module, "_live_openai", openai)
    monkeypatch.setattr(app_module, "_live_gemini", gemini)
    return calls


@pytest.fixture
def cap(client):
    d = app_module.CAPTURES_DIR / CAP_ID
    d.mkdir()
    (d / "meta.json").write_text(
        json.dumps({"url": "https://example.jp/", "element": {"text": "¥1,000"}})
    )
    (d / "chat.json").write_text("[]")
    (d / "capture.png").write_bytes(app_module.base64.b64decode(PNG_B64))
    (d / "inventory.json").write_text(json.dumps([{"i": "n1", "n": "PayPay ¥1,000"}]))
    return CAP_ID


def start(client, provider, **body):
    return client.post(f"/api/live/{provider}", json=body)


def test_openai_relays_the_offer_with_the_session_set_here(client, keyed, cap):
    res = start(
        client,
        "openai",
        capture_id=cap,
        sdp="v=0 offer",
        options={"model": "gpt-realtime-2.1", "voice": "cedar", "speed": 9},
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body["sdp"] == "v=0 answer" and body["model"] == "gpt-realtime-2.1"
    # the page goes as untrusted data in the context, the click first
    assert "Selected on the page" in body["context"] and "n1" in body["context"]
    choice = keyed[0][1]
    assert choice["voice"] == "cedar" and choice["speed"] == 1.5  # clamped


def test_gemini_gets_a_token_and_anything_unlisted_falls_back(client, keyed, cap):
    res = start(
        client,
        "gemini",
        capture_id=cap,
        options={"model": "gpt-6", "voice": "Nobody", "turnEnd": "x", "lang": "fr"},
    )
    body = res.get_json()
    assert (body["token"], body["ws"]) == ("auth_tokens/x", "wss://example/ws")
    choice = keyed[0][1]
    assert choice["model"] == "gemini-3.8-live" and choice["voice"] == "Kore"
    assert choice["turnEnd"] == "normal" and choice["lang"] == ""


@pytest.mark.parametrize(
    "provider, body, status",
    [
        ("claude", {}, 404),
        ("openai", {"capture_id": "0000000000ff", "sdp": "v=0"}, 404),
        ("openai", {"capture_id": CAP_ID}, 400),  # no offer
        ("openai", {"capture_id": CAP_ID, "sdp": "hello"}, 400),
    ],
)
def test_refuses_what_it_cannot_start(client, keyed, cap, provider, body, status):
    assert start(client, provider, **body).status_code == status
    assert keyed == []


def test_without_a_key_it_says_so(client, cap):
    assert start(client, "gemini", capture_id=cap).status_code == 501


def test_the_rules_follow_the_options():
    choice = app_module._live_choice("openai", {"point": False, "lang": "ja"})
    rules = app_module._live_instructions(choice)
    assert "highlight tool" not in rules and "Japanese" in rules
    assert "highlight tool" in app_module._live_instructions(
        app_module._live_choice("openai", {})
    )


def test_spoken_turns_join_the_session_history(client, cap):
    sid = client.post("/api/session", json={"capture_id": cap}).get_json()["session_id"]
    log = lambda **b: client.post(  # noqa: E731
        "/api/live/log", json={"session_id": sid, "capture_id": cap, **b}
    )
    assert log(role="user", text="What do I get?").status_code == 200
    assert log(role="assistant", text="¥1,000 [[n1]] and [[n9]]").status_code == 200
    assert log(role="system", text="x").status_code == 400
    assert log(role="user", text="  ").status_code == 404
    history = client.get(f"/api/session/{sid}").get_json()["history"]
    assert history == [
        {"role": "user", "text": "What do I get?", "live": True, "capture_id": cap},
        # an id the inventory does not have is dropped
        {"role": "assistant", "text": "¥1,000 [[n1]] and", "live": True},
    ]


def test_catalogue_lists_live_models_and_voices(client, keyed):
    live = client.get("/api/ai").get_json()["live"]
    assert live["openai"]["models"][0] == "gpt-realtime-2.1-mini"
    assert "Kore" in live["gemini"]["voices"]

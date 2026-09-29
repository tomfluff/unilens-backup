"""Read aloud through either provider (R2 of the 2026-09-27 report): the choice is
checked here, so no arbitrary model or voice reaches a paid API."""

import pytest

import app as app_module


@pytest.fixture
def spoken(client, monkeypatch):
    """Both keys set; Gemini's speech faked: records what it was asked for."""
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setenv("GOOGLE_API_KEY", "test")
    calls = []

    def fake(text, model, voice):
        calls.append((text, model, voice))
        yield app_module._wav_header(app_module.TTS_RATE)
        yield b"\x00\x01" * 8

    monkeypatch.setattr(app_module, "_speak_gemini", fake)
    return calls


def prepare(client, **body):
    return client.post("/api/tts", json={"text": "Shareholders get ¥1,000.", **body})


def test_gemini_reads_with_its_model_and_voice(client, spoken):
    res = prepare(
        client, provider="gemini", model="gemini-3.8-flash-lite-tts", voice="Puck"
    )
    audio = client.get(f"/api/tts/{res.get_json()['id']}.mp3")
    assert audio.mimetype == "audio/wav"
    assert audio.data[:4] == b"RIFF" and audio.data[8:12] == b"WAVE"
    assert spoken == [("Shareholders get ¥1,000.", "gemini-3.8-flash-lite-tts", "Puck")]


@pytest.mark.parametrize(
    "body, expected",
    [
        # nothing chosen: OpenAI, its model and the default voice
        ({}, ("openai", app_module.TTS_MODELS["openai"][0], "alloy")),
        # another provider's voice, an unlisted model: that provider's defaults
        (
            {"provider": "gemini", "voice": "alloy", "model": "gpt-4o-mini-tts"},
            ("gemini", "gemini-3.8-flash-tts", "Kore"),
        ),
        (
            {"provider": "openai", "voice": "Kore"},
            ("openai", "gpt-4o-mini-tts", "alloy"),
        ),
    ],
)
def test_anything_unlisted_falls_back(spoken, monkeypatch, body, expected):
    monkeypatch.delenv("TTS_VOICE", raising=False)
    monkeypatch.delenv("TTS_MODEL", raising=False)
    assert app_module._tts_choice(body) == expected


def test_a_provider_without_its_key_is_never_used(client, spoken, monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY")
    assert prepare(client, provider="gemini").status_code == 501
    monkeypatch.delenv("OPENAI_API_KEY")
    assert prepare(client).status_code == 501
    assert spoken == []


def test_a_malformed_choice_falls_back_instead_of_failing(client, spoken):
    assert (
        prepare(client, provider=[1], model={"x": 1}, voice=["Kore"]).status_code == 200
    )


def test_a_refused_gemini_reading_is_an_error_not_an_empty_wav(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "test")

    def refuse(text, model, voice):
        raise RuntimeError("403 the key cannot use this model")

    monkeypatch.setattr(app_module, "_speak_gemini", refuse)
    tid = prepare(client, provider="gemini").get_json()["id"]
    assert client.get(f"/api/tts/{tid}.mp3").status_code == 502


def test_models_the_key_cannot_reach_are_not_offered(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "test")
    monkeypatch.setattr(
        app_module, "_reachable_models", lambda p: {"gemini-3.8-flash-tts"}
    )
    assert app_module._tts_models("gemini") == ["gemini-3.8-flash-tts"]
    assert app_module._tts_choice(
        {"provider": "gemini", "model": "gemini-3.8-flash-lite-tts"}
    )[1] == ("gemini-3.8-flash-tts")

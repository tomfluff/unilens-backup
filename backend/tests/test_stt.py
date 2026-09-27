"""Speech to text for browsers without their own (R1 of the 2026-09-26 report)."""

import io

import pytest

import app as app_module


@pytest.fixture
def heard(client, monkeypatch):
    """Keys set, listing offline, and the transcription faked: records its call."""
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setenv("GOOGLE_API_KEY", "test")
    monkeypatch.setattr(app_module, "_reachable_models", lambda provider: None)
    calls = []

    def fake(provider, model, audio, mime, lang):
        calls.append((provider, model, len(audio), mime, lang))
        return "how do I apply"

    monkeypatch.setattr(app_module, "_transcribe", fake)
    return calls


def post(client, body=b"OggS...", mime="audio/webm", query=""):
    return client.post(f"/api/stt{query}", data=body, content_type=mime)


def test_transcribes_with_the_default_model(client, heard):
    res = post(client, query="?lang=ja")
    assert res.status_code == 200
    body = res.get_json()
    assert body["text"] == "how do I apply"
    assert (body["provider"], body["model"]) == ("openai", "whisper-1")
    assert heard == [("openai", "whisper-1", 7, "audio/webm", "ja")]


def test_a_listed_choice_is_kept_and_anything_else_falls_back(client, heard):
    post(client, query="?provider=gemini&model=gemini-3.8-flash&lang=xx")
    post(client, query="?provider=openai&model=gpt-6-voice")
    assert heard[0][:2] == ("gemini", "gemini-3.8-flash") and heard[0][4] == ""
    assert heard[1][:2] == ("openai", "whisper-1")


@pytest.mark.parametrize(
    "kw, status",
    [
        ({"mime": "text/plain"}, 415),
        ({"body": b""}, 400),
        ({"body": b"x" * (app_module.STT_MAX_BYTES + 1)}, 413),
    ],
)
def test_rejects_what_is_not_a_short_voice_message(client, heard, kw, status):
    assert post(client, **kw).status_code == status
    assert heard == []


def test_without_a_key_it_says_so(client):
    assert post(client).status_code == 501


def test_catalogue_lists_the_speech_models(client, heard):
    body = client.get("/api/ai").get_json()
    assert body["stt"]["openai"][0] == "whisper-1"
    assert "gemini-3.5-transcribe" in body["stt"]["gemini"]


def test_catalogue_names_the_provider_that_transcribes_by_default(
    client, heard, monkeypatch
):
    """The panel lists this one's models for "Browser, else server" (bug 7): the keys
    of `stt` arrive sorted, gemini first, while the server takes OpenAI first."""
    assert client.get("/api/ai").get_json()["sttDefault"] == "openai"
    monkeypatch.delenv("OPENAI_API_KEY")
    assert client.get("/api/ai").get_json()["sttDefault"] == "gemini"
    monkeypatch.delenv("GOOGLE_API_KEY")
    assert client.get("/api/ai").get_json()["sttDefault"] is None


def test_a_chosen_provider_without_its_key_never_gets_another(
    client, heard, monkeypatch
):
    monkeypatch.delenv("GOOGLE_API_KEY")
    assert post(client, query="?provider=gemini").status_code == 501
    assert post(client, query="?provider=nope").status_code == 501
    assert heard == []


def test_an_undeclared_long_body_is_read_no_further_than_the_cap(client, heard):
    """chunked: no Content-Length, so only the capped read stands between it and memory"""
    body = io.BytesIO(b"x" * (app_module.STT_MAX_BYTES + 4096))
    res = client.post(
        "/api/stt",
        input_stream=body,
        content_type="audio/webm",
        environ_base={"wsgi.input_terminated": True},
    )
    assert res.status_code == 413
    assert body.tell() <= app_module.STT_MAX_BYTES + 1
    assert heard == []

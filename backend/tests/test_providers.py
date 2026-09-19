"""Provider dispatch: the stub round-trip through /api/chat and
/api/chat/stream, and the PROVIDERS table's handling of unknown names."""

import base64
import json

import pytest

import app as app_module
from conftest import PNG_B64

PNG = base64.b64decode(PNG_B64)
META = {"url": "https://example.test/", "clickX": 10, "clickY": 20, "scrollDepth": 5}


@pytest.fixture
def capture(client):
    cap_dir = app_module.CAPTURES_DIR / "cap1"
    cap_dir.mkdir()
    (cap_dir / "capture.png").write_bytes(PNG)
    (cap_dir / "meta.json").write_text(json.dumps(META), encoding="utf-8")
    (cap_dir / "chat.json").write_text("[]", encoding="utf-8")
    return "cap1"


def _stream_text(res) -> str:
    deltas = []
    for line in res.get_data(as_text=True).splitlines():
        if not line.startswith("data: "):
            continue
        frame = json.loads(line[len("data: ") :])
        assert "error" not in frame, frame
        deltas.append(frame.get("delta", ""))
    return "".join(deltas)


def test_chat_and_stream_return_the_same_stub_text(client, capture):
    body = {"capture_id": capture, "message": "hello"}
    chat = client.post("/api/chat", json=body)
    assert chat.status_code == 200
    reply = chat.get_json()["reply"]
    assert reply.startswith("[stub")
    assert 'Your message: "hello"' in reply

    stream = client.post("/api/chat/stream", json=body)
    assert stream.status_code == 200
    # _stream_stub yields each word with a trailing space, so strip only that.
    assert _stream_text(stream).rstrip(" ") == reply


def test_unknown_provider_raises():
    with pytest.raises(ValueError, match="unknown provider"):
        app_module._run("call", "nope", meta={}, message="x")

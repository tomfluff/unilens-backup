"""A capture or session id in a request is only ever the minted 12-hex syntax
resolving inside its directory. A bad capture id is a uniform 404; a bad
session id is "no session". Neither touches anything outside the directory."""

import base64
import json
import re

import pytest

import app as app_module
from conftest import CAP_ID, PNG_B64

INVENTORY = [{"i": "n0", "r": "text", "n": "Apply", "b": [0, 0, 1, 1], "v": 1}]


@pytest.fixture
def decoy(client, tmp_path):
    """A complete capture dir *outside* CAPTURES_DIR that traversal would hit."""
    d = tmp_path / "decoy"
    d.mkdir()
    (d / "capture.png").write_bytes(base64.b64decode(PNG_B64))
    (d / "meta.json").write_text("{}", encoding="utf-8")
    (d / "chat.json").write_text("[]", encoding="utf-8")
    (d / "inventory.json").write_text(json.dumps(INVENTORY), encoding="utf-8")
    return d


def _bad_ids(decoy):
    return ["../decoy", str(decoy), "0123456789ab", "cap1", "../../etc"]


def test_chat_404s_on_every_non_minted_or_missing_id(client, decoy, tmp_path):
    for cap_id in _bad_ids(decoy):
        body = {"capture_id": cap_id, "message": "hi"}
        assert client.post("/api/chat", json=body).status_code == 404, cap_id
        assert client.post("/api/chat/stream", json=body).status_code == 404, cap_id
    assert (decoy / "chat.json").read_text() == "[]"  # never read as a capture
    assert not list(app_module.CAPTURES_DIR.iterdir())
    assert {p.name for p in tmp_path.iterdir()} == {"captures", "sessions", "decoy"}


def test_locate_404s_on_every_non_minted_or_missing_id(client, decoy, tmp_path):
    for cap_id in _bad_ids(decoy):
        body = {
            "capture_id": cap_id,
            "question": "Where is Apply?",
            "screenshot": False,
        }
        assert client.post("/api/locate", json=body).status_code == 404, cap_id
    assert (decoy / "chat.json").read_text() == "[]"
    assert not list(app_module.CAPTURES_DIR.iterdir())
    assert {p.name for p in tmp_path.iterdir()} == {"captures", "sessions", "decoy"}


def test_get_and_delete_routes_404_on_a_bad_id(client, decoy):
    for cap_id in ("..%2Fdecoy", "cap1", "0123456789ab"):
        for path in ("", "/image", "/viewport", "/detail"):
            assert client.get(f"/api/capture/{cap_id}{path}").status_code == 404
        assert client.delete(f"/api/capture/{cap_id}").status_code == 404
    assert decoy.is_dir() and (decoy / "meta.json").is_file()  # not deleted


# ── Session ids ─────────────────────────────────────────────────────────────

DECOY_SESSION = {"captures": [CAP_ID], "history": [{"role": "user", "text": "s"}]}


@pytest.fixture
def decoy_session(client, tmp_path):
    """A session file *outside* SESSIONS_DIR that "../decoy" would resolve to."""
    p = tmp_path / "decoy.json"
    p.write_text(json.dumps(DECOY_SESSION), encoding="utf-8")
    return p


@pytest.fixture
def cap(client):
    cap_dir = app_module.CAPTURES_DIR / CAP_ID
    cap_dir.mkdir()
    (cap_dir / "capture.png").write_bytes(base64.b64decode(PNG_B64))
    (cap_dir / "meta.json").write_text("{}", encoding="utf-8")
    (cap_dir / "chat.json").write_text("[]", encoding="utf-8")
    (cap_dir / "inventory.json").write_text(json.dumps(INVENTORY), encoding="utf-8")
    return cap_dir


def _bad_sids(tmp_path):
    return ["../decoy", str(tmp_path / "decoy"), "0123456789ab"]


def _untouched(decoy_session):
    assert json.loads(decoy_session.read_text()) == DECOY_SESSION
    assert not list(app_module.SESSIONS_DIR.iterdir())


def test_session_info_404s_on_a_bad_or_missing_id(client, decoy_session, tmp_path):
    for sid in ["..%2Fdecoy"] + _bad_sids(tmp_path):
        assert client.get(f"/api/session/{sid}").status_code == 404, sid
    _untouched(decoy_session)


def test_chat_and_locate_treat_a_bad_session_id_as_no_session(
    client, decoy_session, cap, tmp_path
):
    for sid in _bad_sids(tmp_path):
        body = {"capture_id": CAP_ID, "session_id": sid, "message": "hi"}
        assert client.post("/api/chat", json=body).status_code == 200, sid
        stream = client.post("/api/chat/stream", json=body)
        assert stream.status_code == 200, sid
        assert '"done": true' in stream.get_data(as_text=True)  # runs the SSE body
        body = {"capture_id": CAP_ID, "session_id": sid, "question": "Apply?"}
        assert client.post("/api/locate", json=body).status_code == 200, sid
    # Session-less: every exchange landed in the capture's own chat.json.
    assert len(json.loads((cap / "chat.json").read_text())) == 18
    _untouched(decoy_session)


def test_capture_mints_a_new_session_for_a_bad_session_id(
    client, decoy_session, tmp_path
):
    for sid in _bad_sids(tmp_path):
        body = {"image": "data:image/png;base64," + PNG_B64, "session_id": sid}
        res = client.post("/api/capture", json=body)
        assert res.status_code == 200, sid
        new_sid = res.get_json()["session_id"]
        assert re.fullmatch(r"[0-9a-f]{12}", new_sid) and new_sid != sid
        assert (app_module.SESSIONS_DIR / f"{new_sid}.json").is_file()
    assert json.loads(decoy_session.read_text()) == DECOY_SESSION
    assert len(list(app_module.SESSIONS_DIR.iterdir())) == 3

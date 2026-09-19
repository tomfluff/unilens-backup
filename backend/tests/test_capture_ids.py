"""A capture id in a request is only ever the minted 12-hex syntax resolving
inside CAPTURES_DIR; anything else is a uniform 404 and touches nothing."""

import base64
import json

import pytest

import app as app_module
from conftest import PNG_B64

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

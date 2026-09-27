"""A new conversation on the capture the user is on ("New conversation")."""

import json

import app as app_module
from conftest import CAP_ID


def make_capture():
    cap = app_module.CAPTURES_DIR / CAP_ID
    cap.mkdir()
    (cap / "meta.json").write_text("{}")
    (cap / "chat.json").write_text("[]")
    return CAP_ID


def test_starts_a_fresh_session_holding_the_capture(client):
    cap = make_capture()
    res = client.post("/api/session", json={"capture_id": cap})
    assert res.status_code == 200
    sid = res.get_json()["session_id"]
    saved = json.loads((app_module.SESSIONS_DIR / f"{sid}.json").read_text())
    assert saved == {"captures": [cap], "history": []}
    # a second one is another session: the first conversation stays as it was
    assert (
        client.post("/api/session", json={"capture_id": cap}).get_json()["session_id"]
        != sid
    )


def test_an_unknown_capture_is_refused(client):
    for body in ({"capture_id": "0123456789ab"}, {"capture_id": ["x"]}, {}):
        assert client.post("/api/session", json=body).status_code == 404


def test_a_body_that_is_not_an_object_is_refused(client):
    assert client.post("/api/session", json=[CAP_ID]).status_code == 400
    assert client.post("/api/session", data="not json").status_code == 400

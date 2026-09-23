"""A follow-up after the user scrolled or zoomed re-captures the view into the
session (meta.viewRefresh); the model must be told it is the same question."""

import app as app_module
from conftest import PNG_B64


def _upload(client, meta, sid=None):
    body = {"image": "data:image/png;base64," + PNG_B64, "meta": meta}
    if sid:
        body["session_id"] = sid
    return client.post("/api/capture", json=body).get_json()


def test_session_note_marks_a_view_refresh_as_the_same_question(client):
    first = _upload(client, {"clickX": 10, "clickY": 20})
    second = _upload(
        client,
        {"clickX": 10, "clickY": 20, "viewRefresh": True},
        sid=first["session_id"],
    )
    third = _upload(client, {"clickX": 5, "clickY": 6}, sid=first["session_id"])
    session = app_module._load_session(first["session_id"])
    note = app_module._session_context_note(session, third["id"])
    lines = note.splitlines()[1:]
    assert "view moved" not in lines[0]
    assert "(same question, the user's view moved)" in lines[1]
    assert second["session_id"] == first["session_id"]


def test_system_prompt_explains_view_refresh():
    assert "metadata.viewRefresh" in app_module.SYSTEM_PROMPT

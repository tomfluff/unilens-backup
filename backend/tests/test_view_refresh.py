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


def test_history_records_which_capture_each_question_came_from(client):
    """The popover offers "where I clicked" per question: it needs the capture id."""
    first = client.post(
        "/api/capture",
        json={"image": "data:image/png;base64," + PNG_B64, "meta": {"clickX": 1}},
    ).get_json()
    sid = first["session_id"]
    client.post(
        "/api/chat",
        json={"capture_id": first["id"], "session_id": sid, "message": "what is this?"},
    )
    body = client.post(
        "/api/chat/stream",
        json={"capture_id": first["id"], "session_id": sid, "message": "and this?"},
    ).get_data(as_text=True)
    assert '"done": true' in body
    history = app_module._load_session(sid)["history"]
    users = [h for h in history if h["role"] == "user"]
    assert [h.get("capture_id") for h in users] == [first["id"], first["id"]]

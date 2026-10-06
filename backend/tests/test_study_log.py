"""The study's interaction log: one append-only JSONL per participant and session,
fed by the widget (/api/study/log) and by the routes, and its export."""

import json

import app as app_module
import study_export
from conftest import PNG_B64


def _lines(path):
    return [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines()]


def _post(client, query, body):
    return client.post(
        f"/api/study/log{query}",
        data=json.dumps(body),
        content_type="text/plain",
    )


def test_events_append_to_the_participants_session(client):
    ev = {"t": "2026-10-07T01:00:00.000Z", "seq": 1, "type": "alt_click", "x": 5}
    assert _post(client, "?pid=P00&session=1", {"events": [ev]}).status_code == 200
    assert (
        _post(client, "?pid=P00&session=01", {"events": [{**ev, "seq": 2}]}).status_code
        == 200
    )
    rows = _lines(app_module.STUDY_LOGS_DIR / "P00" / "session-1.jsonl")
    assert [r["seq"] for r in rows] == [1, 2]
    assert all(r["src"] == "client" and "rx" in r for r in rows)


def test_without_a_valid_participant_nothing_is_written(client):
    ev = {"type": "alt_click"}
    for q in (
        "",
        "?pid=P00",
        "?session=1",
        "?pid=../x&session=1",
        "?pid=P00&session=x",
    ):
        assert _post(client, q, {"events": [ev]}).status_code == 400
    assert not app_module.STUDY_LOGS_DIR.exists()


def test_bad_events_are_dropped_not_fatal(client):
    body = {"events": [{"type": "ok"}, {"no": "type"}, "text", {"type": "x" * 41}]}
    r = _post(client, "?pid=P00&session=2", body)
    assert r.get_json() == {"logged": 1, "dropped": 3}
    assert _post(client, "?pid=P00&session=2", {"events": []}).status_code == 400
    assert _post(client, "?pid=P00&session=2", "not json").status_code == 400


def test_a_capture_with_a_participant_is_logged_by_the_server(client):
    body = {
        "image": f"data:image/png;base64,{PNG_B64}",
        "meta": {
            "url": "https://s.example/en/x.html?pid=P00&token=abc&q=lost+umbrella#hours",
            "clickX": 3,
            "clickY": 4,
        },
    }
    cap = client.post("/api/capture?pid=P00&session=1", json=body).get_json()
    rows = _lines(app_module.STUDY_LOGS_DIR / "P00" / "session-1.jsonl")
    assert rows[-1]["type"] == "capture_saved"
    assert rows[-1]["capture"] == cap["id"]
    assert rows[-1]["src"] == "server"
    # the address keeps its path, a search's words and an anchor, nothing else
    assert rows[-1]["url"] == "/en/x.html?q=lost%20umbrella#hours"
    # and without one, nothing
    client.post("/api/capture", json=body)
    assert len(_lines(app_module.STUDY_LOGS_DIR / "P00" / "session-1.jsonl")) == 1


def test_export_writes_a_table_a_timeline_and_a_summary(client, tmp_path):
    events = [
        {
            "t": "2026-10-07T01:00:00.000Z",
            "seq": 1,
            "type": "page_load",
            "url": "/en/lost-found.html",
            "title": "Lost and found",
        },
        {
            "t": "2026-10-07T01:00:05.000Z",
            "seq": 2,
            "type": "alt_click",
            "x": 10,
            "y": 20,
            "element": {"tag": "h1", "text": "Lost and found"},
        },
        {
            "t": "2026-10-07T01:00:09.000Z",
            "seq": 3,
            "type": "question",
            "text": "How long | are umbrellas kept?",
            "via": "voice",
            "command": None,
        },
        {
            "t": "2026-10-07T01:00:15.000Z",
            "seq": 4,
            "type": "answer",
            "text": "14 days.",
            "sources": [{"n": 1, "id": "n3", "label": "Umbrellas"}],
            "ms": 6000,
            "model": "m",
        },
        {
            "t": "2026-10-07T01:00:16.000Z",
            "seq": 5,
            "type": "status",
            "sound": "done",
            "text": "Answered",
        },
        {
            "t": "2026-10-07T01:00:20.000Z",
            "seq": 6,
            "type": "source",
            "n": 1,
            "labels": ["Umbrellas"],
            "moved": True,
            "inAnswer": True,
        },
        {
            "t": "2026-10-07T01:00:25.000Z",
            "seq": 7,
            "type": "read_aloud",
            "action": "play",
            "msg": 3,
        },
    ]
    _post(client, "?pid=P00&session=1", {"events": events})
    out = tmp_path / "out"
    rows = study_export.export(["P00"], app_module.STUDY_LOGS_DIR, out)
    assert rows[0]["questions"] == 1 and rows[0]["voice"] == 1
    assert rows[0]["mean_answer_s"] == 6.0 and rows[0]["read_aloud_plays"] == 1
    csv_text = (out / "P00-session-1.csv").read_text(encoding="utf-8")
    assert csv_text.count("\n") == 1 + len(events)
    md = (out / "P00-session-1.md").read_text(encoding="utf-8")
    assert 'voice: "How long \\| are umbrellas kept?"' in md
    assert "Answered" not in md  # status lines only in the CSV
    assert (out / "summary.csv").exists()


def test_export_counts_what_the_participant_did(client, tmp_path):
    t = "2026-10-07T01:00:0{}.000Z"
    events = [
        {
            "t": t.format(1),
            "seq": 1,
            "type": "source",
            "n": 1,
            "via": "number in the answer",
        },
        {"t": t.format(2), "seq": 2, "type": "source", "n": 2, "via": "command"},
        {
            "t": t.format(3),
            "seq": 3,
            "type": "source",
            "n": 2,
            "via": "controls",
            "action": "off",
        },
        {
            "t": t.format(4),
            "seq": 4,
            "type": "error",
            "where": "answer",
            "message": "x",
        },
    ]
    _post(client, "?pid=P01&session=1", {"events": events})
    app_module._study_log(
        ("P01", "1"),
        [{"t": t.format(5), "type": "error", "where": "answer", "message": "x"}],
        "server",
    )
    row = study_export.export(["P01"], app_module.STUDY_LOGS_DIR, tmp_path / "o")[0]
    assert row["sources_pressed"] == 1
    assert row["errors"] == 1 and row["server_errors"] == 1

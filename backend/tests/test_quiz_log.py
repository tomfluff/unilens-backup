"""The quiz widget's log (quiz-lib): one append-only JSONL per quiz, fed by
/api/quiz/log, mirrored into the participant's study log when the page names one."""

import json

import app as app_module


def _lines(path):
    return [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines()]


def _post(client, query, body):
    return client.post(
        f"/api/quiz/log{query}",
        data=json.dumps(body) if not isinstance(body, str) else body,
        content_type="text/plain",
    )


ANSWER = {
    "t": "2026-10-08T01:00:00.000Z",
    "seq": 3,
    "type": "quiz_answer",
    "quiz": "ir-basics",
    "attempt": "a1b2c3",
    "question": "q1",
    "response": "c2",
    "correct": True,
    "ms": 4200,
}


def test_answers_append_to_the_quiz_log_without_a_participant(client):
    start = {**ANSWER, "type": "quiz_start", "seq": 1}
    r = _post(client, "", {"events": [start, ANSWER]})
    assert r.status_code == 200
    assert r.get_json() == {"logged": 2, "dropped": 0}
    rows = _lines(app_module.QUIZ_LOGS_DIR / "ir-basics.jsonl")
    assert [x["type"] for x in rows] == ["quiz_start", "quiz_answer"]
    assert all(x["src"] == "client" and "rx" in x for x in rows)
    assert "pid" not in rows[0]
    # no participant: nothing goes to a study log
    assert not app_module.STUDY_LOGS_DIR.exists()


def test_a_participant_is_recorded_and_mirrored_to_the_study_log(client):
    assert _post(client, "?pid=P07&session=02", {"events": [ANSWER]}).status_code == 200
    row = _lines(app_module.QUIZ_LOGS_DIR / "ir-basics.jsonl")[0]
    assert (row["pid"], row["session"]) == ("P07", "2")
    study = _lines(app_module.STUDY_LOGS_DIR / "P07" / "session-2.jsonl")
    assert study[0]["type"] == "quiz_answer" and study[0]["quiz"] == "ir-basics"


def test_events_go_to_their_own_quiz(client):
    other = {**ANSWER, "quiz": "recruit"}
    _post(client, "", {"events": [ANSWER, other]})
    assert len(_lines(app_module.QUIZ_LOGS_DIR / "ir-basics.jsonl")) == 1
    assert len(_lines(app_module.QUIZ_LOGS_DIR / "recruit.jsonl")) == 1


def test_unknown_types_bad_quiz_ids_and_huge_events_are_dropped(client):
    events = [
        {**ANSWER, "type": "alt_click"},
        {**ANSWER, "quiz": "../../etc/passwd"},
        {**ANSWER, "quiz": 5},
        {**ANSWER, "response": "x" * 9000},
        "not an event",
        ANSWER,
    ]
    r = _post(client, "", {"events": events})
    assert r.get_json() == {"logged": 1, "dropped": 5}
    assert [p.name for p in app_module.QUIZ_LOGS_DIR.iterdir()] == ["ir-basics.jsonl"]


def test_malformed_requests_are_refused(client):
    assert _post(client, "", "{not json").status_code == 400
    assert _post(client, "", {"events": []}).status_code == 400
    assert _post(client, "", {"events": "x"}).status_code == 400
    too_many = [ANSWER] * (app_module.QUIZ_MAX_EVENTS + 1)
    assert _post(client, "", {"events": too_many}).status_code == 400
    assert not app_module.QUIZ_LOGS_DIR.exists()


def test_a_bad_participant_is_ignored_not_refused(client):
    # the quiz log does not need a participant: a malformed one is just not recorded
    assert _post(client, "?pid=a b&session=1", {"events": [ANSWER]}).status_code == 200
    row = _lines(app_module.QUIZ_LOGS_DIR / "ir-basics.jsonl")[0]
    assert "pid" not in row


# ── Reading the results back ─────────────────────────────────────────────


def _attempt(aid, *, complete=True, answers=(("q1", "c2", True, 4200),)):
    """One attempt's events as the widget sends them, a second apart."""
    evs = [
        {
            "t": "2026-10-08T01:00:00.000Z",
            "type": "quiz_start",
            "quiz": "ir-basics",
            "attempt": aid,
            "total": 2,
            "lang": "ja",
        }
    ]
    for i, (q, resp, ok, ms) in enumerate(answers):
        evs.append(
            {
                "t": f"2026-10-08T01:00:0{i + 5}.000Z",
                "type": "quiz_answer",
                "quiz": "ir-basics",
                "attempt": aid,
                "question": q,
                "index": i,
                "response": resp,
                "response_text": f"text of {resp}",
                "correct": ok,
                "ms": ms,
            }
        )
    if complete:
        evs.append(
            {
                "t": "2026-10-08T01:00:09.000Z",
                "type": "quiz_complete",
                "quiz": "ir-basics",
                "attempt": aid,
                "correct": sum(1 for a in answers if a[2]),
                "total": 2,
                "ms": 8000,
            }
        )
    return evs


def test_results_give_each_attempt_with_answers_and_timings(client):
    answers = (("q1", "c2", True, 4200), ("q2", ["a", "c"], False, 3100))
    _post(client, "?pid=P07&session=1", {"events": _attempt("a1", answers=answers)})
    r = client.get("/api/quiz/ir-basics/results")
    assert r.status_code == 200
    body = r.get_json()
    assert body["quiz"] == "ir-basics"
    [a] = body["attempts"]
    assert (a["attempt"], a["pid"], a["session"], a["lang"]) == ("a1", "P07", "1", "ja")
    assert a["completed"] is True
    assert (a["correct"], a["answered"], a["total"]) == (1, 2, 2)
    assert a["duration_ms"] == 8000
    assert a["started_at"] == "2026-10-08T01:00:00.000Z"
    assert [x["question"] for x in a["answers"]] == ["q1", "q2"]
    assert a["answers"][1] == {
        "question": "q2",
        "index": 1,
        "response": ["a", "c"],
        "response_text": "text of ['a', 'c']",
        "correct": False,
        "ms": 3100,
        "lang": None,
        "answered_at": "2026-10-08T01:00:06.000Z",
    }


def test_an_unfinished_attempt_is_timed_to_its_last_answer(client):
    _post(client, "", {"events": _attempt("a2", complete=False)})
    [a] = client.get("/api/quiz/ir-basics/results").get_json()["attempts"]
    assert a["completed"] is False and a["completed_at"] is None
    assert a["duration_ms"] == 5000  # 01:00:00 -> 01:00:05


def test_results_filter_by_participant_attempt_and_completion(client):
    _post(client, "?pid=P01&session=1", {"events": _attempt("a1")})
    _post(client, "?pid=P02&session=2", {"events": _attempt("a2", complete=False)})

    def get(query):
        r = client.get(f"/api/quiz/ir-basics/results{query}")
        return [a["attempt"] for a in r.get_json()["attempts"]]

    assert get("") == ["a1", "a2"]
    assert get("?pid=P02") == ["a2"]
    assert get("?session=1") == ["a1"]
    assert get("?attempt=a2") == ["a2"]
    assert get("?completed=1") == ["a1"]


def test_opening_the_panel_alone_is_not_an_attempt(client):
    ev = {"type": "quiz_open", "quiz": "ir-basics", "attempt": "a9", "t": "x"}
    _post(client, "", {"events": [ev]})
    assert client.get("/api/quiz/ir-basics/results").get_json()["attempts"] == []


def test_results_for_an_unknown_or_malformed_quiz_are_404(client):
    assert client.get("/api/quiz/nothing-here/results").status_code == 404
    assert client.get("/api/quiz/..%2Fsecrets/results").status_code == 404


def test_the_quiz_list_counts_attempts(client):
    assert client.get("/api/quiz").get_json() == {"quizzes": []}
    _post(client, "", {"events": _attempt("a1") + _attempt("a2", complete=False)})
    [q] = client.get("/api/quiz").get_json()["quizzes"]
    assert (q["id"], q["attempts"], q["completed"]) == ("ir-basics", 2, 1)
    assert q["last_event_at"] == "2026-10-08T01:00:05.000Z"


def test_a_torn_line_does_not_break_the_results(client):
    _post(client, "", {"events": _attempt("a1")})
    with open(app_module.QUIZ_LOGS_DIR / "ir-basics.jsonl", "a", encoding="utf-8") as f:
        f.write('{"type": "quiz_ans')
    assert len(client.get("/api/quiz/ir-basics/results").get_json()["attempts"]) == 1


def test_survey_answers_are_returned_ungraded(client):
    ev = {**ANSWER, "attempt": "s1", "correct": None, "response_text": "選択肢 A"}
    start = {**ANSWER, "type": "quiz_start", "attempt": "s1"}
    _post(client, "", {"events": [start, ev]})
    [a] = client.get("/api/quiz/ir-basics/results").get_json()["attempts"]
    assert a["correct"] is None and a["answered"] == 1
    assert a["answers"][0]["correct"] is None
    assert a["answers"][0]["response_text"] == "選択肢 A"


def test_a_language_switch_is_logged_and_answers_keep_their_language(client):
    start = {**ANSWER, "type": "quiz_start", "attempt": "l1", "lang": "ja"}
    switch = {"type": "quiz_lang", "quiz": "ir-basics", "attempt": "l1", "lang": "en"}
    switch["from"] = "ja"
    answer = {**ANSWER, "attempt": "l1", "lang": "en"}
    r = _post(client, "", {"events": [start, switch, answer]})
    assert r.get_json() == {"logged": 3, "dropped": 0}
    [a] = client.get("/api/quiz/ir-basics/results").get_json()["attempts"]
    assert a["lang"] == "en" and a["answers"][0]["lang"] == "en"


# ── Per-question times ───────────────────────────────────────────────────


def test_each_questions_time_is_listed_by_question(client):
    answers = (("q1", "c2", True, 4200), ("q2", ["a", "c"], False, 3100))
    _post(client, "?pid=P07&session=1", {"events": _attempt("a1", answers=answers)})
    [a] = client.get("/api/quiz/ir-basics/results").get_json()["attempts"]
    assert a["question_ms"] == {"q1": 4200, "q2": 3100}


def _csv_rows(client, query=""):
    import csv
    import io

    r = client.get(f"/api/quiz/ir-basics/results.csv{query}")
    assert r.status_code == 200
    assert r.mimetype == "text/csv"
    assert "ir-basics-results.csv" in r.headers["Content-Disposition"]
    text = r.data.decode("utf-8")
    assert text.startswith("﻿")  # Excel reads it as UTF-8
    return list(csv.DictReader(io.StringIO(text[1:])))


def test_the_csv_has_one_row_per_attempt_and_columns_per_question(client):
    answers = (("q1", "c2", True, 4200), ("q2", ["a", "c"], False, 3150))
    _post(client, "?pid=P07&session=1", {"events": _attempt("a1", answers=answers)})
    _post(
        client,
        "?pid=P08&session=1",
        {"events": _attempt("a2", complete=False, answers=(("q1", "c1", False, 900),))},
    )
    rows = _csv_rows(client)
    assert [r["pid"] for r in rows] == ["P07", "P08"]
    first, second = rows
    assert (first["q1_ms"], first["q1_s"], first["q2_ms"], first["q2_s"]) == (
        "4200",
        "4.2",
        "3150",
        "3.1",
    )
    assert first["q1_answer"] == "text of c2" and first["q1_correct"] == "1"
    assert first["q2_correct"] == "0"
    assert (first["duration_ms"], first["duration_s"], first["completed"]) == (
        "8000",
        "8.0",
        "1",
    )
    # the second participant stopped after one question: the rest is blank
    assert (
        second["q1_ms"] == "900"
        and second["q2_ms"] == ""
        and second["completed"] == "0"
    )
    assert _csv_rows(client, "?pid=P08")[0]["attempt"] == "a2"


def test_the_csv_follows_the_surveys_question_order(client):
    app_module.QUIZZES_DIR.mkdir(parents=True, exist_ok=True)
    survey = {
        "id": "ir-basics",
        "questions": [{"id": "q2"}, {"id": "q1"}, {"id": "q3"}],
    }
    (app_module.QUIZZES_DIR / "ir-basics.json").write_text(json.dumps(survey))
    _post(client, "", {"events": _attempt("a1")})
    r = client.get("/api/quiz/ir-basics/results.csv")
    head = r.data.decode("utf-8")[1:].splitlines()[0].split(",")
    assert [h for h in head if h.endswith("_ms") and h != "duration_ms"] == [
        "q2_ms",
        "q1_ms",
        "q3_ms",
    ]


def test_the_csv_of_an_unknown_survey_is_404(client):
    assert client.get("/api/quiz/nothing-here/results.csv").status_code == 404


# ── Progress, for the test pages' button ───────────────────────────────────


def _survey(*ids):
    app_module.QUIZZES_DIR.mkdir(parents=True, exist_ok=True)
    survey = {"id": "ir-basics", "questions": [{"id": q} for q in ids]}
    (app_module.QUIZZES_DIR / "ir-basics.json").write_text(json.dumps(survey))


def test_progress_names_the_next_question_to_answer(client):
    _survey("q1", "q2", "q3")
    r = client.get("/api/quiz/ir-basics/progress?pid=P01&session=1")
    assert r.status_code == 200
    assert r.get_json() == {
        "quiz": "ir-basics",
        "total": 3,
        "answered": 0,
        "answered_questions": [],
        "next": 1,
        "completed": False,
        "attempt": None,
    }
    evs = _attempt("a1", complete=False, answers=(("q1", "c1", None, 900),))
    _post(client, "?pid=P01&session=1", {"events": evs})
    body = client.get("/api/quiz/ir-basics/progress?pid=P01&session=1").get_json()
    assert (body["answered"], body["next"], body["completed"]) == (1, 2, False)
    # another participant, or another session, has not started
    assert client.get("/api/quiz/ir-basics/progress?pid=P02").get_json()["next"] == 1
    other = "/api/quiz/ir-basics/progress?pid=P01&session=2"
    assert client.get(other).get_json()["next"] == 1


def test_progress_skips_answered_questions_and_ends_completed(client):
    _survey("q1", "q2", "q3")
    answers = (("q1", "c1", None, 900), ("q3", "c1", None, 900))
    _post(
        client,
        "?pid=P01&session=1",
        {"events": _attempt("a1", complete=False, answers=answers)},
    )
    body = client.get("/api/quiz/ir-basics/progress?pid=P01").get_json()
    assert body["next"] == 2 and body["answered_questions"] == ["q1", "q3"]
    more = _attempt("a1", complete=False, answers=(("q2", "c1", None, 900),))[1:]
    _post(client, "?pid=P01&session=1", {"events": more})
    body = client.get("/api/quiz/ir-basics/progress?pid=P01").get_json()
    assert (body["answered"], body["next"], body["completed"]) == (3, None, True)


def test_progress_follows_the_latest_attempt(client):
    _survey("q1", "q2")
    _post(
        client,
        "?pid=P01&session=1",
        {
            "events": _attempt(
                "old", answers=(("q1", "c", None, 1), ("q2", "c", None, 1))
            )
        },
    )
    fresh = [
        dict(e, t=e["t"].replace("2026-10-08", "2026-10-09"))
        for e in _attempt("new", complete=False, answers=())
    ]
    _post(client, "?pid=P01&session=1", {"events": fresh})
    body = client.get("/api/quiz/ir-basics/progress?pid=P01").get_json()
    assert (body["attempt"], body["next"]) == ("new", 1)


def test_progress_without_a_participant_goes_by_the_visitor_id(client):
    _survey("q1", "q2")
    evs = [dict(e, vid="v-abc123") for e in _attempt("a1", complete=False)]
    _post(client, "", {"events": evs})
    assert (
        client.get("/api/quiz/ir-basics/progress?vid=v-abc123").get_json()["next"] == 2
    )
    assert (
        client.get("/api/quiz/ir-basics/progress?vid=v-other1").get_json()["next"] == 1
    )


def test_progress_needs_a_survey_and_a_visitor(client):
    _survey("q1")
    assert client.get("/api/quiz/nothing-here/progress?pid=P01").status_code == 404
    assert client.get("/api/quiz/ir-basics/progress").status_code == 400
    assert client.get("/api/quiz/ir-basics/progress?vid=x").status_code == 400


# ── The IDs typed before the survey ────────────────────────────────────────


def test_the_typed_ids_are_kept_and_filterable(client):
    _post(
        client,
        "",
        {"events": [dict(e, user_id="U01", survey_id="3") for e in _attempt("a1")]},
    )
    _post(
        client,
        "",
        {"events": [dict(e, user_id="U02", survey_id="4") for e in _attempt("a2")]},
    )
    rows = client.get("/api/quiz/ir-basics/results").get_json()["attempts"]
    assert [(a["user_id"], a["survey_id"]) for a in rows] == [
        ("U01", "3"),
        ("U02", "4"),
    ]
    one = client.get("/api/quiz/ir-basics/results?user_id=U02").get_json()["attempts"]
    assert [a["attempt"] for a in one] == ["a2"]
    one = client.get("/api/quiz/ir-basics/results?survey_id=3").get_json()["attempts"]
    assert [a["attempt"] for a in one] == ["a1"]


def test_ids_typed_later_and_odd_ids(client):
    evs = _attempt("a1", complete=False)
    late = {
        "t": "2026-10-08T01:00:08.000Z",
        "type": "quiz_ids",
        "quiz": "ir-basics",
        "attempt": "a1",
        "user_id": "U09",
        "survey_id": "s-1",
    }
    _post(client, "", {"events": [*evs, late]})
    _post(
        client,
        "",
        {"events": [dict(e, user_id="no spaces <b>") for e in _attempt("a2")]},
    )
    rows = {
        a["attempt"]: a
        for a in client.get("/api/quiz/ir-basics/results").get_json()["attempts"]
    }
    assert (rows["a1"]["user_id"], rows["a1"]["survey_id"]) == ("U09", "s-1")
    assert rows["a2"]["user_id"] is None


def test_the_csv_starts_with_the_typed_ids(client):
    _post(
        client,
        "",
        {"events": [dict(e, user_id="U01", survey_id="3") for e in _attempt("a1")]},
    )
    rows = _csv_rows(client, "")
    assert list(rows[0])[:3] == ["attempt", "user_id", "survey_id"]
    assert (rows[0]["user_id"], rows[0]["survey_id"]) == ("U01", "3")

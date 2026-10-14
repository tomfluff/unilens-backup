"""The survey page (/survey) and what it loads: the survey's questions from
quizzes/<id>.json (/api/quiz/<id>) and quiz-lib's build (/survey/quiz.js)."""

import json

import app as app_module

POC = {
    "id": "whatever-the-file-says",
    "title": {"ja": "UniLens PoC アンケート", "en": "UniLens PoC survey"},
    "questions": [{"id": "q1", "prompt": "p", "choices": ["a", "b"], "answer": 1}],
}


def _define(quiz_id, data):
    app_module.QUIZZES_DIR.mkdir(parents=True, exist_ok=True)
    (app_module.QUIZZES_DIR / f"{quiz_id}.json").write_text(
        json.dumps(data, ensure_ascii=False), encoding="utf-8"
    )


def test_the_survey_page_is_served(client):
    r = client.get("/survey?quiz=unilens-poc&pid=P01&session=1")
    assert r.status_code == 200
    assert r.mimetype == "text/html"
    assert b'src="/survey/quiz.js"' in r.data


def test_a_survey_is_served_under_the_id_in_its_address(client):
    _define("unilens-poc", POC)
    r = client.get("/api/quiz/unilens-poc")
    assert r.status_code == 200
    body = r.get_json()
    # answers are logged under the file's name, whatever the file's own id says
    assert body["id"] == "unilens-poc"
    assert body["title"] == POC["title"]


def test_unknown_malformed_and_broken_surveys_are_404(client):
    _define("broken", POC)
    (app_module.QUIZZES_DIR / "broken.json").write_text("{not json", encoding="utf-8")
    _define("a-list", POC)
    (app_module.QUIZZES_DIR / "a-list.json").write_text("[1, 2]", encoding="utf-8")
    for quiz in ("nothing-here", "broken", "a-list", "..%2Fapp", "a b"):
        assert client.get(f"/api/quiz/{quiz}").status_code == 404


def test_quiz_js_comes_from_the_quiz_lib_build(client):
    assert client.get("/survey/quiz.js").status_code == 503  # not built yet
    app_module.QUIZ_LIB_DIST.mkdir(parents=True)
    (app_module.QUIZ_LIB_DIST / "quiz.js").write_text("window.x=1", encoding="utf-8")
    r = client.get("/survey/quiz.js")
    assert r.status_code == 200 and r.data == b"window.x=1"
    assert client.get("/survey/app.py").status_code == 404
    assert client.get("/survey/..%2Fapp.py").status_code == 404


def test_the_list_has_defined_surveys_and_logged_ones(client):
    _define("unilens-poc", POC)
    client.post(
        "/api/quiz/log",
        data=json.dumps(
            {
                "events": [
                    {
                        "t": "2026-10-14T01:00:00.000Z",
                        "type": "quiz_start",
                        "quiz": "old-one",
                        "attempt": "a1",
                    }
                ]
            }
        ),
        content_type="text/plain",
    )
    quizzes = {q["id"]: q for q in client.get("/api/quiz").get_json()["quizzes"]}
    assert quizzes["unilens-poc"]["defined"] is True
    assert quizzes["unilens-poc"]["title"] == POC["title"]
    assert quizzes["unilens-poc"]["attempts"] == 0
    assert quizzes["old-one"]["defined"] is False
    assert quizzes["old-one"]["attempts"] == 1


def test_the_shipped_survey_is_valid():
    path = app_module.Path(app_module.__file__).parent / "quizzes" / "unilens-poc.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert len(data["questions"]) == 4
    for q in data["questions"]:
        assert q["prompt"]["ja"] and q["prompt"]["en"]

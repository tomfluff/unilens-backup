"""Evidence in regular chat: /api/chat and /api/chat/stream cite inventory
elements inline as [[nID]]. Provider requests are asserted on the pure
request builders, never on a provider."""

import base64
import json

import pytest

import app as app_module
from app import EVIDENCE_RULES, SYSTEM_PROMPT
from conftest import CAP_ID, PNG_B64

PNG = base64.b64decode(PNG_B64)
META = {"url": "https://example.test/", "clickX": 10, "clickY": 20}
INVENTORY = [
    {"i": "n0", "r": "container", "n": "", "b": [0, 0, 1000, 3000], "v": 1},
    {
        "i": "n1",
        "r": "text",
        "n": "Starter $9",
        "b": [0, 40, 500, 30],
        "v": 1,
        "p": "n0",
    },
    {
        "i": "n2",
        "r": "button",
        "n": "Apply now",
        "b": [0, 80, 120, 30],
        "v": 0,
        "p": "n0",
    },
]
ROUTES = ["/api/chat", "/api/chat/stream"]


@pytest.fixture
def capture(client):
    def make(inventory=INVENTORY):
        cap_dir = app_module.CAPTURES_DIR / CAP_ID
        cap_dir.mkdir()
        (cap_dir / "capture.png").write_bytes(PNG)
        (cap_dir / "meta.json").write_text(json.dumps(META), encoding="utf-8")
        (cap_dir / "chat.json").write_text("[]", encoding="utf-8")
        if inventory is not None:
            (cap_dir / "inventory.json").write_text(json.dumps(inventory))
        return CAP_ID

    return make


def _frames(res) -> list[dict]:
    return [
        json.loads(line[len("data: ") :])
        for line in res.get_data(as_text=True).splitlines()
        if line.startswith("data: ")
    ]


def _reply(client, route, cap_id, message="Where is Apply?", **extra):
    res = client.post(route, json={"capture_id": cap_id, "message": message, **extra})
    assert res.status_code == 200, res.get_data(as_text=True)
    if route == "/api/chat":
        return res.get_json()["reply"]
    frames = _frames(res)
    assert frames[-1].get("done") is True
    return "".join(f.get("delta", "") for f in frames)


def _saved(cap_id):
    return json.loads((app_module.CAPTURES_DIR / cap_id / "chat.json").read_text())


# ── Route wiring ────────────────────────────────────────────────────────────


@pytest.mark.parametrize("route", ROUTES)
@pytest.mark.parametrize(
    "inventory, extra, expected",
    [(INVENTORY, {}, INVENTORY), (None, {}, None), (INVENTORY, {"cite": False}, None)],
    ids=["with-inventory", "no-inventory", "cite-false"],
)
def test_provider_gets_the_inventory_only_when_citing(
    client, capture, monkeypatch, route, inventory, extra, expected
):
    seen = {}

    def fake(**kw):
        seen.update(kw)
        return iter(["ok"]) if route.endswith("stream") else "ok"

    kind = "stream" if route.endswith("stream") else "call"
    monkeypatch.setitem(app_module.PROVIDERS["stub"], kind, fake)
    _reply(client, route, capture(inventory), **extra)
    assert seen["inventory"] == expected


@pytest.mark.parametrize("route", ROUTES)
def test_cite_must_be_a_boolean(client, capture, route):
    res = client.post(
        route, json={"capture_id": capture(), "message": "hi", "cite": "yes"}
    )
    assert res.status_code == 400


@pytest.mark.parametrize("route", ROUTES)
def test_stub_cites_the_matching_element(client, capture, route):
    cap = capture()
    assert _reply(client, route, cap).rstrip().endswith("[[n2]]")
    assert _saved(cap)[-1]["text"].rstrip().endswith("[[n2]]")


@pytest.mark.parametrize("route", ROUTES)
def test_stub_does_not_cite_without_an_inventory(client, capture, route):
    assert "[[" not in _reply(client, route, capture(None))


# ── Marker validation ───────────────────────────────────────────────────────


def test_unknown_ids_are_stripped_from_reply_and_history(client, capture, monkeypatch):
    monkeypatch.setitem(
        app_module.PROVIDERS["stub"],
        "call",
        lambda **_: "Starter is $9 [[n99]] and Apply [[n2]].",
    )
    cap = capture()
    assert _reply(client, "/api/chat", cap) == "Starter is $9 and Apply [[n2]]."
    assert _saved(cap)[-1]["text"] == "Starter is $9 and Apply [[n2]]."


def test_stream_sends_deltas_as_written_but_saves_only_known_ids(
    client, capture, monkeypatch
):
    # a marker split across deltas, as a real stream delivers it
    monkeypatch.setitem(
        app_module.PROVIDERS["stub"],
        "stream",
        lambda **_: iter(["Price $9 [[n", "99]], button [[n2", "]]."]),
    )
    cap = capture()
    assert _reply(client, "/api/chat/stream", cap) == "Price $9 [[n99]], button [[n2]]."
    assert _saved(cap)[-1]["text"] == "Price $9, button [[n2]]."


@pytest.mark.parametrize(
    "text, expected",
    [
        ("See [[n99]]details", "See details"),  # keeps a separator between words
        ("$9 [[n99]].", "$9."),
        ("Over-long [[n123456]] id", "Over-long id"),
        ("Adjacent [[n2]][[n99]][[n1]].", "Adjacent [[n2]][[n1]]."),
        ("Not a marker [[x1]] or [n2].", "Not a marker [[x1]] or [n2]."),
    ],
)
def test_strip_unknown_cites(text, expected):
    assert app_module._strip_unknown_cites(text, {"n1", "n2"}) == expected


def test_cite_false_strips_every_marker(client, capture, monkeypatch):
    monkeypatch.setitem(app_module.PROVIDERS["stub"], "call", lambda **_: "See [[n2]].")
    assert _reply(client, "/api/chat", capture(), cite=False) == "See."


# ── Provider requests (pure builders) ───────────────────────────────────────


def _args(inventory):
    return dict(
        png_b64=PNG_B64,
        viewport_b64=None,
        meta=META,
        history=[],
        message="Where is Apply?",
        inventory=inventory,
    )


def _openai_texts(req):
    return [
        c["text"]
        for m in req["input"]
        if isinstance(m["content"], list)
        for c in m["content"]
        if c["type"] == "input_text"
    ]


def test_openai_request_adds_rules_and_inventory_only_with_an_inventory():
    req = app_module._chat_openai_request(**_args(INVENTORY), stream=True)
    assert req["instructions"] == EVIDENCE_RULES
    assert req["stream"] is True
    texts = _openai_texts(req)
    assert any(t.startswith("## Page inventory") for t in texts)
    assert not any(EVIDENCE_RULES in t for t in texts)  # rules never beside page data

    plain = app_module._chat_openai_request(**_args(None))
    # exactly the pre-citation request
    assert plain == {
        "model": app_module.OPENAI_MODEL,
        "input": app_module._openai_messages(
            PNG_B64, None, META, [], "Where is Apply?"
        ),
    }


def test_gemini_request_adds_rules_and_inventory_only_with_an_inventory():
    req = app_module._chat_gemini_request(**_args(INVENTORY))
    assert req["config"].system_instruction == SYSTEM_PROMPT + "\n\n" + EVIDENCE_RULES
    texts = [p.text for c in req["contents"] for p in c.parts if p.text]
    assert any(t.startswith("## Page inventory") for t in texts)

    plain = app_module._chat_gemini_request(**_args(None))
    assert plain["config"].system_instruction == SYSTEM_PROMPT
    texts = [p.text for c in plain["contents"] for p in c.parts if p.text]
    assert not any(t.startswith("## Page inventory") for t in texts)

"""Token use per model call (Yotam, 2026-10-10): a `usage` event in the study log and a
line on stdout, from the response's own counts; the requests do not change."""

import json
from types import SimpleNamespace as NS

import app as app_module
import study_export
from conftest import PNG_B64


class Dump(NS):
    def model_dump(self, exclude_none=True):
        return {k: v for k, v in vars(self).items() if v is not None}


OPENAI_USAGE = NS(
    input_tokens=12000,
    input_tokens_details=Dump(cached_tokens=9000),
    output_tokens=300,
    output_tokens_details=Dump(reasoning_tokens=120),
    total_tokens=12300,
)


class FakeOpenAI:
    requests: list = []

    def __init__(self, *a, **k):
        self.responses = self

    def create(self, **kw):
        FakeOpenAI.requests.append(kw)
        if kw.get("stream"):
            return iter(
                [
                    NS(type="response.output_text.delta", delta="Kept 14 days."),
                    NS(type="response.completed", response=NS(usage=OPENAI_USAGE)),
                ]
            )
        return NS(output_text="Kept 14 days.", usage=OPENAI_USAGE)


def _lines(pid="P00", session="2"):
    path = app_module.STUDY_LOGS_DIR / pid / f"session-{session}.jsonl"
    return [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines()]


def _ctx(call="chat", follow=False):
    return {"ids": ("P00", "2"), "call": call, "capture": "c1", "followUp": follow}


def test_openai_counts_under_one_set_of_names():
    f = app_module._usage_fields("openai", OPENAI_USAGE)
    assert f["input"] == 12000 and f["cachedInput"] == 9000
    assert f["output"] == 300 and f["reasoning"] == 120 and f["total"] == 12300
    assert f["cacheWrite"] is None
    # a detail the API adds later is kept as sent
    later = NS(
        **{
            **vars(OPENAI_USAGE),
            "input_tokens_details": Dump(cached_tokens=1, cache_write_tokens=5),
        }
    )
    assert app_module._usage_fields("openai", later)["cacheWrite"] == 5
    assert app_module._usage_fields("openai", later)["inputDetails"] == {
        "cached_tokens": 1,
        "cache_write_tokens": 5,
    }


def test_gemini_counts_under_the_same_names():
    u = NS(
        prompt_token_count=800,
        cached_content_token_count=200,
        candidates_token_count=50,
        thoughts_token_count=30,
        total_token_count=880,
    )
    f = app_module._usage_fields("gemini", u)
    assert (f["input"], f["cachedInput"], f["output"], f["reasoning"]) == (
        800,
        200,
        50,
        30,
    )


def test_a_call_and_a_stream_log_their_usage(client, monkeypatch, capsys):
    import openai

    monkeypatch.setattr(openai, "OpenAI", FakeOpenAI)
    kw = dict(
        png_b64=PNG_B64, viewport_b64=None, meta={}, history=[], message="How long?"
    )
    assert app_module._call_openai(**kw, usage=_ctx("chat")) == "Kept 14 days."
    assert list(app_module._stream_openai(**kw, usage=_ctx("chat_stream", True))) == [
        "Kept 14 days."
    ]
    rows = [r for r in _lines() if r["type"] == "usage"]
    assert [r["call"] for r in rows] == ["chat", "chat_stream"]
    assert rows[1]["followUp"] is True and rows[1]["cachedInput"] == 9000
    assert rows[0]["model"] == FakeOpenAI.requests[0]["model"]
    assert "[usage]" in capsys.readouterr().out
    # logging only: the requests carry nothing new
    assert "usage" not in FakeOpenAI.requests[0]


def test_without_a_participant_nothing_is_logged_and_nothing_breaks(
    client, monkeypatch
):
    import openai

    monkeypatch.setattr(openai, "OpenAI", FakeOpenAI)
    kw = dict(png_b64=PNG_B64, viewport_b64=None, meta={}, history=[], message="Hi")
    assert app_module._call_openai(**kw) == "Kept 14 days."
    app_module._record_usage({"ids": None, "call": "chat"}, "openai", "m", object())
    assert not app_module.STUDY_LOGS_DIR.exists()


def test_the_export_sums_the_tokens_and_counts_fallbacks(client, tmp_path):
    app_module._record_usage(_ctx("chat"), "openai", "m", OPENAI_USAGE)
    app_module._record_usage(_ctx("chat", True), "openai", "m", OPENAI_USAGE)
    app_module._study_log(
        ("P00", "2"),
        [
            {
                "t": "2026-10-10T07:00:00Z",
                "type": "read_aloud_fallback",
                "reason": "server 502",
            }
        ],
        "client",
    )
    row = study_export.export(["P00"], app_module.STUDY_LOGS_DIR, tmp_path / "o")[0]
    assert row["model_calls"] == 2 and row["follow_up_calls"] == 1
    assert row["input_tokens"] == 24000 and row["cached_input_tokens"] == 18000
    assert row["reasoning_tokens"] == 240 and row["read_aloud_fallbacks"] == 1
    md = (tmp_path / "o" / "P00-session-2.md").read_text(encoding="utf-8")
    assert "12000 in, 9000 cached, 300 out, 120 reasoning (follow-up)" in md
    assert "read aloud by the browser's voice" in md

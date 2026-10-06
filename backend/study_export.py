"""Turn the study's interaction logs into tables for analysis.

    .venv/bin/python study_export.py                 every participant
    .venv/bin/python study_export.py P03             one participant (or several)
    .venv/bin/python study_export.py P03 --out DIR   elsewhere (default study-logs/export)

The logs are study-logs/<pid>/session-<n>.jsonl, one event per line, written by
the backend (app.py, "Study logs"). For each participant and session this writes:

- <pid>-session-<n>.csv: one row per event, every field (the details as JSON);
- <pid>-session-<n>.md: a summary and a readable timeline (status lines left out:
  they repeat the events they describe; the CSV has them);

and summary.csv, one row per participant and session. Captures are named by id:
their pictures and page text are in backend/captures/<id>/.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).parent
LOGS = HERE / "study-logs"

# the fields every event has; the rest go to "details"
BASE = ("t", "seq", "type", "page", "src", "rx")


def read_log(path: Path) -> list[dict]:
    """A session's events in time order; a broken line is skipped, not fatal."""
    events = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if isinstance(ev, dict):
            events.append(ev)
    # client events carry their own order (seq); server events fall in by time
    events.sort(key=lambda e: (str(e.get("t", "")), e.get("seq") or 0))
    return events


def _when(ev: dict) -> datetime | None:
    """The event's time, in this computer's time zone (the logs are in UTC)."""
    try:
        t = datetime.fromisoformat(str(ev.get("t", "")).replace("Z", "+00:00"))
    except ValueError:
        return None
    return t.astimezone() if t.tzinfo else t


def _short(text: object, n: int = 90) -> str:
    s = " ".join(str(text or "").split())
    return s if len(s) <= n else s[: n - 1] + "…"


def summarize(ev: dict) -> str:
    """One line saying what happened, for the timeline."""
    kind = ev.get("type")
    if kind == "page_load":
        return f"opened {ev.get('url')} ({ev.get('title', '')})"
    if kind in ("alt_click", "region_select"):
        el = ev.get("element") or {}
        what = el.get("text") or el.get("tag") or "?"
        return f'{kind.replace("_", " ")} at ({ev.get("x")}, {ev.get("y")}) on "{_short(what, 60)}"'
    if kind == "capture":
        return f"capture {ev.get('capture')} ({ev.get('ms')} ms)"
    if kind == "capture_saved":
        return f"server saved capture {ev.get('capture')}"
    if kind == "question":
        cmd = f" [command: {ev['command']}]" if ev.get("command") else ""
        return f'{ev.get("via", "?")}: "{_short(ev.get("text"))}"{cmd}'
    if kind == "answer":
        srcs = ev.get("sources") or []
        labels = "; ".join(f"{s.get('n')} {_short(s.get('label'), 30)}" for s in srcs)
        secs = (ev.get("ms") or 0) / 1000
        return f'"{_short(ev.get("text"))}" ({len(srcs)} sources: {labels}; {secs:.1f} s, {ev.get("model")})'
    if kind == "answer_server":
        return f"server: {ev.get('model')} answered in {ev.get('latencyMs')} ms"
    if kind == "source":
        how = ev.get("via") or ("in the answer" if ev.get("inAnswer") else "controls")
        if ev.get("action") == "off":
            return f"source {ev.get('n')} pressed again: outline off ({how})"
        moved = (
            "page moved"
            if ev.get("moved")
            else f"page stayed ({ev.get('where') or 'on screen'})"
        )
        labels = ", ".join(_short(x, 30) for x in ev.get("labels") or [])
        return f"source {ev.get('n')} ({labels}), {how}; {moved}"
    if kind == "command":
        n = f" {ev['n']}" if ev.get("n") else ""
        return f'{ev.get("kind")}{n}: "{_short(ev.get("text"), 40)}" → {_short(ev.get("result"), 60)}'
    if kind == "mic":
        heard = f' heard "{_short(ev.get("heard"), 60)}"' if ev.get("heard") else ""
        return f"mic {ev.get('action')}{heard}"
    if kind == "transcript":
        return f'server heard "{_short(ev.get("text"))}" ({ev.get("latencyMs")} ms)'
    if kind == "read_aloud":
        return f"read aloud: {ev.get('action')} (answer {ev.get('msg')})"
    if kind == "read_aloud_prepared":
        return f"server prepared read-aloud ({ev.get('chars')} characters)"
    if kind == "highlights_shown":
        badges = ",".join(str(b) for b in ev.get("badges") or [])
        by = "by the participant" if ev.get("byUser") else "with the answer"
        return f"outlined {badges} {by} ({ev.get('onScreen')} on screen)"
    if kind == "highlights_cleared":
        return f"outlines cleared ({ev.get('count')})"
    if kind == "status":
        return f"[{ev.get('sound')}] {_short(ev.get('text'))}"
    if kind == "chat_dragged":
        return f"chat dragged to ({ev.get('left')}, {ev.get('top')})"
    if kind == "chat_hidden":
        return "chat hidden (✕)"
    if kind == "facilitator_key":
        return f"facilitator key Ctrl+Alt+Shift+{str(ev.get('key', '?')).upper()}"
    if kind == "back":
        return (
            "back to the earlier view"
            if ev.get("ok")
            else "back: nothing to go back to"
        )
    if kind == "error":
        return f"ERROR in {ev.get('where')}: {_short(ev.get('message'))}"
    rest = {k: v for k, v in ev.items() if k not in BASE}
    return _short(json.dumps(rest, ensure_ascii=False))


def stats(events: list[dict]) -> dict:
    """The session in numbers, for the summary."""
    times = [w for w in (_when(e) for e in events) if w]
    q = [e for e in events if e.get("type") == "question"]
    answers = [e for e in events if e.get("type") == "answer"]
    secs = [a["ms"] / 1000 for a in answers if isinstance(a.get("ms"), (int, float))]
    count = lambda kind, **match: sum(  # noqa: E731
        1
        for e in events
        if e.get("type") == kind and all(e.get(k) == v for k, v in match.items())
    )
    return {
        "start": times[0].isoformat(timespec="seconds") if times else "",
        "end": times[-1].isoformat(timespec="seconds") if times else "",
        "minutes": (
            round((times[-1] - times[0]).total_seconds() / 60, 1) if times else 0
        ),
        "pages": len({e.get("url") for e in events if e.get("type") == "page_load"}),
        "alt_clicks": count("alt_click"),
        "questions": len(q),
        "typed": sum(1 for e in q if e.get("via") == "typed"),
        "voice": sum(1 for e in q if e.get("via") == "voice"),
        "commands": count("command"),
        "answers": len(answers),
        "mean_answer_s": round(sum(secs) / len(secs), 1) if secs else "",
        # chosen by the participant (a number, the arrows, All), not by a command
        "sources_pressed": sum(
            1
            for e in events
            if e.get("type") == "source"
            and e.get("via") not in ("command", "live")
            and e.get("action") != "off"
        ),
        "mic_starts": count("mic", action="start"),
        "read_aloud_plays": count("read_aloud", action="play"),
        "chat_drags": count("chat_dragged"),
        # the widget reports what the participant met; the server's own errors (the
        # same failure, seen from the other side) are counted apart
        "errors": sum(
            1 for e in events if e.get("type") == "error" and e.get("src") != "server"
        ),
        "server_errors": sum(
            1 for e in events if e.get("type") == "error" and e.get("src") == "server"
        ),
    }


def export_session(pid: str, path: Path, out: Path) -> dict:
    events = read_log(path)
    session = path.stem.removeprefix("session-")
    stem = f"{pid}-session-{session}"
    t0 = next((w for w in (_when(e) for e in events) if w), None)

    def elapsed(ev: dict) -> str:
        w = _when(ev)
        return f"{(w - t0).total_seconds():.1f}" if w and t0 else ""

    with open(out / f"{stem}.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            ["time", "elapsed_s", "source", "event", "page", "summary", "details"]
        )
        for ev in events:
            details = {k: v for k, v in ev.items() if k not in BASE}
            when = _when(ev)
            w.writerow(
                [
                    (
                        when.isoformat(timespec="milliseconds")
                        if when
                        else ev.get("t", "")
                    ),
                    elapsed(ev),
                    ev.get("src", ""),
                    ev.get("type", ""),
                    ev.get("page", ""),
                    summarize(ev),
                    json.dumps(details, ensure_ascii=False),
                ]
            )

    s = stats(events)
    lines = [
        f"# {pid}, session {session}",
        "",
        f"- {s['start']} to {s['end']} ({s['minutes']} min), {s['pages']} pages",
        f"- {s['alt_clicks']} Alt+clicks; {s['questions']} questions ({s['typed']} typed, {s['voice']} by voice), {s['commands']} of them commands",
        f"- {s['answers']} answers, {s['mean_answer_s'] or '–'} s on average; {s['sources_pressed']} sources chosen",
        f"- {s['mic_starts']} microphone uses, {s['read_aloud_plays']} read-aloud plays, {s['chat_drags']} chat drags, {s['errors']} errors",
        "",
        "Status lines are left out here; the CSV has every event. Captures: backend/captures/<id>/.",
        "",
        "| time | +s | event | what happened |",
        "|---|---|---|---|",
    ]
    for ev in events:
        if ev.get("type") == "status":
            continue
        w = _when(ev)
        when = w.strftime("%H:%M:%S") if w else ""
        what = summarize(ev).replace("|", "\\|")
        lines.append(f"| {when} | {elapsed(ev)} | {ev.get('type')} | {what} |")
    (out / f"{stem}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"pid": pid, "session": session, **s}


def export(
    pids: list[str] | None = None, logs: Path = LOGS, out: Path | None = None
) -> list[dict]:
    """Export the given participants (all when none); returns the summary rows."""
    out = out or logs / "export"
    out.mkdir(parents=True, exist_ok=True)
    folders = (
        sorted(p for p in logs.iterdir() if p.is_dir() and p.name != out.name)
        if logs.exists()
        else []
    )
    if pids:
        folders = [f for f in folders if f.name in pids]
    rows = []
    for folder in folders:
        for path in sorted(folder.glob("session-*.jsonl")):
            rows.append(export_session(folder.name, path, out))
    if rows:
        with open(out / "summary.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("pids", nargs="*", help="participant ids (default: all)")
    ap.add_argument("--logs", type=Path, default=LOGS, help="the logs folder")
    ap.add_argument("--out", type=Path, default=None, help="where to write")
    args = ap.parse_args()
    rows = export(args.pids or None, args.logs, args.out)
    out = args.out or args.logs / "export"
    if not rows:
        print(f"no logs found in {args.logs}")
        return
    for r in rows:
        print(
            f"{r['pid']} session {r['session']}: {r['questions']} questions, {r['answers']} answers, {r['errors']} errors"
        )
    print(f"written to {out}")


if __name__ == "__main__":
    main()

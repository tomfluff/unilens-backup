"""
UniLens backend — minimal Flask prototype.

POST /api/capture  {image: dataURL, meta: {...}}      -> {id}
POST /api/chat     {capture_id, message}              -> {reply, provider, model}
GET  /health

Captures stored under captures/<id>/ (capture.png + meta.json + chat.json).
LLM/VLM provider picked by env: OPENAI_API_KEY -> OpenAI, else GOOGLE_API_KEY
-> Gemini, else an offline echo stub (so the frontend works without keys).
Patterns follow assets26-ai4vis-proj/prototype (base64 inline images).
"""
import base64
import json
import os
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS

load_dotenv()

CAPTURES_DIR = Path(__file__).parent / "captures"
CAPTURES_DIR.mkdir(exist_ok=True)
SESSIONS_DIR = Path(__file__).parent / "sessions"
SESSIONS_DIR.mkdir(exist_ok=True)


def _load_session(sid: str) -> dict | None:
    p = SESSIONS_DIR / f"{sid}.json"
    if not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def _save_session(sid: str, data: dict) -> None:
    (SESSIONS_DIR / f"{sid}.json").write_text(json.dumps(data, indent=2), encoding="utf-8")


def _session_context_note(session: dict, current_cap_id: str) -> str | None:
    """One text line per earlier capture so the model knows the session's path."""
    lines = []
    for i, cid in enumerate(session["captures"]):
        if cid == current_cap_id:
            continue
        meta_path = CAPTURES_DIR / cid / "meta.json"
        if not meta_path.is_file():
            continue
        m = json.loads(meta_path.read_text(encoding="utf-8"))
        el = m.get("element") or {}
        desc = f"capture #{i + 1}: click ({m.get('clickX')}, {m.get('clickY')})"
        if el.get("tag"):
            desc += f" on <{el['tag']}>"
        if el.get("text"):
            desc += f" \"{el['text'][:80]}\""
        if m.get("region"):
            r = m["region"]
            desc += f", selected region {r['w']}x{r['h']}"
        lines.append(desc)
    if not lines:
        return None
    return (
        "Earlier in this session the user also captured (images not re-sent; shown page is the latest capture):\n"
        + "\n".join(lines)
    )

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

SYSTEM_PROMPT = """You are UniLens, an assistant that helps users understand web pages.
With every conversation you receive:
- A full-page screenshot annotated with: a cyan rectangle = the user's visible viewport,
  an orange fading line = the user's recent mouse movement (faint = older, bright = newer),
  and a red crosshair/circle = where the user alt+clicked to ask for help.
- When available, a second clean close-up image of exactly the region the user currently
  sees (zoom-aware). Prefer it for reading fine details and small text.
- Page metadata (URL, scroll position, viewport size, click coordinates, zoom level,
  recent zoom history showing where the user zoomed in). When present, metadata.element
  describes the exact DOM element the user clicked (tag, text, nearest heading) — treat
  it as the most precise signal of what they are asking about. When metadata.region is
  present, the user explicitly selected that rectangle (drawn magenta on the full page;
  the close-up image shows exactly it) — answer about that region.
Focus your answers on the region around the click and what the user was likely looking at.
Answer in short chat-style plain text suited to a small chat bubble. Avoid markdown
headings and tables; minimal **bold** and simple dash lists are OK."""


def _provider():
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("GOOGLE_API_KEY"):
        return "gemini"
    return "stub"


def _openai_messages(png_b64: str, viewport_b64: str | None, meta: dict, history: list, message: str) -> list:
    context_content = [
        {"type": "input_text", "text": "## Annotated full-page screenshot"},
        {
            "type": "input_image",
            "image_url": f"data:image/png;base64,{png_b64}",
            "detail": "high",
        },
    ]
    if viewport_b64:
        context_content += [
            {"type": "input_text", "text": "## Close-up of the user's current view"},
            {
                "type": "input_image",
                "image_url": f"data:image/png;base64,{viewport_b64}",
                "detail": "high",
            },
        ]
    context_content.append(
        {"type": "input_text", "text": "## Page metadata\n" + json.dumps(meta, indent=2)}
    )
    input_messages = [
        {"role": "user", "content": [{"type": "input_text", "text": SYSTEM_PROMPT}]},
        {"role": "assistant", "content": "Understood. I will follow these instructions."},
        {"role": "user", "content": context_content},
        {"role": "assistant", "content": "I can see the page. What would you like to know?"},
    ]
    for m in history:
        input_messages.append({"role": m["role"], "content": m["text"]})
    input_messages.append({"role": "user", "content": message})
    return input_messages


def _call_openai(png_b64: str, viewport_b64: str | None, meta: dict, history: list, message: str) -> str:
    from openai import OpenAI

    client = OpenAI()
    response = client.responses.create(
        model=OPENAI_MODEL, input=_openai_messages(png_b64, viewport_b64, meta, history, message)
    )
    return response.output_text


def _gemini_contents(png_b64: str, viewport_b64: str | None, meta: dict, history: list, message: str) -> list:
    from google.genai import types

    context_parts = [
        types.Part.from_text(text="## Annotated full-page screenshot"),
        types.Part.from_bytes(data=base64.b64decode(png_b64), mime_type="image/png"),
    ]
    if viewport_b64:
        context_parts += [
            types.Part.from_text(text="## Close-up of the user's current view"),
            types.Part.from_bytes(data=base64.b64decode(viewport_b64), mime_type="image/png"),
        ]
    context_parts.append(types.Part.from_text(text="## Page metadata\n" + json.dumps(meta, indent=2)))
    contents = [
        types.Content(role="user", parts=context_parts),
        types.Content(role="model", parts=[types.Part.from_text(text="I can see the page. What would you like to know?")]),
    ]
    for m in history:
        role = "model" if m["role"] == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m["text"])]))
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))
    return contents


def _call_gemini(png_b64: str, viewport_b64: str | None, meta: dict, history: list, message: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client()
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=_gemini_contents(png_b64, viewport_b64, meta, history, message),
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )
    return response.text


def _stream_openai(png_b64, viewport_b64, meta, history, message):
    """Yield text deltas from the OpenAI Responses streaming API."""
    from openai import OpenAI

    client = OpenAI()
    input_messages = _openai_messages(png_b64, viewport_b64, meta, history, message)
    stream = client.responses.create(model=OPENAI_MODEL, input=input_messages, stream=True)
    for event in stream:
        if event.type == "response.output_text.delta":
            yield event.delta


def _stream_gemini(png_b64, viewport_b64, meta, history, message):
    from google import genai
    from google.genai import types

    client = genai.Client()
    contents = _gemini_contents(png_b64, viewport_b64, meta, history, message)
    for chunk in client.models.generate_content_stream(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    ):
        if chunk.text:
            yield chunk.text


def _stream_stub(meta: dict, message: str):
    import time as _t

    for word in _call_stub(meta, message).split(" "):
        yield word + " "
        _t.sleep(0.02)


def _call_stub(meta: dict, message: str) -> str:
    return (
        "[stub — set OPENAI_API_KEY or GOOGLE_API_KEY for real answers]\n"
        f"You clicked at ({meta.get('clickX')}, {meta.get('clickY')}) on {meta.get('url')} "
        f"at {meta.get('scrollDepth')}% scroll depth, with {len(meta.get('trace', []))} trace points. "
        f'Your message: "{message}"'
    )


def create_app():
    app = Flask(__name__)
    CORS(app)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "provider": _provider()})

    @app.post("/api/capture")
    def save_capture():
        data = request.get_json(force=True)
        image = data.get("image", "")
        meta = data.get("meta", {})
        if not image.startswith("data:image/png;base64,"):
            return jsonify({"error": "image must be a PNG data URL"}), 400

        cap_id = uuid.uuid4().hex[:12]
        cap_dir = CAPTURES_DIR / cap_id
        cap_dir.mkdir()
        (cap_dir / "capture.png").write_bytes(base64.b64decode(image.split(",", 1)[1]))
        viewport = data.get("viewport") or ""
        if viewport.startswith("data:image/png;base64,"):
            (cap_dir / "viewport.png").write_bytes(base64.b64decode(viewport.split(",", 1)[1]))
        (cap_dir / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        (cap_dir / "chat.json").write_text("[]", encoding="utf-8")

        # Session continuity: join the given session or start a new one
        sid = data.get("session_id") or ""
        session = _load_session(sid) if sid else None
        if session is None:
            sid = uuid.uuid4().hex[:12]
            session = {"captures": [], "history": []}
        session["captures"].append(cap_id)
        _save_session(sid, session)
        return jsonify({"id": cap_id, "session_id": sid})

    @app.get("/api/capture/<cap_id>")
    def capture_info(cap_id):
        cap_dir = CAPTURES_DIR / cap_id
        if not cap_dir.is_dir():
            return jsonify({"error": "unknown capture_id"}), 404
        files = {p.name: p.stat().st_size for p in sorted(cap_dir.iterdir())}
        return jsonify({"id": cap_id, "files": files})

    @app.get("/api/session/<sid>")
    def session_info(sid):
        session = _load_session(sid)
        if session is None:
            return jsonify({"error": "unknown session_id"}), 404
        return jsonify({"id": sid, "captures": len(session["captures"]), "history": session["history"]})

    @app.post("/api/chat/stream")
    def chat_stream():
        data = request.get_json(force=True)
        cap_id = data.get("capture_id", "")
        message = (data.get("message") or "").strip()
        if not message:
            return jsonify({"error": "empty message"}), 400
        cap_dir = CAPTURES_DIR / cap_id
        if not cap_dir.is_dir():
            return jsonify({"error": f"unknown capture_id: {cap_id}"}), 404

        meta = json.loads((cap_dir / "meta.json").read_text(encoding="utf-8"))
        sid = data.get("session_id") or ""
        session = _load_session(sid) if sid else None
        if session is not None:
            history = session["history"]
            note = _session_context_note(session, cap_id)
            provider_history = (
                [{"role": "user", "text": note}, {"role": "assistant", "text": "Noted."}] + history if note else history
            )
        else:
            history = json.loads((cap_dir / "chat.json").read_text(encoding="utf-8"))
            provider_history = history
        png_b64 = base64.b64encode((cap_dir / "capture.png").read_bytes()).decode()
        viewport_b64 = None
        if (cap_dir / "viewport.png").is_file():
            viewport_b64 = base64.b64encode((cap_dir / "viewport.png").read_bytes()).decode()

        provider = _provider()
        model = {"openai": OPENAI_MODEL, "gemini": GEMINI_MODEL, "stub": "none"}[provider]
        images_sent = 0 if provider == "stub" else (2 if viewport_b64 else 1)

        def sse(obj):
            return f"data: {json.dumps(obj)}\n\n"

        def generate():
            t0 = time.perf_counter()
            parts = []
            try:
                if provider == "openai":
                    deltas = _stream_openai(png_b64, viewport_b64, meta, provider_history, message)
                elif provider == "gemini":
                    deltas = _stream_gemini(png_b64, viewport_b64, meta, provider_history, message)
                else:
                    deltas = _stream_stub(meta, message)
                for delta in deltas:
                    parts.append(delta)
                    yield sse({"delta": delta})
            except Exception as e:
                yield sse({"error": f"{type(e).__name__}: {e}"})
                return
            reply = "".join(parts)
            new_history = history + [{"role": "user", "text": message}, {"role": "assistant", "text": reply}]
            if session is not None:
                session["history"] = new_history
                _save_session(sid, session)
            else:
                (cap_dir / "chat.json").write_text(json.dumps(new_history, indent=2), encoding="utf-8")
            yield sse(
                {
                    "done": True,
                    "provider": provider,
                    "model": model,
                    "imagesSent": images_sent,
                    "latencyMs": round((time.perf_counter() - t0) * 1000),
                }
            )

        return Response(stream_with_context(generate()), mimetype="text/event-stream")

    @app.post("/api/chat")
    def chat():
        data = request.get_json(force=True)
        cap_id = data.get("capture_id", "")
        message = (data.get("message") or "").strip()
        if not message:
            return jsonify({"error": "empty message"}), 400

        cap_dir = CAPTURES_DIR / cap_id
        if not cap_dir.is_dir():
            return jsonify({"error": f"unknown capture_id: {cap_id}"}), 404

        meta = json.loads((cap_dir / "meta.json").read_text(encoding="utf-8"))
        sid = data.get("session_id") or ""
        session = _load_session(sid) if sid else None
        if session is not None:
            history = session["history"]
            note = _session_context_note(session, cap_id)
            provider_history = (
                [{"role": "user", "text": note}, {"role": "assistant", "text": "Noted."}] + history if note else history
            )
        else:
            history = json.loads((cap_dir / "chat.json").read_text(encoding="utf-8"))
            provider_history = history
        png_b64 = base64.b64encode((cap_dir / "capture.png").read_bytes()).decode()
        viewport_b64 = None
        if (cap_dir / "viewport.png").is_file():
            viewport_b64 = base64.b64encode((cap_dir / "viewport.png").read_bytes()).decode()

        provider = _provider()
        t0 = time.perf_counter()
        try:
            if provider == "openai":
                reply = _call_openai(png_b64, viewport_b64, meta, provider_history, message)
            elif provider == "gemini":
                reply = _call_gemini(png_b64, viewport_b64, meta, provider_history, message)
            else:
                reply = _call_stub(meta, message)
        except Exception as e:  # surface provider errors to the popover
            return jsonify({"error": f"{type(e).__name__}: {e}"}), 502
        latency_ms = round((time.perf_counter() - t0) * 1000)

        history += [{"role": "user", "text": message}, {"role": "assistant", "text": reply}]
        if session is not None:
            session["history"] = history
            _save_session(sid, session)
        else:
            (cap_dir / "chat.json").write_text(json.dumps(history, indent=2), encoding="utf-8")

        model = {"openai": OPENAI_MODEL, "gemini": GEMINI_MODEL, "stub": "none"}[provider]
        return jsonify(
            {
                "reply": reply,
                "provider": provider,
                "model": model,
                "latencyMs": latency_ms,
                "imagesSent": 0 if provider == "stub" else (2 if viewport_b64 else 1),
            }
        )

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")

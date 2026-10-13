---
Author: Yotam Sechayk
Date: 2026-10-07
---

# Read aloud starts at once through a tunnel

## Context

In session 1 the participants reached UniLens through a Cloudflare quick tunnel. Read-aloud started late: up to 9.4 s for a 470-character answer, and 2.7 s for 120 characters. The backend already streamed the speech as it was made. The widget asked for it with a POST (`/api/tts`, for an id) and then had an `<audio>` element GET it (`/api/tts/<id>.mp3`). The quick tunnel holds back a GET's body until it is complete. It passes a POST's body on at once (first bytes at 0.07 s, against 3.06 s for a GET, whatever the type or headers; the team lead's test with a dummy server). So nothing played until the whole reading had been made.

## Decision

- **The reading is the POST's own answer.** A new route, `POST /api/tts/stream`, takes the same body as `/api/tts` (text, provider, model, voice, checked the same way). It answers with 16-bit mono PCM at 24 kHz, sent as it is made: OpenAI's `pcm` format, or Gemini's own audio without the WAV header. The sample rate is in an `X-Audio-Sample-Rate` header.
- **The widget plays it with WebAudio as it arrives** (`speech.ts`). It holds 0.3 s of audio before the first sound, then gathers each 0.25 s into a piece. The pieces are scheduled back to back, so the reading is gapless; a piece that comes late starts at once. Pause and resume suspend and resume the audio context. Stop aborts the stream and closes the context. The `AudioContext` is made inside the press that asked for the reading, as browsers require.
- **PCM with WebAudio, not MP3 through MediaSource.** Both providers already make 24 kHz PCM, so there is one path for both, with no codec or segment handling. It works in every browser with WebAudio, and it is the pattern Yotam's ai4charts uses. It costs more bandwidth (48 KB/s), which a tunnel carries easily.
- **Fallbacks:**
  - A backend without the new route (404) gets the old `<audio>` route, so a frozen build keeps reading aloud against an older backend.
  - If the backend's voice cannot start, the browser's own voice reads, as before.
  - The `/api/tts` and `/api/tts/<id>.mp3` routes stay, Gemini's WAV included.
- Not done: reading sentence by sentence, the first plan. It worked through a GET-holding tunnel, but it costs one request per part and only shortens the wait. The POST removes the wait.

## Consequences

Measured through a real quick tunnel, in Chrome 154 and Edge 154 on Windows (first sound after pressing play):

- **OpenAI:** 120 characters 2.1–3.5 s; 449 characters 1.2–1.5 s; 969 characters 1.1–1.2 s.
- **Gemini:** 0.9–1.3 s.
- **Every run:** no gaps, and the audio was complete.

OpenAI's own start time varies from run to run, on its MP3 route as well (8–17 s for the first bytes in some local runs). Chat answers already stream through the tunnel: first words after about 2 s, then in steps.

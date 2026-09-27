---
Author: Yotam Sechayk
Date: 2026-09-26
---

# Voice input where the browser has no speech recognition

## Context

Firefox has no SpeechRecognition, so the voice button did nothing there. The builder asked for a speech-to-text API instead: OpenAI first, then Gemini.

## Decision

- **The voice button records, and the server turns it into text.** The browser records the message (WebM, Ogg or MP4) and sends it to `POST /api/stt`. The words fill the field once it is text, and the status line says "Turning your message into text…" meanwhile.
- **A "Speech recognition" setting:** the browser, else the server (default); the browser only; OpenAI; or Gemini. A second setting picks the server's model (OpenAI `whisper-1` by default).
- **With "send what I say when I pause" on, a pause ends the message**, once speech was heard. A message is at most a minute.
- **Stop while it is being turned into text drops it.** Nothing is sent.
- **A provider chosen without its key refuses the recording**, instead of sending it to the other provider.
- **The mic turns off on every ending**, including a recorder that fails to start.
- **The server reads at most 10 MiB** of a recording, declared or not.

## Not in this change

- Words appearing while speaking, through the server. That needs a streaming speech API; the Live talk is the step toward it.

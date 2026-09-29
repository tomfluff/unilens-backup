---
Author: Yotam Sechayk
Date: 2026-09-27
---

# Newer models, and read aloud with Gemini

## Context

The builder found the AI settings missing the newest models (GPT-6 Sol and Luna), and asked for recent, relevant ones only, with the cheaper ones that suit UniLens, and for Gemini's read-aloud voices (R2 of the 2026-09-27 testing report). The lists are curated in `backend/app.py`; a model appears only once it is added there, and the backend hides any the key cannot reach.

## Decision

- **Chat, OpenAI:** gpt-6-sol, gpt-6-luna, gpt-5.6-sol, gpt-5.6-terra, gpt-5.6-luna, gpt-5.4-mini, gpt-5.4-nano. Dropped: gpt-5.4, gpt-5.5, gpt-4.1-mini. Left out: gpt-6-astra (built for the hardest end-to-end work) and the -pro models.
- **Chat, Gemini:** gemini-3.8-flash, gemini-3.7-flash, gemini-3.6-flash, gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemini-3.1-pro-preview. Dropped: gemini-3-flash-preview, gemini-3.5-flash, gemini-2.5-flash. The code's Gemini default is now gemini-3.6-flash.
- **Speech to text:** OpenAI whisper-1 (default), gpt-transcribe, gpt-4o-mini-transcribe, gpt-4o-transcribe; Gemini gemini-3.5-transcribe (default), gemini-3.8-flash.
- **Live, the user's words as text (OpenAI):** gpt-live-transcribe, built for realtime transcription.
- **Read aloud with Gemini.** A new "Read-aloud provider" setting (backend default, OpenAI, Gemini) with its model (Gemini: gemini-3.8-flash-tts by default, gemini-3.8-flash-lite-tts) and its voices (Gemini's prebuilt ones, as Live's). The backend streams Gemini's speech as WAV (16-bit PCM at 24 kHz) under the same route; a request's provider, model and voice are checked against the catalogue, which now lists each provider's (`tts`, `ttsDefault`).
- **The chat default stays gpt-5.6-terra** (the builder's environment). On two saved questions, twice each, GPT-6 Luna put every number inline too (12/12 against 11/11) but marked fewer phrases (6 against 9), took longer (4.5 s against 3.7 s on average) and wrote more (about 270 output tokens against 100).

## Tried

- Every listed model answered with our request shape (OpenAI with a reasoning level, Gemini with a thinking level), each reachable with the current keys.
- gpt-transcribe, whisper-1, gemini-3.8-flash and gemini-3.5-transcribe each transcribed a recorded question exactly.
- Read aloud in the browser: Gemini's WAV and OpenAI's MP3 both played to the end, starting about 2.5 s after the press.
- A Live talk with gpt-live-transcribe: the user's words arrived as before.

## Not in this change

- Dictation that shows words while the user speaks (gpt-realtime-whisper, gemini-3.5-transcribe-live).
- The Live default model: the full gpt-realtime-2.1 did better than -mini in every test (source 2 for "the second one", short answers, no "let me…"), at about four times the cost. It is the builder's call.

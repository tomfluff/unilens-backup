---
Author: Yotam Sechayk
Date: 2026-09-29
---

# Fixes from the builder's third round of testing

## Context

On 2026-09-28 the builder found a spotlight fault on the SoftBank mirror. Two more problems turned up while the realtime APIs' documentation was checked on 2026-09-29 for a knowledge bank.

## Decision

- **A source inside another source is lit through the outer one.**
  - Spotlight and dim darken the page and cut one hole per outlined element, with an even-odd clip path. Under that rule a hole inside another hole is dark again, so a link cited inside its cited sentence sat in a dark smudge.
  - The builder's rule: when both are marked, the backdrop lights the outer one only; when only the inner one is marked, it lights the inner one only.
  - A box inside another now cuts no hole of its own, and the same box twice cuts one. The link keeps its number, and its outline when an outline style is on.
  - Two sources that only partly overlap still darken their overlap. That is rare, and a mask of the union would fix it.
- **Live works on `gemini-3.8-live-extended-thinking`.** It was offered in the Live settings but had never started.
  - The session carries a thinking level (`low`). Without one, Gemini closed the connection at once (1007, "Thinking level must be specified for this model").
  - Tool results go without `scheduling`, which this model does not take.
  - Its `turnComplete` ends an utterance, such as a filler while it reasons. The reply ends on `interactionStatus: IDLE`, so the filler and the answer share one bubble. While it is still working, the talk shows "thinking", not "listening", so a changed page waits until it is done.
- **Server speech recognition uses `gpt-transcribe`.** OpenAI shuts `whisper-1`, `gpt-4o-mini-transcribe` and `gpt-4o-transcribe` down on 2027-02-26, so they are off the list. A stored choice of one falls back to `gpt-transcribe`.

## Tried

- **Spotlight and dim on the mirror:** the answer cited the 内容 cell's sentence and the PayPay link inside it. The whole cell is lit, as in the builder's hand-drawn version.
- **Extended Thinking, one real two-turn talk** (about US$0.13):
  - It said a filler 0.8 s after the question, called `go_to`, and gave the answer about 5 s after the question. Filler and answer came in one bubble.
  - The status went IN_PROGRESS, then IDLE, as the docs say.
- **`gpt-transcribe`:** it transcribed a recorded question exactly in the 2026-09-27 round.

## Not in this change

- Gemini cancelling a tool call when the user speaks over it (`toolCallCancellation`). The widget has already acted by then.
- Marking an interrupted OpenAI reply, whose caption keeps words that were never played.
- The `OpenAI-Safety-Identifier` header, for the pilot.

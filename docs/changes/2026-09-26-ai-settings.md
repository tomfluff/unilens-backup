---
Author: Yotam Sechayk
Date: 2026-09-26
---

# AI settings: provider, model, reasoning and voice

## Context

For studies, the builder wants to choose the provider, model and reasoning level from the interface, not the backend's environment.

## Decision

- **An "AI (research)" settings group:** provider (backend default, OpenAI or Gemini), model, reasoning level, and the read-aloud voice.
- **The backend owns the catalogue.** `GET /api/ai` lists the providers whose key is set, the models each key can reach, and the reasoning levels each model takes. Pro models take "high" only.
- **Every request is checked against it.** The chat sends only what differs from the defaults, as `ai`. Anything not in the catalogue falls back to the default, so no arbitrary model name reaches a paid API.
- **Reasoning follows the model.** The panel shows the chosen model's levels, or "Not for this model".
- **Changing the provider resets the model.**
- **The model list is cached.** A listing is kept an hour. A failed listing keeps the last good one, and each provider refreshes on its own.

## Not in this change

- Per-study presets of these settings.

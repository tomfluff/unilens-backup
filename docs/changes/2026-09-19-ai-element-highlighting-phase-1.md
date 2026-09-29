---
Author: Yotam Sechayk
Date: 2026-09-19
---

# AI element highlighting, phase 1: the model can point, on request

## Context

UniLens was a one-way pipe: alt+click sends a screenshot and one element
description to a vision-language model, the answer comes back as chat text,
nothing flows back onto the page. For a screen-magnifier user who sees a
quarter of the page at 400%, "the Apply button is below the form" is an
instruction to pan around hunting. The magnifier literature names this as the
core failure: loss of overview and orientation.

PageGuide (arXiv 2604.23772) already grounds LLM answers to live DOM elements
for general users, so "the model highlights an element" is prior art. The
contribution is a **ladder of assistance and agency** for magnifier users,
each rung a feature and a study condition: (1) the model can point, on
request; (2) it can lead (off-screen cues, pan on consent); (3) it can walk
you through; (4) it can act, held as a question. This change is rung 1.

Design and evidence: `docs/research/2026-09-18-ai-element-highlighting-literature.md`,
`docs/research/2026-09-19-phase1-research-probes.md`, and the approved design
doc (three adversarial review rounds, an engineering review, and Codex outside
voices; decisions logged).

## Decision

**Inventory.** At capture time the client distils the DOM into a tree of
candidate nodes (`unilens-lib/src/inventory.ts`) with sequential ids and a
registry back to live elements. Roles follow an accname-style table;
containers earn a node only as landmarks, headings, labelled groups, or forks
of two or more visible branches (Region4Web's criterion); text leaves are
candidates; region summaries are additive and built from emitted names;
off-screen nodes are kept with a visibility flag while `display:none`,
`visibility:hidden`, `aria-hidden` and `inert` subtrees are never walked. The
wire form uses short keys and integer boxes and travels **beside** `meta`,
never inside it; the backend stores it as `captures/<id>/inventory.json` and
only `/api/locate` reads it.

**Privacy.** A form field is described by its label only: never its value,
never its contents; password and hidden inputs are never walked. The test for
this caught a real leak in the first draft.

**Locate.** `POST /api/locate` asks the model for structured JSON whose
`highlights[].id` is a **closed vocabulary**, an enum of the capture's ids
built per request (string fallback above the provider's 1,000-value cap), with
one Pydantic model as the only schema definition (`strictify()` for OpenAI
strict mode, the class itself for Gemini). Rules live in the system role; the
inventory is sent as canonical JSON between per-request random delimiters with
every untrusted string datamarked; the server validates ids against the stored
inventory. The stub provider answers from the inventory alone so the whole
path is testable without keys.

**Rendering.** `highlight.ts` draws in a fixed, pointer-transparent layer
under `documentElement`, outside the body zoom transform, from a **style
parameter object** with named presets: `wcag-ring` (W3C Technique C40 two-band
ring, the default), `yellow-fill`, `glow`, `dim-others`, `dim-yellow-glow`.
The visual design of the highlight is itself a research variable; the WCAG
ring is the floor and the default, not the ceiling. Forced-colours and
reduced-motion are honoured by every preset. The minimap shows a marker for
the target when zoomed.

**Predictability.** The outline always belongs to the latest question on the
current capture: the capture id is set right after upload and each locate
carries a monotonic token; a late answer is dropped, a non-found answer clears.
`Escape` has a single owner in `highlight.ts` that decides once per keypress
under the `escapeOrder` setting; the popover only lends a close callback; the
host page sees every `Escape` it always saw.

**Knobs over constants.** Every exploration parameter (inventory depth,
summary depth and cap, byte and node caps, screenshot on/off, ring width and
scaling, pulse, marker size, preset, Escape order) is a persisted setting, so
decisions come from trials on the mirrors, not from argument.

**Refactors taken in passing, each verified behaviour-neutral by tests written
first:** provider dispatch through one `PROVIDERS` table; `_load_capture_context`
shared by the chat routes; `onViewChange` returns an unsubscribe; the two
libraries pin the same TypeScript major; the backend has its first tests.

## Consequences

- A magnifier user can ask "where is X?" and get an outline and a minimap
  marker, on `dev-demo` and both SoftBank mirrors. Phase 1 does nothing on
  ordinary chat turns; "point while answering" is step two.
- Every claim above has a test: 21+ backend, 55+ `unilens-lib`, 58
  `accessibility-lib`, all under `make check`, which now cannot pass with a
  broken typecheck.
- No live provider call has been made yet; two things only a live call
  proves (OpenAI strict mode with Pydantic `title` keys; google-genai with a
  900-value `Literal`) are the first checkpoint with a key.
- Open, by design: the inventory's structure gets its own office-hours
  session; the trial runner lands before any settings exploration; the feel of
  the decided mechanics is re-checked on the real build (`TODOS.md`).

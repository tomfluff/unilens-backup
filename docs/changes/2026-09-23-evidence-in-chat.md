---
Author: Yotam Sechayk
Date: 2026-09-23
---

# Evidence in chat: every answer can point, the Where is mode goes

## Context

The first tester pass on phase 1 (the builder's notes, 2026-09-23) found
the dedicated "Where is…" mode wrong for the interaction: pointing should be
part of the regular conversation, not a separate button. An answer such as
"the cost is ¥500" should offer to show where on the page that came from,
several elements can answer one question, and the user should be able to
move between them by button or by typing. The same pass found that the
model kept answering from the first capture after the user scrolled or
zoomed, and that the inventory missed most of a real page.

## Decision

**Citations in the stream.** When a capture has an inventory, `/api/chat`
and `/api/chat/stream` send it (the same datamarked, delimited block as
`/api/locate`) with `EVIDENCE_RULES` in the system role. The model cites
the element each statement came from as `[[n12]]` right after the claim.
Streaming, the one-call cost and the answer text are unchanged; the
evidence is cited by the same reasoning that wrote the answer, which is
what "where the information was taken from" asks for. Unknown ids are
stripped from saved history and from `/api/chat`; the client hides them in
the stream. `cite: false` (the `citeEvidence` knob) restores the old
request byte for byte.

**Chips, row, navigator.** The popover renders citations as numbered chips.
A reply that cites gets an action row: Highlight all, Scroll to, and a
previous/next navigator when several elements answer. Outlines carry the
same numbers as the chips; dim presets cut one hole per outlined element.
Typed commands (next, previous, show all, the second one, clear) steer the
last cited reply locally with no model call. The `autoHighlight` knob
(where | always | never, default where) outlines a reply's evidence on
arrival when the question asked where or to show; clicks are never
automatic-guarded, late answers still are.

**Each reply keeps its capture.** Ids are minted per capture, so a reply's
citations resolve only against the registry of the capture that answered
it. History seeded from earlier captures renders without chips.

**View refresh.** Before a follow-up, if the user scrolled or panned more
than a quarter of the viewport or zoomed, the popover re-captures into the
session (`meta.viewRefresh`, same question point) and the message goes
against the new capture. Skipped without a session, so history is never
lost. Knob: `refreshView`.

**Removed.** The Where is mode, `locate.ts` and the `locateScreenshot`
knob. `/api/locate` stays: the step-two trial runner is its intended
caller, and its strict id enum is still the stronger guarantee for trials.

**Inventory fixes found on the way.** Depth is counted on the emitted tree
(the mirror nests content 15-21 divs deep; 122 nodes became 436); box
sizes are converted to content space under zoom; `display:contents`
wrappers take their children's union; the budget guard holds its caps
(protected roles go last, never orphaning) in near-linear time.

## Consequences

- One model call per turn still, but every call on a page with an
  inventory carries it: about 12k extra input tokens on the SoftBank
  mirror. Prompt caching softens repeats within a session.
- Citations are a prompt contract, not a schema: a model can omit them or
  cite a plausible wrong element. The server and client drop unknown ids;
  wrong-but-valid ids are the open accuracy question for the runner.
- "Guide to" is not built: its meaning is a design choice (camera move,
  trail, or step list) on the options page.
- Visual choices (highlight style, entrance, off-screen cue, minimap
  marker) are open on the options page; the shipped defaults are placeholders.

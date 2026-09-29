# Should choosing a piece of evidence move the page? A role-play synthesis

Date: 2026-09-23. Question from the builder: with numbered chips, a previous/next
navigator and typed navigation, clicking an item already moves the view to it, so
"Scroll to" and "Guide to" look redundant; maybe people do not want to be panned,
only guided. "Guide to" itself is out of scope (its own session).

Method: two independent role-plays of six people (70 with macular degeneration at
400%; mild low vision at 150% with bifocals; keyboard-only; TTS-first; sighted
first-time participant; fast expert) through four scenarios (one citation on
screen; one far below at 300%; three spread over the page; a follow-up while an
item is outlined). One by a Claude agent with the full session context, one by
Codex (GPT-6 Sol) from PRODUCT.md. This is design reasoning, not user data.

## Where both agree

- Choosing an item that is already comfortably visible outlines it and does not
  move the page.
- "Highlight all", a new answer, and sending a follow-up never move the page.
- Every move needs a way back to where the user was reading ("Return to previous
  view"), by control and by typing ("back", "戻る").
- Every state is both seen and heard: a numbered outline plus a short spoken status
  with direction, e.g. "Source 2 of 3, price table, below", and after a move
  "Source 2 in view; return available". Moves and cues get different earcons.
- No animated travel; respect reduced motion.

## Where they disagree

- **High zoom.** Claude: above about 150% the first activation should only cue,
  a second activation moves. Codex: double activation is hard to discover and
  costly at high zoom; move on first activation, but into a clear reading area
  with neighbouring context, not exact centre. The personas split on the cost of
  a jump versus the cost of finding a distant item by hand; the 150% threshold is
  a guess.
- **Cue anchor.** Claude: at the pointer for pointer users, at the popover edge
  for keyboard and typed use. Codex: vary edge versus pointer as a study factor.

## Recommendation

1. Keep today's default: move only when the item is off-screen (`moveToEvidence:
   offscreen`), placed with context rather than dead centre.
2. Add "Return to previous view" before the first study: a Back control that
   appears after a move, and typed "back"/"戻る". Today "back" means previous
   evidence; it should mean return, and "previous" keeps previous evidence.
3. Make movement a study factor, not a button: `moveToEvidence` (offscreen /
   never = cues only / always), placement (context / centre), and the off-screen
   cue (edge / pointer). A zoom-aware cue-then-move variant is a candidate
   condition, not a default.
4. Spoken status on every activation, with direction when a cue replaces a move.

Risks to measure: lost reading position, motion discomfort, a wrong citation
sending the user far away, and browser scrolling that does not move an
operating-system magnifier.

## Sources (DOIs checked against Crossref)

- SteeringWheel, CHI 2018. https://doi.org/10.1145/3173574.3173594
- Bringing Things Closer: Enhancing Low-Vision Interaction Experience with Office
  Productivity Applications, PACMHCI 2021 (split preference for automatic focus
  following vs a steady viewport). https://doi.org/10.1145/3457144
- Towards Making Videos Accessible for Low Vision Screen Magnifier Users, IUI
  2020. https://doi.org/10.1145/3377325.3377494
- Horvitz, Principles of Mixed-Initiative User Interfaces, CHI 1999.
  https://doi.org/10.1145/302979.303030
- W3C, Understanding Status Messages and Animation from Interactions (WCAG 2.1).

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Low-vision web users** who browse with a screen magnifier at 100-400%, on
  real third-party sites (the studies use mirrors of SoftBank's Japanese
  investor-relations and recruiting pages). They see a small part of the page
  at a time and lose overview and orientation. Their job: understand what they
  are looking at, find things on the page, and get back to them.
- **HCI study participants** using UniLens in lab sessions run by the University
  of Tokyo with SoftBank; many read Japanese.
- **The research team** (developer audience) inspects what was sent to the model
  in the debug panel, never in the chat.

## Product Purpose

UniLens is an in-page AI partner embedded in any web page by one script. The
user alt+clicks (or selects a region, or accepts the dwell hint) on what they
are looking at; UniLens captures the page as they see it (viewport, zoom, mouse
trail, clicked element, a text inventory of the page's elements) and opens a
chat beside it. Answers cite the page elements they drew on, and the user can
highlight them, scroll to them, and step through several. Success: a magnifier
user gets an answer about what they see and is pointed at the place on the page
without hunting for it.

## Positioning

The assistant sees what the user sees and points back at the live page. The
work is a ladder of assistance for magnifier users, each rung a feature and a
study condition: point (highlight, on request), lead (off-screen cues, scroll or
pan on consent), walk through, and act (held as an open question). General
find-and-highlight assistants exist (PageGuide); the magnifier-native guidance
ladder is the contribution.

## Operating Context

- Runs inside host pages it does not own: the popover, panels and outlines live
  in the host's light DOM, so host CSS can leak in and every visual property
  must be set explicitly.
- Opened next to the click, 340px wide, draggable and pinnable; it must not hide
  what the user is asking about.
- Used with UniLens' own magnifier (ctrl+wheel zoom, minimap, lens panning) and
  with browser pinch zoom.
- Read-aloud (TTS) and voice input are part of the loop; Japanese IME input must
  work.
- Lab sessions: a participant, an observer, the SoftBank mirrors, one laptop.

## Capabilities and Constraints

- Capture: full annotated page, zoom-aware close-up, metadata, page inventory;
  follow-ups re-capture when the view moved.
- Chat: streaming replies, quick actions (explain, summarise, translate),
  citations as numbered chips, an evidence row (highlight all, scroll to,
  previous/next), typed navigation ("next", "show all"), read-aloud, voice
  input, high-contrast mode, text size setting.
- Highlight styles, entrance, off-screen cue and minimap marker are open
  research variables (options page), not settled design.
- "Guide to" is undecided: camera move, trail, or step list.
- React + TypeScript + styled-components, bundled by esbuild into one script.

## Brand Commitments

- Name: UniLens. One consistent UniLens identity on every host site, so
  participants learn it once; it does not take on each page's look.
- Interface language follows the browser or page language: Japanese and English
  (the Display panel, 表示調整, already does this).
- No emoji as interface icons.

## Evidence on Hand

- `frontend/softbank-mirror`, `frontend/softbank-mirror-recruit` (real Japanese
  pages, mirrored) and `frontend/dev-demo`.
- Literature map: `docs/research/2026-09-18-ai-element-highlighting-literature.md`.
- No participant results, testimonials or benchmarks yet; none may be invented.

## Product Principles

1. **The page is the subject.** The chat serves the page the user is reading; it
   never covers it or competes with it for attention.
2. **Every action is seen and heard.** Each interaction has a visible response
   and an audible one; nothing happens silently or only in one channel.
3. **Legible at 400%.** Text, targets and indicators stay readable and hittable
   under magnification; nothing depends on small or subtle cues.
4. **Point, don't describe.** Where an answer comes from the page, show where.
5. **Honest state.** The user can always tell working, answered, nothing found,
   and something broke apart.

## Accessibility & Inclusion

WCAG 2.2 AA as the floor, plus low-vision extras: large type that scales with
the text-size setting, targets of at least 24px (larger where magnification
makes precision hard), always-visible focus, no meaning carried by colour alone,
forced-colors and a separate high-contrast mode, reduced motion respected, and
audio feedback for every action alongside read-aloud. Japanese and English.

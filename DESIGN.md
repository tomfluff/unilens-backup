---
name: UniLens
description: An in-page AI partner for magnifier users; a chat that looks like the assistant people know and points back at the page.
colors:
  signal-yellow: "#ffd400"
  pure-black: "#000000"
  pure-white: "#ffffff"
  sign-black: "#111111"
  assistant-paper: "#ffffff"
  assistant-mist: "#f1f3f5"
  assistant-ink: "#1f2937"
  assistant-slate: "#4b5563"
  assistant-hairline: "#d1d5db"
  assistant-blue: "#2563eb"
  assistant-control-edge: "#6b7280"
  assistant-alarm-red: "#b91c1c"
  assistant-alarm-wash: "#fef2f2"
  guide-graphite: "#1c1f24"
  guide-graphite-raised: "#262a31"
  guide-key: "#2e333b"
  guide-amber: "#ffb000"
  guide-label: "#ffffff"
  guide-muted: "#c9ced6"
  guide-rim: "#8a929e"
  guide-coral: "#ff6b57"
  station-panel: "#ffffff"
  station-ink: "#222222"
  station-band: "#2b2b2b"
  station-line-blue: "#0079c2"
  station-muted: "#4d5156"
  station-strip: "#eef4f9"
  station-strip-ink: "#0b3d63"
  station-key-edge: "#8a8f95"
  station-red: "#d0021b"
typography:
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-answer:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "1em"
    fontWeight: 400
    lineHeight: 1.65
  body-answer-ud:
    fontFamily: '"BIZ UDPGothic", "BIZ UDGothic", system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "1.05em"
    fontWeight: 400
    lineHeight: 1.75
  title:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "1em"
    fontWeight: 700
    lineHeight: 1.2
  title-handset:
    fontFamily: '"BIZ UDPGothic", "BIZ UDGothic", system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "1em"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  title-sign:
    fontFamily: '"BIZ UDPGothic", "BIZ UDGothic", system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "1.12em"
    fontWeight: 700
    lineHeight: 1.2
  label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "1em"
    fontWeight: 600
    lineHeight: 1.2
  label-place:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "0.95em"
    fontWeight: 600
    lineHeight: 1.3
  numeral-key:
    fontFamily: '"BIZ UDPGothic", "BIZ UDGothic", system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "1.05em"
    fontWeight: 700
    fontFeature: '"tnum"'
  status-display:
    fontFamily: '"BIZ UDPGothic", "BIZ UDGothic", system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif'
    fontSize: "1em"
    fontWeight: 700
    lineHeight: 1.35
  mono:
    fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'
    fontSize: "0.92em"
rounded:
  sign: "4px"
  label: "6px"
  key: "10px"
  field: "12px"
  bubble: "14px"
  panel: "16px"
  handset: "22px"
  code: "0.35em"
  pill: "999px"
spacing:
  control-gap: "0.35em"
  row-gap: "0.45em"
  header-gap: "0.55em"
  turn-gap: "0.7em"
  inset-sign: "0.8em"
  inset: "1em"
  handset-gap: "8px"
  handset-inset: "12px"
  viewport-margin: "8px"
components:
  panel-assistant:
    backgroundColor: "{colors.assistant-paper}"
    textColor: "{colors.assistant-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    width: "min(24.3em, calc(100vw - 16px))"
    height: "min(30em, calc(100vh - 16px))"
  panel-assistant-hc:
    backgroundColor: "{colors.pure-black}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.panel}"
  panel-audio-guide:
    backgroundColor: "{colors.guide-graphite}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.handset}"
    padding: "12px"
    width: "min(24.3em, calc(100vw - 16px))"
    height: "min(30em, calc(100vh - 16px))"
  panel-audio-guide-hc:
    backgroundColor: "{colors.pure-black}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.handset}"
  panel-station:
    backgroundColor: "{colors.station-panel}"
    textColor: "{colors.station-ink}"
    rounded: "{rounded.label}"
    width: "min(24.3em, calc(100vw - 16px))"
    height: "min(30em, calc(100vh - 16px))"
  panel-station-hc:
    backgroundColor: "{colors.pure-black}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.label}"
  header-station:
    backgroundColor: "{colors.station-band}"
    textColor: "{colors.pure-white}"
    typography: "{typography.title-sign}"
    padding: "0.6em 0.65em 0.6em 0.75em"
  roundel-station:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.sign-black}"
    size: "2.3em"
  icon-key-assistant:
    backgroundColor: "{colors.assistant-mist}"
    textColor: "{colors.assistant-ink}"
    rounded: "{rounded.key}"
    size: "2.4em"
  icon-key-assistant-pressed:
    backgroundColor: "{colors.assistant-blue}"
    textColor: "{colors.assistant-paper}"
  icon-key-audio-guide:
    backgroundColor: "{colors.guide-key}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.field}"
    size: "2.6em"
  icon-key-station:
    textColor: "{colors.pure-white}"
    rounded: "{rounded.sign}"
    size: "2.5em"
  bubble-user-assistant:
    backgroundColor: "{colors.assistant-blue}"
    textColor: "{colors.assistant-paper}"
    rounded: "{rounded.bubble}"
    padding: "0.6em 0.85em"
  bubble-user-assistant-hc:
    backgroundColor: "{colors.signal-yellow}"
    textColor: "{colors.pure-black}"
  bubble-answer-assistant:
    backgroundColor: "{colors.assistant-mist}"
    textColor: "{colors.assistant-ink}"
    typography: "{typography.body-answer}"
    rounded: "{rounded.bubble}"
    padding: "0.75em 0.9em"
  bubble-error-assistant:
    backgroundColor: "{colors.assistant-alarm-wash}"
    textColor: "{colors.assistant-alarm-red}"
    rounded: "{rounded.bubble}"
  answer-label-audio-guide:
    backgroundColor: "{colors.guide-label}"
    textColor: "{colors.sign-black}"
    typography: "{typography.body-answer-ud}"
    rounded: "{rounded.label}"
    padding: "1em 1.05em"
  answer-station:
    textColor: "{colors.station-ink}"
    typography: "{typography.body-answer-ud}"
  cite-chip-assistant:
    backgroundColor: "{colors.assistant-blue}"
    textColor: "{colors.assistant-paper}"
    rounded: "{rounded.pill}"
    height: "1.75em"
    padding: "0 0.3em"
  cite-chip-audio-guide:
    backgroundColor: "{colors.sign-black}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.pill}"
    height: "1.75em"
  cite-chip-audio-guide-current:
    backgroundColor: "{colors.guide-amber}"
    textColor: "{colors.guide-graphite}"
  cite-code-station:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.sign-black}"
    rounded: "{rounded.code}"
    height: "1.75em"
    padding: "0 0.35em"
  cite-code-station-current:
    backgroundColor: "{colors.station-line-blue}"
    textColor: "{colors.pure-white}"
  control-assistant:
    backgroundColor: "{colors.assistant-paper}"
    textColor: "{colors.assistant-ink}"
    rounded: "{rounded.pill}"
    size: "2.3em"
  control-assistant-all:
    backgroundColor: "{colors.assistant-paper}"
    textColor: "{colors.assistant-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "2.3em"
    padding: "0 0.8em"
  control-assistant-all-pressed:
    backgroundColor: "{colors.assistant-blue}"
    textColor: "{colors.assistant-paper}"
  key-audio-guide:
    backgroundColor: "{colors.guide-key}"
    textColor: "{colors.pure-white}"
    typography: "{typography.numeral-key}"
    rounded: "{rounded.key}"
    height: "2.8em"
  key-audio-guide-current:
    backgroundColor: "{colors.guide-amber}"
    textColor: "{colors.guide-graphite}"
  code-key-station:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.sign-black}"
    rounded: "{rounded.sign}"
    height: "2.6em"
  code-key-station-current:
    backgroundColor: "{colors.station-line-blue}"
    textColor: "{colors.pure-white}"
  exit-sign-station:
    backgroundColor: "{colors.signal-yellow}"
    textColor: "{colors.sign-black}"
    rounded: "{rounded.sign}"
    height: "2.6em"
  exit-sign-station-pressed:
    backgroundColor: "{colors.station-band}"
    textColor: "{colors.signal-yellow}"
  place-entry-assistant:
    backgroundColor: "{colors.assistant-paper}"
    textColor: "{colors.assistant-blue}"
    typography: "{typography.label-place}"
    rounded: "{rounded.pill}"
    padding: "0.15em 0.75em 0.15em 0.5em"
    height: "2.3em"
  place-entry-audio-guide:
    textColor: "{colors.guide-muted}"
    typography: "{typography.label-place}"
    rounded: "{rounded.key}"
    padding: "0.15em 0.75em 0.15em 0.5em"
    height: "2.3em"
  place-entry-station:
    backgroundColor: "{colors.station-panel}"
    textColor: "{colors.station-ink}"
    typography: "{typography.label-place}"
    rounded: "{rounded.sign}"
    padding: "0.15em 0.75em 0.15em 0.5em"
    height: "2.3em"
  quick-action-assistant:
    backgroundColor: "{colors.assistant-mist}"
    textColor: "{colors.assistant-ink}"
    rounded: "{rounded.pill}"
    height: "2.3em"
  quick-action-audio-guide:
    textColor: "{colors.pure-white}"
    rounded: "{rounded.key}"
    height: "2.6em"
  quick-action-station:
    textColor: "{colors.station-ink}"
    rounded: "{rounded.sign}"
    height: "2.5em"
  input-assistant:
    backgroundColor: "{colors.assistant-paper}"
    textColor: "{colors.assistant-ink}"
    rounded: "{rounded.field}"
    height: "2.8em"
    padding: "0 0.85em"
  input-audio-guide:
    backgroundColor: "#0f1114"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.key}"
    height: "3em"
    padding: "0 0.8em"
  input-station:
    backgroundColor: "{colors.station-panel}"
    textColor: "{colors.station-ink}"
    rounded: "{rounded.sign}"
    height: "2.9em"
    padding: "0 0.7em"
  send-assistant:
    backgroundColor: "{colors.assistant-blue}"
    textColor: "{colors.assistant-paper}"
    rounded: "{rounded.field}"
    size: "2.8em"
  send-assistant-disabled:
    backgroundColor: "{colors.assistant-mist}"
    textColor: "{colors.assistant-slate}"
  send-audio-guide:
    backgroundColor: "{colors.guide-amber}"
    textColor: "{colors.guide-graphite}"
    rounded: "{rounded.field}"
    size: "3em"
  send-station:
    backgroundColor: "{colors.station-line-blue}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.sign}"
    size: "2.9em"
  status-assistant:
    textColor: "{colors.assistant-slate}"
    typography: "{typography.body}"
    padding: "0 1em 0.65em"
  status-audio-guide:
    backgroundColor: "{colors.guide-amber}"
    textColor: "{colors.guide-graphite}"
    typography: "{typography.status-display}"
    rounded: "{rounded.key}"
    padding: "0.45em 0.8em"
    height: "2.6em"
  status-station:
    backgroundColor: "{colors.station-strip}"
    textColor: "{colors.station-strip-ink}"
    typography: "{typography.status-display}"
    padding: "0.45em 0.8em"
    height: "2.5em"
---

# Design System: UniLens

## Overview

**Creative North Star: "The Familiar Assistant That Points"**

UniLens is a chat that opens beside what a magnifier user clicked on someone else's web page. By default it looks like the assistant people already know (a white card, one blue accent, speech bubbles, pill actions), finished to the bar of the ChatGPT, Claude and LINE apps. What sets it apart is that it points: answers carry numbered evidence that outlines, scrolls to and steps through places on the live page, and every click becomes a place entry the user can return to. The chat serves the page and never competes with it: it floats, sits at most 340px wide at the default text size, folds to its header and status line, and keeps the page's own look out of its own.

Two alternates share every control, state, sound slot and knob, and change only the material. **Audio guide** is a graphite museum handset: white label cards for answers, black number discs, a row of keypad keys, and an amber display that serves as the status line. **Station signs** is Japanese railway wayfinding: a dark sign band with a U roundel and bilingual name, station-code chips (U1, U2) ringed in line blue, exit-yellow action signs, and a pale information strip as the status line. Each style has its own high-contrast rendition in black, white and signal yellow, bound through the same custom properties. It is never a filter.

The system is built for 100–400% magnification. Type, targets and panel all scale in em from the chat scale setting, and a separate text-size slider scales the conversation text on top of it. Every action is shown on the control it acts on and heard as a short earcon in the style's own sound palette. Nothing relies on colour alone, a small cue or motion. Confirmed rejections from the direction contract: the decorated chatbot (gradient header, sparkle icon, emoji controls, tiny grey chips).

**Key Characteristics:**
- One scoped stylesheet with three styles (`data-style`: assistant, audioGuide, station), each a set of CSS custom properties with a real high-contrast rebinding (`data-hc`).
- Hosted in third-party pages: every element except SVG is reverted to browser defaults, then restyled. Host CSS never shapes the chat.
- Mounted on `<html>`, outside `<body>`, so the page's zoom transform and layout never reach it. The accessibility widget, the highlight layer and the minimap mount on `<html>` the same way.
- Em sizing from `chatFontSize` (14px default, 17, 20), so the text-size setting grows the whole panel, its targets and its type together.
- One authored icon family: 24px grid, 2px round stroke, no fill, currentColor. No emoji anywhere.
- Every action seen and heard: the control's own state (and the status line when folded) plus an earcon for each one.
- Every highlight, cue and motion value is a knob in the options page (research variables), and each has a shipped default.

## Colors

Each style carries its own restrained palette: one accent, one ink, soft neutrals. Signal yellow is the one colour shared across all three styles, the high-contrast modes and the page highlight.

### Primary
- **Assistant Blue** (#2563eb): the Assistant's only accent. Used for the user's bubble, citation chips, place entries, the labelled "All" control, send, the focus ring, the caret and text selection. Text on it is Assistant Paper.
- **Handset Amber** (#ffb000): the Audio guide's display. Used for the status display, the current number key, the current citation disc, the P-number on place entries, send, and the focus halo. Text on it is Guide Graphite.
- **Line Blue** (#0079c2): the Station's line colour. Used for the band's bottom rule, the roundel ring, the rings on station codes, the current code (filled), send, and the status strip's top rule.

### Secondary
- **Signal Yellow** (#ffd400): the high-contrast accent in all three styles. It is also the Station's exit-sign colour for "All" and "Back", the Station's focus halo, and the default page-highlight colour (`hlColor`).

### Neutral
- **Assistant Paper** (#ffffff) / **Assistant Mist** (#f1f3f5): panel surface / answer bubbles, quick actions and icon keys.
- **Assistant Ink** (#1f2937) / **Assistant Slate** (#4b5563): text / subtitle, placeholder and the status line.
- **Assistant Hairline** (#d1d5db): the rules under the header and above the quick actions.
- **Assistant Control Edge** (#6b7280): the 1px outline on controls, quick actions and the input, and the dashed border of a quiet ("nothing found") answer.
- **Assistant Alarm Red** (#b91c1c) on **Alarm Wash** (#fef2f2): the error bubble, with a 1.5px red border.
- **Guide Graphite** (#1c1f24) / **Graphite Raised** (#262a31) / **Guide Key** (#2e333b): handset body / error and quiet cards / keys.
- **Guide Label** (#ffffff) with **Sign Black** (#111111): the answer label card; Sign Black is also the citation disc.
- **Guide Muted** (#c9ced6), **Guide Rim** (#8a929e), **Guide Coral** (#ff6b57): the title and the user's lines / outlines of place entries, quick actions and the input / the error border and the live mic.
- **Station Panel** (#ffffff), **Station Ink** (#222222), **Station Band** (#2b2b2b), **Station Muted** (#4d5156): panel / text and 2px sign borders / header band / the user's lines.
- **Station Strip** (#eef4f9) with **Strip Ink** (#0b3d63): the status strip.
- **Station Key Edge** (#8a8f95), **Station Red** (#d0021b): header key and quiet borders / the error border and the live mic.

### Named Rules
**The One Accent Rule.** Each style has exactly one accent (blue, amber or line blue), and it marks what the user can act on or is acting on: their own words, the evidence, the current position, send and focus. Neutrals carry everything else.

**The Real High Contrast Rule.** High contrast rebinds the style's own tokens to Pure Black, Pure White and Signal Yellow and thickens borders to 2–3px. The style's form, controls and layout stay the same. It is never a CSS filter and never a separate layout. Forced-colors mode gets a 2px CanvasText frame and 1px ButtonText button borders on top.

**The Signal Yellow Rule.** #ffd400 is the one yellow in the product, used for the high-contrast accent, the exit signs and the page highlight. Do not introduce a second yellow.

## Typography

**Body Font:** system UI stack (system-ui, -apple-system, Segoe UI, then Hiragino Sans, Yu Gothic UI, Meiryo) for Assistant.
**Sign Font:** BIZ UDPGothic / BIZ UDGothic, then the same stack, for Audio guide and Station.
**Mono:** ui-monospace for inline code in answers.

**Character:** The Assistant speaks in the platform's own UI face, as every familiar assistant does. The two sign-derived styles use Morisawa's universal-design Gothic, drawn for legibility on signage and for low vision, with Japanese fallbacks in every stack. No style has a display face. The largest type is the Station's 1.12em title.

### Hierarchy
- **Title** (700, 1em, 1.2): the header name. The Audio guide tracks it at 0.08em in Guide Muted, like a handset nameplate. The Station sets it at 1.12em with the other-language name below at 1em (hidden on short screens).
- **Body** (400, chatFontSize 14px default, 1.5): the panel base, the user's messages, the empty-state hint and the Assistant's status line.
- **Answer** (400, 1em, 1.65 Assistant / 1.05em, 1.75 Audio guide and Station): answers get the most generous leading in the panel, because they are what is read at magnification.
- **Label** (600, 1em, 1.2): quick actions, the labelled "All" control and the Assistant's position readout ("2/3", tabular). Place entries are 600, 0.95em, 1.3.
- **Numerals** (700, tabular): citation chips, number keys (Audio guide 1.05em) and station codes. Numbers never shift width as they change.
- **Status display** (700, 1em, 1.35): the Audio guide's amber display and the Station's strip. At most two lines, one on a short screen.

### Named Rules
**The Em Rule.** Every size in the chat is in em of `--ul-fs`, which is set from the chat scale, `chatFontSize` (14, 17 or 20px). The words of each message are further multiplied by `--ul-text`, the text-size slider (`chatTextScale`, 80–200%); controls, place entries and the input stay on the chat scale so rows of buttons never overflow. The panel (24.3em × 30em), targets, radii on signs and type all scale together. Only the Audio guide's frame spacing (12px inset, 8px and 6px gaps) and the 4px level-meter bars are fixed px.

**The Readable Face Rule.** Faces are chosen for reading, not flavour: the platform UI face for the Assistant, BIZ UD Gothic for the sign styles, and a Japanese face in every stack. Nothing is set below 0.92em (inline code).

## Layout

The chat is a fixed, draggable card (z-index 2147483646, one below the off-screen arrows so they are never clipped by it) placed next to the click. It sits at least 8px inside the window (`calc(100vw - 16px)`), and it glides to a new click instead of reopening. The card is one flex column: header (drag handle), log (the only scrolling part), quick actions (a three-column grid), and input row (mic, field, send). Folded ("mini"), it keeps only the header and the status line.

- **Size:** width min(24.3em, 100vw − 16px), 340px at the default text size; height min(30em, 100vh − 16px).
- **Narrow screens (≤480px wide):** the chat docks as a bottom sheet, full width minus 16px and half the window high, so what it points at stays visible above it.
- **Short screens (≤560px high, e.g. a laptop at 200–300% browser zoom):** height is at most 66% of the window, but never less than 16em (header, three lines of log and the input). The header, keys, input and status shrink, and the subtitle hides. Quick actions hide once a conversation starts, and the status clamps to one line. If the chat still covers a source it moved to, it folds itself.
- **Log rhythm:** 0.7em between entries. The Assistant insets by 1em and aligns bubbles (user right, max 85%; answers left, max 92%). The Audio guide and Station stretch every entry to full width and set the user's words as a plain muted line: a bullet square on the Station, no bubble on the Audio guide.
- **Place entries** open each new place in the log, before what was asked there: right-aligned in Assistant, left-aligned in the other two.
- **Rows inside:** 0.35em between controls and between quick actions, 0.45em in the input row and status line. The Audio guide uses 8px between its bands inside a 12px handset inset.

**The Room For The Answer Rule.** When height runs out, chrome gives way before the log does: header padding, key heights, the subtitle, then the quick actions. The log always keeps three lines, and the input never leaves the panel.

**The One Home Per Fact Rule.** Each fact appears once. The current source lives on the controls row (the lit key or code, "2/3"); "what just happened" is spoken by the live region and shown on the status line only when the chat is folded, where in the sign styles it *is* the amber display or the information strip. There is no "places found" count and no subtitle in the Assistant.

## Elevation & Depth

The panel is the only lifted object: it floats over a page it does not own, so each style gives it one shadow. Nothing inside the panel is lifted. Depth inside comes from tonal fills (mist bubbles, graphite keys, the amber display, the dark sign band) and borders. Inside the panel, box-shadow appears only as zero-blur rings for current, pressed and focus states.

### Shadow Vocabulary
- **Assistant float** (`box-shadow: 0 16px 40px rgba(17, 24, 39, .18), 0 2px 6px rgba(17, 24, 39, .08)`): the card, with a 1px #e5e7eb frame.
- **Handset float** (`box-shadow: 0 14px 34px rgba(0, 0, 0, .35)`): the Audio guide body, which has no frame.
- **Sign float** (`box-shadow: 0 12px 30px rgba(0, 0, 0, .28)`): the Station panel, with a 1px #c9ccd0 frame.
- **Current ring** (Assistant `0 0 0 2px mist, 0 0 0 4px blue`; Audio guide `0 0 0 3px #111`): marks the citation now shown on the page.
- **Pressed sign ring** (`inset 0 0 0 3px #ffd400`): the Station's "All" while on, on the dark band colour.
- **Focus halo** (Audio guide `outline 3px #fff` + `0 0 0 6px amber`; Station `outline 3px #111` + `0 0 0 6px #ffd400`; Assistant `outline 3px blue`, offset 2px).

**The Single Float Rule.** One shadow per chat, on the panel. Bubbles, keys and signs sit flat on it.

## Shapes

Each style has its own corner language, and it is kept consistent within the style:

- **Assistant: soft.** Panel 16px; bubbles 14px, with a 4px tail corner toward the speaker (user bottom-right, answer bottom-left); input and send/mic 12px; header keys 10px; everything the user presses in a reply (controls, quick actions, citations, place entries, read-aloud) is a full pill (999px).
- **Audio guide: moulded hardware.** Body 22px; header keys and input keys 12px; number keys, input, quick actions, place entries and the status display 10px; the answer label 6px; citation discs are full circles.
- **Station: signage.** Panel 6px; every sign, key, input and quiet or error card 4px; station codes are rounded squares (0.35em) with a 0.22em line-blue ring; the roundel is a circle with a 0.3em ring.

Borders carry the form in the sign styles: 2px ink borders on Station signs and 1.5–2px rims on Audio guide outlines. The Station header has a 0.35em line-blue rule under the band, and the status strip a 0.25em rule on top.

## Components

Every component exists in all three styles with the same behaviour, the same accessible name and the same sound slot. Only the material changes.

### Header
- **Assistant:** "UniLens" in Title, then minimize/expand, pin and close as 2.4em mist keys (10px). Pin shows pressed in Assistant Blue. 1px hairline below.
- **Audio guide:** tracked muted "UniLens", 2.6em graphite keys (12px); pressed shows amber.
- **Station:** the dark band with a 2.3em U roundel (white, line-blue ring) and the bilingual name (UniLens / ユニレンズ, swapped in Japanese). Keys are 2.5em outlined 4px squares, and pressed shows exit yellow.
- The header is the drag handle (grab cursor); its buttons are excluded from the drag.

### Place entries (signature)
Each click is its own entry in the log: pin icon, a P-number chip, and the page label cut off with an ellipsis. The whole entry is a button that returns to the place. It is at least 2.3em high and set in Label-place.
- **Assistant:** a pill with a 1.5px blue outline and blue text; the P-number is a filled blue pill.
- **Audio guide:** a 10px card with a 1.5px rim and muted text; the P-number is an amber display tab.
- **Station:** a 4px sign with a 2px ink border; the P-number is ringed in line blue, like a station code.

### Answers
- **Assistant:** the mist bubble, 1.65 leading. Error: alarm wash with red text and a 1.5px red border. Quiet ("nothing found"): transparent with a 1.5px dashed control-edge border.
- **Audio guide:** a white label card (6px, Answer UD). Error: raised graphite with a 3px coral border. Quiet: a 2px dashed muted border.
- **Station:** plain text on the panel, full width. Error: a 3px red frame. Quiet: a 2px dashed key-edge frame.
- **Streaming caret:** a 0.5em block in currentColor that blinks (1s, steps(2)). It is still under reduced motion.
- **Read aloud:** a 2em circular button after the answer's last word, with a 1px border and the speaker icon (stop icon while reading). A three-bar level meter (4px bars, 0.9s, staggered 0.15s) shows on the status line while reading or listening.

### Citation chips
Inline numbered chips in the answer text, 1.75em high, 700 and tabular. Pressing one outlines that place on the page.
- **Assistant:** blue pills. The current one gets a double ring (mist, then blue).
- **Audio guide:** black discs. The current one turns amber with a black ring.
- **Station:** station codes "U1", "U2": white rounded squares with a line-blue ring. The current one is filled line blue.

### Controls row (signature)
One row under a cited answer, never more.
- **Assistant:** `‹ 2/3 › [All] … [Back]`. Arrows are 2.3em circles with a 1px control-edge border. The position readout is 600 tabular. "All" is a pill with a 1.5px blue outline and a label, filled blue while on. Back is pushed to the row's end.
- **Audio guide:** `‹ 1 2 3 › [All] [Back]` as a keypad. Keys share the row equally, 2.8em high, graphite, 700 1.05em tabular. The current number and pressed "All" turn amber.
- **Station:** `‹ U1 U2 U3 › [All] [Back]`. Arrows are white with a 2px grey border. Codes are ringed in line blue, and the current code is filled. "All" and "Back" are exit-yellow signs. "All" while on turns the dark band colour with yellow text and a 3px inset yellow ring.
- There are at most three number keys, a window that follows the current source. Arrows and numbers appear only with two or more sources. "All" shows its label in Assistant, or when there is a single source. Back appears only when there is a saved place to return to.

### Quick actions
Three equal columns ("Explain", "Summarize", "Translate" / 説明して, 要約して, 翻訳して), dimmed to 0.55 while busy.
- **Assistant:** mist pills with a 1px control-edge border, 2.3em.
- **Audio guide:** transparent 10px keys with a 1.5px rim, 2.6em.
- **Station:** transparent 4px signs with a 2px ink border, 600, 2.5em.

### Input row
Mic, field, send. The field placeholder is "Ask about this page…" / このページについて質問…, and the caret is in the accent colour. A live mic turns red (Assistant #dc2626, Station red, Audio guide coral; signal yellow in high contrast). Send stays quiet until there is text, and its quiet state keeps its arrow at 3:1 or better against its own ground: the Assistant shows the arrow in slate on mist; the Audio guide in muted on a key; the Station in ink on a transparent key with a muted border.
- **Assistant:** a 2.8em field (12px, 1px control-edge border) and 2.8em keys; send is blue.
- **Audio guide:** a 3em field with a dark well (#0f1114) and a 2px rim; 3em keys; send is amber.
- **Station:** a 2.9em field (4px, 2px ink border); 2.9em keys; send is line blue.

### Status line (signature)
What just happened, e.g. "Source 2 of 3, …. Moved there; Back returns you." It shows **only on the folded chat** (header plus status), where it is the chat's whole face. Open, the chat shows each action on the control itself (pressed, current, the outline on the page), and the live region speaks the status for screen readers; a line of small text under the input was space taken from the answer and hard to read at magnification. At most two lines, one on a short screen.
- **Assistant:** plain slate text under the header.
- **Audio guide:** the amber display (10px, 700, at least 2.6em).
- **Station:** the pale information strip with a line-blue top rule (700, at least 2.5em).
- While a click is being captured, a dashed "Capturing…" entry stands in the log where its place entry will appear.

### Sound
Each of the eleven actions has an earcon: press, chip, all, move, back, send, done, error, micOn, micOff and clear. Earcons are synthesized with WebAudio at gain 0.05 and last under 150ms each. They play in the style's own palette:
- **Assistant:** soft sine pops and short glides (520–900Hz).
- **Audio guide:** keypad DTMF pairs (e.g. 1336+941Hz) and a square-wave click.
- **Station:** triangle-wave chimes on C6, E6 and G6. "Move" is a rising arpeggio and "back" a falling one.
The `sounds` setting silences earcons; the controls' own states and the live region still carry every action.

### Motion
One setting drives all movement: `motion` (smooth by default, or instant) with `motionMs` (350ms default, 100–1000). It covers page moves to evidence, Back, minimap and cue jumps, log scrolling and the chat's glide to a new click. Page moves ease in and out on a cubic curve, so they leave from where the reader is without a lurch; each glide is timed from animation-frame timestamps only, never `performance.now`, which host pages may replace (SoftBank's does). The chat glides with `cubic-bezier(.22, 1, .36, 1)`. Any wheel, touch or key from the user cancels a glide. With `prefers-reduced-motion` set, every move, smooth zoom, the caret, the level meter and the recording pulse are instant or still.

### Page highlight and off-screen cues (research variables)
The chat drives the page layer, which is detached from `<body>` like the chat. The shipped defaults:
- **Highlight:** a thick band in Signal Yellow (2px per band, 1–6), 3px off the element, with a black edge so yellow reads on white. Numbered badges match the chips: 24px, 700 14px/20px, blue in Assistant, #111 in Audio guide, a ringed "U1" in Station.
- **Highlight options:** a two-band black/white ring (W3C C40), brackets, underline, fill (0.3 alpha), glow, dim (0.55) and spotlight (0.72, 14px feather).
- **Off-screen cue:** off by default. At `edge` it is a button on the screen edge that brings the element into view; at `pointer` it is an arrow on a `cueRadius` circle (90px, 40–240) round the pointer, which only points and never takes clicks.
- **Cue geometry:** each arrow is a filled arrowhead in the highlight colour with a 2.5-unit black edge, and a black tail disc with the number upright in white. It is sized by `cueSize` (72px default, 48–128) and drawn at the true bearing to its target. It is kept on screen and pushed outward along its own line when the chat is in the way.

### Icons
Authored as one family: 24px grid, 2px round stroke, round joins, no fill, currentColor, 1.25em (1.1em in the read-aloud button). The set is pin, close, mic, send, speaker, stop, wait, previous, next, highlight-all (four rounded squares), back (a return hook), place (map pin), minimize and expand.

## Do's and Don'ts

### Do:
- **Do** revert every element except SVG to browser defaults before styling (`all: revert`), and set every visual property explicitly. The host page's CSS must not reach the chat.
- **Do** mount UniLens surfaces (chat, highlight layer, cues, minimap, the accessibility widget) on `<html>`, outside the zoomed `<body>`.
- **Do** size everything in em of `--ul-fs`, so the chat scale (14/17/20px) scales the panel, targets and type together; scale only the conversation text with `--ul-text`.
- **Do** give every new action a status-line message in English and Japanese, plus an earcon slot in all three palettes.
- **Do** build each new control once and render it in all three styles and all three high-contrast renditions, with the same behaviour and accessible name.
- **Do** keep every target at 24px or more at the smallest text size (inline chips 1.75em; keys and controls 2em and up) and focus always visible: a 3px outline, plus a 6px halo in the sign styles.
- **Do** use tabular numerals for every number that changes in place (chips, keys, position, P-numbers).
- **Do** make eased motion follow `motion`/`motionMs` and go instant under reduced motion.

### Don't:
- **Don't** use emoji as interface icons. Use the authored 2px-stroke SVG family.
- **Don't** decorate the chatbot: no gradient header, no sparkle icon, no emoji controls, no tiny grey chips.
- **Don't** add hints that teach typed commands ("say next", "type back"). Typed navigation stays, and it is not advertised.
- **Don't** show a fact twice. The status line is the only "what just happened", and a cited answer gets one controls row.
- **Don't** make high contrast a filter or a different layout. Rebind the style's own tokens to black, white and #ffd400.
- **Don't** let the chat cover what it points at. On narrow and short screens it docks, shrinks or folds.
- **Don't** give the chat the host page's look. UniLens looks the same on every site.
- **Don't** lift anything inside the panel. The panel's own shadow is the only one.

---
Author: Yotam Sechayk
Date: 2026-10-06
---

# Sounds of their own for Live and reading aloud

## Context

Every chat action has a sound, but a Live talk starting and ending played the microphone's sounds, and reading aloud played the generic button sound. Starting Live and starting a voice message sounded the same.

## Decision

- Four new sounds: `liveOn` and `liveOff` (a Live talk starts, ends), `readOn` (reading aloud starts or resumes) and `readOff` (it stops or pauses).
- Picked by ear from two candidates each, in every chat style, on an audition page (`.local/explorations/2026-10-06-earcons/`, local):
  - Assistant: Live is a rising three-note call figure, and the same falling; reading is a low two-note step up, and down.
  - Audio guide: Live keeps the microphone's keys; reading is a soft triangle step.
  - Station signs: Live is G6 to C7, and back; reading is a lower G5 to B5 step, and back.
- Live's start and end are a little longer than the other sounds (up to about 210 ms), like a call connecting.

## Consequences

- The chat plays them where it played the microphone and button sounds before: Live starting and ending, and read aloud's play, pause, resume and stop.
- When answers are read aloud automatically, the reading sound follows the answer's own sound by a moment, and the status line keeps telling the answer.
- The `sounds` setting silences them like every other sound.

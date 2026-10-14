# UniLens Agent Quick Rules

- Keep changes minimal, scoped, and verifiable.
- Preserve existing behavior unless the task explicitly asks for a behavior change.
- Avoid editing mirrored vendor files in `frontend/softbank-mirror/ext/` unless explicitly requested.
- When removing "unused" modules, check `accessibility-lib/src/toggleDrag.ts` first: it is a shipped feature (draggable display-adjustment button) referenced from `accessibilityPanel.tsx`. `make test` fails if it is unwired.

## Fast Repo Map
- `backend/`: Flask API (`/api/capture`, `/api/chat`, sessions/captures storage).
- `unilens-lib/`: Main embeddable React + TypeScript widget.
- `accessibility-lib/`: Accessibility-focused embeddable widget.
- `quiz-lib/`: Survey widget; the study's survey page is served by the backend (`/survey?quiz=<id>`, questions in `backend/quizzes/`), answers logged at `/api/quiz/log`.
- `frontend/`: Static test targets (`dev-demo`, `softbank-mirror`).

## Required Checks
- `make build`
- `make format`

## Useful Run Commands
- `make serve <target>` (backend + one frontend)
- `make serve-backend`
- `make serve-frontend <target>`

## Before Finishing Any Change
To test and validate your changes, please make sure you run `make check` until it passes with 0 errors or warnings.
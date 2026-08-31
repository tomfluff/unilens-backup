# UniLens Agent Quick Rules

- Keep changes minimal, scoped, and verifiable.
- Preserve existing behavior unless the task explicitly asks for a behavior change.
- Avoid editing mirrored vendor files in `frontend/softbank-mirror/ext/` unless explicitly requested.

## Fast Repo Map
- `backend/`: Flask API (`/api/capture`, `/api/chat`, sessions/captures storage).
- `unilens-lib/`: Main embeddable React + TypeScript widget.
- `accessibility-lib/`: Accessibility-focused embeddable widget.
- `frontend/`: Static test targets (`dev-demo`, `softbank-mirror`).

## Required Checks
- `make build`
- `make format`

## Useful Run Commands
- `make serve <target>` (backend + one frontend)
- `make serve-backend`
- `make serve-frontend <target>`

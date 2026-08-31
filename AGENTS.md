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

## Before Finishing Any Change
To test and validate your changes, please make sure you run:
- `make build` - Ensure all code can still be built
- `make format` - Ensure all formatter checks pass

If you are working within `unilens-lib` or `accessibility-lib`, please additionally run:
- `make fix` - This is more aggressive than `make format` and will identify and attempt to fix syntactical errors, and will stop on errors that cannot be fixed. Your code should pass `make fix` with 0 warnings or errors before being finalized.
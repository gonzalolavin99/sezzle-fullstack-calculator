# ADR 0001 — Monorepo with Go backend and React + TypeScript frontend

- Status: Accepted
- Date: 2026-10-19

## Context
The brief prefers React (TypeScript) for the frontend and Go for the backend, and asks for one repository
containing both. Reviewers will clone and run it.

## Decision
One repository with `backend/` (Go) and `frontend/` (React + TypeScript with Vite), a shared `Makefile`,
one CI workflow and one `docker-compose.yml`.

- Backend uses the Go standard library HTTP server (method-aware routing patterns), `log/slog` for logs and
  no web framework.
- Frontend uses Vite for fast builds and Vitest for tests.

## Third-party tools and dependencies
One line each, as required by `CLAUDE.md`.

- `golangci-lint` v2.15.0 (dev tool, not a module dependency): runs `go vet`, `staticcheck`, `errcheck` and the
  `gofmt` check in one command, locally (`make tools`, `make lint`) and in CI.

Frontend (versions checked on the npm registry on 2026-10-20; exact versions in `frontend/package-lock.json`):

- `react`, `react-dom` 19.3: required by the brief.
- `vite` 8.3 + `@vitejs/plugin-react` 6.1: dev server and production build (ADR decision above).
- `typescript` ~6.0.3: strict type checking. Not 7.x: `typescript-eslint` 8.72 supports TypeScript `<6.1.0` only.
- `tailwindcss` + `@tailwindcss/vite` 4.3: styling with design tokens (ADR 0005).
- `vitest` + `@vitest/coverage-v8` 5.0, `jsdom` 30: unit tests and coverage, sharing the Vite config.
- `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`: test components the way a
  user uses them (roles, labels, clicks, keys) instead of implementation details.
- `eslint` 10 + `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
  `globals`: code-quality lint. ESLint was kept even though the current Vite template ships `oxlint`, because the
  plan and `CLAUDE.md` specify it and the React hooks rules are the standard ones.
- `prettier` 3.9 + `eslint-config-prettier`: formatting, with ESLint's style rules turned off so the two never
  disagree.
- `@types/react`, `@types/react-dom`, `@types/node`: type definitions.
- `msw` 3.0 (tests only): intercepts `fetch` at the network level so the API client is tested against realistic
  responses (status codes, headers, broken JSON, delays) without starting the backend or hand-mocking `fetch`.

The API client uses the built-in `fetch` (no `axios`): one dependency fewer, and timeouts come from
`AbortSignal.timeout`.

## Consequences
- One clone, one command to run everything; easy to review.
- No framework means fewer dependencies and more idiomatic Go, at the cost of writing a little middleware by hand.
- Alternatives considered: Gin or Echo (popular, but unnecessary for three routes); Next.js (adds server rendering
  we do not need).

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

## Consequences
- One clone, one command to run everything; easy to review.
- No framework means fewer dependencies and more idiomatic Go, at the cost of writing a little middleware by hand.
- Alternatives considered: Gin or Echo (popular, but unnecessary for three routes); Next.js (adds server rendering
  we do not need).

# ADR 0006 — Containers, same-origin proxy and CI

- Status: Accepted
- Date: 2026-10-20

## Context
The brief asks for a Dockerfile to run frontend and backend together, and reviewers will run the project on their
own machines. The frontend calls the API from the browser, so the way the two are wired decides whether CORS is needed.

## Decision
- **Two images, one `docker-compose.yml`.** The backend is a static Go binary (`CGO_ENABLED=0`) in a small Alpine image,
  run as a fixed unprivileged user, with a `HEALTHCHECK` on `/healthz`. The frontend is built with Node and served by
  nginx.
- **Same origin through nginx.** nginx serves the app and forwards `/api/` to the backend (`BACKEND_URL`, default the
  Compose service name). The backend has no published port. In development, Vite's proxy does the same, so the browser
  never calls another origin and CORS is only needed for a split deployment (the optional demo in ADR 0005).
- **Start-up order by health, not by time.** The frontend waits for the backend's healthcheck and restarts when the
  backend is recreated, because nginx resolves the backend's name once at startup.
- **CI on GitHub Actions**, one workflow: backend (golangci-lint at the Makefile's pinned version, `go test -race`,
  coverage), frontend (ESLint, Prettier, strict `tsc`, Vitest coverage), then `docker compose up --build --wait` on a
  clean runner and the Playwright smoke test. Coverage reports are uploaded as artifacts.
- Base images are pinned to exact tags checked on Docker Hub; actions are pinned to their major version.

## Consequences
- One command (`docker compose up --build`) runs the same artifacts CI tests; the first CI run was the clean-machine check.
- No CORS configuration in the normal setup, and one fewer port exposed.
- nginx's master process still runs as root (its workers do not), as in the official image.
- Alternatives considered: distroless for the backend (smaller, but no `wget`, so the healthcheck would need a new
  subcommand in the binary); the browser calling the backend's port directly (needs CORS everywhere); a coverage
  service such as Codecov (another account and integration for numbers CI already reports).

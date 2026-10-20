# Full-Stack Calculator

A calculator with a React + TypeScript frontend and a Go backend service.

> Work in progress. Sections below are filled in as the project is built (see `docs/PROJECT_PLAN.md`).

## Prerequisites

Only Docker is needed to run the full stack. To run or develop each layer locally:

| Tool | Version used | Needed for |
|---|---|---|
| Go | 1.27.0 | backend |
| Node.js | 24 LTS (24.20.0) | frontend |
| Docker | Engine 29.8.2 (Docker Desktop 4.95.0) | full stack with `docker compose` |
| GNU Make | 4.4.1 | shortcuts in the `Makefile` (optional) |
| golangci-lint | 2.15.0 | backend lint and format; install with `make tools` |

`make tools` installs into the Go bin directory (`go env GOPATH` + `/bin`); make sure it is on your `PATH`.

`make help` lists every shortcut (`dev`, `test`, `coverage`, `lint`, `fmt`, `docker-up`, ...). The `Makefile`
only uses commands that work in both POSIX `sh` and Windows `cmd.exe`.

## Quick start

## Running without Docker

### Backend

```bash
make dev-backend          # or: cd backend && go run ./cmd/server
```

The API listens on `http://localhost:8080`. Configuration comes from environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | TCP port to listen on |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed by CORS; only needed when the frontend runs on another origin (live demo, or Vite without its proxy) |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn` or `error`; logs are JSON lines on stdout |

Invalid values stop the server at startup with a clear message. `Ctrl+C` or `SIGTERM` shuts it down gracefully,
giving in-flight requests up to 10 seconds to finish.

### Frontend

```bash
cd frontend && npm install    # once
make dev-frontend             # or: cd frontend && npm run dev
```

Vite serves the app on `http://localhost:5173`. Other scripts: `npm test`, `npm run coverage`, `npm run lint`
(ESLint, Prettier check and strict `tsc`), `npm run format`, `npm run build`.

> On Windows PowerShell with script execution disabled, call `npm.cmd` instead of `npm`. `make` is not affected.

## Tests and coverage

```bash
make test-backend       # go test ./...
make coverage-backend   # per-function report, plus backend/coverage.html
make test-race          # race detector in a Linux container (it needs cgo, so it does not run natively on Windows)
make lint-backend       # golangci-lint run + format check

make test-frontend      # Vitest: API client, reducer, components and user flows (MSW fakes the backend)
make coverage-frontend  # text summary, plus frontend/coverage/index.html
make lint-frontend      # ESLint, Prettier check and strict tsc
```

## API reference

The full contract is in [`backend/api/openapi.yaml`](backend/api/openapi.yaml) (OpenAPI 3.1). A test fails if a
route or error code used by the code is missing from it.

## Architecture

## Design decisions and trade-offs

## Assumptions

## AI usage

## What I would do with more time

## Time spent

## License

MIT, see [LICENSE](LICENSE).

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
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed by CORS (local frontend) |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn` or `error`; logs are JSON lines on stdout |

Invalid values stop the server at startup with a clear message. `Ctrl+C` or `SIGTERM` shuts it down gracefully,
giving in-flight requests up to 10 seconds to finish.

## Tests and coverage

## API reference

## Architecture

## Design decisions and trade-offs

## Assumptions

## AI usage

## What I would do with more time

## Time spent

## License

MIT, see [LICENSE](LICENSE).

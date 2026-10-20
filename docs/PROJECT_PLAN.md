# Project Plan — Full-Stack Calculator

Living plan for building the Sezzle take-home. Claude Code works through it **in order**, one task at a time,
and ticks each checkbox only when its "done when" checks pass.

---

## 1. Goal and success criteria

Deliver a calculator that a reviewer can clone and run in under two minutes, read in under fifteen,
and trust after skimming the tests. Success means:

- Every row in `docs/REQUIREMENTS.md` traceability table is ✅, including all optional items.
- `docker compose up --build` starts the full stack with one command.
- CI is green: lint, type-check, tests and coverage for both layers.
- Domain coverage ≥ 95%, overall backend ≥ 85%, frontend logic ≥ 85%.
- The README explains setup, API, design decisions and trade-offs clearly.
- Gonzalo can explain every file in a live interview.

**Guiding principle (from the brief):** correctness, clarity and maintainability beat extra features.
Extras are welcome only when they are small, tested and documented.

---

## 2. Architecture

### Overview

```
┌──────────────────────┐   HTTP/JSON    ┌───────────────────────────────────────────┐
│  React + TypeScript  │ ─────────────▶ │  Go service                                │
│  (Vite, served by    │  /api/v1/...   │                                            │
│   nginx in Docker)   │ ◀───────────── │  adapters/httpapi  →  app  →  calculator   │
└──────────────────────┘                │  (handlers, JSON)    (use   (pure domain:   │
                                        │                       case)  operations)   │
                                        └───────────────────────────────────────────┘
```

### Why hexagonal-lite and not microservices

The brief asks for **one** backend microservice. Splitting it into several services would add network calls,
deployment complexity and failure modes without any benefit for a calculator. A reviewer would read it as over-engineering.

Inside the one service we use a **hexagonal-lite (ports and adapters)** layout:

- **Domain (`internal/calculator`)** — pure Go. Operations, validation rules, domain errors. No HTTP, no JSON, no logs.
- **Application (`internal/app`)** — the use case "calculate": looks up the operation, runs it, returns a result or error.
- **Adapters (`internal/adapters/httpapi`)** — HTTP handlers, request/response DTOs, error-to-status mapping, middleware.

This keeps the math testable without a server, and lets us add a new transport (gRPC, CLI) or a new operation
without touching the rest. It is "lite" because we do not create interfaces we do not need yet. See `docs/adr/0002`.

### Extensibility: the operation registry

Each operation implements one small interface and registers itself:

```go
type Operation interface {
    Name() string            // "add", "sqrt", ...
    Arity() int              // 1 for sqrt, 2 for add
    Apply(operands []float64) (float64, error)
}
```

Adding "modulo" later = one file + one table-driven test + one line in the registry. The frontend reads
`GET /api/v1/operations`, so a new operation can appear in the UI without hard-coding it. This is the
"ready for future features" story to tell in the interview.

### Repository layout

```
.
├── backend/
│   ├── cmd/server/main.go             # wiring, config, graceful shutdown
│   ├── internal/calculator/           # domain: operations, registry, errors (+ _test.go)
│   ├── internal/app/                  # calculate use case (+ _test.go)
│   ├── internal/adapters/httpapi/     # handlers, DTOs, middleware, error mapping (+ _test.go)
│   ├── internal/platform/             # config, logger (slog)
│   ├── api/openapi.yaml               # API contract
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/api/                       # typed API client
│   ├── src/features/calculator/       # reducer (state machine), components, hooks
│   ├── src/components/                # shared UI pieces
│   ├── e2e/                           # Playwright smoke test
│   ├── Dockerfile
│   └── nginx.conf                     # serves the SPA, proxies /api to the backend
├── docs/
│   ├── REQUIREMENTS.md
│   ├── PROJECT_PLAN.md                # this file
│   ├── adr/                           # architecture decision records
│   └── ai/PROMPTS.md                  # AI usage log (required deliverable)
├── .github/workflows/ci.yml
├── docker-compose.yml
├── Makefile
├── CLAUDE.md
└── README.md
```

---

## 3. API contract

Base path: `/api/v1`. All responses are JSON. Full contract in `backend/api/openapi.yaml`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/calculate` | Run one operation |
| `GET` | `/api/v1/operations` | List supported operations and their arity |
| `GET` | `/healthz` | Liveness check for Docker and CI |
| `GET` | `/metrics` | Prometheus metrics (stretch, see section 7) |

### Calculate

Request:
```json
{ "operation": "divide", "operands": [10, 4] }
```

Success `200`:
```json
{ "operation": "divide", "operands": [10, 4], "result": 2.5 }
```

Error `422` (example):
```json
{ "error": { "code": "DIVISION_BY_ZERO", "message": "cannot divide by zero" } }
```

Why one `calculate` endpoint with an `operation` field instead of `/add`, `/divide`, ...:
one handler, one validation path, and the registry decides what exists. Trade-off and alternative in `docs/adr/0003`.

### Operations and edge cases

| Operation | Arity | Rule | Error cases |
|---|---|---|---|
| `add` | 2 | a + b | non-finite result |
| `subtract` | 2 | a − b | non-finite result |
| `multiply` | 2 | a × b | non-finite result (overflow) |
| `divide` | 2 | a ÷ b | `b == 0` → `DIVISION_BY_ZERO` |
| `power` | 2 | aᵇ | negative base with fractional exponent → `INVALID_OPERAND`; zero to a negative exponent → `DIVISION_BY_ZERO`; overflow → `RESULT_OUT_OF_RANGE` |
| `sqrt` | 1 | √a | `a < 0` → `INVALID_OPERAND` |
| `percentage` | 2 | a % of b = a × b ÷ 100 | non-finite result (multiplies first for exact results; divides first only if `a × b` overflows) |

### Error codes and HTTP status

| Situation | Code | Status |
|---|---|---|
| Body is not valid JSON, unknown fields, body too large | `INVALID_REQUEST` | 400 |
| Unknown operation | `UNKNOWN_OPERATION` | 400 |
| Wrong number of operands | `INVALID_ARITY` | 400 |
| Operand is missing, `NaN` or infinite | `INVALID_OPERAND` | 400 |
| Division by zero | `DIVISION_BY_ZERO` | 422 |
| Math is undefined for these values | `INVALID_OPERAND` | 422 |
| Result overflows `float64` | `RESULT_OUT_OF_RANGE` | 422 |
| Wrong method | `METHOD_NOT_ALLOWED` | 405 (with `Allow` header) |
| Unknown path | `NOT_FOUND` | 404 |
| Unexpected failure | `INTERNAL_ERROR` | 500 (no internals leaked) |

### Numbers

We use `float64` and document it. Results are rounded for display in the frontend only, never in the API.
The README states the known `0.1 + 0.2` behavior and explains that real money code at a payments company
would use integer minor units (cents) or a decimal type — a deliberate, honest trade-off. See `docs/adr/0004`.

---

## 4. Frontend design

- **Vite + React + TypeScript**, strict mode on.
- **State machine with `useReducer`.** The calculator state (current input, stored operand, pending operation,
  result, error) lives in a pure reducer. Pure = easy to test, easy to explain.
- **Typed API client** in `src/api/` with request timeout, error parsing into the backend's error codes,
  and friendly messages per code.
- **UI:** keypad plus full keyboard support (digits, `+ - * /`, `Enter`, `Backspace`, `Escape`), a display that
  shows the expression and the result, an error banner with clear text, a loading state, and a short history
  of the last calculations kept in memory.
- **Operations list from the API:** the advanced operations (power, sqrt, percentage) render from
  `GET /api/v1/operations`, proving the extensibility story end to end.
- **Accessibility:** buttons with `aria-label`s, visible focus, `aria-live` region for results and errors,
  color contrast checked.
- **Responsive:** works at 360px width and on desktop; light and dark mode via `prefers-color-scheme`.
- **Styling:** Tailwind CSS (ADR 0005). Visual concept in `docs/DESIGN.md`: a "paper tape" calculator with a
  history tape and an optional API inspector panel.

**About v0 or Lovable:** fine for a quick visual draft, but generated code tends to bring many dependencies and
patterns that do not match the rest of the repo. Recommended path: sketch the look there (or with Claude),
then build the components here with Claude Code so the code stays consistent, tested and explainable.
If a draft is used, log it in `docs/ai/PROMPTS.md`.

---

## 5. Quality and tooling

| Area | Backend | Frontend |
|---|---|---|
| Unit tests | `go test`, table-driven | Vitest + React Testing Library |
| HTTP tests | `net/http/httptest` | MSW to mock the API |
| End-to-end | — | Playwright smoke test against Docker Compose |
| Race detector | `go test -race` (CI on Linux; locally `make test-race` in Docker, since cgo is not available on a default Windows setup) | — |
| Coverage | `-coverprofile` + HTML report | Vitest v8 coverage |
| Lint/format | `gofmt`, `go vet`, `golangci-lint` | ESLint, Prettier, `tsc -b` (both tsconfigs set `noEmit`) |
| CI | GitHub Actions: lint → test → coverage → docker build | same workflow |

Coverage reports are uploaded as CI artifacts, and the README shows a coverage summary.

---

## 5b. Engineering workflow (how a senior team would run this)

| Phase of a real project | Artifact in this repo |
|---|---|
| Requirements | `docs/REQUIREMENTS.md` with traceability table |
| Design | `docs/PROJECT_PLAN.md`, `docs/DESIGN.md`, ADRs, `backend/api/openapi.yaml` |
| Implementation | One branch and one pull request per phase (`feat/backend-domain`, `feat/backend-http`, `feat/frontend`, `chore/docker-ci`, `docs/readme`) |
| Review | `code-reviewer` subagent before each PR; PR template filled; CI green before merge |
| Testing | Unit, HTTP, component and one end-to-end test; coverage reports in CI |
| Delivery | Docker Compose, CI on every push, optional live demo |
| Documentation | README, ADRs, AI usage log |
| Retrospective | "What I would do with more time" in the README |

**AI harness committed to the repo:**
- `CLAUDE.md` — project context and working rules.
- `.claude/skills/next-task` — runs one plan task with the teaching workflow (`/next-task`).
- `.claude/skills/explain` — explains code for interview prep (`/explain <file or concept>`).
- `.claude/skills/log-prompt` — appends to the AI usage log (`/log-prompt`).
- `.claude/agents/code-reviewer.md` — independent read-only reviewer used before each PR.

Merge each PR with a normal merge (not squash) so the step-by-step history stays visible.

---

## 6. Task list

Each task has: **what**, **why**, **done when**, and **learn** (the Go or concept to understand before moving on).
Estimated times are for Claude Code + Gonzalo together.

### Phase 0 — Setup (≈30 min)

- [x] **S1. Create the repo and skeleton.** Folders from section 2, `.gitignore`, `.editorconfig`, MIT license, empty README with section headings.
  *Done when:* repo pushed to GitHub, first commit `chore: initial project skeleton`.
- [x] **S2. Install and verify toolchains.** Latest stable Go, Node LTS, Docker. Record versions in README.
  *Learn:* `go mod init`, what a Go module is, compared with `package.json`.
- [x] **S3. Makefile.** Targets `dev`, `test`, `coverage`, `lint`, `fmt`, `docker-up`.
  *Done when:* `make help` lists every target.

### Phase 1 — Backend domain (≈1 h)

- [x] **B1. Domain errors.** Sentinel errors (`ErrDivisionByZero`, `ErrInvalidOperand`, `ErrResultOutOfRange`, ...) in `internal/calculator/errors.go`.
  *Learn:* Go errors are values; `errors.Is` and `fmt.Errorf("%w")` vs `try/catch` in TypeScript.
- [x] **B2. Operation interface and registry.** Interface from section 2, registry with lookup by name and a sorted list.
  *Learn:* Go interfaces are satisfied implicitly — no `implements` keyword.
- [x] **B3. Basic operations, test first.** add, subtract, multiply, divide with table-driven tests, including zero, negatives, decimals, very large numbers and `NaN`/`Inf` inputs.
  *Done when:* `go test ./internal/calculator/...` passes, coverage ≥ 95%.
  *Learn:* table-driven tests and `t.Run` subtests.
- [x] **B4. Advanced operations, test first.** power, sqrt, percentage with the edge cases in section 3.
- [x] **B5. Result guard.** One shared check that rejects non-finite results, so no operation can return `NaN` or `Inf`.

### Phase 2 — Backend application and HTTP (≈1 h)

- [x] **B6. Calculate use case** in `internal/app`: looks up the operation and runs it. Arity is validated once, inside each operation (`checkOperands`); the use case tests cover it.
- [x] **B7. HTTP handlers.** `POST /api/v1/calculate`, `GET /api/v1/operations`, `GET /healthz` using the standard library router with method patterns.
  *Learn:* `http.Handler`, `http.HandlerFunc`, routing patterns like `"POST /api/v1/calculate"`, compared with Express.
- [x] **B8. Request decoding and validation.** Max body size, `DisallowUnknownFields`, required fields, JSON errors mapped to `INVALID_REQUEST`.
- [x] **B9. Error mapping.** One function maps domain errors to status codes and JSON bodies (section 3 table).
- [x] **B10. Middleware.** Request ID, structured logging with `log/slog`, panic recovery, CORS for local dev.
  *Learn:* middleware as a function that wraps a handler.
- [x] **B11. Server wiring.** Config from env (`PORT`, `ALLOWED_ORIGINS`, `LOG_LEVEL`), read/write timeouts, graceful shutdown on SIGTERM.
  *Learn:* `context`, goroutines and channels — just enough to understand graceful shutdown.
- [x] **B12. Handler tests with `httptest`.** Happy paths and every error code in the table.
  *Done when:* backend coverage ≥ 85%, `go test -race ./...` clean (runs in CI on Linux).
- [x] **B13. OpenAPI spec** in `backend/api/openapi.yaml` matching the real behavior.

### Phase 3 — Frontend (≈1.5 h)

- [x] **F1. Scaffold.** Vite React TS, strict TypeScript, ESLint, Prettier, Vitest, RTL, Tailwind with design tokens from `docs/DESIGN.md`.
  The `lint` npm script must run `eslint`, `prettier --check` and `tsc -b` (type-check only: `noEmit`), so `make lint` matches the docs.
- [x] **F2. API client** in `src/api/` with types, timeout and error-code parsing. Tests with MSW.
- [x] **F3. Calculator reducer.** Pure state machine with tests for every transition (digit, decimal point, operator, equals, clear, backspace, error, chained operations).
- [x] **F4. Components.** Display, Keypad, AdvancedOperations (from the API), ErrorBanner, Tape, ApiInspector (see `docs/DESIGN.md`).
- [x] **F5. Keyboard support and accessibility.** Digits, `. ,`, `+ - * /`, `Enter`/`=`, `Backspace`, `Escape`; results announced once through a `role="status"` region, errors through the banner's `role="alert"`.
- [x] **F6. Responsive layout and dark mode.** Check at 360px and at desktop width.
- [x] **F7. Component tests** for main flows: `2 + 3 = 5`, divide by zero shows the error, sqrt of a negative shows the error, backend down shows a friendly message.
  *Done when:* frontend logic coverage ≥ 85%.

### Phase 4 — Docker, CI and end-to-end (≈45 min)

- [ ] **D1. Backend Dockerfile.** Multi-stage build, static binary, small non-root runtime image, healthcheck.
- [ ] **D2. Frontend Dockerfile.** Multi-stage: build with Node, serve with nginx; nginx proxies `/api` to the backend so there is no CORS in production.
- [ ] **D3. `docker-compose.yml`.** Both services, healthchecks, app on `http://localhost:8080`.
  *Done when:* fresh clone + `docker compose up --build` works on a clean machine.
- [ ] **D4. GitHub Actions CI.** Lint, type-check, tests with coverage for both layers, Docker build. Upload coverage reports as artifacts.
- [ ] **D5. Playwright smoke test** that runs against Compose: open the app, compute `12 / 4 = 3`, try `5 / 0` and see the error.

### Phase 5 — Documentation and submission (≈45 min)

- [ ] **R1. README** with the structure in section 8.
- [ ] **R2. ADRs** reviewed and final.
- [ ] **R3. `docs/ai/PROMPTS.md`** complete and honest.
- [ ] **R4. Final review.** Fresh clone test, traceability table all ✅, no TODOs, no secrets, consistent naming, record time spent in the README.
- [ ] **R5. Live demo (optional).** Deploy per ADR 0005 and add the link to the README. Skip if it risks the deadline.
- [ ] **R6. Submit** the repository link (and prompts) through the Greenhouse form and send a short note to the recruiter.

### Phase 6 — Interview prep (≈30 min)

- [ ] **I1. Walkthrough rehearsal.** Gonzalo explains the architecture in 3 minutes, in English.
- [ ] **I2. Likely questions.** Why Go's standard library and no framework? Why one `calculate` endpoint? How would you add an operation? How would you handle money? What would you do with more time? How did you use AI and how did you check its output?

---

## 7. Stretch goals (only after everything above is ✅)

Pick at most two; each must be small, tested and documented.

1. **`/metrics` endpoint** with Prometheus counters and a latency histogram per operation. Sezzle's stack uses Prometheus and Grafana, so this is the most relevant extra.
2. **Expression mode** (`(2 + 3) * 4`) using a small parser in the domain — only if time remains; it is the riskiest extra.
3. **Rate limiting middleware** with a token bucket.

---

## 8. README outline

1. Title, one-line description, CI and coverage badges, screenshot or GIF.
2. Quick start: `docker compose up --build`.
3. Running without Docker: backend and frontend separately.
4. Running tests and coverage.
5. API reference with `curl` examples for success and each error case.
6. Architecture: diagram, layers, operation registry, how to add an operation.
7. Design decisions and trade-offs (links to ADRs).
8. Assumptions (percentage semantics, float precision, operand limits).
9. AI usage (link to `docs/ai/PROMPTS.md` and `CLAUDE.md`).
10. What I would do with more time.
11. Time spent.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Over-engineering beyond the "2–4 hours" guidance | Finish core first; extras only from section 7; mention honestly in README how long it took |
| Gonzalo cannot explain Go code in the interview | Teaching mode in `CLAUDE.md`; check question after each task; rehearsal in Phase 6 |
| Float precision surprises | Documented in ADR 0004 and README; tests use tolerance where needed |
| Docker works only on one machine | Test from a fresh clone; pin base images |
| Deadline (5 business days) | Phases 0–5 fit in two focused sessions; buffer day before submission |

---

## 10. Schedule (tonight + tomorrow morning)

Received Monday 19 October 2026; hard deadline Monday 26 October. Plan: build tonight, submit tomorrow morning
after a fresh-clone check with rested eyes.

| Block | Phases | Notes |
|---|---|---|
| Tonight, block 1 (~1 h) | Phase 0 + Go primer | Go basics in 20 minutes: packages, structs, interfaces, errors, tests |
| Tonight, block 2 (~2 h) | Phases 1–2 | Backend done with tests, PRs merged |
| Tonight, block 3 (~2 h) | Phase 3 | Frontend done with tests |
| Tonight, block 4 (~1 h) | Phase 4 | Docker, CI green |
| Tomorrow morning (~1.5 h) | Phases 5–6 | README, demo if time, fresh-clone test, rehearsal, submit |

If a block runs long, cut stretch goals first, then the live demo — never tests or docs.

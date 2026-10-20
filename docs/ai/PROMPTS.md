# AI Usage Log

Sezzle asked candidates to share the prompts used in their work. This log records how AI tools were used,
what they produced, and what I changed or rejected. I reviewed, ran and tested all generated code, and I can
explain every part of it.

## Tools
- **Claude (claude.ai):** planning, requirements analysis and the initial project plan, ADRs and this harness.
- **Claude Code (desktop):** implementation, tests, documentation, guided by `CLAUDE.md`.
- **v0 and Lovable:** one visual draft each from the same prompt, used only as a design reference (entry 008).

## How I worked
1. Turned the assignment email into `docs/REQUIREMENTS.md` with a traceability table.
2. Wrote `CLAUDE.md` so Claude Code had context about the project, my level in Go and the working rules
   (tests first, small commits, explain decisions, ask before big changes).
3. Built task by task from `docs/PROJECT_PLAN.md`, reviewing each change before committing.

## Log

### 001 — Planning (claude.ai)
- **Prompt (summary):** Shared the assignment email and asked for a complete, professional plan: Go backend,
  React + TypeScript frontend, all optional features, Docker, a strong README, an architecture recommendation
  and a step-by-step task list explained so I can learn Go while building.
- **Output:** `CLAUDE.md`, `docs/REQUIREMENTS.md`, `docs/PROJECT_PLAN.md`, ADRs 0001–0004 and this log.
- **My changes / decisions:** *(fill in: what I accepted, changed or rejected and why)*

### 002 — Kickoff: environment check, version check, repo init and Go primer (Claude Code)
- **Prompt (summary, original in Spanish):** Read `CLAUDE.md`, `START_HERE.md` and everything in `docs/`, plus
  `.claude/skills` and `.claude/agents`; confirm the skills and the subagent are visible; check installed tools
  (`go`, `node`, `npm`, `docker`, `git`, `gh`); verify current stable versions of Go, Node LTS, React, Vite and
  Tailwind on the web and propose what to pin; summarize the plan in Spanish in at most 10 lines; run `git init`,
  ignore `START_HERE.md` and make the first commit; give a 20-minute Go primer compared with TypeScript (packages
  and modules, structs, interfaces, errors as values, table-driven tests) with 3 check questions. No project code yet.
- **Output:** environment report (Go, Docker and `make` missing; Node, npm, git and gh present), version proposal
  from go.dev, nodejs.org and the npm registry, `.gitignore` (ignores `START_HERE.md`), `.gitattributes`
  (LF line endings, added after Git warned about CRLF conversion on Windows), first commit, Go primer in chat.
- **Follow-up:** I asked for the install commands one at a time. Claude Code found WSL2 was also missing (Docker
  needs it) and gave `winget` commands in order: WSL2, Go 1.27.0, Docker Desktop 4.95.0, make 4.4.1. I asked to
  install everything on my external drive (G:) because C: is small; Claude Code adjusted the commands
  (`--location`, Docker `--installation-dir` and `--wsl-default-data-root`, `GOPATH`/`GOMODCACHE`/`GOCACHE` on G:)
  and checked after each step that files landed on G:, not C:. After a reboot I ran `go version`, `docker -v`,
  `docker run --rm hello-world` and `make --version`; all passed. With my confirmation it created the public
  GitHub repo with `gh repo create` and pushed the first commit.
- **Review:** I ran every install command myself and verified each tool. Declined the Docker Desktop update
  mid-project to avoid unnecessary risk.
- **Mistake caught:** the Go primer showed the `Operation` interface without `Arity()`, while the plan defines it
  with `Name()`, `Arity()` and `Apply()`. I noticed it when answering a check question and proposed
  `var _ Operation = Sqrt{}` as a compile-time check that a type satisfies the interface.

### 003 — S1: project skeleton (Claude Code)
- **Prompt (summary):** After answering the Go primer questions correctly, started task S1 with `/next-task S1`.
- **Output:** branch `chore/setup`; folder layout from the plan (section 2) with `.gitkeep` files; `.gitignore` for
  Go, Node, env files and editors; `.editorconfig` (LF, tabs for Go and Makefile to match `gofmt`); MIT `LICENSE`;
  `README.md` with the section headings from the plan (section 8). `go mod init` and the Vite scaffold are left to
  S2 and F1 so each commit has one purpose.
- **Review:** Checked the tree, that `START_HERE.md` is still ignored, and that every new file is stored with LF.

### 004 — Harness adjustments (Claude Code)
- **Prompt (summary):** Stop asking check-for-understanding questions and just explain each step, to save time.
  Remove Claude Code as a co-author from the commits.
- **Output:** removed the `Co-Authored-By` trailer from the two existing commits (history rewritten and
  force-pushed while I was the only user of the repo); updated `CLAUDE.md` and the `next-task` skill so
  there are no check questions and no co-author trailers.
- **Review:** Confirmed that the rewritten commits have the same content (empty diff) and no trailers on GitHub.
  AI usage stays fully documented in this log and in `CLAUDE.md`. The GitHub contributors sidebar kept showing
  Claude for a while because of caching; the contributors API already listed only me.

### 005 — S2: toolchains and Go module (Claude Code)
- **Prompt (summary):** "Let's go with the next one" (task S2).
- **Output:** `backend/go.mod` created with `go mod init github.com/gonzalolavin99/sezzle-fullstack-calculator/backend`
  (Go 1.27.0, no dependencies); "Prerequisites" table in the README with the installed versions.
- **Review:** Checked `go env` points the module and build caches to G:, and that `go vet ./...` runs (no packages yet).

### 006 — S3: Makefile (Claude Code)
- **Prompt (summary):** "Let's go, and keep explaining what you are doing."
- **Output:** `Makefile` with `help` (default), `tools`, `dev`, `test`, `coverage`, `lint`, `fmt`, `docker-up`,
  `docker-down` and `-backend`/`-frontend` variants. Recipes avoid `grep`/`awk`/`test` so they run in both `sh`
  and `cmd.exe` (on my Windows setup `make` falls back to `cmd.exe`). `help` uses make's `$(info)`. Installed
  golangci-lint v2.15.0 (latest release, checked on GitHub) and added it to the ADR 0001 tool list.
- **Review:** Ran `make help` through both `cmd.exe` and `sh`. First version printed "Nothing to be done for
  'help'"; fixed with `@exit 0`. `make test-backend` fails with "no packages to test" until B1 adds Go code —
  expected. The race detector is left to CI because it needs cgo, which a default Windows setup lacks.
- **Code review (code-reviewer subagent, phase 0):** no Must fix. Applied: PATH note for `make tools` in the
  README, plan notes that `-race` runs in CI and that the frontend `lint` script must include `prettier --check`
  and `tsc --noEmit`, more complete `.gitignore` (Playwright, Vite, `*.out`, `go.work`), and `fmt-backend` now uses
  `golangci-lint fmt` so `make fmt` and `make lint` share one formatter. Left for later: entry 001 review notes and
  the Tools list placeholder (task R3).

### 007 — B1: domain errors (Claude Code)
- **Prompt (summary):** "Merge PR 1 (normal merge, not squash) and continue with B1."
- **Output:** PR 1 merged with a merge commit; branch `feat/backend-domain`. Test first:
  `internal/calculator/errors_test.go` (every error is distinct; `errors.Is` still finds each one after `%w`
  wrapping), shown failing to compile, then `internal/calculator/errors.go` with six sentinel errors.
  `INVALID_OPERAND` has two statuses in the plan (400 for NaN/Inf input, 422 for undefined math), so the domain
  has two errors, `ErrNonFiniteOperand` and `ErrInvalidOperand`; the API contract does not change.
- **Review:** `go test`, `go vet` and `golangci-lint` (run and fmt) all clean. Rejected alternative: a struct
  error type carrying API codes, because it would leak HTTP concerns into the domain.

### 008 — UI visual draft (Claude Code → v0 and Lovable)
- **Prompt (summary):** I asked whether to try v0 or Lovable for the frontend. Claude Code recommended a visual
  draft only (as the plan says) and wrote one prompt for v0, based on `docs/DESIGN.md`: a single React + Tailwind
  component, no component libraries, mock data, "paper tape" concept, desktop and 360px layouts, keypad, advanced
  row, error banner, tape with a voided error line, collapsible API inspector, light/dark tokens, aria-labels,
  one animation with reduced-motion support. I ran the same prompt in v0 and in Lovable.
- **Output:** two deployed drafts. Claude Code compared them in a browser at desktop and 375px widths and chose
  v0 (closer to the design doc, more polished, code downloadable). I downloaded the v0 code; `page.tsx` and
  `globals.css` are kept as reference in `docs/design/v0-draft/`. `docs/DESIGN.md` now lists what was adopted,
  changed and rejected, plus the color tokens.
- **Review:** Both drafts showed `%` twice; this came from Claude Code's prompt (it listed `%` in both the advanced
  row and the keypad) and is fixed in the design notes. Rejected from the draft: math in the browser, one large
  component, Next.js/shadcn/analytics dependencies. Claude Code could not read the v0 source through the Vercel
  connection (403 on my team scope), so I downloaded it manually.

### 009 — B2: Operation interface and registry (Claude Code)
- **Prompt (summary):** "The v0 ZIP is downloaded; continue with that or with B2."
- **Output:** test first (`registry_test.go` with a stub operation: duplicate names rejected, lookup by name
  including unknown/empty/case-sensitive names wrapped as `ErrUnknownOperation`, operations listed sorted by name),
  shown failing, then `operation.go` (interface from the plan) and `registry.go` (`NewRegistry` returns an error on
  duplicates; `Lookup`; `Operations` sorted with `slices.Sorted(maps.Keys(...))`).
- **Review:** 100% coverage of the package, `go vet` and `golangci-lint` clean. The first run of the format check
  failed on a misaligned one-line method in the test; fixed with `make fmt-backend`. Rejected alternative: a
  `switch` on the operation name in the handler, which would mix domain and HTTP and grow with every operation.
  Also noticed that the commit for entry 008 picked up a Codex copy of the harness (`AGENTS.md`, `.agents/`,
  `.codex/`) that was not created by Claude Code. I asked to remove it from the repo; it is now untracked and
  ignored, and the local copy stays on my machine.

### 010 — B3: basic operations (Claude Code)
- **Prompt (summary):** "Remove AGENTS.md, .agents/ and .codex/ from the repo and continue with B3."
- **Output:** Codex files untracked with `git rm --cached` and added to `.gitignore` (local copies kept; they
  remain in the history of one earlier commit). Test first: `basic_test.go`, one table with 30 cases for add,
  subtract, multiply and divide (integers, zero, negatives, decimals including `0.1 + 0.2`, large but finite
  numbers, divide by `0` and `-0`, NaN/Inf operands, wrong operand count), shown failing; then `basic.go`
  (four empty-struct operations) and `operands.go` (`checkOperands`: arity and finite checks shared by all
  operations, so `Apply` never panics on a short slice).
- **Review:** package coverage 100% (target ≥ 95%), `golangci-lint` clean. Overflow to `Inf` (for example
  `1e308 * 10`) is deliberately left to B5, the shared result guard; B3 tests only use large values that stay finite.

### 011 — B4: advanced operations (Claude Code)
- **Prompt (summary):** "Open the terminal and show me live how to run these commands (`make test-backend` and
  so on), then continue with B4."
- **Output:** Claude Code ran the commands in my terminal panel and explained `-v`, `-run`, `-cover` and test
  caching. Before writing tests it ran a scratch program to check `math.Pow` on edge cases instead of guessing:
  `(-8)^(1/3)` is `NaN`, `0^-1` is `+Inf`, `0^0` is `1`. Test first (`advanced_test.go`, 24 cases), shown failing
  in my terminal, then `advanced.go`: `Power` (negative base with fractional exponent → `ErrInvalidOperand`,
  zero to a negative exponent → `ErrDivisionByZero`), `Sqrt` (negative → `ErrInvalidOperand`) and `Percentage`
  (`a / 100 * b`, so `50% of 1e308` does not overflow in the intermediate `a * b`).
- **Review:** 100% coverage, lint clean, run in my own terminal. Overflow such as `10^400` is left to B5. Noted for
  B5: `math.Sqrt(-0)` returns `-0`, which JSON would print as `-0`; the result guard should normalize it.

### 012 — B5: result guard (Claude Code)
- **Prompt (summary):** "Go ahead" (task B5).
- **Output:** test first (`result_guard_test.go`): every operation that can overflow returns
  `ErrResultOutOfRange`; no operation returns `-0` (checked with `math.Signbit`, because `-0 == 0`); direct table
  test of the guard, including `NaN` → `ErrInvalidOperand`. Implemented in two steps so the red was meaningful:
  first `checkResult` alone (11 subtests failed at runtime, showing `+Inf, <nil>` and `-0` results), then every
  `Apply` returns through `checkResult`. ADR 0004 now mentions the `-0` rule.
- **Review:** 100% coverage, lint clean, all run in my terminal. Chose a call in each `Apply` over a wrapper in
  the registry, so the rule is visible where each result is computed and holds without the use case.

### 013 — Phase 1 review and pull request (Claude Code + code-reviewer subagent)
- **Prompt (summary):** "Run the code-reviewer, fix the Must fix items and open the Phase 1 PR."
- **Output:** the reviewer found one Must fix, a real bug introduced in B4: `percentage` computed `a / 100 * b`,
  so 7% of 100 returned `7.000000000000001` (190 inexact integer results for a in 1..100, b in 1..1000, against
  0 with `a * b / 100`). Claude Code had chosen `a / 100 * b` to avoid overflow after checking only three inputs
  (15% of 200, 12.5% of 80, 7% of 3) that happened to match; a first re-check also looked fine because Go folds
  constant expressions exactly at compile time, so it re-ran the check with runtime values. Fixed test first
  (7% of 100 and 7% of 200 failing, then passing): multiply first, and divide first only if `a * b` overflows.
  Should fix items applied: plan table (`0^negative`, percentage rule), ADR 0004 (NaN maps to `INVALID_OPERAND`),
  test and interface comments, R1/R2 marked "domain done, UI pending", two more power edge tests.
- **Review:** tests, coverage (100%) and lint green in my terminal. Lesson: probe floating-point choices over a
  range of inputs, not a few hand-picked ones.

### 014 — B6: calculate use case (Claude Code)
- **Prompt (summary):** "Merge PR 2 (normal merge) and continue with B6."
- **Output:** PR 2 merged with a merge commit; branch `feat/backend-http` for Phase 2. Test first
  (`internal/app/calculate_test.go`, `internal/calculator/defaults_test.go`), shown failing in both packages, then
  `calculator.DefaultOperations()` (the one list to extend with a new operation) and `app.Calculator` with
  `Calculate` (lookup, apply, wrap the error with the operation name) and `Operations` (name and arity, sorted).
- **Review:** both packages at 100% coverage, lint clean. Deviation from the plan text, noted in the plan: the
  use case does not re-validate arity, because each operation already does it in `checkOperands`; one source of
  truth. Tests use the real registry instead of mocks because the domain is pure and fast.

### 015 — B7: HTTP handlers (Claude Code)
- **Prompt (summary):** "Let's go" (task B7).
- **Output:** test first (`handlers_test.go` with `httptest`: health, operations list, calculate for binary,
  unary and decimal results, and 405 with `Allow: POST` for a wrong method), shown failing, then
  `internal/adapters/httpapi`: `router.go` (standard library `ServeMux` with method patterns), `handlers.go` and
  `json.go` (DTOs with struct tags, `writeJSON`, `writeError`). `GET /api/v1/operations` returns
  `{"operations":[{"name","arity"}]}`; an object leaves room for more fields later.
- **Review:** tests and lint green; adapter coverage 85.3% because the error branches belong to B8 (request
  validation) and B9 (error mapping). Until B9, a domain error answers a provisional 500 `INTERNAL_ERROR`, marked in
  a comment so it is not forgotten.

### 016 — B8: request decoding and validation (Claude Code)
- **Prompt (summary):** "Do it" (task B8).
- **Output:** test first (`request_test.go`, 14 invalid bodies), shown failing at runtime: the B7 handler accepted
  two JSON objects, unknown fields and oversized bodies with 200, and turned `[1, null]` into `[1, 0]`, which
  surfaced as a division by zero. Then `request.go`: `MaxBytesReader` (64 KiB), `DisallowUnknownFields`, a check
  for a single JSON object, required `operation` and `operands` (pointer fields tell missing/null from zero),
  `null`/string/`1e999` operands → 400 `INVALID_OPERAND`, everything else → 400 `INVALID_REQUEST`. Added an
  `apiError` type that B9 will reuse for domain errors.
- **Review:** two mistakes caught by the compiler and tests: the old request struct was left in `json.go`
  (declared twice), and Claude Code assumed `encoding/json` reports an element type error as field `operands`,
  but it reports `operands.0`; the rule now matches the real format. Coverage 97.3%, lint clean. Not added:
  a `Content-Type` requirement (stricter, but harder to try with curl, and not in the plan).

### 017 — B9: error mapping (Claude Code)
- **Prompt (summary):** "Continue" (task B9).
- **Output:** test first (`errors_test.go`: each domain error, wrapped as the use case does, maps to its status
  and code; an unexpected error becomes 500 `INTERNAL_ERROR` without leaking its text; end-to-end cases through the
  handler, including `"operands": []` → `INVALID_ARITY`), shown failing; then `errors.go` with the section 3 table
  as data (`domainErrorMapping`) and `fromDomainError`, which replaces the provisional 500 from B7.
- **Review:** all three backend packages at 100% coverage, lint clean. Known domain messages are returned as they
  are (for example the arity details) because they help the client and expose nothing internal.

### 018 — B10: middleware (Claude Code)
- **Prompt (summary):** "Let's go" (task B10).
- **Output:** test first (`middleware_test.go`: chain order, request ID generated/kept/replaced, one JSON log
  line with method, path, status, duration and request ID, panic → 500 without leaking the panic value, CORS for
  allowed and other origins including preflight), shown failing; then `middleware.go` with `Chain`, `RequestID`
  (client value kept only if it matches `^[A-Za-z0-9_-]{1,64}$`, to avoid log injection), `Logging` (`log/slog`),
  `Recover` and `CORS` (local development only; nginx removes the need in Docker).
- **Review:** tests and lint green, adapter coverage 99.2% (only `Unwrap` is not exercised). Written by hand
  instead of adding `rs/cors` or a router package, because each piece is a few lines and the standard library is
  preferred. Middleware is wired in B11.

### 019 — B11: server wiring and first live run (Claude Code)
- **Prompt (summary):** "Let's go" (task B11).
- **Output:** test first (`platform/config_test.go`: defaults, custom values, origin list parsing, invalid port
  and log level; `cmd/server/main_test.go`: invalid config fails, cancelling the context shuts the server down
  cleanly), shown failing; then `platform/config.go` (`LoadConfig` takes `getenv` as a parameter),
  `platform/logger.go` (JSON `slog`) and `cmd/server/main.go` (`main` only calls `run`; `run` wires registry →
  use case → handler → middleware, sets server timeouts including `ReadHeaderTimeout`, and shuts down gracefully
  on SIGINT/SIGTERM with `signal.NotifyContext`, a goroutine, a channel and `select`). README "Running without
  Docker → Backend" section with the environment variables.
- **Review:** all tests and lint green. Then a live run in my terminal: started the server with
  `make dev-backend`, called `/healthz`, `/api/v1/operations` and `/api/v1/calculate` with `curl.exe`
  (2.5, 422 `DIVISION_BY_ZERO`, 422 `INVALID_OPERAND`, 400 for a null operand, 405 for GET), checked one JSON log
  line per request with its request ID, and stopped it with Ctrl+C ("shutting down" → "server stopped"). Found:
  the 405 (and 404) bodies are plain text from the router, not JSON; to fix in B12.

### 020 — B12: handler tests and fixes from the live run (Claude Code)
- **Prompt (summary):** "Fix it and let's continue" (the plain-text 404/405 and the duplicated operation name).
- **Output:** tests first for JSON 404/405 and for the arity message, shown failing; then `jsonRouterErrors` in
  `router.go`, which rewrites the router's plain-text 404/405 into the JSON error shape (`NOT_FOUND`,
  `METHOD_NOT_ALLOWED`, `Allow` header kept), and the domain arity message no longer repeats the operation name.
  Every code in the error table is now covered through the handler. New `make test-race` target runs the race
  detector in the official `golang:1.27` image, since cgo is not available on Windows. README "Tests and
  coverage" section and the plan's error table updated.
- **Review:** tests and lint green; total backend coverage 96.9% (target ≥ 85%); `go test -race ./...` clean in a
  Linux container. A catch-all `/` route was rejected for 404 because it would also catch wrong methods and hide
  the 405. Docker Desktop had to be started first (the engine was not running). A `sed` edit to the Makefile failed
  on an escaping error and changed nothing; redone with direct edits.

### 021 — B13: OpenAPI spec (Claude Code)
- **Prompt (summary):** continued straight from B12 ("let's continue").
- **Output:** test first (`openapi_test.go`: the spec must mention every route and every error code the adapter
  can return, taken from `domainErrorMapping` plus the request, router and recovery codes), shown failing; then
  `backend/api/openapi.yaml` (OpenAPI 3.1): three paths, request/response schemas, the error shape with the code
  enum, 400/405/422/500 responses with examples copied from the live run, and notes on float behavior and
  `X-Request-ID`. README links to it.
- **Review:** tests and lint green. YAML syntax checked by parsing it with `gopkg.in/yaml.v3` inside a throwaway
  `golang:1.27` container (nothing installed on my machine). Not added: code generators or a served Swagger UI
  (new dependencies for three routes).

### 022 — Phase 2 review and pull request (Claude Code + code-reviewer subagent)
- **Prompt (summary):** "Run the code-reviewer, fix the Must fix items and open the Phase 2 PR."
- **Output:** the reviewer probed the running server against every row of the error table and found no Must fix.
  All five Should fix items were applied:
  1. `run` had a race: the server goroutine could still write to the log after `run` returned, and the test
     relied on `time.Sleep`. Now `net.Listen` runs synchronously (a busy port fails at once, the real address is
     logged), and `run` waits for the serve goroutine after `Shutdown`. The sleep is gone.
  2. The `ErrServerClosed` check was on `Shutdown`'s error, which never returns it; moved to `Serve`'s result.
  3. The OpenAPI request schema used the operation enum and min/max operands, so a validating client would reject
     the requests the spec documents as `UNKNOWN_OPERATION`/`INVALID_ARITY`; relaxed (the enum stays on responses).
  4. R6, R7 and R8 marked done in the traceability table.
  5. New `withMiddleware` in `main.go` with a test of the production order (panic → logged 500 with request ID,
     CORS header kept on the error).
  Also applied: `Access-Control-Expose-Headers: X-Request-ID`, clearer wording for non-numeric operands, a comment
  stating the invariant behind the 404/405 rewrite, `make test-race` in the plan's quality table.
- **Review:** tests and lint green, `make test-race` clean, `TestRun` repeated 20 times under `-race` without a
  failure, YAML re-validated. The `Expose-Headers` test and its fix were written together, not red-first.
  Left as known minor points: case-insensitive JSON keys (documented in the spec), `Recover` after headers were
  already written.

### 023 — F1: frontend scaffold (Claude Code)
- **Prompt (summary):** "Merge PR 3 (normal merge) and continue with F1."
- **Output:** PR 3 merged; branch `feat/frontend`. Checked current versions on the npm registry and their peer
  dependencies before pinning: TypeScript 7.0 is the latest, but `typescript-eslint` 8.72 supports `<6.1.0`, so
  TypeScript is pinned to `~6.0.3`. Generated the official `create-vite` react-ts template in a scratch folder and
  copied only its config (`tsconfig*`, `vite.config.ts`, `index.html`); added `"strict": true` (the template does
  not enable it) and `noUncheckedIndexedAccess`. Added Tailwind 4 with the `docs/DESIGN.md` tokens as CSS variables
  exposed through `@theme inline` (dark mode swaps the variables), Vitest + jsdom + Testing Library, ESLint flat
  config + Prettier, npm scripts matching the Makefile, a placeholder `App` and one smoke test. ADR 0001 lists
  each new dependency with a one-line reason; README "Running without Docker → Frontend" added.
- **Review:** in my terminal: test passes, `make lint-frontend` (ESLint, Prettier check, strict `tsc`) and
  `npm run build` pass, `npm install` reported 0 vulnerabilities. Checked in a browser that the tokens apply in
  both light and dark mode. Issues met: PowerShell blocked `npm.ps1` (script execution policy), so commands use
  `npm.cmd` (the execution policy was not changed); the copied `tsconfig.json` failed the Prettier check until
  formatted. Kept ESLint although the new Vite template ships `oxlint`, because the plan and `CLAUDE.md` specify it.

### 024 — Visual direction: make the UI look less AI-generated (Claude Code)
- **Prompt (summary):** "The visual part looks very AI-made; make it more natural, then continue with the plan."
- **Output:** Claude Code listed the traits that read as generated, most of them inherited from the v0 draft and
  copied into the F1 header: tiny uppercase letter-spaced eyebrow labels ("DESK INSTRUMENT / 01", "RUNNING
  RECORD", "CALCULATOR · READY", "END OF TAPE"), monospace for every label, hairline near-square panels with soft
  shadows, low-contrast beige text, strikethrough error lines. `docs/DESIGN.md` gained a "Visual direction" section
  (plain sentence-case words, monospace only for numbers, keys that look like keys, AA contrast, plain "History"
  and "Request details"). A contrast script showed two light tokens failing WCAG AA (`muted` 3.20, `danger` 4.37);
  both were darkened (now 4.77 and 5.42). The heading became "Calculator" (test first: the old heading failed the
  updated test). A quick mockup of the new direction was shown in chat; the real components come in F4.
- **Review:** frontend test and lint green. The paper-tape idea (a history list) is kept because it is useful;
  only the decoration was removed.

### 025 — F2: typed API client (Claude Code)
- **Prompt (summary):** continued with the plan after the visual change (task F2).
- **Output:** test first (`client.test.ts`, 16 cases with MSW 3: success for both endpoints, every server error
  code with status, detail and request ID, an unknown code, a non-JSON proxy error page, a malformed success body,
  network failure, timeout, and the `onExchange` report), shown failing; then `src/api/`: `types.ts` (from the
  OpenAPI spec), `errors.ts` (`ApiError` with a friendly `message` and the server's `detail`), `messages.ts`
  (a `Record` over every code, so a new code without a message fails to compile) and `client.ts` (`fetch` +
  `AbortSignal.timeout`, runtime shape checks before trusting network data). Development uses a Vite proxy for
  `/api`, so the app always calls same-origin paths, as with nginx in Docker; CORS docs updated to say it is only
  for a different-origin deployment. `VITE_API_BASE_URL` is typed for the optional demo.
- **Review:** 17 tests green, frontend coverage 95.9%, lint and strict `tsc` green; proxy checked live (request to
  :5173 answered by the Go backend with its request ID). Two mistakes caught: the timeout was first detected with
  `err instanceof DOMException`, which is false across realms (jsdom vs Node), so it now asks `signal.aborted`;
  and the test used MSW v2's `onUnhandledRequest`, which v3 renamed to `onUnhandledFrame` (found by `tsc`, since
  Vitest does not type-check).

### 026 — F3: calculator reducer (Claude Code)
- **Prompt (summary):** "Let's go" (task F3).
- **Output:** tests first (`reducer.test.ts`, 39 cases; `format.test.ts`, 22 cases), shown failing; then
  `features/calculator/reducer.ts`, a pure state machine. It never does math: `=` (and a chained operator, or a
  unary operation such as √) produces `pending: { id, operation, operands }` for a hook to send to the backend in
  F4, which then dispatches `resolved` or `failed`. Covered: digits, single decimal point, 15-digit limit,
  backspace, sign toggle (`±` fills the keypad slot freed when the duplicate `%` was removed), clear, chained
  operations, unary operations that keep a waiting binary operation, keys ignored while a request is pending,
  late answers ignored by request ID, errors kept in a 20-entry history whose timestamp is passed in the action so
  the reducer stays pure. `format.ts` formats results for display only (12 significant digits, scientific notation
  for very large or small values, `0.30000000000000004` shown as `0.3`) and writes expressions (`12 ÷ 4`,
  `15% of 200`, `√144`, and a readable fallback for an operation the UI does not know).
- **Review:** all tests passed on the first run, so the pending guard was broken on purpose to confirm the tests
  catch it (8 failures), then restored. 78 frontend tests, coverage 98.4%, lint and strict `tsc` green.

### 027 — F4: components and API wiring (Claude Code)
- **Prompt (summary):** "Let's go with the next one" (task F4).
- **Output:** a shared MSW server with a small fake backend (`src/test/server.ts`) used by every test file; the
  client gained an optional `AbortSignal` (new code `ABORTED`, test first). Tests first for each component and an
  integration test (`12 ÷ 4 = 3` through keypad → reducer → hook → client → fake backend), shown failing; then
  `components/Key.tsx`, `features/calculator/`: `Display`, `Keypad` (with `±`), `AdvancedOperations` (keys built
  from `GET /api/v1/operations`, unknown operations show their API name), `ErrorBanner`, `Tape` ("History"),
  `ApiInspector` (native `<details>`, "Request details"), `useCalculator` (sends `state.pending`, dispatches the
  answer, aborts on cleanup so React StrictMode's double effect does not send two requests), `useOperations` and
  `Calculator`. Styled with the revised, plainer visual direction.
- **Review:** 96 tests green; lint, Prettier and strict `tsc` clean. Used the app in a browser against the real Go
  backend: `12 ÷ 4 = 3`, `5 ÷ 0` kept in the history with its message, `√144 = 12`; backend logs show exactly one
  request per calculation; the request ID in "Request details" matches the backend log line; checked the stacked
  layout at a narrow width and two columns in dark mode at 1280px. A first screenshot made the keys look grey;
  computed styles showed the right colors (captured mid-transition), so nothing was changed.

<!-- Template for each new entry:
### NNN — Short title (tool)
- **Prompt:** exact text, or a faithful summary for long prompts
- **Output:** files or changes produced
- **Review:** what I checked (tests, manual run), what I changed or rejected, and why
-->

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
  `.codex/`) that was not created by Claude Code; it stays until I decide whether it belongs in the repo.

<!-- Template for each new entry:
### NNN — Short title (tool)
- **Prompt:** exact text, or a faithful summary for long prompts
- **Output:** files or changes produced
- **Review:** what I checked (tests, manual run), what I changed or rejected, and why
-->

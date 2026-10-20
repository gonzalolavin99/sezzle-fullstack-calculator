# AI Usage Log

Sezzle asked candidates to share the prompts used in their work. This log records how AI tools were used,
what they produced, and what I changed or rejected. I reviewed, ran and tested all generated code, and I can
explain every part of it.

## Tools
- **Claude (claude.ai):** planning, requirements analysis and the initial project plan, ADRs and this harness.
- **Claude Code (desktop):** implementation, tests, documentation, guided by `CLAUDE.md`.
- *(Add v0 or Lovable here if used for a visual draft.)*

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

<!-- Template for each new entry:
### NNN — Short title (tool)
- **Prompt:** exact text, or a faithful summary for long prompts
- **Output:** files or changes produced
- **Review:** what I checked (tests, manual run), what I changed or rejected, and why
-->

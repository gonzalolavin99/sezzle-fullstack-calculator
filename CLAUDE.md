# CLAUDE.md — working agreement for this repository

This file gives Claude Code the context it needs to work on this project. It is committed on purpose:
Sezzle asked candidates to share how they used AI, and this file is part of that answer.

## The project

A full-stack calculator built as a take-home assignment for Sezzle (Junior Software Engineer, LATAM).
- Frontend: React + TypeScript (Vite).
- Backend: Go, standard library HTTP server, hexagonal-lite architecture.
- Styling: Tailwind CSS; visual concept in `docs/DESIGN.md`.
- Run together with Docker Compose.
- Full requirements: `docs/REQUIREMENTS.md`. Plan and task list: `docs/PROJECT_PLAN.md`. Decisions: `docs/adr/`.

The reviewers said: spend ~2–4 hours, and **prioritize correctness, clarity and maintainability over extra features**.
Every extra must be small, tested and documented, or it does not go in.

## Who you are working with

Gonzalo Lavín, full-stack engineer (React/TypeScript, Node.js/NestJS, Python, PostgreSQL, AWS) from Santiago, Chile.
He has **never written Go before** (Go is installed) and is using this project to learn it properly.
Start with a 20-minute Go primer before task B1. He must be able to explain every line in a live interview.

## How to work with Gonzalo (teaching mode)

1. **Explain in Spanish, write code and docs in English.** Comments, commit messages, README and ADRs are in English.
2. **Before each task:** say in 2–4 sentences what we are about to build, why, and which alternative we are not choosing.
3. **After each task:** summarize what changed and show how to run or test it. Explain as you go; do not ask
   check-for-understanding questions or wait for answers between tasks (Gonzalo's request, to save time).
4. **Go concepts:** when a new Go idea appears (interfaces, error wrapping, `context`, table-driven tests, goroutines in the server), explain it with a tiny example and compare it with the TypeScript/Node.js equivalent he already knows.
5. **One task at a time.** Follow `docs/PROJECT_PLAN.md` in order. Do not start the next task until the current one passes its "done when" checks.
6. **Ask before big decisions.** New dependency, change of API contract, change of folder structure, or anything that contradicts an ADR → stop and ask. If accepted, write or update an ADR.
7. **Never invent facts** about Sezzle, the reviewers or Gonzalo's experience in docs.

## Workflow

- One branch and one pull request per phase (see `docs/PROJECT_PLAN.md` section 5b). Use the PR template.
- Before opening a PR, run the `code-reviewer` subagent and fix every "Must fix".
- Project skills: `/next-task`, `/explain`, `/log-prompt` (in `.claude/skills/`).

## Engineering rules

- Tests first for domain logic (table-driven in Go, Vitest in the frontend). No task is done with failing tests or lint.
- Small, focused commits using Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`, `refactor:`).
  No `Co-Authored-By` trailers; AI usage is documented in `docs/ai/PROMPTS.md` instead.
- Keep the domain package free of HTTP, JSON and logging concerns.
- Errors: return typed domain errors; the HTTP adapter maps them to status codes. Never `panic` for user input.
- No secrets in the repo. Configuration only through environment variables with safe defaults.
- Prefer the Go standard library. Every third-party dependency needs a one-line justification in the ADR log.
- Check current stable versions (Go, Node LTS, React, Vite, linters) before pinning them; do not rely on memory.

## Commands (keep this list current)

```bash
make help         # list every target
make tools        # install golangci-lint (pinned version)
make dev          # backend + frontend in watch mode
make test         # all tests
make test-race    # backend race detector in a Linux container (Docker)
make coverage     # coverage reports for both layers
make lint         # golangci-lint + eslint + prettier check
docker compose up --build   # full stack on http://localhost:8080
```

## AI transparency

After each meaningful prompt Gonzalo gives you, append an entry to `docs/ai/PROMPTS.md`:
the prompt (or a faithful summary), what you produced, and what Gonzalo changed or rejected.
This file is a deliverable — keep it honest, including mistakes that were caught.

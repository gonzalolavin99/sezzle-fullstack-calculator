---
name: next-task
description: Work on the next unchecked task in docs/PROJECT_PLAN.md using the teaching workflow. Use when Gonzalo says "next task", "siguiente tarea" or asks to continue the plan.
argument-hint: "[optional task id, e.g. B3]"
---

Work on task $ARGUMENTS if given; otherwise pick the first unchecked task in `docs/PROJECT_PLAN.md`.

1. **Brief (in Spanish, 2–4 sentences):** what we will build, why, and which alternative we are not choosing.
   If the task introduces a new Go concept, explain it with a tiny example and compare it with TypeScript/Node.js.
2. **Tests first** when the task touches logic: write or extend the failing test, run it, show it failing.
3. **Implement** the smallest change that passes. Keep the domain free of HTTP/JSON/logging.
4. **Verify:** run the relevant tests, linters and type-check. Do not continue with anything red.
5. **Update docs:** tick the task in `docs/PROJECT_PLAN.md`, update the traceability table in
   `docs/REQUIREMENTS.md` if a requirement is now met, and update the README if commands or behavior changed.
6. **Log AI usage:** append an entry to `docs/ai/PROMPTS.md` (prompt, output, review notes).
7. **Commit** with a Conventional Commit message on the current phase branch.
8. **Wrap up (in Spanish):** what changed and how to run it. No check-for-understanding question; Gonzalo
   says when to start the next task.

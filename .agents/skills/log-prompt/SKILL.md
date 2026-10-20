---
name: log-prompt
description: Append an entry to docs/ai/PROMPTS.md describing a prompt, what AI produced and how it was reviewed. Use after any meaningful AI-assisted step, or when Gonzalo says "log this".
argument-hint: "[short title]"
---

Append a new numbered entry to `docs/ai/PROMPTS.md` following the template at the end of that file:

- **Title:** $ARGUMENTS, or a short title for the step just completed.
- **Prompt:** the exact prompt, or a faithful summary if it is long. Never invent a prompt.
- **Output:** files and changes produced.
- **Review:** what was checked (tests, manual run, lint) and what Gonzalo changed or rejected, with the reason.
  If Gonzalo has not reviewed it yet, write "Pending review" and ask him for his notes.

Keep entries honest and short. Include mistakes that were caught; they show good review practice.

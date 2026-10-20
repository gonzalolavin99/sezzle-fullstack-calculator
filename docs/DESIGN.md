# UI Design — "Paper Tape" calculator

## Concept
A calculator inspired by the paper-tape adding machines used in accounting: every calculation prints a line on
a running tape, like a receipt. It fits the payments domain, is easy to read, and is different from the usual
iPhone-style clone — without being a gimmick.

Two pieces of personality, both small and useful:

1. **The tape ("History"):** each result appears as a line (`12 ÷ 4 = 3`) with the time. Failed calculations
   stay in the list with their message in red (`5 ÷ 0 · Can't divide by zero.`). A result can be clicked to reuse it. A
   "Clear" button empties the list.
2. **The API inspector ("Request details"):** a collapsed `<details>` showing the last request and response JSON,
   status code and latency. It shows reviewers the full-stack flow and helps debugging.

## Visual direction (revised 2026-10-20)
After the first scaffold, the look inherited from the v0 draft read as "AI-generated": tiny uppercase,
letter-spaced labels ("DESK INSTRUMENT / 01", "RUNNING RECORD", "CALCULATOR · READY", "END OF TAPE"), monospace
for every label, hairline borders with near-square corners and soft shadows, beige-on-beige text below AA
contrast, and decorative detail with no job. The direction now is **a calculator, not a design piece**:

- **Plain words.** Sentence-case headings that say what things are: "Calculator", "History", "Request details".
  No eyebrow labels, fake numbering, status slogans or "end of" footers.
- **Monospace only for numbers** (display and tape amounts, with tabular figures). Everything else uses the
  system font.
- **Keys that look like keys:** moderate rounding, solid fills, a slightly heavier bottom border. No decorative
  shadows; a panel is separated by its background, not by a hairline plus a shadow.
- **Readable contrast:** every text/background pair passes WCAG AA (checked with a script; see the token table).
- **History:** time as `HH:MM`; a failed calculation shows its expression and the error message in red (the words,
  not only the color, say it failed) instead of strikethrough, which is harder to read.
- **Request details:** a native `<details>` element, collapsed by default.

## Rules
- **No Sezzle branding:** no logo, name or brand colors. It is my project, not a copy of theirs.
- **Typography:** the system sans-serif for the UI; a monospaced font with tabular figures for numbers only.
- **Color:** neutral paper and ink tones, one accent color for the primary action (`=`) and red for errors.
  Light and dark mode via `prefers-color-scheme`.
- **Motion:** one subtle animation only (a new tape line slides in). Respect `prefers-reduced-motion`.
- **Layout:** desktop shows keypad and tape side by side; mobile (≥ 360px) stacks them with the tape below.
- **Accessibility:** every key has an accessible name, visible focus ring, results and errors announced with
  `aria-live`, contrast AA or better, full keyboard support.

## Styling
Tailwind CSS (see the ADR log). Design tokens (colors, radius, font families) live in the Tailwind theme so the
look can change in one place.

## Visual draft (v0)
Two drafts were made from the same prompt: one in v0 and one in Lovable. The v0 draft was chosen: it is closer
to this document, and its code could be downloaded and reviewed. The reference files are kept, unchanged, in
`docs/design/v0-draft/` (saved as `.txt` so linters and the type-checker ignore them). The frontend is rebuilt
from scratch in `frontend/`; no draft code is copied as-is.

**Adopted** (as revised by the visual direction above)
- Layout: calculator and request details on the left, history on the right; stacked on mobile.
- Accent only on `=`; an error banner with a dismiss button.
- History lines with the time; failed calculations kept in the history.
- The neutral palette below, light and dark, in the Tailwind theme instead of `bg-[var(--x)]` classes.
- From the Lovable draft (ideas only): a visible "calculating…" state, and history lines for advanced operations.

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#eeece7` | `#1b1b19` | page background |
| `panel` | `#f7f5f0` | `#242421` | calculator and request details |
| `tape` / `tape-hover` | `#faf8f2` / `#f1eee6` | `#292824` / `#33312b` | history background and hover |
| `key` / `operator` | `#f4f1eb` / `#e8e4dc` | `#2b2a26` / `#36342e` | digit and operator keys |
| `ink` / `muted` | `#262522` / `#6b675f` | `#efede6` / `#99958b` | text; `ink` is also the focus ring |
| `rule` | `#d8d3c9` | `#46443d` | borders and dividers |
| `accent` / `accent-ink` | `#d9a441` / `#2e2516` | same | `=` key |
| `danger` / `danger-soft` | `#a23b33` / `#f4e7e3` | `#e47d72` / `#3d2926` | errors |
| `code` | `#e9e5dd` | `#1e1e1b` | JSON blocks in request details |

Contrast (WCAG, AA needs 4.5:1 for text): `muted` on `paper` 4.77 light / 5.77 dark; `muted` on `panel` 5.17 /
5.21; `danger` on `danger-soft` 5.42 / 4.84; `accent-ink` on `accent` 6.71. Focus ring (non-text, AA needs 3:1): `ink` on `paper`, `panel` and `tape` 12.98–14.43 light, 12.6–14.73
dark; it was `accent` until the phase 3 review measured 1.91–2.12 in light mode. The draft's light `muted` (`#87837a`,
3.20) and `danger` (`#b24b42`, 4.37) failed and were darkened.

**Changed or rejected**
- `%` appeared twice (advanced row and keypad); it stays only in the advanced row, which is rendered from
  `GET /api/v1/operations`.
- The draft does math in the browser (`Math.sqrt`, `/ 100`); all math goes through the backend API.
- One 130-line component becomes `Display`, `Keypad`, `AdvancedOperations`, `ErrorBanner`, `Tape` and
  `ApiInspector`, with state in a tested reducer.
- `aria-live` wrapped the whole display; it will announce only the result and errors.
- Not brought over: Next.js, shadcn/ui, `lucide-react`, Vercel Analytics, `tw-animate-css` (unused or not needed).
- Eyebrow labels, "Desk instrument / 01", "CALCULATOR · READY", "Running record", "End of tape", monospace
  labels, near-square hairline panels with shadows, strikethrough error lines (see the visual direction above).

## Components
| Component | Responsibility |
|---|---|
| `Display` | Current input, pending expression, last result |
| `Keypad` | Digits, decimal point, basic operators, equals, clear, backspace |
| `AdvancedOperations` | Buttons rendered from `GET /api/v1/operations` (power, sqrt, percentage) |
| `Tape` | "History": results and errors, click a result to reuse it |
| `ErrorBanner` | Friendly message per backend error code, plus "backend unreachable" |
| `ApiInspector` | "Request details": last request/response, status and latency |

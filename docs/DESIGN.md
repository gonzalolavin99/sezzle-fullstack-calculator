# UI Design — "Paper Tape" calculator

## Concept
A calculator inspired by the paper-tape adding machines used in accounting: every calculation prints a line on
a running tape, like a receipt. It fits the payments domain, is easy to read, and is different from the usual
iPhone-style clone — without being a gimmick.

Two pieces of personality, both small and useful:

1. **The tape (history):** each result appears as a printed line (`12 ÷ 4 = 3`) with a timestamp. Errors print in
   red as a voided line (`5 ÷ 0 — division by zero`). Lines can be clicked to reuse the result. Clear tape button.
2. **The API inspector:** a collapsible panel ("Inspect request") showing the last request and response JSON,
   status code and latency. It shows reviewers the full-stack flow and helps debugging. Off by default.

## Rules
- **No Sezzle branding:** no logo, name or brand colors. It is my project, not a copy of theirs.
- **Typography:** a clean sans-serif for the UI and a monospaced font with tabular figures for numbers and the tape.
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

**Adopted**
- Layout: header, calculator and inspector on the left, tape on the right; stacked on mobile.
- Square, thin-bordered keys; accent only on `=`; error banner with a left rule and a dismiss button.
- Tape lines with timestamps, voided error lines (red, struck through), "End of tape" footer.
- Design tokens below, light and dark, moved into the Tailwind theme instead of `bg-[var(--x)]` classes.
- From the Lovable draft (ideas only): a visible "calculating…" state, and tape lines for advanced operations.

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#eeece7` | `#1b1b19` | page background |
| `panel` | `#f7f5f0` | `#242421` | calculator and inspector |
| `tape` / `tape-hover` | `#faf8f2` / `#f1eee6` | `#292824` / `#33312b` | tape background and hover |
| `key` / `operator` | `#f4f1eb` / `#e8e4dc` | `#2b2a26` / `#36342e` | digit and operator keys |
| `ink` / `muted` | `#262522` / `#87837a` | `#efede6` / `#99958b` | text |
| `rule` | `#d8d3c9` | `#46443d` | borders and dividers |
| `accent` / `accent-ink` | `#d9a441` / `#2e2516` | same | `=` key and focus ring |
| `danger` / `danger-soft` | `#b24b42` / `#f4e7e3` | `#e47d72` / `#3d2926` | errors |
| `code` | `#e9e5dd` | `#1e1e1b` | JSON blocks in the inspector |

**Changed or rejected**
- `%` appeared twice (advanced row and keypad); it stays only in the advanced row, which is rendered from
  `GET /api/v1/operations`.
- The draft does math in the browser (`Math.sqrt`, `/ 100`); all math goes through the backend API.
- One 130-line component becomes `Display`, `Keypad`, `AdvancedOperations`, `ErrorBanner`, `Tape` and
  `ApiInspector`, with state in a tested reducer.
- `aria-live` wrapped the whole display; it will announce only the result and errors.
- Not brought over: Next.js, shadcn/ui, `lucide-react`, Vercel Analytics, `tw-animate-css` (unused or not needed).
- Contrast of `muted` on `paper` (light) must be checked for AA in F5/F6.

## Components
| Component | Responsibility |
|---|---|
| `Display` | Current input, pending expression, last result |
| `Keypad` | Digits, decimal point, basic operators, equals, clear, backspace |
| `AdvancedOperations` | Buttons rendered from `GET /api/v1/operations` (power, sqrt, percentage) |
| `Tape` | History of results and errors, click to reuse |
| `ErrorBanner` | Friendly message per backend error code, plus "backend unreachable" |
| `ApiInspector` | Last request/response, status and latency |

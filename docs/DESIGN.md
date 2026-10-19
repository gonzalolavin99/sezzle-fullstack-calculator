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

## Components
| Component | Responsibility |
|---|---|
| `Display` | Current input, pending expression, last result |
| `Keypad` | Digits, decimal point, basic operators, equals, clear, backspace |
| `AdvancedOperations` | Buttons rendered from `GET /api/v1/operations` (power, sqrt, percentage) |
| `Tape` | History of results and errors, click to reuse |
| `ErrorBanner` | Friendly message per backend error code, plus "backend unreachable" |
| `ApiInspector` | Last request/response, status and latency |

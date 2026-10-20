# ADR 0004 — float64 arithmetic with explicit non-finite guards

- Status: Accepted
- Date: 2026-10-19

## Context
A calculator must handle decimals, very large values and undefined results. Floating-point numbers cannot
represent every decimal exactly (for example `0.1 + 0.2`).

## Decision
- Use `float64` end to end, which also matches JSON numbers.
- Reject `NaN` and infinite inputs, and reject any operation whose result is not finite (`RESULT_OUT_OF_RANGE`).
  Every operation returns through one shared guard (`checkResult`): an infinite result is `RESULT_OUT_OF_RANGE`,
  a `NaN` result means the math is undefined (`INVALID_OPERAND`, 422; not reachable with finite inputs today),
  and `-0` becomes `0` so the API never returns `-0`.
- The API returns the raw `float64` result; the frontend formats it for display (limited significant digits).
- Document the precision trade-off in the README.

## Consequences
- Simple, fast and idiomatic; covers power and square root naturally.
- Not suitable for money. In a payments system, amounts would be stored as integer minor units (cents) or a
  decimal type, with explicit rounding rules. This is stated in the README as a conscious trade-off.
- Alternative considered: a decimal library for all operations. More exact for basic operations, but awkward for
  square root and fractional powers, and an extra dependency for little gain in this scope.

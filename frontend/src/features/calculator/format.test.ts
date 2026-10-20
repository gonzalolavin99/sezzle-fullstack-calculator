import { describe, expect, it } from 'vitest'
import { formatExpression, formatNumber, operationSymbol } from './format.ts'

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [2.5, '2.5'],
    [-12, '-12'],
    [1024, '1,024'],
    [1234567.891, '1,234,567.891'],
    // float64 noise from the API is hidden for display only (ADR 0004)
    [0.30000000000000004, '0.3'],
    [1 / 3, '0.333333333333'],
    // very large or very small values switch to scientific notation
    [1e21, '1e+21'],
    [-2.5e15, '-2.5e+15'],
    [1.23456789e-7, '1.234568e-7'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected)
  })
})

describe('formatExpression', () => {
  it.each([
    ['add', [12, 4], '12 + 4'],
    ['subtract', [12, 4], '12 − 4'],
    ['multiply', [12, 4], '12 × 4'],
    ['divide', [12, 4], '12 ÷ 4'],
    ['power', [2, 10], '2 ^ 10'],
    ['percentage', [15, 200], '15% of 200'],
    ['sqrt', [144], '√144'],
    ['modulo', [7, 2], 'modulo(7, 2)'], // an operation the UI has no symbol for yet
  ])('%s %j reads as %s', (operation, operands, expected) => {
    expect(formatExpression(operation as string, operands as number[])).toBe(expected)
  })
})

describe('operationSymbol', () => {
  it.each([
    ['divide', '÷'],
    ['power', '^'],
    ['percentage', '% of'],
    ['modulo', 'modulo'],
  ])('shows %s as %s while waiting for the second number', (operation, expected) => {
    expect(operationSymbol(operation)).toBe(expected)
  })
})

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

/** Base URL used by tests: fetch in Node needs an absolute URL. */
export const TEST_API = 'http://api.test'

export const testOperations = [
  { name: 'add', arity: 2 },
  { name: 'divide', arity: 2 },
  { name: 'multiply', arity: 2 },
  { name: 'percentage', arity: 2 },
  { name: 'power', arity: 2 },
  { name: 'sqrt', arity: 1 },
  { name: 'subtract', arity: 2 },
]

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status })
}

/**
 * A small fake of the Go backend for component tests: same routes, same response shapes,
 * real math for the cases the tests use. Contract details are covered by the backend's own tests.
 */
export const defaultHandlers = [
  http.get(`${TEST_API}/api/v1/operations`, () =>
    HttpResponse.json({ operations: testOperations }),
  ),
  http.post(`${TEST_API}/api/v1/calculate`, async ({ request }) => {
    const { operation, operands } = (await request.json()) as {
      operation: string
      operands: number[]
    }
    const [a = 0, b = 0] = operands
    const results: Record<string, () => number> = {
      add: () => a + b,
      subtract: () => a - b,
      multiply: () => a * b,
      divide: () => a / b,
      power: () => a ** b,
      sqrt: () => Math.sqrt(a),
      percentage: () => (a * b) / 100,
    }
    if (operation === 'divide' && b === 0) {
      return error(422, 'DIVISION_BY_ZERO', 'divide: cannot divide by zero')
    }
    if (operation === 'sqrt' && a < 0) {
      return error(422, 'INVALID_OPERAND', 'sqrt: operation is undefined for these operands')
    }
    const run = results[operation]
    if (!run) return error(400, 'UNKNOWN_OPERATION', `unknown operation: "${operation}"`)
    return HttpResponse.json(
      { operation, operands, result: run() },
      { headers: { 'X-Request-ID': 'test-request' } },
    )
  }),
]

export const server = setupServer(...defaultHandlers)

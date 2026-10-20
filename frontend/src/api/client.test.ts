import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createApiClient, type Exchange } from './client.ts'
import { ApiError } from './errors.ts'
import type { ApiErrorCode } from './types.ts'

// Tests run in Node, where fetch needs an absolute URL; in the browser the base URL is empty.
const BASE = 'http://api.test'
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function errorBody(code: string, message: string) {
  return { error: { code, message } }
}

/** Runs fn and returns the ApiError it throws, so tests can assert on its fields. */
async function captureApiError(fn: () => Promise<unknown>): Promise<ApiError> {
  try {
    await fn()
  } catch (err) {
    if (err instanceof ApiError) return err
    throw err
  }
  throw new Error('expected an ApiError, but the call succeeded')
}

describe('calculate', () => {
  it('posts the operation and returns the result', async () => {
    let received: unknown
    server.use(
      http.post(`${BASE}/api/v1/calculate`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ operation: 'divide', operands: [10, 4], result: 2.5 })
      }),
    )

    const result = await createApiClient({ baseUrl: BASE }).calculate('divide', [10, 4])

    expect(received).toEqual({ operation: 'divide', operands: [10, 4] })
    expect(result).toEqual({ operation: 'divide', operands: [10, 4], result: 2.5 })
  })

  const serverErrors: [ApiErrorCode, number, string][] = [
    ['INVALID_REQUEST', 400, 'request body must be valid JSON'],
    ['UNKNOWN_OPERATION', 400, 'unknown operation: "modulo"'],
    ['INVALID_ARITY', 400, 'add: wrong number of operands: expects 2, got 1'],
    ['INVALID_OPERAND', 422, 'sqrt: operation is undefined for these operands'],
    ['DIVISION_BY_ZERO', 422, 'divide: cannot divide by zero'],
    ['RESULT_OUT_OF_RANGE', 422, 'power: result is out of range'],
    ['INTERNAL_ERROR', 500, 'unexpected error'],
  ]

  it.each(serverErrors)('turns %s (%i) into an ApiError', async (code, status, message) => {
    server.use(
      http.post(`${BASE}/api/v1/calculate`, () =>
        HttpResponse.json(errorBody(code, message), {
          status,
          headers: { 'X-Request-ID': 'req-7' },
        }),
      ),
    )

    const err = await captureApiError(() =>
      createApiClient({ baseUrl: BASE }).calculate('divide', [1, 0]),
    )

    expect(err.code).toBe(code)
    expect(err.status).toBe(status)
    expect(err.detail).toBe(message)
    expect(err.requestId).toBe('req-7')
    expect(err.message).not.toBe('') // friendly text from messages.ts
  })

  it('treats an unknown error code as an unexpected response', async () => {
    server.use(
      http.post(`${BASE}/api/v1/calculate`, () =>
        HttpResponse.json(errorBody('TEAPOT', 'short and stout'), { status: 418 }),
      ),
    )

    const err = await captureApiError(() =>
      createApiClient({ baseUrl: BASE }).calculate('add', [1, 2]),
    )
    expect(err.code).toBe('UNEXPECTED_RESPONSE')
    expect(err.status).toBe(418)
  })

  it('treats a non-JSON error page (for example from a proxy) as an unexpected response', async () => {
    server.use(
      http.post(
        `${BASE}/api/v1/calculate`,
        () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 }),
      ),
    )

    const err = await captureApiError(() =>
      createApiClient({ baseUrl: BASE }).calculate('add', [1, 2]),
    )
    expect(err.code).toBe('UNEXPECTED_RESPONSE')
    expect(err.status).toBe(502)
  })

  it('rejects a success response with the wrong shape', async () => {
    server.use(http.post(`${BASE}/api/v1/calculate`, () => HttpResponse.json({ result: 'three' })))

    const err = await captureApiError(() =>
      createApiClient({ baseUrl: BASE }).calculate('add', [1, 2]),
    )
    expect(err.code).toBe('UNEXPECTED_RESPONSE')
  })

  it('reports a network failure as NETWORK_ERROR', async () => {
    server.use(http.post(`${BASE}/api/v1/calculate`, () => HttpResponse.error()))

    const err = await captureApiError(() =>
      createApiClient({ baseUrl: BASE }).calculate('add', [1, 2]),
    )
    expect(err.code).toBe('NETWORK_ERROR')
    expect(err.status).toBeUndefined()
  })

  it('gives up after the timeout', async () => {
    server.use(
      http.post(`${BASE}/api/v1/calculate`, async () => {
        await delay(500)
        return HttpResponse.json({ operation: 'add', operands: [1, 2], result: 3 })
      }),
    )

    const err = await captureApiError(() =>
      createApiClient({ baseUrl: BASE, timeoutMs: 20 }).calculate('add', [1, 2]),
    )
    expect(err.code).toBe('TIMEOUT')
  })
})

describe('listOperations', () => {
  it('returns the operations from the API', async () => {
    const operations = [
      { name: 'add', arity: 2 },
      { name: 'sqrt', arity: 1 },
    ]
    server.use(http.get(`${BASE}/api/v1/operations`, () => HttpResponse.json({ operations })))

    await expect(createApiClient({ baseUrl: BASE }).listOperations()).resolves.toEqual(operations)
  })

  it('rejects a list with the wrong shape', async () => {
    server.use(
      http.get(`${BASE}/api/v1/operations`, () =>
        HttpResponse.json({ operations: [{ name: 'add' }] }),
      ),
    )

    const err = await captureApiError(() => createApiClient({ baseUrl: BASE }).listOperations())
    expect(err.code).toBe('UNEXPECTED_RESPONSE')
  })
})

describe('onExchange', () => {
  it('reports each request and response for the request details panel', async () => {
    server.use(
      http.post(`${BASE}/api/v1/calculate`, () =>
        HttpResponse.json(errorBody('DIVISION_BY_ZERO', 'divide: cannot divide by zero'), {
          status: 422,
          headers: { 'X-Request-ID': 'req-9' },
        }),
      ),
    )
    const exchanges: Exchange[] = []

    await captureApiError(() =>
      createApiClient({ baseUrl: BASE, onExchange: (e) => exchanges.push(e) }).calculate(
        'divide',
        [5, 0],
      ),
    )

    expect(exchanges).toHaveLength(1)
    expect(exchanges[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/calculate',
      requestBody: { operation: 'divide', operands: [5, 0] },
      status: 422,
      responseBody: errorBody('DIVISION_BY_ZERO', 'divide: cannot divide by zero'),
      requestId: 'req-9',
    })
    expect(exchanges[0]?.durationMs).toBeGreaterThanOrEqual(0)
  })
})

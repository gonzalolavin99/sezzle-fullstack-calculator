import { ApiError } from './errors.ts'
import {
  SERVER_ERROR_CODES,
  type CalculateResponse,
  type OperationInfo,
  type ServerErrorCode,
} from './types.ts'

/** One request/response pair, reported for the "Request details" panel. */
export interface Exchange {
  method: 'GET' | 'POST'
  path: string
  requestBody?: unknown
  status?: number
  responseBody?: unknown
  durationMs: number
  requestId?: string
}

export interface ApiClientOptions {
  /** Prefix for every path. Empty in the browser: requests go to the same origin. */
  baseUrl?: string
  timeoutMs?: number
  onExchange?: (exchange: Exchange) => void
}

export interface ApiClient {
  calculate(operation: string, operands: number[]): Promise<CalculateResponse>
  listOperations(): Promise<OperationInfo[]>
}

const DEFAULT_TIMEOUT_MS = 5000

export function createApiClient({
  baseUrl = '',
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onExchange,
}: ApiClientOptions = {}): ApiClient {
  async function request<T>(
    method: Exchange['method'],
    path: string,
    requestBody: unknown,
    isValid: (body: unknown) => body is T,
  ): Promise<T> {
    const exchange: Exchange = { method, path, requestBody, durationMs: 0 }
    const started = performance.now()
    const signal = AbortSignal.timeout(timeoutMs)
    try {
      let response: Response
      try {
        response = await fetch(baseUrl + path, {
          method,
          headers: requestBody === undefined ? undefined : { 'Content-Type': 'application/json' },
          body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
          signal,
        })
      } catch (err) {
        // Ask the signal instead of checking `err instanceof DOMException`: the error's class
        // can come from another realm (jsdom vs Node), where instanceof is false.
        throw new ApiError(signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR', { cause: err })
      }

      exchange.status = response.status
      exchange.requestId = response.headers.get('X-Request-ID') ?? undefined
      const body = await readJson(response)
      exchange.responseBody = body

      const meta = { status: response.status, requestId: exchange.requestId }
      if (!response.ok) {
        if (isErrorBody(body)) {
          throw new ApiError(body.error.code, { ...meta, detail: body.error.message })
        }
        throw new ApiError('UNEXPECTED_RESPONSE', meta)
      }
      if (!isValid(body)) {
        throw new ApiError('UNEXPECTED_RESPONSE', meta)
      }
      return body
    } finally {
      exchange.durationMs = Math.round(performance.now() - started)
      onExchange?.(exchange)
    }
  }

  return {
    calculate(operation, operands) {
      return request('POST', '/api/v1/calculate', { operation, operands }, isCalculateResponse)
    },
    async listOperations() {
      const body = await request('GET', '/api/v1/operations', undefined, isOperationsResponse)
      return body.operations
    },
  }
}

/** Returns the parsed JSON body, or undefined if the body is not JSON (for example a proxy error page). */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

// Runtime checks: TypeScript types disappear at runtime, so data from the network is
// checked before the rest of the app trusts it.

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isErrorBody(body: unknown): body is { error: { code: ServerErrorCode; message: string } } {
  if (!isObject(body) || !isObject(body.error)) return false
  const { code, message } = body.error
  return typeof message === 'string' && (SERVER_ERROR_CODES as readonly unknown[]).includes(code)
}

function isCalculateResponse(body: unknown): body is CalculateResponse {
  return (
    isObject(body) &&
    typeof body.operation === 'string' &&
    Array.isArray(body.operands) &&
    body.operands.every((n) => typeof n === 'number') &&
    typeof body.result === 'number'
  )
}

function isOperationsResponse(body: unknown): body is { operations: OperationInfo[] } {
  return (
    isObject(body) &&
    Array.isArray(body.operations) &&
    body.operations.every(
      (op) => isObject(op) && typeof op.name === 'string' && typeof op.arity === 'number',
    )
  )
}

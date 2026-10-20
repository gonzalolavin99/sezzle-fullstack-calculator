import { friendlyMessages } from './messages.ts'
import type { ApiErrorCode } from './types.ts'

/**
 * The single error type the API client throws. `message` is the friendly text for the user;
 * `detail` keeps the backend's own message for the request details panel and debugging.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number | undefined
  readonly detail: string | undefined
  readonly requestId: string | undefined

  constructor(
    code: ApiErrorCode,
    options: { status?: number; detail?: string; requestId?: string; cause?: unknown } = {},
  ) {
    super(friendlyMessages[code], { cause: options.cause })
    this.name = 'ApiError'
    this.code = code
    this.status = options.status
    this.detail = options.detail
    this.requestId = options.requestId
  }
}

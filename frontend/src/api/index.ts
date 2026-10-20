export { createApiClient, type ApiClient, type Exchange, type RequestOptions } from './client.ts'
export { ApiError } from './errors.ts'
export { friendlyMessages } from './messages.ts'
export type { ApiErrorCode, CalculateResponse, OperationInfo } from './types.ts'

/** Base URL for the app's API client: empty means the same origin (Vite proxy or nginx). */
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

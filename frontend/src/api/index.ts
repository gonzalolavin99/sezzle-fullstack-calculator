import { createApiClient } from './client.ts'

export { createApiClient, type ApiClient, type Exchange } from './client.ts'
export { ApiError } from './errors.ts'
export type { ApiErrorCode, CalculateResponse, OperationInfo } from './types.ts'

/** Base URL for the app's API client: empty means the same origin (Vite proxy or nginx). */
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

// Keeps the default import path short for components that do not need custom options.
export const defaultApiClient = createApiClient({ baseUrl: apiBaseUrl })

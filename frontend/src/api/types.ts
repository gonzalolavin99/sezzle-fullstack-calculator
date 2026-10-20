// Types for the backend API, matching backend/api/openapi.yaml.

export interface CalculateResponse {
  operation: string
  operands: number[]
  result: number
}

export interface OperationInfo {
  name: string
  arity: number
}

/** Error codes the backend can return (see the error table in the OpenAPI spec). */
export const SERVER_ERROR_CODES = [
  'INVALID_REQUEST',
  'UNKNOWN_OPERATION',
  'INVALID_ARITY',
  'INVALID_OPERAND',
  'DIVISION_BY_ZERO',
  'RESULT_OUT_OF_RANGE',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'INTERNAL_ERROR',
] as const

export type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number]

/** Errors detected by the client itself, when there is no usable answer from the backend. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'UNEXPECTED_RESPONSE'

export type ApiErrorCode = ServerErrorCode | ClientErrorCode

import type { ApiErrorCode } from './types.ts'

// What the user reads for each error. A Record over every code makes the compiler
// fail if a new code is added without a message.
export const friendlyMessages: Record<ApiErrorCode, string> = {
  INVALID_REQUEST: "The calculator couldn't read that request. Check the numbers and try again.",
  UNKNOWN_OPERATION: "That operation isn't supported.",
  INVALID_ARITY: 'That operation needs a different number of values.',
  INVALID_OPERAND: "That operation isn't defined for this value.",
  DIVISION_BY_ZERO: "Can't divide by zero.",
  RESULT_OUT_OF_RANGE: 'The result is too large to show.',
  NOT_FOUND: 'Something went wrong on our side. Try again.',
  METHOD_NOT_ALLOWED: 'Something went wrong on our side. Try again.',
  INTERNAL_ERROR: 'Something went wrong on our side. Try again.',
  UNEXPECTED_RESPONSE: 'The calculator service sent an answer we could not read. Try again.',
  NETWORK_ERROR: "Can't reach the calculator service. Check that the backend is running.",
  TIMEOUT: 'The calculator service took too long to answer. Try again.',
}

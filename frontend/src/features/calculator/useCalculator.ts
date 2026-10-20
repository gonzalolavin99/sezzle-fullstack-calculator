import { useEffect, useReducer } from 'react'
import { ApiError, friendlyMessages, type ApiClient } from '../../api/index.ts'
import { calculatorReducer, initialState } from './reducer.ts'

/**
 * Connects the pure reducer to the backend: whenever the reducer asks for a calculation
 * (state.pending), this hook sends it and dispatches the answer.
 */
export function useCalculator(
  client: ApiClient,
  now: () => string = () => new Date().toISOString(),
) {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  const { pending } = state

  useEffect(() => {
    if (!pending) return
    // Cancelled on cleanup: React StrictMode runs effects twice in development, and the user may
    // press Clear. The reducer also ignores late answers by request ID.
    const controller = new AbortController()

    client
      .calculate(pending.operation, pending.operands, { signal: controller.signal })
      .then((response) => {
        dispatch({ type: 'resolved', id: pending.id, value: response.result, at: now() })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message = err instanceof ApiError ? err.message : friendlyMessages.UNEXPECTED_RESPONSE
        dispatch({ type: 'failed', id: pending.id, message, at: now() })
      })

    return () => controller.abort()
  }, [client, pending, now])

  return [state, dispatch] as const
}

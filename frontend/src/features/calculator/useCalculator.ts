import { useEffect, useReducer } from 'react'
import { ApiError, friendlyMessages, type ApiClient } from '../../api/index.ts'
import { calculatorReducer, initialState } from './reducer.ts'

// Module level, so the default is the same function on every render. A default written inline
// would be new each render, re-run the effect below, and abort and resend the request (review finding).
const isoNow = () => new Date().toISOString()

/**
 * Connects the pure reducer to the backend: whenever the reducer asks for a calculation
 * (state.pending), this hook sends it and dispatches the answer.
 */
export function useCalculator(client: ApiClient, now: () => string = isoNow) {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  const { pending } = state

  useEffect(() => {
    if (!pending) return
    // Cancelled on cleanup, when the user presses Clear or the component unmounts. The reducer also
    // ignores late answers by request ID.
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

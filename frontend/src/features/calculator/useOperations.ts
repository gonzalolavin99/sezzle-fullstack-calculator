import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, OperationInfo } from '../../api/index.ts'

export type OperationsStatus = 'loading' | 'retrying' | 'ready' | 'error'

export interface RetryOptions {
  /** Pause between failed attempts. */
  delayMs: number
  /** Attempts before giving up and offering a manual retry. */
  maxAttempts: number
}

// A sleeping backend (the live demo's free tier) takes about 50 s to wake up. With the client's
// 5 s timeout, 20 attempts 3 s apart keep trying for well over a minute.
export const DEFAULT_RETRY: RetryOptions = { delayMs: 3000, maxAttempts: 20 }

/**
 * Loads the operations the backend supports, so new operations appear without UI changes.
 * Retries on failure, so a backend that is still starting up does not hide the advanced keys.
 */
export function useOperations(client: ApiClient, retry: RetryOptions = DEFAULT_RETRY) {
  const [result, setResult] = useState<{ status: OperationsStatus; operations: OperationInfo[] }>({
    status: 'loading',
    operations: [],
  })
  // Each attempt has a number; a manual retry starts a new round of automatic attempts.
  const [attempt, setAttempt] = useState(1)
  const roundStart = useRef(1)
  const { delayMs, maxAttempts } = retry

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    client
      .listOperations({ signal: controller.signal })
      .then((operations) => setResult({ status: 'ready', operations }))
      .catch(() => {
        if (controller.signal.aborted) return
        if (attempt - roundStart.current + 1 < maxAttempts) {
          setResult({ status: 'retrying', operations: [] })
          timer = setTimeout(() => setAttempt((n) => n + 1), delayMs)
        } else {
          setResult({ status: 'error', operations: [] })
        }
      })
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [client, attempt, delayMs, maxAttempts])

  const retryNow = useCallback(() => {
    setResult({ status: 'loading', operations: [] })
    setAttempt((n) => {
      roundStart.current = n + 1
      return n + 1
    })
  }, [])

  return { ...result, retry: retryNow }
}

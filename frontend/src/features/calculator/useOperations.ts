import { useEffect, useState } from 'react'
import type { ApiClient, OperationInfo } from '../../api/index.ts'

export type OperationsStatus = 'loading' | 'ready' | 'error'

/** Loads the operations the backend supports, so new operations appear without UI changes. */
export function useOperations(client: ApiClient) {
  const [result, setResult] = useState<{ status: OperationsStatus; operations: OperationInfo[] }>({
    status: 'loading',
    operations: [],
  })

  useEffect(() => {
    const controller = new AbortController()
    client
      .listOperations({ signal: controller.signal })
      .then((operations) => setResult({ status: 'ready', operations }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ status: 'error', operations: [] })
      })
    return () => controller.abort()
  }, [client])

  return result
}

import type { Exchange } from '../../api/index.ts'

/** "Request details": the last call to the backend, for reviewers and debugging. Collapsed by default. */
export function ApiInspector({ exchange }: { exchange: Exchange | null }) {
  return (
    <details className="rounded-xl bg-panel px-4 py-3 text-sm">
      <summary
        onMouseDown={(event) => event.preventDefault()}
        className="cursor-pointer text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
      >
        Request details
      </summary>

      {exchange === null ? (
        <p className="mt-3 text-muted">No requests yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted">Request</dt>
            <dd className="font-mono">{`${exchange.method} ${exchange.path}`}</dd>
            <dt className="text-muted">Status</dt>
            <dd className="font-mono">{exchange.status ?? 'no response'}</dd>
            <dt className="text-muted">Time</dt>
            <dd className="font-mono">{`${exchange.durationMs} ms`}</dd>
            {exchange.requestId && (
              <>
                <dt className="text-muted">Request ID</dt>
                <dd className="truncate font-mono">{exchange.requestId}</dd>
              </>
            )}
          </dl>
          <div className="grid gap-2 sm:grid-cols-2">
            <JsonBlock label="Sent" testId="request-body" value={exchange.requestBody} />
            <JsonBlock label="Received" testId="response-body" value={exchange.responseBody} />
          </div>
        </div>
      )}
    </details>
  )
}

function JsonBlock({ label, testId, value }: { label: string; testId: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-muted">{label}</p>
      <pre
        data-testid={testId}
        className="overflow-x-auto rounded-lg bg-code p-3 font-mono text-xs"
      >
        {value === undefined ? '—' : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

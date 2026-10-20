import { useState } from 'react'
import { apiBaseUrl, createApiClient, type Exchange } from '../../api/index.ts'
import { AdvancedOperations } from './AdvancedOperations.tsx'
import { ApiInspector } from './ApiInspector.tsx'
import { Display } from './Display.tsx'
import { ErrorBanner } from './ErrorBanner.tsx'
import { formatExpression, formatNumber } from './format.ts'
import { Keypad } from './Keypad.tsx'
import type { HistoryEntry } from './reducer.ts'
import { Tape } from './Tape.tsx'
import { useCalculator } from './useCalculator.ts'
import { useKeyboard } from './useKeyboard.ts'
import { useOperations } from './useOperations.ts'

interface CalculatorProps {
  /** Backend origin; empty means the same origin. Tests pass an absolute URL. */
  baseUrl?: string
}

export function Calculator({ baseUrl = apiBaseUrl }: CalculatorProps) {
  const [exchange, setExchange] = useState<Exchange | null>(null)
  // Created once; setExchange is stable, so the client never needs to change.
  const [client] = useState(() => createApiClient({ baseUrl, onExchange: setExchange }))
  const [state, dispatch] = useCalculator(client)
  const operations = useOperations(client)
  useKeyboard(dispatch)
  const busy = state.pending !== null

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="min-w-0 space-y-3">
        <section
          aria-label="Calculator"
          aria-busy={busy}
          className="space-y-3 rounded-xl bg-panel p-4 sm:p-5"
        >
          <Display state={state} />
          {/* Screen readers hear each result once; errors are announced by the banner (role="alert"). */}
          <p role="status" className="sr-only">
            {announcement(state.history[0])}
          </p>
          {state.error && (
            <ErrorBanner
              message={state.error}
              onDismiss={() => dispatch({ type: 'dismissError' })}
            />
          )}
          <AdvancedOperations
            status={operations.status}
            operations={operations.operations}
            disabled={busy}
            onSelect={(op) =>
              dispatch({ type: op.arity === 1 ? 'unary' : 'binary', operation: op.name })
            }
          />
          <Keypad dispatch={dispatch} disabled={busy} />
        </section>
        <ApiInspector exchange={exchange} />
      </div>

      <Tape
        entries={state.history}
        onUse={(value) => dispatch({ type: 'useValue', value })}
        onClear={() => dispatch({ type: 'clearHistory' })}
      />
    </div>
  )
}

function announcement(latest: HistoryEntry | undefined): string {
  if (latest?.result === undefined) return ''
  return `${formatExpression(latest.operation, latest.operands)} = ${formatNumber(latest.result)}`
}

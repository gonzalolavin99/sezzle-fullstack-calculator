import { formatExpression, formatNumber, operationSymbol } from './format.ts'
import type { State } from './reducer.ts'

export function Display({ state }: { state: State }) {
  const { pending, stored, operation, input, overwrite } = state

  let expression = ' ' // keeps the line height when empty
  if (pending) expression = formatExpression(pending.operation, pending.operands)
  else if (stored !== null && operation)
    expression = `${formatNumber(stored)} ${operationSymbol(operation)}`

  // While typing, show exactly what was typed ("12.50"); after an operator or a result, format it.
  const value = pending ? 'Calculating…' : overwrite ? formatNumber(Number(input)) : input

  return (
    <div className="px-1 pb-3 text-right">
      <p data-testid="display-expression" className="h-6 font-mono text-sm tabular-nums text-muted">
        {expression}
      </p>
      <p
        data-testid="display-value"
        aria-live="polite"
        className={`mt-1 truncate font-mono tabular-nums ${
          pending ? 'text-2xl leading-[3rem] text-muted' : 'text-5xl leading-tight'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

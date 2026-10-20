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
      <p
        data-testid="display-expression"
        className="h-6 truncate font-mono text-sm tabular-nums text-muted"
      >
        {expression}
      </p>
      <p
        data-testid="display-value"
        className={`mt-1 h-12 font-mono leading-[3rem] tabular-nums ${
          pending ? 'text-2xl text-muted' : valueSize(value)
        }`}
      >
        {value}
      </p>
    </div>
  )
}

// A calculator must never hide digits, so long numbers get a smaller font instead of being cut off.
// Limits are measured on the narrowest supported screen (360px). The longest value is a formatted
// result such as "-0.00000142857142857143" (23 characters), which fits at text-xl.
function valueSize(value: string): string {
  if (value.length <= 9) return 'text-5xl'
  if (value.length <= 13) return 'text-4xl'
  if (value.length <= 17) return 'text-2xl'
  return 'text-xl'
}

import type { OperationInfo } from '../../api/index.ts'
import { Key } from '../../components/Key.tsx'
import { advancedLabel, BASIC_OPERATIONS } from './labels.ts'
import type { OperationsStatus } from './useOperations.ts'

interface AdvancedOperationsProps {
  status: OperationsStatus
  operations: OperationInfo[]
  onSelect: (operation: OperationInfo) => void
  onRetry: () => void
  disabled: boolean
}

/** Keys for every operation the API offers beyond the basic four, rendered from GET /api/v1/operations. */
export function AdvancedOperations({
  status,
  operations,
  onSelect,
  onRetry,
  disabled,
}: AdvancedOperationsProps) {
  if (status === 'loading') {
    return <p className="h-10 text-sm leading-10 text-muted">Loading operations…</p>
  }
  if (status === 'retrying') {
    return (
      <p className="h-10 text-sm leading-10 text-muted">
        Waking up the server… the other keys appear in a moment.
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p className="flex h-10 items-center gap-2 text-sm text-muted">
        Couldn't load more operations. The basic keys still work.
        <button
          type="button"
          onClick={onRetry}
          className="rounded px-2 py-1 font-medium text-ink underline hover:no-underline focus-visible:outline-2 focus-visible:outline-ink"
        >
          Retry
        </button>
      </p>
    )
  }

  // The keypad sends one operand (√) or two (xʸ); an operation with another arity cannot be entered.
  const advanced = operations.filter(
    (op) => !BASIC_OPERATIONS.has(op.name) && (op.arity === 1 || op.arity === 2),
  )
  return (
    <div role="group" aria-label="More operations" className="grid grid-cols-3 gap-2">
      {advanced.map((op) => {
        const label = advancedLabel(op.name)
        return (
          <Key
            key={op.name}
            variant="advanced"
            aria-label={label.name}
            aria-disabled={disabled}
            onClick={() => onSelect(op)}
          >
            {label.text}
          </Key>
        )
      })}
    </div>
  )
}

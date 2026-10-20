import type { OperationInfo } from '../../api/index.ts'
import { Key } from '../../components/Key.tsx'
import { advancedLabel, BASIC_OPERATIONS } from './labels.ts'
import type { OperationsStatus } from './useOperations.ts'

interface AdvancedOperationsProps {
  status: OperationsStatus
  operations: OperationInfo[]
  onSelect: (operation: OperationInfo) => void
  disabled: boolean
}

/** Keys for every operation the API offers beyond the basic four, rendered from GET /api/v1/operations. */
export function AdvancedOperations({
  status,
  operations,
  onSelect,
  disabled,
}: AdvancedOperationsProps) {
  if (status === 'loading') {
    return <p className="h-10 text-sm leading-10 text-muted">Loading operations…</p>
  }
  if (status === 'error') {
    return (
      <p className="h-10 text-sm leading-10 text-muted">
        Couldn't load more operations. The basic keys still work.
      </p>
    )
  }

  const advanced = operations.filter((op) => !BASIC_OPERATIONS.has(op.name))
  return (
    <div className="grid grid-cols-3 gap-2">
      {advanced.map((op) => {
        const label = advancedLabel(op.name)
        return (
          <Key
            key={op.name}
            variant="advanced"
            aria-label={label.name}
            disabled={disabled}
            onClick={() => onSelect(op)}
          >
            {label.text}
          </Key>
        )
      })}
    </div>
  )
}

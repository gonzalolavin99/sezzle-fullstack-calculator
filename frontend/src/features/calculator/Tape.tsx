import { formatExpression, formatNumber } from './format.ts'
import type { HistoryEntry } from './reducer.ts'

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

interface TapeProps {
  entries: HistoryEntry[]
  onUse: (value: number) => void
  onClear: () => void
}

/** The "History" panel: every calculation, newest first. A result can be reused. */
export function Tape({ entries, onUse, onClear }: TapeProps) {
  return (
    <section aria-labelledby="history-heading" className="rounded-xl bg-tape p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="history-heading" className="text-lg font-semibold">
          History
        </h2>
        {entries.length > 0 && (
          <button
            type="button"
            aria-label="Clear history"
            onClick={onClear}
            className="rounded px-2 py-1 text-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Results appear here.</p>
      ) : (
        <ol className="divide-y divide-rule">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-baseline justify-between gap-3 py-2">
              <Line entry={entry} onUse={onUse} />
              <time dateTime={entry.at} className="shrink-0 text-xs text-muted">
                {timeFormat.format(new Date(entry.at))}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function Line({ entry, onUse }: { entry: HistoryEntry; onUse: (value: number) => void }) {
  const expression = formatExpression(entry.operation, entry.operands)
  const { result } = entry

  if (result === undefined) {
    return (
      <p className="min-w-0">
        <span className="font-mono tabular-nums">{expression}</span>{' '}
        <span className="text-sm text-danger">· {entry.error}</span>
      </p>
    )
  }

  const shown = formatNumber(result)
  return (
    <button
      type="button"
      aria-label={`Use result ${shown}`}
      onClick={() => onUse(result)}
      className="-mx-1 min-w-0 truncate rounded px-1 text-left font-mono tabular-nums hover:bg-tape-hover focus-visible:outline-2 focus-visible:outline-accent"
    >
      {expression} = {shown}
    </button>
  )
}

// The calculator as a pure state machine. It never does math: "=" produces a pending request,
// a hook sends it to the backend and dispatches "resolved" or "failed" with the answer.

export interface PendingRequest {
  /** Matches the answer to its request, so a late answer after "clear" is ignored. */
  id: number
  operation: string
  operands: number[]
}

export interface HistoryEntry {
  id: number
  operation: string
  operands: number[]
  result?: number
  error?: string
  /** ISO timestamp, passed in by the caller so the reducer stays pure. */
  at: string
}

/** What to do with the answer to the pending request. */
type FollowUp =
  // A binary result: show it, then optionally continue with the operator that triggered it ("2 + 3 ×").
  | { kind: 'result'; nextOperation: string | null }
  // A unary result (√): replace the current number and keep any operation waiting for it.
  | { kind: 'unary' }

export interface State {
  /** The number being typed or shown, as text, so "0." and trailing zeros survive while typing. */
  input: string
  /** True when the next digit starts a new number (after an operator or a result). */
  overwrite: boolean
  /** Left operand and operation waiting for the right operand. */
  stored: number | null
  operation: string | null
  pending: PendingRequest | null
  followUp: FollowUp
  error: string | null
  /** Newest first. */
  history: HistoryEntry[]
  nextId: number
}

export type Action =
  | { type: 'digit'; digit: string }
  | { type: 'decimal' }
  | { type: 'backspace' }
  | { type: 'negate' }
  | { type: 'clear' }
  | { type: 'binary'; operation: string }
  | { type: 'unary'; operation: string }
  | { type: 'equals' }
  | { type: 'resolved'; id: number; value: number; at: string }
  | { type: 'failed'; id: number; message: string; at: string }
  | { type: 'dismissError' }
  | { type: 'useValue'; value: number }
  | { type: 'clearHistory' }

export const MAX_DIGITS = 15
export const MAX_HISTORY = 20

const noFollowUp: FollowUp = { kind: 'result', nextOperation: null }

export const initialState: State = {
  input: '0',
  overwrite: false,
  stored: null,
  operation: null,
  pending: null,
  followUp: noFollowUp,
  error: null,
  history: [],
  nextId: 1,
}

export function calculatorReducer(state: State, action: Action): State {
  // While waiting for the backend, only the answer, clear and history actions are accepted,
  // so two calculations never mix.
  if (state.pending && !acceptedWhilePending.has(action.type)) {
    return state
  }

  switch (action.type) {
    case 'digit': {
      if (!/^\d$/.test(action.digit)) return state
      if (state.overwrite || state.input === '0') {
        return { ...state, input: action.digit, overwrite: false, error: null }
      }
      if (digitCount(state.input) >= MAX_DIGITS) return state
      return { ...state, input: state.input + action.digit, error: null }
    }

    case 'decimal': {
      if (state.overwrite) return { ...state, input: '0.', overwrite: false, error: null }
      if (state.input.includes('.')) return state
      return { ...state, input: state.input + '.', error: null }
    }

    case 'backspace': {
      if (state.overwrite) return state
      const shorter = state.input.slice(0, -1)
      return { ...state, input: shorter === '' || shorter === '-' ? '0' : shorter, error: null }
    }

    case 'negate': {
      if (Number(state.input) === 0) return state
      const input = state.input.startsWith('-') ? state.input.slice(1) : '-' + state.input
      return { ...state, input, error: null }
    }

    case 'clear':
      return { ...initialState, history: state.history, nextId: state.nextId }

    case 'binary': {
      // "2 + 3 ×": calculate 2 + 3 first, then continue with ×.
      if (state.stored !== null && state.operation && !state.overwrite) {
        return request(state, state.operation, [state.stored, Number(state.input)], {
          kind: 'result',
          nextOperation: action.operation,
        })
      }
      return {
        ...state,
        stored: Number(state.input),
        operation: action.operation,
        overwrite: true,
        error: null,
      }
    }

    case 'unary':
      return request(state, action.operation, [Number(state.input)], { kind: 'unary' })

    case 'equals': {
      if (state.stored === null || !state.operation) return state
      return request(state, state.operation, [state.stored, Number(state.input)], noFollowUp)
    }

    case 'resolved': {
      if (!state.pending || action.id !== state.pending.id) return state
      const { pending, followUp } = state
      const entry: HistoryEntry = { ...pending, result: action.value, at: action.at }
      const shown = {
        ...state,
        input: String(action.value),
        overwrite: true,
        pending: null,
        followUp: noFollowUp,
        history: addToHistory(state.history, entry),
      }
      if (followUp.kind === 'unary') return shown
      return {
        ...shown,
        stored: followUp.nextOperation ? action.value : null,
        operation: followUp.nextOperation,
      }
    }

    case 'failed': {
      if (!state.pending || action.id !== state.pending.id) return state
      const entry: HistoryEntry = { ...state.pending, error: action.message, at: action.at }
      return {
        ...state,
        stored: null,
        operation: null,
        overwrite: true,
        pending: null,
        followUp: noFollowUp,
        error: action.message,
        history: addToHistory(state.history, entry),
      }
    }

    case 'dismissError':
      return { ...state, error: null }

    case 'useValue':
      return { ...state, input: String(action.value), overwrite: true, error: null }

    case 'clearHistory':
      return { ...state, history: [] }
  }
}

const acceptedWhilePending = new Set<Action['type']>([
  'resolved',
  'failed',
  'clear',
  'dismissError',
  'clearHistory',
])

function request(state: State, operation: string, operands: number[], followUp: FollowUp): State {
  return {
    ...state,
    pending: { id: state.nextId, operation, operands },
    followUp,
    nextId: state.nextId + 1,
    error: null,
  }
}

function digitCount(input: string): number {
  return input.replace(/[^0-9]/g, '').length
}

function addToHistory(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...history].slice(0, MAX_HISTORY)
}

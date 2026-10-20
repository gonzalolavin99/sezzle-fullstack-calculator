import { describe, expect, it } from 'vitest'
import { calculatorReducer, initialState, type Action, type State } from './reducer.ts'

const AT = '2026-10-20T10:42:00.000Z'

/** Applies actions in order, starting from the initial state. */
function run(...actions: Action[]): State {
  return actions.reduce(calculatorReducer, initialState)
}

/** Shorthand for typing several characters on the keypad. */
function type(text: string): Action[] {
  return [...text].map((ch): Action =>
    ch === '.' ? { type: 'decimal' } : { type: 'digit', digit: ch },
  )
}

describe('entering numbers', () => {
  it('starts at 0', () => {
    expect(initialState.input).toBe('0')
  })

  it('replaces the leading zero and appends digits', () => {
    expect(run(...type('120')).input).toBe('120')
  })

  it('keeps a single zero', () => {
    expect(run(...type('00')).input).toBe('0')
  })

  it('adds one decimal point only', () => {
    expect(run(...type('1.2.5')).input).toBe('1.25')
  })

  it('starts with "0." when the decimal point comes first', () => {
    expect(run(...type('.5')).input).toBe('0.5')
  })

  it('stops at 15 digits', () => {
    expect(run(...type('1234567890123456789')).input).toBe('123456789012345')
  })

  it('ignores anything that is not a single digit', () => {
    expect(run({ type: 'digit', digit: 'x' }).input).toBe('0')
  })
})

describe('backspace, clear and sign', () => {
  it('removes the last character, down to 0', () => {
    expect(run(...type('12'), { type: 'backspace' }).input).toBe('1')
    expect(run(...type('1'), { type: 'backspace' }).input).toBe('0')
  })

  it('goes back to 0 instead of leaving a lone minus sign', () => {
    expect(run(...type('5'), { type: 'negate' }, { type: 'backspace' }).input).toBe('0')
  })

  it('does not edit a result', () => {
    const shown = run(
      ...type('9'),
      { type: 'unary', operation: 'sqrt' },
      { type: 'resolved', id: 1, value: 3, at: AT },
    )
    expect(calculatorReducer(shown, { type: 'backspace' }).input).toBe('3')
  })

  it('toggles the sign, but not on zero', () => {
    expect(run(...type('5'), { type: 'negate' }).input).toBe('-5')
    expect(run(...type('5'), { type: 'negate' }, { type: 'negate' }).input).toBe('5')
    expect(run({ type: 'negate' }).input).toBe('0')
  })

  it('clear resets everything except the history', () => {
    const withHistory = run(
      ...type('9'),
      { type: 'unary', operation: 'sqrt' },
      { type: 'resolved', id: 1, value: 3, at: AT },
    )
    const cleared = calculatorReducer(
      calculatorReducer(withHistory, { type: 'binary', operation: 'add' }),
      { type: 'clear' },
    )
    expect(cleared).toEqual({
      ...initialState,
      history: withHistory.history,
      nextId: withHistory.nextId,
    })
  })
})

describe('binary operations', () => {
  it('stores the left operand and the operation', () => {
    const state = run(...type('12'), { type: 'binary', operation: 'divide' })
    expect(state).toMatchObject({ stored: 12, operation: 'divide', input: '12', overwrite: true })
  })

  it('starts a new number after the operator', () => {
    expect(run(...type('12'), { type: 'binary', operation: 'divide' }, ...type('4')).input).toBe(
      '4',
    )
  })

  it('replaces the operator if pressed twice', () => {
    const state = run(
      ...type('12'),
      { type: 'binary', operation: 'add' },
      { type: 'binary', operation: 'divide' },
    )
    expect(state).toMatchObject({ stored: 12, operation: 'divide', pending: null })
  })

  it('equals asks the backend to calculate', () => {
    const state = run(...type('12'), { type: 'binary', operation: 'divide' }, ...type('4'), {
      type: 'equals',
    })
    expect(state.pending).toEqual({ id: 1, operation: 'divide', operands: [12, 4] })
  })

  it('equals does nothing without an operation', () => {
    expect(run(...type('7'), { type: 'equals' })).toEqual(run(...type('7')))
  })

  it('shows the result and records it in the history', () => {
    const state = run(
      ...type('12'),
      { type: 'binary', operation: 'divide' },
      ...type('4'),
      { type: 'equals' },
      { type: 'resolved', id: 1, value: 3, at: AT },
    )
    expect(state).toMatchObject({
      input: '3',
      stored: null,
      operation: null,
      pending: null,
      overwrite: true,
    })
    expect(state.history).toEqual([
      { id: 1, operation: 'divide', operands: [12, 4], result: 3, at: AT },
    ])
  })

  it('keeps the full precision of the result for the next calculation', () => {
    const state = run(
      ...type('.1'),
      { type: 'binary', operation: 'add' },
      ...type('.2'),
      { type: 'equals' },
      { type: 'resolved', id: 1, value: 0.30000000000000004, at: AT },
    )
    expect(state.input).toBe('0.30000000000000004')
  })

  it('chains: pressing an operator after a second number calculates first', () => {
    const asked = run(...type('2'), { type: 'binary', operation: 'add' }, ...type('3'), {
      type: 'binary',
      operation: 'multiply',
    })
    expect(asked.pending).toEqual({ id: 1, operation: 'add', operands: [2, 3] })

    const answered = calculatorReducer(asked, { type: 'resolved', id: 1, value: 5, at: AT })
    expect(answered).toMatchObject({ input: '5', stored: 5, operation: 'multiply', pending: null })

    const final = [...type('4'), { type: 'equals' } as Action].reduce(calculatorReducer, answered)
    expect(final.pending).toEqual({ id: 2, operation: 'multiply', operands: [5, 4] })
  })

  it('can continue from a result', () => {
    const state = run(
      ...type('2'),
      { type: 'binary', operation: 'add' },
      ...type('3'),
      { type: 'equals' },
      { type: 'resolved', id: 1, value: 5, at: AT },
      { type: 'binary', operation: 'power' },
      ...type('2'),
      { type: 'equals' },
    )
    expect(state.pending).toEqual({ id: 2, operation: 'power', operands: [5, 2] })
  })
})

describe('unary operations', () => {
  it('apply at once to the current number', () => {
    expect(run(...type('144'), { type: 'unary', operation: 'sqrt' }).pending).toEqual({
      id: 1,
      operation: 'sqrt',
      operands: [144],
    })
  })

  it('apply to the second number without losing the pending operation', () => {
    const state = run(
      ...type('2'),
      { type: 'binary', operation: 'add' },
      ...type('9'),
      { type: 'unary', operation: 'sqrt' },
      { type: 'resolved', id: 1, value: 3, at: AT },
    )
    expect(state).toMatchObject({ input: '3', stored: 2, operation: 'add' })
    expect(calculatorReducer(state, { type: 'equals' }).pending?.operands).toEqual([2, 3])
  })
})

describe('while a calculation is pending', () => {
  const pending = run(...type('12'), { type: 'binary', operation: 'divide' }, ...type('4'), {
    type: 'equals',
  })

  it.each<Action>([
    { type: 'digit', digit: '7' },
    { type: 'decimal' },
    { type: 'backspace' },
    { type: 'negate' },
    { type: 'binary', operation: 'add' },
    { type: 'unary', operation: 'sqrt' },
    { type: 'equals' },
    { type: 'useValue', value: 42 },
  ])('ignores %j', (action) => {
    expect(calculatorReducer(pending, action)).toBe(pending)
  })

  it('ignores an answer to an older request', () => {
    expect(calculatorReducer(pending, { type: 'resolved', id: 99, value: 1, at: AT })).toBe(pending)
    expect(calculatorReducer(pending, { type: 'failed', id: 99, message: 'x', at: AT })).toBe(
      pending,
    )
  })

  it('clear cancels it, so a late answer is ignored', () => {
    const cleared = calculatorReducer(pending, { type: 'clear' })
    expect(cleared.pending).toBeNull()
    expect(calculatorReducer(cleared, { type: 'resolved', id: 1, value: 3, at: AT })).toBe(cleared)
  })
})

describe('errors', () => {
  const failed = run(
    ...type('5'),
    { type: 'binary', operation: 'divide' },
    ...type('0'),
    { type: 'equals' },
    { type: 'failed', id: 1, message: "Can't divide by zero.", at: AT },
  )

  it('shows the message, keeps the number and drops the operation', () => {
    expect(failed).toMatchObject({
      error: "Can't divide by zero.",
      input: '0',
      stored: null,
      operation: null,
      pending: null,
    })
  })

  it('records the failed calculation in the history', () => {
    expect(failed.history[0]).toEqual({
      id: 1,
      operation: 'divide',
      operands: [5, 0],
      error: "Can't divide by zero.",
      at: AT,
    })
  })

  it('the next key press or dismiss clears the message', () => {
    expect(calculatorReducer(failed, { type: 'digit', digit: '1' }).error).toBeNull()
    expect(calculatorReducer(failed, { type: 'dismissError' }).error).toBeNull()
  })
})

describe('history', () => {
  it('puts the newest entry first and keeps at most 20', () => {
    let state = initialState
    for (let i = 1; i <= 25; i++) {
      state = [
        { type: 'unary', operation: 'sqrt' } as Action,
        { type: 'resolved', id: i, value: i, at: AT } as Action,
      ].reduce(calculatorReducer, state)
    }
    expect(state.history).toHaveLength(20)
    expect(state.history[0]?.result).toBe(25)
  })

  it('reuses a past result as the current number', () => {
    const state = run(...type('8'), { type: 'useValue', value: 2.5 })
    expect(state).toMatchObject({ input: '2.5', overwrite: true })
  })

  it('clears the history', () => {
    const state = run(
      ...type('9'),
      { type: 'unary', operation: 'sqrt' },
      { type: 'resolved', id: 1, value: 3, at: AT },
      { type: 'clearHistory' },
    )
    expect(state.history).toEqual([])
  })
})

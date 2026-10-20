import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdvancedOperations } from './AdvancedOperations.tsx'
import { ApiInspector } from './ApiInspector.tsx'
import { Display } from './Display.tsx'
import { ErrorBanner } from './ErrorBanner.tsx'
import { Keypad } from './Keypad.tsx'
import { initialState, type State } from './reducer.ts'
import { Tape } from './Tape.tsx'

const AT = '2026-10-20T10:42:00.000Z'

describe('Display', () => {
  it('shows the number being typed as it is', () => {
    render(<Display state={{ ...initialState, input: '12.50' }} />)
    expect(screen.getByTestId('display-value')).toHaveTextContent('12.50')
  })

  it('formats a result for reading', () => {
    render(<Display state={{ ...initialState, input: '0.30000000000000004', overwrite: true }} />)
    expect(screen.getByTestId('display-value')).toHaveTextContent('0.3')
  })

  it('shows the operation waiting for its second number', () => {
    render(<Display state={{ ...initialState, stored: 12, operation: 'divide', input: '4' }} />)
    expect(screen.getByTestId('display-expression')).toHaveTextContent('12 ÷')
  })

  // Digits are never cut off: long numbers get a smaller font so they fit a 360px screen.
  it.each([
    ['123456789', 'text-5xl'],
    ['1234567890123', 'text-4xl'],
    ['-123456789012345.', 'text-2xl'],
    // The longest formatted result: 15 significant digits after "0.00000".
    ['-0.00000142857142857143', 'text-xl'],
  ])('sizes %s to fit (%s)', (input, size) => {
    render(<Display state={{ ...initialState, input }} />)
    const value = screen.getByTestId('display-value')
    expect(value).toHaveClass(size)
    expect(value).not.toHaveClass('truncate')
  })

  it('shows the calculation in progress', () => {
    const state: State = {
      ...initialState,
      pending: { id: 1, operation: 'divide', operands: [12, 4] },
    }
    render(<Display state={state} />)
    expect(screen.getByTestId('display-expression')).toHaveTextContent('12 ÷ 4')
    expect(screen.getByTestId('display-value')).toHaveTextContent('Calculating…')
  })
})

describe('Keypad', () => {
  it('sends an action for each key', async () => {
    const dispatch = vi.fn()
    render(<Keypad dispatch={dispatch} disabled={false} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '7' }))
    await user.click(screen.getByRole('button', { name: 'Divide' }))
    await user.click(screen.getByRole('button', { name: 'Decimal point' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))
    await user.click(screen.getByRole('button', { name: 'Change sign' }))
    await user.click(screen.getByRole('button', { name: 'Backspace' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      { type: 'digit', digit: '7' },
      { type: 'binary', operation: 'divide' },
      { type: 'decimal' },
      { type: 'equals' },
      { type: 'negate' },
      { type: 'backspace' },
      { type: 'clear' },
    ])
  })

  it('keeps Clear usable while a calculation is pending', async () => {
    const dispatch = vi.fn()
    render(<Keypad dispatch={dispatch} disabled />)

    // aria-disabled, not disabled: a disabled button drops keyboard focus to <body> on every calculation.
    expect(screen.getByRole('button', { name: '7' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: '7' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Clear' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})

describe('AdvancedOperations', () => {
  const operations = [
    { name: 'add', arity: 2 },
    { name: 'power', arity: 2 },
    { name: 'sqrt', arity: 1 },
    { name: 'modulo', arity: 2 },
  ]

  it('shows only the operations that are not on the basic keypad, in API order', () => {
    render(
      <AdvancedOperations
        status="ready"
        operations={operations}
        onSelect={vi.fn()}
        disabled={false}
      />,
    )
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(names).toEqual(['Power', 'Square root', 'modulo'])
  })

  // The keypad can only send one or two operands; another arity would always fail with INVALID_ARITY.
  it('leaves out operations the keypad cannot send', () => {
    render(
      <AdvancedOperations
        status="ready"
        operations={[...operations, { name: 'clamp', arity: 3 }, { name: 'random', arity: 0 }]}
        onSelect={vi.fn()}
        disabled={false}
      />,
    )
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(names).toEqual(['Power', 'Square root', 'modulo'])
  })

  it('reports the operation with its arity', async () => {
    const onSelect = vi.fn()
    render(
      <AdvancedOperations
        status="ready"
        operations={operations}
        onSelect={onSelect}
        disabled={false}
      />,
    )

    await userEvent.setup().click(screen.getByRole('button', { name: 'Square root' }))
    expect(onSelect).toHaveBeenCalledWith({ name: 'sqrt', arity: 1 })
  })

  it('says so when the list could not be loaded', () => {
    render(
      <AdvancedOperations status="error" operations={[]} onSelect={vi.fn()} disabled={false} />,
    )
    expect(screen.getByText(/couldn't load more operations/i)).toBeInTheDocument()
  })
})

describe('ErrorBanner', () => {
  it('announces the message and can be dismissed', async () => {
    const onDismiss = vi.fn()
    render(<ErrorBanner message="Can't divide by zero." onDismiss={onDismiss} />)

    expect(screen.getByRole('alert')).toHaveTextContent("Can't divide by zero.")
    await userEvent.setup().click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe('Tape', () => {
  const entries = [
    { id: 2, operation: 'divide', operands: [5, 0], error: "Can't divide by zero.", at: AT },
    { id: 1, operation: 'divide', operands: [12, 4], result: 3, at: AT },
  ]

  it('invites a first calculation when empty', () => {
    render(<Tape entries={[]} onUse={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByText(/results appear here/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear history' })).not.toBeInTheDocument()
  })

  it('lists results and failed calculations, newest first', () => {
    render(<Tape entries={entries} onUse={vi.fn()} onClear={vi.fn()} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('5 ÷ 0')
    expect(items[0]).toHaveTextContent("Can't divide by zero.")
    expect(items[1]).toHaveTextContent('12 ÷ 4 = 3')
    expect(within(items[1] as HTMLElement).getByText(/./, { selector: 'time' })).toHaveAttribute(
      'datetime',
      AT,
    )
  })

  it('reuses a result when clicked, and clears the list', async () => {
    const onUse = vi.fn()
    const onClear = vi.fn()
    render(<Tape entries={entries} onUse={onUse} onClear={onClear} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Use result: 12 ÷ 4 = 3' }))
    await user.click(screen.getByRole('button', { name: 'Clear history' }))

    expect(onUse).toHaveBeenCalledWith(3)
    expect(onClear).toHaveBeenCalledOnce()
  })
})

describe('ApiInspector', () => {
  it('is collapsed and says when nothing was sent yet', () => {
    render(<ApiInspector exchange={null} />)
    expect(screen.getByText('Request details').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByText(/no requests yet/i)).toBeInTheDocument()
  })

  it('shows the last request and response', () => {
    render(
      <ApiInspector
        exchange={{
          method: 'POST',
          path: '/api/v1/calculate',
          requestBody: { operation: 'divide', operands: [12, 4] },
          status: 200,
          responseBody: { operation: 'divide', operands: [12, 4], result: 3 },
          durationMs: 12,
          requestId: 'req-1',
        }}
      />,
    )
    expect(screen.getByText('POST /api/v1/calculate')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('12 ms')).toBeInTheDocument()
    expect(screen.getByText('req-1')).toBeInTheDocument()
    expect(screen.getByTestId('request-body')).toHaveTextContent('"operands": [')
    expect(screen.getByTestId('response-body')).toHaveTextContent('"result": 3')
  })
})

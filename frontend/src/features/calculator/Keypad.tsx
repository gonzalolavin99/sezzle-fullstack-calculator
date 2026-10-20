import type { Dispatch } from 'react'
import { Key } from '../../components/Key.tsx'
import { KEYBOARD_HINT } from './keyboard.ts'
import type { Action } from './reducer.ts'

interface KeyDef {
  text: string
  /** Accessible name when the text alone is a symbol. */
  name?: string
  action: Action
  variant?: 'digit' | 'operator' | 'equals'
  wide?: boolean
}

const digit = (d: string): KeyDef => ({ text: d, action: { type: 'digit', digit: d } })
const binary = (text: string, name: string, operation: string): KeyDef => ({
  text,
  name,
  action: { type: 'binary', operation },
  variant: 'operator',
})

// Row by row, as on a desk calculator.
const keys: KeyDef[] = [
  { text: 'C', name: 'Clear', action: { type: 'clear' }, variant: 'operator' },
  { text: '⌫', name: 'Backspace', action: { type: 'backspace' }, variant: 'operator' },
  { text: '±', name: 'Change sign', action: { type: 'negate' }, variant: 'operator' },
  binary('÷', 'Divide', 'divide'),
  digit('7'),
  digit('8'),
  digit('9'),
  binary('×', 'Multiply', 'multiply'),
  digit('4'),
  digit('5'),
  digit('6'),
  binary('−', 'Subtract', 'subtract'),
  digit('1'),
  digit('2'),
  digit('3'),
  binary('+', 'Add', 'add'),
  { ...digit('0'), wide: true },
  { text: '.', name: 'Decimal point', action: { type: 'decimal' } },
  { text: '=', name: 'Equals', action: { type: 'equals' }, variant: 'equals' },
]

interface KeypadProps {
  dispatch: Dispatch<Action>
  /** True while a calculation is pending; Clear stays usable to cancel it. */
  disabled: boolean
}

export function Keypad({ dispatch, disabled }: KeypadProps) {
  return (
    <div role="group" aria-label="Keypad" aria-describedby="keyboard-hint">
      <div className="grid grid-cols-4 gap-2">
        {keys.map((key) => (
          <Key
            key={key.name ?? key.text}
            variant={key.variant}
            wide={key.wide}
            aria-label={key.name}
            disabled={disabled && key.action.type !== 'clear'}
            onClick={() => dispatch(key.action)}
          >
            {key.text}
          </Key>
        ))}
      </div>
      <p id="keyboard-hint" className="mt-3 text-center text-sm text-muted">
        {KEYBOARD_HINT}
      </p>
    </div>
  )
}

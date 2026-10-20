import { describe, expect, it } from 'vitest'
import { keyToAction } from './keyboard.ts'
import type { Action } from './reducer.ts'

const press = (key: string, modifiers: Partial<KeyboardEvent> = {}) =>
  keyToAction({ key, ctrlKey: false, metaKey: false, altKey: false, ...modifiers })

describe('keyToAction', () => {
  const cases: [key: string, action: Action][] = [
    ['0', { type: 'digit', digit: '0' }],
    ['7', { type: 'digit', digit: '7' }],
    ['.', { type: 'decimal' }],
    // Numeric keypads on Spanish and other layouts send a comma.
    [',', { type: 'decimal' }],
    ['+', { type: 'binary', operation: 'add' }],
    ['-', { type: 'binary', operation: 'subtract' }],
    ['*', { type: 'binary', operation: 'multiply' }],
    ['/', { type: 'binary', operation: 'divide' }],
    ['Enter', { type: 'equals' }],
    ['=', { type: 'equals' }],
    ['Backspace', { type: 'backspace' }],
    ['Escape', { type: 'clear' }],
  ]

  it.each(cases)('maps %j', (key, action) => {
    expect(press(key)).toEqual(action)
  })

  it.each(['a', 'Tab', ' ', 'ArrowUp', 'Shift', 'F5'])('ignores %j', (key) => {
    expect(press(key)).toBeNull()
  })

  // Ctrl+C, Cmd+R and similar belong to the browser, not to the calculator.
  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }])(
    'ignores keys pressed with %j',
    (modifier) => {
      expect(press('7', modifier)).toBeNull()
    },
  )
})

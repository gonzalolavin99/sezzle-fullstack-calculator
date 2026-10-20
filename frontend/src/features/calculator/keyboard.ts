import type { Action } from './reducer.ts'

type KeyLike = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>

const operatorKeys: Record<string, string> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
}

const namedKeys: Record<string, Action> = {
  '.': { type: 'decimal' },
  // Numeric keypads on Spanish and other layouts send a comma.
  ',': { type: 'decimal' },
  Enter: { type: 'equals' },
  '=': { type: 'equals' },
  Backspace: { type: 'backspace' },
  Escape: { type: 'clear' },
}

/** Shown under the keypad and read by screen readers; keep it in step with keyToAction. */
export const KEYBOARD_HINT = 'Keyboard: digits, + - * /, Enter or =, Backspace, Esc to clear.'

/** Translates a physical key into a calculator action, or null when the key is not ours. */
export function keyToAction(event: KeyLike): Action | null {
  // Ctrl+C, Cmd+R and similar belong to the browser.
  if (event.ctrlKey || event.metaKey || event.altKey) return null

  const { key } = event
  if (/^\d$/.test(key)) return { type: 'digit', digit: key }
  const operation = operatorKeys[key]
  if (operation) return { type: 'binary', operation }
  return namedKeys[key] ?? null
}

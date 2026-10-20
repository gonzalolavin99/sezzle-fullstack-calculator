import { useEffect, type Dispatch } from 'react'
import { keyToAction } from './keyboard.ts'
import type { Action } from './reducer.ts'

/** Lets the whole page drive the calculator from the physical keyboard. */
export function useKeyboard(dispatch: Dispatch<Action>) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      // Enter on a focused button, link or <summary> keeps its native meaning ("press this").
      if (event.key === 'Enter' && isInteractive(event.target)) return

      const action = keyToAction(event)
      if (!action) return
      // Stops the browser's own use of the key, such as "/" opening quick find in Firefox.
      event.preventDefault()
      dispatch(action)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('button, a, summary') !== null
}

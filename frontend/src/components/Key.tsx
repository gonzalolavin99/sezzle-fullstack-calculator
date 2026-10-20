import type { ButtonHTMLAttributes } from 'react'

type Variant = 'digit' | 'operator' | 'equals' | 'advanced'

interface KeyProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Spans two columns, like the 0 key. */
  wide?: boolean
}

// Keys look like physical keys: solid fill and a slightly heavier bottom edge (docs/DESIGN.md).
const base =
  'flex items-center justify-center rounded-lg border border-b-2 border-rule text-ink ' +
  'transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const variants: Record<Variant, string> = {
  digit: 'h-14 bg-key font-mono text-xl hover:bg-tape-hover',
  operator: 'h-14 bg-operator text-xl hover:bg-tape-hover',
  equals: 'h-14 border-accent bg-accent text-xl text-accent-ink hover:brightness-95',
  advanced: 'h-10 bg-paper text-base text-muted hover:text-ink',
}

export function Key({ variant = 'digit', wide = false, className = '', ...props }: KeyProps) {
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${wide ? 'col-span-2' : ''} ${className}`}
      // A mouse click does not move focus to the key, so a later Enter means "=" and does not
      // press the clicked key again. Tab still focuses keys for keyboard users.
      onMouseDown={(event) => event.preventDefault()}
      {...props}
    />
  )
}

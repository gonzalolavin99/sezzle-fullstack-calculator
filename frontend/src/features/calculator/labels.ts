/** Operations that have their own key on the basic keypad. */
export const BASIC_OPERATIONS = new Set(['add', 'subtract', 'multiply', 'divide'])

interface Label {
  /** What the key shows. */
  text: string
  /** Accessible name, read by screen readers and used by tests. */
  name: string
}

const advancedLabels: Record<string, Label> = {
  power: { text: 'xʸ', name: 'Power' },
  sqrt: { text: '√', name: 'Square root' },
  percentage: { text: '%', name: 'Percent of' },
}

/** Label for an advanced operation; an operation the UI does not know yet shows its API name. */
export function advancedLabel(operation: string): Label {
  return advancedLabels[operation] ?? { text: operation, name: operation }
}

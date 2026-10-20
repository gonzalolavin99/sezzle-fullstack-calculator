// Display formatting. The API returns full float64 results (ADR 0004); only the UI rounds them.

const plain = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 12 })

/** Formats a number for display: up to 12 significant digits, scientific notation when very large or small. */
export function formatNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-6)) {
    const [mantissa = '', exponent = ''] = value.toExponential(6).split('e')
    return `${trimTrailingZeros(mantissa)}e${exponent}`
  }
  return plain.format(value)
}

function trimTrailingZeros(mantissa: string): string {
  return mantissa.includes('.') ? mantissa.replace(/\.?0+$/, '') : mantissa
}

const infixSymbols: Record<string, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
}

/** Formats a calculation the way a person would write it, for the display and the history. */
export function formatExpression(operation: string, operands: number[]): string {
  const [a = 0, b = 0] = operands
  const symbol = infixSymbols[operation]
  if (symbol) return `${formatNumber(a)} ${symbol} ${formatNumber(b)}`
  if (operation === 'percentage') return `${formatNumber(a)}% of ${formatNumber(b)}`
  if (operation === 'sqrt') return `√${formatNumber(a)}`
  // An operation added on the backend that the UI has no symbol for yet still reads clearly.
  return `${operation}(${operands.map(formatNumber).join(', ')})`
}

/** The symbol for an operation waiting for its second operand, as in "12 ÷". */
export function operationSymbol(operation: string): string {
  if (operation === 'percentage') return '% of'
  return infixSymbols[operation] ?? operation
}

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TEST_API } from '../../test/server.ts'
import { Calculator } from './Calculator.tsx'

// End to end inside the frontend: keypad → reducer → hook → API client → fake backend (MSW).
// The full list of user flows is covered in task F7.
describe('Calculator', () => {
  it('calculates 12 ÷ 4 through the API and records it', async () => {
    render(<Calculator baseUrl={TEST_API} />)
    const user = userEvent.setup()

    for (const name of ['1', '2', 'Divide', '4', 'Equals']) {
      await user.click(screen.getByRole('button', { name }))
    }

    expect(await screen.findByRole('button', { name: 'Use result 3' })).toBeInTheDocument()
    expect(screen.getByTestId('display-value')).toHaveTextContent('3')
    expect(screen.getByText('POST /api/v1/calculate')).toBeInTheDocument()
  })

  it('loads the advanced operations from the API', async () => {
    render(<Calculator baseUrl={TEST_API} />)

    expect(await screen.findByRole('button', { name: 'Square root' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Power' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Percent of' })).toBeInTheDocument()
  })
})

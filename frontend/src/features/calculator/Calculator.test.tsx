import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server, TEST_API } from '../../test/server.ts'
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

  describe('physical keyboard', () => {
    it('calculates 12 / 4 typed on the keyboard', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await user.keyboard('12/4{Enter}')

      expect(await screen.findByRole('button', { name: 'Use result 3' })).toBeInTheDocument()
      expect(screen.getByTestId('display-value')).toHaveTextContent('3')
    })

    it('fixes a typo with Backspace and starts over with Escape', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await user.keyboard('123{Backspace}')
      expect(screen.getByTestId('display-value')).toHaveTextContent('12')

      await user.keyboard('+{Escape}')
      expect(screen.getByTestId('display-value')).toHaveTextContent('0')
      expect(screen.getByTestId('display-expression')).toHaveTextContent('')
    })

    it('presses Equals, not the last clicked key, when Enter follows a mouse click', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      for (const name of ['1', '2', 'Divide', '4']) {
        await user.click(screen.getByRole('button', { name }))
      }
      await user.keyboard('{Enter}')

      expect(await screen.findByRole('button', { name: 'Use result 3' })).toBeInTheDocument()
    })

    it('lets Enter activate a key reached with Tab', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      screen.getByRole('button', { name: '7' }).focus()
      await user.keyboard('{Enter}')

      expect(screen.getByTestId('display-value')).toHaveTextContent('7')
    })
  })

  describe('screen reader support', () => {
    it('announces the result, not every key typed', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await user.keyboard('12/4')
      expect(screen.getByRole('status')).toHaveTextContent('')
      expect(screen.getByTestId('display-value')).not.toHaveAttribute('aria-live')

      await user.keyboard('{Enter}')
      expect(await screen.findByRole('status')).toHaveTextContent('12 ÷ 4 = 3')
    })

    it('marks the calculator busy while waiting for the backend', async () => {
      // Hold the answer until the test has checked the busy state.
      let answer = () => {}
      const answered = new Promise<void>((resolve) => (answer = resolve))
      server.use(
        http.post(`${TEST_API}/api/v1/calculate`, async () => {
          await answered
          return HttpResponse.json({ operation: 'add', operands: [2, 3], result: 5 })
        }),
      )
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()
      const calculator = screen.getByRole('region', { name: 'Calculator' })

      await user.keyboard('2+3=')
      expect(calculator).toHaveAttribute('aria-busy', 'true')
      answer()
      await screen.findByRole('button', { name: 'Use result 5' })
      expect(calculator).toHaveAttribute('aria-busy', 'false')
    })

    it('groups the keys and explains the keyboard shortcuts', async () => {
      render(<Calculator baseUrl={TEST_API} />)

      const keypad = screen.getByRole('group', { name: 'Keypad' })
      expect(keypad).toHaveAccessibleDescription(/Enter/)
      expect(await screen.findByRole('group', { name: 'More operations' })).toBeInTheDocument()
    })
  })

  it('loads the advanced operations from the API', async () => {
    render(<Calculator baseUrl={TEST_API} />)

    expect(await screen.findByRole('button', { name: 'Square root' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Power' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Percent of' })).toBeInTheDocument()
  })
})

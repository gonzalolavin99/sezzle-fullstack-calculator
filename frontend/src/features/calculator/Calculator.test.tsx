import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server, TEST_API, testOperations } from '../../test/server.ts'
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

    expect(
      await screen.findByRole('button', { name: 'Use result: 12 ÷ 4 = 3' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('display-value')).toHaveTextContent('3')
    expect(screen.getByText('POST /api/v1/calculate')).toBeInTheDocument()
  })

  describe('physical keyboard', () => {
    it('calculates 12 / 4 typed on the keyboard', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await user.keyboard('12/4{Enter}')

      expect(
        await screen.findByRole('button', { name: 'Use result: 12 ÷ 4 = 3' }),
      ).toBeInTheDocument()
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

      expect(
        await screen.findByRole('button', { name: 'Use result: 12 ÷ 4 = 3' }),
      ).toBeInTheDocument()
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
      await screen.findByRole('button', { name: 'Use result: 2 + 3 = 5' })
      expect(calculator).toHaveAttribute('aria-busy', 'false')
    })

    it('groups the keys and explains the keyboard shortcuts', async () => {
      render(<Calculator baseUrl={TEST_API} />)

      const keypad = screen.getByRole('group', { name: 'Keypad' })
      expect(keypad).toHaveAccessibleDescription(/Enter/)
      expect(await screen.findByRole('group', { name: 'More operations' })).toBeInTheDocument()
    })
  })

  // The main user flows, keypad to fake backend and back (task F7).
  describe('main flows', () => {
    async function press(user: ReturnType<typeof userEvent.setup>, ...names: string[]) {
      for (const name of names) {
        await user.click(await screen.findByRole('button', { name }))
      }
    }

    it('calculates 2 + 3 = 5', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await press(user, '2', 'Add', '3', 'Equals')

      expect(
        await screen.findByRole('button', { name: 'Use result: 2 + 3 = 5' }),
      ).toHaveTextContent('2 + 3 = 5')
      expect(screen.getByTestId('display-value')).toHaveTextContent('5')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('chains operations left to right: 2 + 3 × 4 = 20', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await press(user, '2', 'Add', '3', 'Multiply')
      await screen.findByRole('button', { name: 'Use result: 2 + 3 = 5' })
      await press(user, '4', 'Equals')

      expect(
        await screen.findByRole('button', { name: 'Use result: 5 × 4 = 20' }),
      ).toBeInTheDocument()
    })

    it('shows a clear error for 5 ÷ 0, keeps it in the history and lets it be dismissed', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await press(user, '5', 'Divide', '0', 'Equals')

      expect(await screen.findByRole('alert')).toHaveTextContent("Can't divide by zero.")
      const history = screen.getByRole('region', { name: 'History' })
      expect(within(history).getByText('5 ÷ 0')).toBeInTheDocument()
      expect(within(history).getByText(/Can't divide by zero/)).toBeInTheDocument()

      await press(user, 'Dismiss')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('shows a clear error for the square root of a negative number', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await press(user, '9', 'Change sign', 'Square root')

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "That operation isn't defined for this value.",
      )
      expect(screen.getByText('√-9')).toBeInTheDocument()
    })

    it('runs the advanced operations from the API: 2 xʸ 10 and 15% of 200', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await press(user, '2', 'Power', '1', '0', 'Equals')
      expect(
        await screen.findByRole('button', { name: 'Use result: 2 ^ 10 = 1,024' }),
      ).toBeInTheDocument()

      await press(user, '1', '5', 'Percent of', '2', '0', '0', 'Equals')
      expect(
        await screen.findByRole('button', { name: 'Use result: 15% of 200 = 30' }),
      ).toHaveTextContent('15% of 200 = 30')
    })

    it('reuses a result from the history and clears the history', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await press(user, '2', 'Add', '3', 'Equals')
      await screen.findByRole('button', { name: 'Use result: 2 + 3 = 5' })
      await press(user, 'Clear')
      expect(screen.getByTestId('display-value')).toHaveTextContent('0')

      await press(user, 'Use result: 2 + 3 = 5', 'Add', '1', 'Equals')
      expect(
        await screen.findByRole('button', { name: 'Use result: 5 + 1 = 6' }),
      ).toBeInTheDocument()

      await press(user, 'Clear history')
      expect(screen.getByText('Results appear here.')).toBeInTheDocument()
    })

    it('tells the user when the backend is down, and the basic keys still respond', async () => {
      server.use(
        http.get(`${TEST_API}/api/v1/operations`, () => HttpResponse.error()),
        http.post(`${TEST_API}/api/v1/calculate`, () => HttpResponse.error()),
      )
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      expect(
        await screen.findByText("Couldn't load more operations. The basic keys still work."),
      ).toBeInTheDocument()

      await press(user, '2', 'Add', '3', 'Equals')
      expect(await screen.findByRole('alert')).toHaveTextContent(
        "Can't reach the calculator service. Check that the backend is running.",
      )
      expect(screen.getByRole('button', { name: '7' })).toBeEnabled()
    })
  })

  // Regressions found by the phase 3 review.
  describe('review regressions', () => {
    it('sends one request even when the page re-renders while it is pending', async () => {
      let releaseOperations = () => {}
      const operationsHeld = new Promise<void>((resolve) => (releaseOperations = resolve))
      let releaseAnswer = () => {}
      const answerHeld = new Promise<void>((resolve) => (releaseAnswer = resolve))
      let calls = 0
      server.use(
        http.get(`${TEST_API}/api/v1/operations`, async () => {
          await operationsHeld
          return HttpResponse.json({ operations: testOperations })
        }),
        http.post(`${TEST_API}/api/v1/calculate`, async () => {
          calls++
          await answerHeld
          return HttpResponse.json({ operation: 'add', operands: [2, 2], result: 4 })
        }),
      )
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await user.keyboard('2+2=')
      // The operations list arriving now re-renders the calculator mid-request.
      releaseOperations()
      await screen.findByRole('button', { name: 'Square root' })
      releaseAnswer()

      expect(
        await screen.findByRole('button', { name: 'Use result: 2 + 2 = 4' }),
      ).toBeInTheDocument()
      expect(calls).toBe(1)
    })

    it('presses Equals when Enter follows a click on a history result', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await user.keyboard('2+3=')
      await user.click(await screen.findByRole('button', { name: 'Use result: 2 + 3 = 5' }))
      await user.keyboard('+5{Enter}')

      expect(
        await screen.findByRole('button', { name: 'Use result: 5 + 5 = 10' }),
      ).toBeInTheDocument()
    })

    it('presses Equals when Enter follows a click on "Request details"', async () => {
      render(<Calculator baseUrl={TEST_API} />)
      const user = userEvent.setup()

      await user.click(screen.getByText('Request details'))
      await user.keyboard('2+2{Enter}')

      expect(
        await screen.findByRole('button', { name: 'Use result: 2 + 2 = 4' }),
      ).toBeInTheDocument()
    })
  })

  it('loads the advanced operations from the API', async () => {
    render(<Calculator baseUrl={TEST_API} />)

    expect(await screen.findByRole('button', { name: 'Square root' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Power' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Percent of' })).toBeInTheDocument()
  })
})

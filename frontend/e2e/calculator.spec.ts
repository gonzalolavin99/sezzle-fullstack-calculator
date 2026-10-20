import { expect, test } from '@playwright/test'

// Smoke test of the deployed stack: browser → nginx → Go backend and back.
test.describe('calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // The advanced keys come from GET /api/v1/operations, so they prove the API is reachable.
    await expect(page.getByRole('button', { name: 'Square root' })).toBeVisible()
  })

  test('computes 12 ÷ 4 = 3 with the keypad', async ({ page }) => {
    for (const name of ['1', '2', 'Divide', '4', 'Equals']) {
      await page.getByRole('button', { name, exact: true }).click()
    }

    await expect(page.getByTestId('display-value')).toHaveText('3')
    await expect(page.getByRole('button', { name: 'Use result: 12 ÷ 4 = 3' })).toBeVisible()
  })

  test('shows a clear error for 5 ÷ 0 typed on the keyboard', async ({ page }) => {
    await page.keyboard.type('5/0')
    await page.keyboard.press('Enter')

    await expect(page.getByRole('alert')).toHaveText(/Can't divide by zero\./)
    const history = page.getByRole('region', { name: 'History' })
    await expect(history.getByText("Can't divide by zero")).toBeVisible()
  })
})

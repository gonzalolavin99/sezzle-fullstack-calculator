import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { TEST_API } from './test/server.ts'

describe('App', () => {
  it('renders the page heading and the calculator', async () => {
    render(<App baseUrl={TEST_API} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Calculator' })).toBeInTheDocument()
    // Plain labels only: no decorative "eyebrow" text above the heading.
    expect(screen.queryByText(/desk instrument/i)).not.toBeInTheDocument()
    // Wait for the operations request so the test ends with no pending updates.
    expect(await screen.findByRole('button', { name: 'Square root' })).toBeInTheDocument()
  })
})

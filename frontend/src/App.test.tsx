import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'

describe('App', () => {
  it('renders the page heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Calculator' })).toBeInTheDocument()
    // Plain labels only: no decorative "eyebrow" text above the heading.
    expect(screen.queryByText(/desk instrument/i)).not.toBeInTheDocument()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders Life XP Dashboard', () => {
    render(<App />)
    expect(screen.getByText(/Life XP Dashboard/i)).toBeInTheDocument()
  })

  it("updates the Today's Entries stat immediately after saving, without a page reload", async () => {
    render(<App />)

    // Default metrics are pre-filled by DataEntryForm, so submitting immediately
    // saves one entry per metric.
    await waitFor(() => expect(screen.getByText("Today's Entries")).toBeInTheDocument())
    expect(screen.getByText("Today's Entries").nextElementSibling).toHaveTextContent('0')

    fireEvent.click(screen.getByRole('button', { name: /save entries/i }))

    await waitFor(() =>
      expect(screen.getByText("Today's Entries").nextElementSibling).not.toHaveTextContent('0')
    )
  })
})

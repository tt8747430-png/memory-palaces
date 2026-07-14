import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { WordReveal } from './WordReveal'

afterEach(cleanup)

describe('WordReveal', () => {
  it('renders every word of the line', () => {
    render(<WordReveal text="Remember every card" />)
    expect(screen.getByText('Remember')).toBeInTheDocument()
    expect(screen.getByText('every')).toBeInTheDocument()
    expect(screen.getByText('card')).toBeInTheDocument()
  })

  it('exposes the whole line as a single accessible name on the chosen element', () => {
    render(<WordReveal as="h1" text="Welcome, Ada" />)
    expect(screen.getByRole('heading', { name: 'Welcome, Ada' })).toBeInTheDocument()
  })
})

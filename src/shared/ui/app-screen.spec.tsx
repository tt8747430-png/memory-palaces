import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppScreen } from './app-screen'

describe('AppScreen', () => {
  it('renders children inside a scroll region', () => {
    render(<AppScreen>hello</AppScreen>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders header and footer slots around the scroll region', () => {
    render(
      <AppScreen header={<header>H</header>} footer={<footer>F</footer>}>
        body
      </AppScreen>,
    )
    expect(screen.getByText('H')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })
})

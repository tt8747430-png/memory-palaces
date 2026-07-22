import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { AppScreen } from './AppScreen'

afterEach(cleanup)

describe('AppScreen', () => {
  it('renders children in a scroll container without header/footer', () => {
    renderWithProviders(<AppScreen>Body</AppScreen>)
    expect(screen.getByRole('main')).toHaveTextContent('Body')
  })

  it('renders header and footer slots around the content', () => {
    renderWithProviders(
      <AppScreen header={<header>Top</header>} footer={<footer>Bottom</footer>}>
        Body
      </AppScreen>,
    )
    expect(screen.getByText('Top')).toBeInTheDocument()
    expect(screen.getByText('Bottom')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('Body')
  })
})

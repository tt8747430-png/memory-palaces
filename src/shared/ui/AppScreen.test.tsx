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

  // jsdom lays nothing out, so this holds the class contract rather than the pixel: the body is
  // sized past the port so the scroller always has range to rubber-band against.
  it('sizes a bouncing body past its scrollport', () => {
    renderWithProviders(<AppScreen bounce>Body</AppScreen>)
    expect(screen.getByRole('main').firstElementChild).toHaveClass('min-h-[calc(100%+1px)]')
  })

  /**
   * The clearance is an empty box at the end of the content, so the port still runs to the display
   * edge and rows keep passing behind the nav's glass — only where the list *stops* changes. Not
   * padding: a scrolling flex column's end padding is not reliably part of its scrollable overflow.
   */
  it('ends the scroll with an empty box, leaving the port full height', () => {
    renderWithProviders(
      <AppScreen bounce gutter="dial">
        Body
      </AppScreen>,
    )
    const main = screen.getByRole('main')
    expect(main.className).not.toContain('mb-[')
    expect(main.className).not.toContain('pb-safe')
    expect(main.lastElementChild).toHaveClass('h-[calc(var(--app-bottom-inset)+8.5rem)]')
    expect(main.lastElementChild).toBeEmptyDOMElement()
  })

  it('clears the floating chrome for an end gutter', () => {
    renderWithProviders(<AppScreen gutter="end">Body</AppScreen>)
    expect(screen.getByRole('main').lastElementChild).toHaveClass(
      'h-[calc(var(--app-bottom-inset)+5rem)]',
    )
  })

  it('keeps the gutter above a docked footer, never below it', () => {
    renderWithProviders(
      <AppScreen fill gutter="end" footer={<footer>Bottom</footer>}>
        Body
      </AppScreen>,
    )
    const main = screen.getByRole('main')
    expect(main.lastElementChild).toHaveTextContent('Bottom')
    expect(main.children[1]).toHaveClass('h-[calc(var(--app-bottom-inset)+5rem)]')
  })

  it('keeps the safe-area padding, and no gutter box, when nothing floats over the screen', () => {
    renderWithProviders(<AppScreen bounce>Body</AppScreen>)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('pb-safe')
    expect(main.children).toHaveLength(1)
  })

  it('lets a docked footer size the body instead', () => {
    renderWithProviders(
      <AppScreen bounce fill footer={<footer>Bottom</footer>}>
        Body
      </AppScreen>,
    )
    expect(screen.getByRole('main').firstElementChild).toHaveClass('flex-1')
  })
})

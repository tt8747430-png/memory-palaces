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
    expect(screen.getByRole('main').firstElementChild).toHaveClass(
      'min-h-[calc(100%+1px-var(--screen-gutter,0px))]',
    )
  })

  /**
   * The gutter is height at the end of the content, so a body sized to the whole port on top of it
   * is a screen that scrolls by the gutter with every row already visible. Body and gutter have to
   * come to one port between them — which is the same statement twice, and would drift if the two
   * were written as separate numbers.
   */
  it('sizes the body by the port less the gutter it will add under it', () => {
    renderWithProviders(
      <AppScreen fill gutter="dial">
        Body
      </AppScreen>,
    )
    const main = screen.getByRole('main')
    expect(main).toHaveClass('[--screen-gutter:calc(var(--app-bottom-inset)+8.5rem)]')
    expect(main.firstElementChild).toHaveClass('min-h-[calc(100%-var(--screen-gutter,0px))]')
    expect(main.lastElementChild).toHaveClass('h-(--screen-gutter)')
  })

  // Same trap, on a screen that asked for a gutter and no sizer: unsized, the body is its content's
  // own height and the gutter under it is pure range.
  it('sizes a body the screen never asked to fill, once a gutter is under it', () => {
    renderWithProviders(<AppScreen gutter="end">Body</AppScreen>)
    expect(screen.getByRole('main').firstElementChild).toHaveClass(
      'min-h-[calc(100%-var(--screen-gutter,0px))]',
    )
  })

  /**
   * Nothing the gutter clears is on screen while the keyboard is up — the nav is hidden, the dial
   * and select dock with it, the footer is `static`. Left standing, the gutter would be range a
   * revealed field rides past the keyboard's edge on, on top of `--kb-range`. CODE_STYLE §11.
   */
  it('collapses the gutter while the keyboard is up', () => {
    renderWithProviders(<AppScreen gutter="dial">Body</AppScreen>)
    expect(screen.getByRole('main')).toHaveClass('in-data-keyboard:[--screen-gutter:0px]')
  })

  it('leaves the gutter variable undeclared on a screen with no gutter', () => {
    renderWithProviders(<AppScreen fill>Body</AppScreen>)
    expect(screen.getByRole('main').className).not.toContain('--screen-gutter:')
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
    expect(main.lastElementChild).toHaveClass('h-(--screen-gutter)')
    expect(main.lastElementChild).toBeEmptyDOMElement()
  })

  it('clears the floating chrome for an end gutter', () => {
    renderWithProviders(<AppScreen gutter="end">Body</AppScreen>)
    expect(screen.getByRole('main')).toHaveClass(
      '[--screen-gutter:calc(var(--app-bottom-inset)+5rem)]',
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
    expect(main.children[1]).toHaveClass('h-(--screen-gutter)')
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

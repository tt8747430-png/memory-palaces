import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { expectKeyboard, startKeyboardViewport } from '@/shared/lib/keyboard-viewport'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { AppScreen } from './AppScreen'

const KEYBOARD_HEIGHT_KEY = 'mindscape.keyboard-height'

/**
 * Raises a keyboard the way a focus does: the reserve is the height this device last measured, and
 * `expectKeyboard` is what `useKeyboardReveal` calls on `focusin`, before the keyboard reports
 * itself. Nothing here stubs `visualViewport` — the screen only asks whether one is up.
 */
function raiseKeyboard(): () => void {
  localStorage.setItem(KEYBOARD_HEIGHT_KEY, '320')
  const stop = startKeyboardViewport()
  expectKeyboard(true)
  return () => {
    expectKeyboard(false)
    stop()
    localStorage.removeItem(KEYBOARD_HEIGHT_KEY)
  }
}

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

  it('sizes a bouncing body past its scrollport', () => {
    renderWithProviders(<AppScreen bounce>Body</AppScreen>)
    expect(screen.getByRole('main').firstElementChild).toHaveClass(
      'min-h-[calc(100%+1px-var(--screen-gutter,0px))]',
    )
  })

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

  it('sizes a body the screen never asked to fill, once a gutter is under it', () => {
    renderWithProviders(<AppScreen gutter="end">Body</AppScreen>)
    expect(screen.getByRole('main').firstElementChild).toHaveClass(
      'min-h-[calc(100%-var(--screen-gutter,0px))]',
    )
  })

  it('collapses the gutter while the keyboard is up', () => {
    renderWithProviders(<AppScreen gutter="dial">Body</AppScreen>)
    expect(screen.getByRole('main')).toHaveClass('in-data-keyboard:[--screen-gutter:0px]')
  })

  it('leaves the gutter variable undeclared on a screen with no gutter', () => {
    renderWithProviders(<AppScreen fill>Body</AppScreen>)
    expect(screen.getByRole('main').className).not.toContain('--screen-gutter:')
  })

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

  it('keeps the gutter at the end of the scroll, with the footer outside it', () => {
    renderWithProviders(
      <AppScreen fill gutter="end" footer={<footer>Bottom</footer>}>
        Body
      </AppScreen>,
    )
    const main = screen.getByRole('main')
    expect(main.lastElementChild).toHaveClass('h-(--screen-gutter)')
    expect(main).not.toHaveTextContent('Bottom')
  })

  it('keeps the safe-area padding, and no gutter box, when nothing floats over the screen', () => {
    renderWithProviders(<AppScreen bounce>Body</AppScreen>)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('pb-safe')
    expect(main.children).toHaveLength(1)
  })

  it('pins the footer beside the scroll body, so the page scrolls under it', () => {
    renderWithProviders(
      <AppScreen fill footer={<footer>Bottom</footer>}>
        Body
      </AppScreen>,
    )
    const main = screen.getByRole('main')
    const footer = screen.getByText('Bottom').parentElement
    expect(main).not.toContainElement(footer)
    expect(main.parentElement).toContainElement(footer)
    expect(footer).toHaveClass('shrink-0')
    // Nothing anchors it to the viewport: it is a flex item, and the body is what shrinks.
    expect(footer?.className).not.toContain('sticky')
    expect(footer?.className).not.toContain('fixed')
  })

  it('puts the footer at the end of the scroll while the keyboard is up, to be scrolled to', () => {
    const drop = raiseKeyboard()
    try {
      renderWithProviders(
        <AppScreen fill footer={<footer>Bottom</footer>}>
          Body
        </AppScreen>,
      )
      const main = screen.getByRole('main')
      const footer = screen.getByText('Bottom').parentElement
      expect(main).toContainElement(footer)
      expect(footer).toHaveClass('-mx-5', 'mt-auto')
    } finally {
      drop()
    }
  })

  it('lets a docked footer size the body instead', () => {
    renderWithProviders(
      <AppScreen bounce fill footer={<footer>Bottom</footer>}>
        Body
      </AppScreen>,
    )
    expect(screen.getByRole('main').firstElementChild).toHaveClass('flex-1')
  })

  it('lays the scroll body out once: its inset and sizer do not change when the content becomes ready', () => {
    const footer = <footer>Bottom</footer>
    const { rerender } = renderWithProviders(
      <AppScreen fill footer={footer}>
        Loading
      </AppScreen>,
    )
    const main = screen.getByRole('main')
    const before = { inset: main.className, sizer: main.firstElementChild }

    rerender(
      <AppScreen fill footer={footer}>
        Ready
      </AppScreen>,
    )

    expect(screen.getByRole('main')).toBe(main)
    expect(main.className).toBe(before.inset)
    expect(main.firstElementChild).toBe(before.sizer)
    expect(main).toHaveTextContent('Ready')
  })
})

import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { motionValue } from 'motion/react'
import { CHROME, HeaderElevationContext } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { AppScreen } from '../AppScreen'
import { AppHeader } from './AppHeader'
import {
  Header,
  HeaderBack,
  HeaderBar,
  HeaderCount,
  HeaderSubtitle,
  HeaderTitle,
  HeaderTrack,
} from './Header'
import { useHeader } from './header-context'
import { ScreenHeader } from './ScreenHeader'
import { SelectHeader } from './SelectHeader'
import { StudySessionHeader } from './StudySessionHeader'

afterEach(cleanup)

/** The height utility the bar row actually resolves to, or `undefined` when it sets none. */
const barHeight = (ui: ReactElement) => {
  const { container, unmount } = renderWithProviders(ui)
  const bar = container.querySelector('header > div')?.className ?? ''
  unmount()
  return bar.split(' ').find((each) => each.startsWith('h-'))
}

describe('Header', () => {
  it('renders its children inside the screen banner', () => {
    render(
      <Header>
        <HeaderBar>
          <span>Title</span>
          <button type="button">Add</button>
        </HeaderBar>
      </Header>,
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('lifts with the elevation the screen publishes', () => {
    const { container } = render(
      <HeaderElevationContext value={motionValue(1)}>
        <AppHeader>
          <HeaderBar>
            <span>Title</span>
          </HeaderBar>
        </AppHeader>
      </HeaderElevationContext>,
    )
    const lift = container.querySelector('[aria-hidden]')
    expect(lift).toHaveStyle({ opacity: '1' })
  })

  it('leaves the bare frame unpainted, for a scene to fill', () => {
    const { container } = render(
      <HeaderElevationContext value={motionValue(1)}>
        <Header>
          <HeaderBar>
            <span>Title</span>
          </HeaderBar>
        </Header>
      </HeaderElevationContext>,
    )
    const banner = container.querySelector('header')
    expect(container.querySelector('[aria-hidden]')).toBeNull()
    expect(banner?.className).not.toMatch(/bg-/)
  })

  it('keeps one height across every bar the app wears', () => {
    expect(barHeight(<ScreenHeader title="Deck" onBack={() => {}} backLabel="Back" />)).toBe('h-16')
    expect(
      barHeight(
        <SelectHeader
          selection={{ count: 2, allSelected: false, toggleAll: () => {}, exit: () => {} }}
        />,
      ),
    ).toBe('h-16')
  })

  it('gives a study session a row of its own height, and says so', () => {
    // Not the app's 64px, and not by overriding it either: the count pill, the track and a chip
    // row stack inside this header, so `study` is its own entry in `LAYOUT`.
    expect(
      barHeight(<StudySessionHeader title="Physics" backLabel="Back" onBack={() => {}} />),
    ).toBeUndefined()
  })

  it('answers to the selector the reveal band looks it up by', () => {
    // The regression this catches is silent: rename the slot and `useKeyboardReveal` finds
    // nothing, the band falls back to the scroller's own top, and a focused field is revealed
    // under the bar. Rendering the real shell is the point — a hand-built DOM would pass either
    // way. ADR 0002 / CODE_STYLE §11.
    const { container } = renderWithProviders(
      <AppScreen header={<ScreenHeader title="Deck" onBack={() => {}} backLabel="Back" />}>
        <input aria-label="Name" />
      </AppScreen>,
    )
    const scroller = container.querySelector('main')
    expect(scroller).not.toBeNull()
    expect(scroller?.parentElement?.querySelector(CHROME.header)).toBe(
      container.querySelector('header'),
    )
  })
})

describe('Header parts', () => {
  it('reads the title, subtitle and back control off one provider', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(
      <Header title="Physics" subtitle="Deck" onBack={onBack} backLabel="Go back">
        <HeaderBar>
          <HeaderBack />
          <HeaderTitle />
          <HeaderSubtitle />
        </HeaderBar>
      </Header>,
    )
    expect(screen.getByRole('heading', { name: 'Physics' })).toBeInTheDocument()
    expect(screen.getByText('Deck')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Go back' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('leaves the back control out when there is nowhere to go', () => {
    render(
      <Header title="Home">
        <HeaderBar>
          <HeaderBack />
          <HeaderTitle />
        </HeaderBar>
      </Header>,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('gives the count and the track one reading of the same progress', () => {
    render(
      <Header title="Physics" progress={{ done: 3, total: 4 }}>
        <HeaderBar>
          <HeaderCount />
        </HeaderBar>
        <HeaderTrack />
      </Header>,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('/4')).toBeInTheDocument()
    expect(screen.getByTestId('header-progress-fill')).toHaveStyle({ transform: 'scaleX(0.75)' })
  })

  it('serves a one-off part the same contract the shipped ones read', () => {
    function Remaining() {
      const { state } = useHeader()
      const progress = state.progress
      return <span>{progress ? `${progress.total - progress.done} left` : null}</span>
    }
    render(
      <Header title="Physics" progress={{ done: 3, total: 10 }}>
        <HeaderBar>
          <Remaining />
        </HeaderBar>
      </Header>,
    )
    expect(screen.getByText('7 left')).toBeInTheDocument()
  })

  it('refuses to render a part with no bar around it', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<HeaderTitle />)).toThrow(/outside <Header>/)
    quiet.mockRestore()
  })

  it('is the one header every filler is built from', () => {
    const banners = (ui: ReactElement) => {
      const { container, unmount } = renderWithProviders(ui)
      const count = container.querySelectorAll('header').length
      const slot = container.querySelector('header')?.getAttribute('data-slot')
      unmount()
      return { count, slot }
    }

    for (const ui of [
      <ScreenHeader key="screen" title="Deck" onBack={() => {}} backLabel="Back" />,
      <SelectHeader
        key="select"
        selection={{ count: 1, allSelected: false, toggleAll: () => {}, exit: () => {} }}
      />,
      <StudySessionHeader key="session" title="Physics" backLabel="Back" onBack={() => {}} />,
    ]) {
      expect(banners(ui)).toEqual({ count: 1, slot: 'header' })
    }
  })
})

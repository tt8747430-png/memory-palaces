import type { ReactElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { HeaderElevationContext } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { HeaderBar } from './HeaderBar'
import { ScreenHeader } from './ScreenHeader'
import { SelectHeader } from './SelectHeader'

afterEach(cleanup)

describe('HeaderBar', () => {
  it('renders its children inside the screen banner', () => {
    render(
      <HeaderBar>
        <span>Title</span>
        <button type="button">Add</button>
      </HeaderBar>,
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('lifts with the elevation the screen publishes', () => {
    const { container } = render(
      <HeaderElevationContext value={motionValue(1)}>
        <HeaderBar>
          <span>Title</span>
        </HeaderBar>
      </HeaderElevationContext>,
    )
    const lift = container.querySelector('[aria-hidden]')
    expect(lift).toHaveStyle({ opacity: '1' })
  })

  it('keeps one height whichever header fills it', () => {
    const height = (ui: ReactElement) => {
      const { container, unmount } = renderWithProviders(ui)
      const bar = container.querySelector('header > div')?.className ?? ''
      unmount()
      return bar.split(' ').find((each) => each.startsWith('h-'))
    }

    expect(height(<ScreenHeader title="Deck" onBack={() => {}} />)).toBe('h-16')
    expect(
      height(
        <SelectHeader count={2} allSelected={false} onToggleAll={() => {}} onCancel={() => {}} />,
      ),
    ).toBe('h-16')
  })
})

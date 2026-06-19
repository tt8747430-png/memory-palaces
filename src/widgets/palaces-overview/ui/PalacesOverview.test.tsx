import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { PalaceSummary } from './PalacesOverview'
import { PalacesOverview } from './PalacesOverview'

afterEach(cleanup)

const summary = (over: Partial<PalaceSummary> = {}): PalaceSummary => ({
  id: 'p',
  name: 'Home',
  icon: '🏠',
  progress: 40,
  roomsCompleted: 2,
  totalRooms: 5,
  ...over,
})

function renderOverview(palaces: PalaceSummary[]) {
  const handlers = { onOpenPalace: vi.fn(), onViewAll: vi.fn() }
  const result = render(
    <I18nextProvider i18n={i18n}>
      <PalacesOverview palaces={palaces} {...handlers} />
    </I18nextProvider>,
  )
  return { ...handlers, ...result }
}

describe('PalacesOverview', () => {
  it('renders nothing when there are no palaces', () => {
    const { container } = renderOverview([])
    expect(container).toBeEmptyDOMElement()
  })

  it('renders each palace with its name and room count', () => {
    renderOverview([summary({ id: 'a', name: 'Acropolis' })])
    expect(screen.getByText('Acropolis')).toBeInTheDocument()
    expect(screen.getByText('2/5 rooms')).toBeInTheDocument()
  })

  it('marks a palace mastered at 70%+ only', () => {
    renderOverview([summary({ id: 'lo', progress: 40 }), summary({ id: 'hi', progress: 80 })])
    expect(screen.getAllByRole('img', { name: 'Mastered' })).toHaveLength(1)
  })

  it('opens a palace and views all', async () => {
    const user = userEvent.setup()
    const handlers = renderOverview([summary({ id: 'acro', name: 'Acropolis' })])

    await user.click(screen.getByRole('button', { name: /^open acropolis$/i }))
    await user.click(screen.getByRole('button', { name: /view all/i }))

    expect(handlers.onOpenPalace).toHaveBeenCalledWith('acro')
    expect(handlers.onViewAll).toHaveBeenCalledTimes(1)
  })

  it('trains a palace from the kebab quick actions', async () => {
    const user = userEvent.setup()
    const onTrainPalace = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <PalacesOverview
          palaces={[summary({ id: 'acro', name: 'Acropolis' })]}
          onOpenPalace={vi.fn()}
          onViewAll={vi.fn()}
          onTrainPalace={onTrainPalace}
        />
      </I18nextProvider>,
    )

    await user.click(screen.getByRole('button', { name: /more options for acropolis/i }))
    await user.click(await screen.findByRole('button', { name: /train now/i }))

    expect(onTrainPalace).toHaveBeenCalledWith('acro')
  })

  it('deletes a palace directly from the kebab (the undo lives in the toast)', async () => {
    const user = userEvent.setup()
    const onDeletePalace = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <PalacesOverview
          palaces={[summary({ id: 'acro', name: 'Acropolis' })]}
          onOpenPalace={vi.fn()}
          onViewAll={vi.fn()}
          onDeletePalace={onDeletePalace}
        />
      </I18nextProvider>,
    )

    await user.click(screen.getByRole('button', { name: /more options for acropolis/i }))
    await user.click(await screen.findByRole('button', { name: /^delete$/i }))

    expect(onDeletePalace).toHaveBeenCalledWith('acro')
  })
})

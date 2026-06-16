import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createProgressStore, ProgressStoreContext, type Progress } from '@/entities/progress'
import { createPalaceStore, PalaceStoreContext, type Palace } from '@/entities/palace'
import { createRoomStore, RoomStoreContext, type Room } from '@/entities/room'
import { createLocusStore, LocusStoreContext, type Locus } from '@/entities/locus'
import { StatsPage, type StatsPageProps } from './StatsPage'

afterEach(cleanup)

function renderPage(props: StatsPageProps = {}) {
  render(
    <I18nextProvider i18n={i18n}>
      <ProgressStoreContext value={createProgressStore(new InMemoryRepository<Progress>())}>
        <PalaceStoreContext value={createPalaceStore(new InMemoryRepository<Palace>())}>
          <RoomStoreContext value={createRoomStore(new InMemoryRepository<Room>())}>
            <LocusStoreContext value={createLocusStore(new InMemoryRepository<Locus>())}>
              <StatsPage {...props} />
            </LocusStoreContext>
          </RoomStoreContext>
        </PalaceStoreContext>
      </ProgressStoreContext>
    </I18nextProvider>,
  )
}

describe('StatsPage', () => {
  it('renders the title and the six stat tiles', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Your Stats' })).toBeInTheDocument()
    expect(screen.getByText('Days trained')).toBeInTheDocument()
    expect(screen.getByText('Rooms completed')).toBeInTheDocument()
    expect(screen.getByText('Cards')).toBeInTheDocument()
    expect(screen.getByText('Due today')).toBeInTheDocument()
    expect(screen.getByText('Best quiz')).toBeInTheDocument()
  })

  it('calls onBack from the back control', async () => {
    const onBack = vi.fn()
    renderPage({ onBack })
    fireEvent.click(await screen.findByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})

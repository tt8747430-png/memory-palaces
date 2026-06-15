import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, PalaceStoreContext, type Palace } from '@/entities/palace'
import { createRoomStore, RoomStoreContext, type Room } from '@/entities/room'
import { PalaceDetailPage } from './PalaceDetailPage'

afterEach(cleanup)

function renderDetail(palaceId = 'p1') {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: new Date(0).toISOString(), name: 'Roman Forum' }),
  ])
  const roomRepo = new InMemoryRepository<Room>()
  render(
    <I18nextProvider i18n={i18n}>
      <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
        <RoomStoreContext value={createRoomStore(roomRepo)}>
          <PalaceDetailPage palaceId={palaceId} />
        </RoomStoreContext>
      </PalaceStoreContext>
    </I18nextProvider>,
  )
  return { roomRepo }
}

const addRoom = async (user: ReturnType<typeof userEvent.setup>, title: string) => {
  const input = screen.getByRole('textbox', { name: /new room title/i })
  await user.clear(input)
  await user.type(input, title)
  await user.click(screen.getByRole('button', { name: /add room/i }))
}

describe('PalaceDetailPage', () => {
  it('shows the palace name', async () => {
    renderDetail()
    expect(await screen.findByText('Roman Forum')).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown palace', async () => {
    renderDetail('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })

  it('creates rooms (persisted), reorders, and deletes them', async () => {
    const user = userEvent.setup()
    const { roomRepo } = renderDetail()

    await addRoom(user, 'Kitchen')
    expect(await screen.findByText('Kitchen')).toBeInTheDocument()
    await addRoom(user, 'Hallway')
    expect(await screen.findByText('Hallway')).toBeInTheDocument()
    expect(await roomRepo.getAll()).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /move hallway up/i }))
    await waitFor(() => {
      const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
      expect(titles).toEqual(['Hallway', 'Kitchen'])
    })

    await user.click(screen.getByRole('button', { name: /delete kitchen/i }))
    await waitFor(() => expect(screen.queryByText('Kitchen')).not.toBeInTheDocument())
    expect(await roomRepo.getAll()).toHaveLength(1)
  })
})

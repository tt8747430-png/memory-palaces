import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { makeRoom, type Room } from '@/entities/room'
import { RoomJourneyMap } from './RoomJourneyMap'

afterEach(cleanup)

const room = (id: string, order: number, title: string): Room =>
  makeRoom({ id, createdAt: new Date(0).toISOString(), palaceId: 'p1', title, order })

function renderMap(props: Partial<Parameters<typeof RoomJourneyMap>[0]> = {}) {
  const handlers = {
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
  }
  render(
    <I18nextProvider i18n={i18n}>
      <RoomJourneyMap rooms={[]} {...handlers} {...props} />
    </I18nextProvider>,
  )
  return handlers
}

describe('RoomJourneyMap', () => {
  it('shows an empty state when there are no rooms', () => {
    renderMap({ rooms: [] })
    expect(screen.getByText(/no rooms/i)).toBeInTheDocument()
  })

  it('renders rooms by title', () => {
    renderMap({ rooms: [room('a', 0, 'Kitchen'), room('b', 1, 'Hallway')] })
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
    expect(screen.getByText('Hallway')).toBeInTheDocument()
  })

  it('disables move-up for the first room and move-down for the last', () => {
    renderMap({ rooms: [room('a', 0, 'First'), room('b', 1, 'Last')] })
    expect(screen.getByRole('button', { name: /move first up/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /move last down/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /move first down/i })).toBeEnabled()
  })

  it('invokes move and delete callbacks for the targeted room', async () => {
    const user = userEvent.setup()
    const handlers = renderMap({ rooms: [room('a', 0, 'First'), room('b', 1, 'Last')] })

    await user.click(screen.getByRole('button', { name: /move last up/i }))
    await user.click(screen.getByRole('button', { name: /delete first/i }))

    expect(handlers.onMoveUp).toHaveBeenCalledWith('b')
    expect(handlers.onDelete).toHaveBeenCalledWith('a')
  })

  it('renames inline with the trimmed title', async () => {
    const user = userEvent.setup()
    const handlers = renderMap({ rooms: [room('a', 0, 'First')] })

    await user.click(screen.getByRole('button', { name: /rename first/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '  Cellar  ')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(handlers.onRename).toHaveBeenCalledWith('a', 'Cellar')
  })
})

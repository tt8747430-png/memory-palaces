import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { UpNextRoom } from '../lib/pick-up-next'
import { UpNextCard } from './UpNextCard'

afterEach(cleanup)

const room = (over: Partial<UpNextRoom> = {}): UpNextRoom => ({
  palaceId: 'p',
  palaceName: 'Home',
  palaceIcon: '🏠',
  roomId: 'r',
  roomTitle: 'Kitchen',
  total: 8,
  due: 3,
  bucket: 0,
  ...over,
})

function renderCard(rooms: UpNextRoom[]) {
  const onOpenRoom = vi.fn()
  const result = render(
    <I18nextProvider i18n={i18n}>
      <UpNextCard rooms={rooms} onOpenRoom={onOpenRoom} />
    </I18nextProvider>,
  )
  return { onOpenRoom, ...result }
}

describe('UpNextCard', () => {
  it('renders nothing when there are no rooms', () => {
    const { container } = renderCard([])
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a row with room, palace, card count, and due chip', () => {
    renderCard([room()])
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
    expect(screen.getByText(/Home/)).toBeInTheDocument()
    expect(screen.getByText('3 due')).toBeInTheDocument()
  })

  it('labels in-progress and not-started rooms', () => {
    renderCard([
      room({ roomId: 'a', bucket: 1, due: 0 }),
      room({ roomId: 'b', bucket: 2, due: 0 }),
    ])
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('Not started')).toBeInTheDocument()
  })

  it('opens the tapped room', async () => {
    const user = userEvent.setup()
    const { onOpenRoom } = renderCard([room({ roomId: 'kitchen' })])
    await user.click(screen.getByRole('button', { name: /kitchen/i }))
    expect(onOpenRoom).toHaveBeenCalledWith('kitchen')
  })
})

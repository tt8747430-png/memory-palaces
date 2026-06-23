import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { PalaceList, type PalaceListItem } from './PalaceList'

afterEach(cleanup)

const item = (over: Partial<PalaceListItem> = {}): PalaceListItem => ({
  id: 'a',
  name: 'Alpha',
  icon: '🏛️',
  color: 'from-sky-500 to-blue-600',
  category: 'General',
  favorite: false,
  bibleMode: false,
  archived: false,
  folderId: null,
  updatedAt: new Date(0).toISOString(),
  progress: 40,
  roomsCompleted: 2,
  totalRooms: 5,
  dueCount: 0,
  ...over,
})

function renderList(props: Partial<Parameters<typeof PalaceList>[0]> = {}) {
  const handlers = {
    onOpen: vi.fn(),
    onOpenSettings: vi.fn(),
    onToggleFavorite: vi.fn(),
    onMove: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
  }
  render(
    <I18nextProvider i18n={i18n}>
      <PalaceList
        items={[item()]}
        view="grid"
        emptyState={<p>No palaces yet</p>}
        {...handlers}
        {...props}
      />
    </I18nextProvider>,
  )
  return handlers
}

describe('PalaceList', () => {
  it('renders the provided empty state when there are no items', () => {
    renderList({ items: [] })
    expect(screen.getByText('No palaces yet')).toBeInTheDocument()
  })

  it('renders palaces by name in both grid and list views', () => {
    renderList({ items: [item({ id: 'a', name: 'Alpha' }), item({ id: 'b', name: 'Beta' })] })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    cleanup()
    renderList({ view: 'list', items: [item({ name: 'Gamma' })] })
    expect(screen.getByText('Gamma')).toBeInTheDocument()
  })

  it('shows the loading skeleton instead of items', () => {
    renderList({ loading: true })
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
  })

  it('marks favorites and scripture palaces for assistive tech', () => {
    renderList({ items: [item({ favorite: true, bibleMode: true })] })
    expect(screen.getByLabelText('Favorite')).toBeInTheDocument()
    expect(screen.getByLabelText('Scripture palace')).toBeInTheDocument()
  })

  it('surfaces a due count when cards are waiting, and hides it at zero', () => {
    renderList({ view: 'list', items: [item({ name: 'Roman Forum', dueCount: 3 })] })
    expect(screen.getByText('3 due')).toBeInTheDocument()
    cleanup()
    renderList({ view: 'list', items: [item({ name: 'Roman Forum', dueCount: 0 })] })
    expect(screen.queryByText(/\d+ due/)).not.toBeInTheDocument()
  })

  it('opens the action menu and routes delete + favorite to the right palace', async () => {
    const user = userEvent.setup()
    const handlers = renderList({ items: [item({ id: 'a', name: 'Alpha' })] })

    await user.click(screen.getByRole('button', { name: /more options for alpha/i }))
    const sheet = await screen.findByRole('dialog')

    await user.click(within(sheet).getByRole('button', { name: /add to favorites/i }))
    expect(handlers.onToggleFavorite).toHaveBeenCalledWith('a')

    await user.click(screen.getByRole('button', { name: /more options for alpha/i }))
    const reopened = await screen.findByRole('dialog')
    await user.click(within(reopened).getByRole('button', { name: /^delete$/i }))
    expect(handlers.onDelete).toHaveBeenCalledWith('a')
  })

  it('offers restore (not archive) for an archived palace', async () => {
    const user = userEvent.setup()
    const handlers = renderList({ items: [item({ id: 'a', name: 'Alpha', archived: true })] })

    await user.click(screen.getByRole('button', { name: /more options for alpha/i }))
    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('button', { name: /restore/i }))

    expect(handlers.onArchive).toHaveBeenCalledWith('a')
  })
})

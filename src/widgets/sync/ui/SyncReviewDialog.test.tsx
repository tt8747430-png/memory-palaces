import { SYNCED_TABLES } from '@/shared/config/sync-tables'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import {
  type SyncReviewItem,
  type SyncReviewRow,
  type SyncReviewRows,
  type SyncRunner,
  SyncRunnerContext,
} from '@/shared/lib'
import { SyncReviewDialog } from './SyncReviewDialog'

afterEach(cleanup)

const ITEMS: SyncReviewItem[] = [
  { collection: 'decks', id: 'd1', descendants: [{ collection: 'cards', id: 'c9' }] },
  { collection: 'cards', id: 'c1' },
]
const ROWS: SyncReviewRow[] = [
  { ...ITEMS[0]!, label: 'Kanji' },
  { ...ITEMS[1]!, label: 'What is 水?' },
]
const READY: SyncReviewRows = { state: 'ready', rows: ROWS }

function tree(runner: SyncRunner) {
  return (
    <I18nextProvider i18n={i18n}>
      <SyncRunnerContext value={runner}>
        <SyncReviewDialog />
      </SyncRunnerContext>
    </I18nextProvider>
  )
}

function mount(rows: SyncReviewRows = READY, items: SyncReviewItem[] = ITEMS) {
  const runner: SyncRunner = {
    phase: 'idle',
    error: null,
    review: { items, rows },
    tables: SYNCED_TABLES,
    run: vi.fn().mockResolvedValue({ kind: 'clean' }),
    restore: vi.fn().mockResolvedValue({ kind: 'clean' }),
    repair: vi.fn().mockResolvedValue({ kind: 'clean' }),
    openReview: vi.fn().mockResolvedValue({ kind: 'clean' }),
    resolve: vi.fn().mockResolvedValue({ kind: 'clean' }),
    dismiss: vi.fn(),
    reloadReview: vi.fn(),
  }
  const view = render(tree(runner))
  return {
    runner,
    rerenderWith: (next: SyncReviewRows, nextItems = items) =>
      view.rerender(tree({ ...runner, review: { items: nextItems, rows: next } })),
  }
}

describe('SyncReviewDialog', () => {
  it('names every document from the cloud’s copy, grouped outermost first', async () => {
    mount()

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Kanji')).toBeInTheDocument()
    const headings = within(dialog).getAllByRole('heading', { level: 3 })
    expect(headings.map((heading) => heading.textContent)).toEqual(['Decks', 'Cards'])
    expect(within(dialog).getByText(/1 thing added or changed inside it/)).toBeInTheDocument()
  })

  it('defaults every row to Delete — the person’s own recent intent', async () => {
    const { runner } = mount()
    await screen.findByText('Kanji')

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(runner.resolve).toHaveBeenCalledWith([
      { ...ROWS[0], keep: false },
      { ...ROWS[1], keep: false },
    ])
  })

  it('keeps the rows switched to Keep, and only those', async () => {
    const { runner } = mount()
    await screen.findByText('Kanji')

    const [deckRow] = screen.getAllByRole('listitem')
    await userEvent.click(within(deckRow!).getByRole('button', { name: 'Keep' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(runner.resolve).toHaveBeenCalledWith([
      { ...ROWS[0], keep: true },
      { ...ROWS[1], keep: false },
    ])
  })

  it('keeps everything in one press', async () => {
    const { runner } = mount()
    await screen.findByText('Kanji')

    await userEvent.click(screen.getByRole('button', { name: 'Keep everything' }))

    expect(runner.resolve).toHaveBeenCalledWith([
      { ...ROWS[0], keep: true },
      { ...ROWS[1], keep: true },
    ])
  })

  it('applies nothing when dismissed — the Sync is cancelled, not half-done', async () => {
    const { runner } = mount()
    await screen.findByText('Kanji')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(runner.dismiss).toHaveBeenCalled()
    expect(runner.resolve).not.toHaveBeenCalled()
  })

  it('shows a placeholder while the names are still on their way', async () => {
    mount({ state: 'loading' })

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
  })

  it('says so and asks the runner for the names again when they could not be loaded', async () => {
    const { runner, rerenderWith } = mount({ state: 'failed' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(runner.reloadReview).toHaveBeenCalled()
    rerenderWith(READY)
    expect(await screen.findByText('Kanji')).toBeInTheDocument()
    expect(runner.resolve).not.toHaveBeenCalled()
  })

  it('starts a new review from every row on Delete', async () => {
    const { runner, rerenderWith } = mount()
    await screen.findByText('Kanji')
    const [deckRow] = screen.getAllByRole('listitem')
    await userEvent.click(within(deckRow!).getByRole('button', { name: 'Keep' }))

    const next: SyncReviewItem[] = [{ collection: 'decks', id: 'd1' }]
    rerenderWith({ state: 'ready', rows: [{ ...next[0]!, label: 'Kanji' }] }, next)
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(runner.resolve).toHaveBeenCalledWith([{ ...next[0], label: 'Kanji', keep: false }])
  })

  it('lets the deletions stand when the cloud no longer holds any of them', async () => {
    const { runner } = mount({ state: 'ready', rows: [] })

    expect(await screen.findByText(/none of these are in the cloud/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => expect(runner.resolve).toHaveBeenCalledWith([]))
  })
})

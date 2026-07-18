import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DndContext } from '@dnd-kit/core'
import '@/shared/i18n'
import { makeDeck } from '@/decks/model/deck'
import type { Deck } from '@/decks/model/deck'
import { DeckTree } from './deck-tree'

const deckA: Deck = makeDeck({ id: 'a', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' })
const deckASub: Deck = makeDeck({
  id: 'a-sub',
  createdAt: '2026-07-16T00:00:00.000Z',
  name: 'European Capitals',
  parentId: 'a',
})
const deckB: Deck = makeDeck({ id: 'b', createdAt: '2026-07-16T00:00:00.000Z', name: 'Rivers' })

/** Owns the `expanded` set DeckTree is controlled by, mirroring how a real caller
 *  (the library page) would wire `onToggle` back into its own state. */
function Harness() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  return (
    <DndContext>
      <DeckTree
        decks={[deckA, deckASub, deckB]}
        cards={[]}
        expanded={expanded}
        onToggle={(deckId) =>
          setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(deckId)) next.delete(deckId)
            else next.add(deckId)
            return next
          })
        }
        onOpen={() => {}}
        selectMode={false}
        selectedIds={new Set()}
        onRequestSelect={() => {}}
        onToggleSelect={() => {}}
      />
    </DndContext>
  )
}

describe('DeckTree', () => {
  it('renders top-level deck rows and keeps subdecks hidden until expanded', () => {
    render(<Harness />)

    expect(screen.getByText('Capitals')).toBeInTheDocument()
    expect(screen.getByText('Rivers')).toBeInTheDocument()
    expect(screen.queryByText('European Capitals')).not.toBeInTheDocument()
  })

  it('expands and collapses a deck with subdecks via its toggle', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Expand' }))
    expect(screen.getByText('European Capitals')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Collapse' }))
    // The subdeck list exits via a `motion` height/opacity animation, so its row
    // leaves the DOM only once that exit finishes — wait for it instead of
    // asserting synchronously.
    await waitFor(() => expect(screen.queryByText('European Capitals')).not.toBeInTheDocument())
  })
})

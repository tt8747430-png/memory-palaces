import { beforeEach, describe, expect, it } from 'vitest'
import { useImportDraft } from './import-draft'

describe('importDraft store', () => {
  beforeEach(() => useImportDraft.getState().clear())

  it('seeds a draft with local ids from parsed cards', () => {
    useImportDraft.getState().setDraft('mindscape', [
      { front: 'a', back: 'A', flagged: true },
      { front: 'b', back: 'B' },
    ])
    const draft = useImportDraft.getState().draft
    expect(draft?.source).toBe('mindscape')
    expect(draft?.cards).toHaveLength(2)
    expect(draft?.cards[0]?.id).toBeTruthy()
    expect(draft?.cards[0]?.flagged).toBe(true)
  })

  it('edits a card by id without disturbing the others', () => {
    useImportDraft.getState().setDraft('paste', [
      { front: 'a', back: 'A' },
      { front: 'b', back: 'B' },
    ])
    const id = useImportDraft.getState().draft!.cards[0]!.id
    useImportDraft.getState().editCard(id, { front: 'a2', hint: 'cue' })
    const cards = useImportDraft.getState().draft!.cards
    expect(cards[0]).toMatchObject({ front: 'a2', hint: 'cue', back: 'A' })
    expect(cards[1]?.front).toBe('b')
  })

  it('removes a card and clears the whole draft', () => {
    useImportDraft.getState().setDraft('anki', [
      { front: 'a', back: 'A' },
      { front: 'b', back: 'B' },
    ])
    const id = useImportDraft.getState().draft!.cards[0]!.id
    useImportDraft.getState().removeCard(id)
    expect(useImportDraft.getState().draft!.cards).toHaveLength(1)

    useImportDraft.getState().clear()
    expect(useImportDraft.getState().draft).toBeNull()
  })
})

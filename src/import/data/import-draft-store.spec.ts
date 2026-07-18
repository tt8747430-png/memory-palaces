import { beforeEach, describe, expect, it } from 'vitest'
import { ImportDraftStore } from './import-draft-store'

describe('ImportDraftStore', () => {
  let store: ImportDraftStore

  beforeEach(() => {
    store = new ImportDraftStore()
  })

  it('seeds a draft with local ids from parsed cards', () => {
    store.setDraft('mindscape', [
      { front: 'a', back: 'A', flagged: true },
      { front: 'b', back: 'B' },
    ])

    const draft = store.draft()
    expect(draft?.source).toBe('mindscape')
    expect(draft?.cards).toHaveLength(2)
    expect(draft?.cards[0]?.id).toBeTruthy()
    expect(draft?.cards[0]?.flagged).toBe(true)
  })

  it('edits a card by id without disturbing the others', () => {
    store.setDraft('paste', [
      { front: 'a', back: 'A' },
      { front: 'b', back: 'B' },
    ])
    const id = store.draft()!.cards[0]!.id

    store.editCard(id, { front: 'a2', hint: 'cue' })

    const cards = store.draft()!.cards
    expect(cards[0]).toMatchObject({ front: 'a2', hint: 'cue', back: 'A' })
    expect(cards[1]?.front).toBe('b')
  })

  it('removes a card and clears the whole draft', () => {
    store.setDraft('anki', [
      { front: 'a', back: 'A' },
      { front: 'b', back: 'B' },
    ])
    const id = store.draft()!.cards[0]!.id

    store.removeCard(id)
    expect(store.draft()!.cards).toHaveLength(1)

    store.clear()
    expect(store.draft()).toBeNull()
  })

  it('notifies subscribers when the draft changes', () => {
    let notifications = 0
    store.draft.subscribe(() => notifications++)

    store.setDraft('paste', [{ front: 'a', back: 'A' }])
    store.clear()

    expect(notifications).toBe(2)
  })

  it('ignores edits and removals while no draft is open', () => {
    store.editCard('nope', { front: 'x' })
    store.removeCard('nope')

    expect(store.draft()).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createBibleVerseStore } from '../model/store'
import { type BibleVerse, makeBibleVerse } from '../model/verse'
import { keepMissingVerses } from './keep-missing-verses'

const verse = (number: number, text: string) =>
  makeBibleVerse({
    createdAt: 't0',
    translation: 'cornilescu-2024',
    book: 'JHN',
    chapter: 3,
    verse: number,
    text,
  })

describe('keepMissingVerses', () => {
  it('saves only the verses the library does not hold, and never overwrites one it does', async () => {
    const store = started(
      createBibleVerseStore(new InMemoryRepository<BibleVerse>([verse(16, 'held')])),
    )

    const saved = await keepMissingVerses(store, [verse(16, 'pasted'), verse(17, 'new')])

    expect(saved).toBe(1)
    expect(store.getState().verses.map((held) => [held.verse, held.text])).toEqual([
      [16, 'held'],
      [17, 'new'],
    ])
  })

  it('saves nothing when there is nothing new', async () => {
    const store = started(createBibleVerseStore(new InMemoryRepository<BibleVerse>([])))
    expect(await keepMissingVerses(store, [])).toBe(0)
  })
})

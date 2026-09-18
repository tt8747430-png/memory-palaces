import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createBibleVerseStore } from '../model/store'
import type { BibleVerse } from '../model/verse'
import { keepVersesCanonical } from './keep-verses-canonical'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const legacy = (over: Partial<BibleVerse> = {}): BibleVerse => ({
  id: 'web:1 Corinteni:8:9',
  createdAt: 't1',
  updatedAt: 't1',
  translation: 'web',
  book: '1 Corinteni',
  chapter: 8,
  verse: 9,
  text: 'Luați seama',
  ...over,
})

async function keep(rows: BibleVerse[]) {
  const repo = new InMemoryRepository<BibleVerse>(rows)
  const store = createBibleVerseStore(repo)
  store.getState().start()
  const stop = keepVersesCanonical(store)
  await flush()
  await flush()
  return { repo, store, stop }
}

describe('keepVersesCanonical', () => {
  it('moves a legacy row onto its canonical id and removes the old one', async () => {
    const { repo, stop } = await keep([legacy()])
    const rows = await repo.getAll()
    expect(rows.map((row) => row.id)).toEqual(['cornilescu-2024:1CO:8:9'])
    expect(rows[0]).toMatchObject({
      translation: 'cornilescu-2024',
      book: '1CO',
      text: 'Luați seama',
    })
    stop()
  })

  it('keeps a canonical row that is newer, and only drops the legacy one', async () => {
    const canonical: BibleVerse = {
      ...legacy(),
      id: 'cornilescu-2024:1CO:8:9',
      translation: 'cornilescu-2024',
      book: '1CO',
      text: 'newer',
      updatedAt: 't2',
    }
    const { repo, stop } = await keep([legacy(), canonical])
    const rows = await repo.getAll()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.text).toBe('newer')
    stop()
  })

  it('overwrites an older canonical row with the newer legacy text', async () => {
    const canonical: BibleVerse = {
      ...legacy(),
      id: 'cornilescu-2024:1CO:8:9',
      translation: 'cornilescu-2024',
      book: '1CO',
      text: 'older',
      updatedAt: 't0',
    }
    const { repo, stop } = await keep([legacy(), canonical])
    const rows = await repo.getAll()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.text).toBe('Luați seama')
    stop()
  })

  it('reads an English book name too', async () => {
    const { repo, stop } = await keep([
      legacy({ id: 'web:1 Thessalonians:1:1', book: '1 Thessalonians', chapter: 1, verse: 1 }),
    ])
    expect((await repo.getAll()).map((row) => row.id)).toEqual(['cornilescu-2024:1TH:1:1'])
    stop()
  })

  it('leaves a row whose book names nothing', async () => {
    const { repo, stop } = await keep([legacy({ id: 'web:Zeus:1:1', book: 'Zeus' })])
    expect((await repo.getAll()).map((row) => row.id)).toEqual(['web:Zeus:1:1'])
    stop()
  })

  it('writes nothing for a library that is already canonical', async () => {
    const canonical: BibleVerse = {
      ...legacy(),
      id: 'cornilescu-2024:1CO:8:9',
      translation: 'cornilescu-2024',
      book: '1CO',
    }
    const repo = new InMemoryRepository<BibleVerse>([canonical])
    let writes = 0
    const save = repo.save.bind(repo)
    repo.save = async (entity) => {
      writes += 1
      return save(entity)
    }
    const store = createBibleVerseStore(repo)
    store.getState().start()
    const stop = keepVersesCanonical(store)
    await flush()
    expect(writes).toBe(0)
    stop()
  })

  it('does nothing once stopped', async () => {
    const repo = new InMemoryRepository<BibleVerse>([])
    const store = createBibleVerseStore(repo)
    store.getState().start()
    keepVersesCanonical(store)()
    await store.getState().save(legacy())
    await flush()
    expect((await repo.getAll()).map((row) => row.id)).toEqual(['web:1 Corinteni:8:9'])
  })
})

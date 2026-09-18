import { selectIsReady } from '@/shared/lib'
import { isBookCode } from '../model/canon'
import type { BibleVerseStore } from '../model/store'
import { type BibleVerse, refKey } from '../model/verse'

const canonicalId = (verse: BibleVerse): string =>
  refKey(verse.translation, verse.book, verse.chapter, verse.verse)

/**
 * Moves every verse onto the id its translation and book code give it. Rows published before
 * 2026-09-18 are keyed `web:1 Corinteni:8:9`; the store already reads them as Cornilescu and `1CO`
 * (`completeBibleVerse`), but their ids stay until this re-keys them. A keeper, not a migration: it
 * must see whether the canonical row already exists — a newer one wins — and replication writes
 * pulled rows unmigrated, so every device runs it. Idempotent, so two devices converge on one id.
 */
export function keepVersesCanonical(store: BibleVerseStore): () => void {
  let running = false
  const check = () => {
    const state = store.getState()
    if (running || !selectIsReady(state)) return
    const stale = state.verses.filter(
      (verse) => isBookCode(verse.book) && verse.id !== canonicalId(verse),
    )
    if (stale.length === 0) return
    running = true
    const held = new Map(state.verses.map((verse) => [verse.id, verse]))
    queueMicrotask(() => {
      void (async () => {
        for (const verse of stale) {
          const id = canonicalId(verse)
          const canonical = held.get(id)
          if (!canonical || canonical.updatedAt < verse.updatedAt) {
            await store.getState().save({ ...verse, id })
          }
          await store.getState().remove(verse.id)
        }
      })().finally(() => {
        running = false
        // Rows that arrived while this ran — a Sync pulling more legacy rows — get their turn now.
        check()
      })
    })
  }
  check()
  return store.subscribe(check)
}

import type { ExtensionActivation, ExtensionContext } from '@/shared/lib'
import { BIBLE_VERSES } from './ids'
import type { BibleServices } from './model/context'
import { createBibleVerseStore } from './model/store'
import { keepVersesCanonical } from './persistence/keep-verses-canonical'
import type { BibleVerse } from './model/verse'

/**
 * The extension's composition root. Called when the learner switches Bible on: its store starts
 * here, and the keeper that re-keys its legacy rows starts beside it. `deactivate` is switching it
 * off — it stops what this started, which is the whole of "backend off".
 */
export function activate(context: ExtensionContext): ExtensionActivation<BibleServices> {
  const verseStore = createBibleVerseStore(
    context.repository<BibleVerse>(BIBLE_VERSES),
    context.pending(BIBLE_VERSES),
  )
  verseStore.getState().start()
  const stopKeeping = keepVersesCanonical(verseStore)
  return {
    services: { verseStore },
    deactivate: () => {
      stopKeeping()
      verseStore.getState().stop()
    },
  }
}

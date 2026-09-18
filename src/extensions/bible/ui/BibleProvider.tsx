import { type ReactNode, useEffect, useMemo } from 'react'
import { useExtensionRepository } from '@/shared/lib'
import { BibleVerseStoreContext } from '../model/context'
import { createBibleVerseStore } from '../model/store'
import type { BibleVerse } from '../model/verse'

/**
 * Mounted only while the extension is on. This is the extension's composition root: its store
 * starts here and stops when this unmounts, and any keeper it ever grows is an effect in this
 * file. Disabling the extension unmounts it, which is the whole of "backend off".
 */
export function ExtensionProvider({ children }: { children: ReactNode }) {
  const repository = useExtensionRepository<BibleVerse>('bibleVerses')
  const store = useMemo(() => createBibleVerseStore(repository), [repository])

  useEffect(() => {
    store.getState().start()
    return () => store.getState().stop()
  }, [store])

  return <BibleVerseStoreContext value={store}>{children}</BibleVerseStoreContext>
}

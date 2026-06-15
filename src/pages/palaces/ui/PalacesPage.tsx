import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { selectIsReady, selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { createPalace, deletePalace, duplicatePalace, editPalace } from '@/features/palace'
import { PalaceList } from '@/widgets/palace-list'
import { Button } from '@/shared/ui'

export interface PalacesPageProps {
  /** Navigate to a palace's detail. Wired by the route (kept off the component for tests). */
  onOpenPalace?: (id: string) => void
}

/** Palaces screen — the first fully-vertical slice: reactive list off RxDB plus
 * create/edit/delete/duplicate, all persisting offline through the injected store. */
export function PalacesPage({ onOpenPalace }: PalacesPageProps = {}) {
  const { t } = useTranslation()
  const store = usePalaceStoreApi()
  const palaces = usePalaceStore(selectPalaces)
  const isReady = usePalaceStore(selectIsReady)
  const [name, setName] = useState('')

  // Begin the reactive subscription once; the store is a singleton, so start() is idempotent.
  useEffect(() => {
    store.getState().start()
  }, [store])

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    void createPalace(store, { name: trimmed })
    setName('')
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-safe pb-safe">
      <header className="pt-12">
        <h1 className="text-balance">{t('palaces.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('palaces.subtitle')}</p>
      </header>

      <form onSubmit={handleCreate} className="mt-6 flex gap-2">
        <input
          aria-label={t('palaces.createLabel')}
          placeholder={t('palaces.createPlaceholder')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-11 flex-1 rounded-control border border-border bg-card px-4 text-heading"
        />
        <Button type="submit" disabled={!isReady}>
          {t('palaces.create')}
        </Button>
      </form>

      <section className="mt-6 flex-1">
        <PalaceList
          palaces={palaces}
          onOpen={onOpenPalace}
          onRename={(id, newName) => void editPalace(store, id, { name: newName })}
          onDelete={(id) => void deletePalace(store, id)}
          onDuplicate={(id) => void duplicatePalace(store, id)}
        />
      </section>
    </main>
  )
}

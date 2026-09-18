import { BookOpen } from 'lucide-react'
import { Button, ToggleRow } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'
import type { HeldRef } from '../model/verse-cards'

export interface DuplicatesBannerProps {
  duplicates: readonly HeldRef[]
  keep: boolean
  onKeepChange: (keep: boolean) => void
  /** Opens the deck holding the first duplicate. */
  onShowDeck: (deckId: string) => void
}

/**
 * Names the verses the library already holds, with a way to see them and a way to add them
 * anyway. Nothing held, nothing shown.
 */
export function DuplicatesBanner({
  duplicates,
  keep,
  onKeepChange,
  onShowDeck,
}: DuplicatesBannerProps) {
  const t = useBibleT()
  const first = duplicates[0]
  if (!first) return null
  return (
    <section className="flex flex-col gap-2 rounded-card bg-info-surface p-4">
      <p className="text-body font-semibold text-info-foreground">
        {t('duplicates', { refs: duplicates.map((entry) => entry.front).join(', ') })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onShowDeck(first.deckId)}>
          <BookOpen className="size-4" aria-hidden />
          {t('showMe')}
        </Button>
        <ToggleRow
          surface="plain"
          label={t('duplicatesSkip')}
          checked={keep}
          onChange={onKeepChange}
        />
      </div>
    </section>
  )
}

import { useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import { Button, ToggleRow } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'
import { summariseRefs } from '../model/summarise-refs'
import type { HeldRef } from '../model/verse-cards'

export interface DuplicatesBannerProps {
  duplicates: readonly HeldRef[]
  keep: boolean
  onKeepChange: (keep: boolean) => void
  /** Opens the deck holding the first duplicate. */
  onShowDeck: (deckId: string) => void
}

/**
 * Names the verses the library already holds, with a way to see them and a way to add them anyway.
 * The references are collapsed into runs and capped — a whole chapter already held is a sentence,
 * not a wall of twenty-eight commas. Nothing held, nothing shown.
 */
export function DuplicatesBanner({
  duplicates,
  keep,
  onKeepChange,
  onShowDeck,
}: DuplicatesBannerProps) {
  const t = useBibleT()
  const summary = useMemo(() => summariseRefs(duplicates.map((entry) => entry.front)), [duplicates])
  const first = duplicates[0]
  if (!first) return null
  return (
    <section className="flex flex-col gap-2 rounded-card border border-(--info-border) bg-info-surface p-4">
      <p className="text-body font-semibold text-info-foreground">
        {t('duplicates', { count: duplicates.length, refs: summary.text })}
        {summary.more > 0 ? ` ${t('duplicatesMore', { count: summary.more })}` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onShowDeck(first.deckId)}>
          <BookOpen className="size-4" aria-hidden />
          {t('showMe')}
        </Button>
        <ToggleRow
          surface="plain"
          label={t('duplicatesSkip')}
          description={t('duplicatesSkipHint')}
          checked={keep}
          onChange={onKeepChange}
        />
      </div>
    </section>
  )
}

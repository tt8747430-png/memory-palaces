import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import type { ParsedCard } from '@/shared/lib'

const PREVIEW_LIMIT = 6

export function PastePreview({ cards }: { cards: ParsedCard[] }) {
  const { t } = useTranslation()
  const shown = cards.slice(0, PREVIEW_LIMIT)
  const rest = cards.length - shown.length
  return (
    <div>
      <span className="mb-2 block text-(length:--p-text-label) font-semibold text-heading">
        {t('cards.paste.previewLabel')}
      </span>
      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card shadow-rest">
        {shown.map((card, i) => (
          <li key={i} className="flex items-center gap-2.5 px-3.5 py-2.5">
            <span className="min-w-0 flex-1 truncate text-(length:--p-text-label) font-semibold text-heading">
              {card.front}
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-(length:--p-text-label) text-muted-foreground">
              {card.back}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p className="mt-1.5 px-1 text-(length:--p-text-label) text-muted-foreground">
          {t('cards.paste.moreCards', { count: rest })}
        </p>
      ) : null}
    </div>
  )
}

export function CountBadge({ count }: { count: number }) {
  const { t } = useTranslation()
  if (count === 0) return null
  return (
    <span className="rounded-pill bg-info-surface px-2.5 py-1 text-(length:--p-text-tiny) font-bold tabular-nums text-info-foreground">
      {t('cards.paste.found', { count })}
    </span>
  )
}

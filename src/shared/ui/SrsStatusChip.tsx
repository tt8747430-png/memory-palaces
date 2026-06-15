import { useTranslation } from 'react-i18next'
import { srsStatus, type SrsState, type SrsStatus } from '@/shared/lib'
import { cn } from '@/shared/lib'

/** Tone per status — each pre-checked to clear AA at small sizes. State is shown by
 * label + tone, never color alone. */
const TONE: Record<SrsStatus, string> = {
  new: 'bg-info-surface text-info-foreground',
  learning: 'bg-secondary text-secondary-foreground',
  due: 'bg-[var(--warning-surface)] text-[var(--warning-foreground)]',
  known: 'bg-[var(--success-surface)] text-[var(--success-on-surface)]',
}

const LABEL: Record<SrsStatus, `srs.${SrsStatus}`> = {
  new: 'srs.new',
  learning: 'srs.learning',
  due: 'srs.due',
  known: 'srs.known',
}

/** Badge for a card's spaced-repetition status (new / due / learning / known),
 * derived from its schedule via `srsStatus`. */
export function SrsStatusChip({ srs, now = Date.now() }: { srs?: SrsState; now?: number }) {
  const { t } = useTranslation()
  const status = srsStatus(srs, now)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-control px-2 py-0.5',
        'text-[length:var(--p-text-tiny)] font-semibold',
        TONE[status],
      )}
    >
      {t(LABEL[status])}
    </span>
  )
}

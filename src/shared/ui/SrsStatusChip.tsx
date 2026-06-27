import { useTranslation } from 'react-i18next'
import { cn, type SrsState, type SrsStatus, srsStatus } from '@/shared/lib'

/** Tone per maturity — each pre-checked to clear AA at small sizes. State is shown by
 * label + tone, never color alone. */
const TONE: Record<SrsStatus, string> = {
  new: 'bg-info-surface text-info-foreground',
  learning: 'bg-secondary text-secondary-foreground',
  known: 'bg-[var(--success-surface)] text-[var(--success-on-surface)]',
}

const LABEL: Record<SrsStatus, `srs.${SrsStatus}`> = {
  new: 'srs.new',
  learning: 'srs.learning',
  known: 'srs.known',
}

/** Badge for a card's maturity (new / learning / known), derived from its schedule
 * via `srsStatus`. Due-ness is shown by the study overview, not on this chip. */
export function SrsStatusChip({ srs }: { srs?: SrsState }) {
  const { t } = useTranslation()
  const status = srsStatus(srs)
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

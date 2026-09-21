import { BookOpenCheck, BookOpen } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useBibleT } from '../../i18n/use-bible-t'
import type { PassageText } from '../../model/passage-text'
import { formatRef, type VerseRef } from '../../model/reference'
import { summariseVerseRefs } from '../../model/summarise-refs'

export interface PassageSummaryProps {
  passage: VerseRef
  text: PassageText
  onChange: () => void
}

/** The chosen passage, collapsed: what it is, how much of it the Bible library holds, and Change. */
export function PassageSummary({ passage, text, onChange }: PassageSummaryProps) {
  const t = useBibleT()
  const count = passage.to - passage.from + 1
  const status =
    text.held === count
      ? t('summaryAll', { count })
      : text.held === 0
        ? t('summaryNone', { count })
        : t('summarySome', { held: text.held, count, missing: missingRefs(passage, text) })
  const Icon = text.held === count ? BookOpenCheck : BookOpen

  return (
    <section
      aria-label={formatRef(passage)}
      className="flex items-center gap-3 rounded-card border border-border bg-card p-4 shadow-rest"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-control bg-info-surface text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-title font-semibold tabular-nums text-heading">
          {formatRef(passage)}
        </span>
        <span className="block text-label leading-snug text-muted-foreground">{status}</span>
      </span>
      <Button variant="secondary" onClick={onChange}>
        {t('change')}
      </Button>
    </section>
  )
}

/** The verses the library lacks, named as runs — `3:2–4, 3:7` — rather than counted. */
function missingRefs(passage: VerseRef, text: PassageText): string {
  const refs = text.missing.map((verse) => ({ ...passage, from: verse, to: verse }))
  const { text: named, more } = summariseVerseRefs(refs)
  return more ? `${named} +${more}` : named
}

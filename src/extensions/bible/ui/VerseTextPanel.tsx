import { Textarea } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'

export interface VerseTextPanelProps {
  value: string
  onChange: (value: string) => void
  /** Said above the box: where this text came from, or that it is not held yet. */
  note?: string
}

/**
 * On screen at every step, including before a book is picked — that is what lets a learner paste a
 * passage they already have without first walking the picker, and it needs no separate mode.
 */
export function VerseTextPanel({ value, onChange, note }: VerseTextPanelProps) {
  const t = useBibleT()
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-body font-bold text-heading">{t('verseText')}</h2>
      {note ? <p className="text-label leading-snug text-muted-foreground">{note}</p> : null}
      <Textarea
        rows={6}
        value={value}
        aria-label={t('verseText')}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  )
}

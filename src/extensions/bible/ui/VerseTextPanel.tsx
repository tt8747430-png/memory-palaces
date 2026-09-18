import { Textarea } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'
import { translationName } from '../model/translations'

export interface VerseTextPanelProps {
  value: string
  onChange: (value: string) => void
  /** What to say about the text above the box, or nothing. */
  note: string | null
  /** The translation's id; the panel shows its name. */
  translation: string
}

/**
 * On screen before a book is picked too — that is what lets a learner paste a passage they already
 * have without first walking the picker, and it needs no separate mode.
 *
 * Never `autoFocus`: on a full-page input that opens the keyboard over the page's own footer before
 * the learner has seen it, and the mount-time pan lands before any keyboard height is measured
 * (CODE_STYLE §11).
 */
export function VerseTextPanel({ value, onChange, note, translation }: VerseTextPanelProps) {
  const t = useBibleT()
  return (
    <section className="flex flex-col gap-2">
      <h2 id="bible-verse-text" className="text-body font-bold text-heading">
        {t('verseText')}
      </h2>
      {note ? <p className="text-label leading-snug text-muted-foreground">{note}</p> : null}
      <Textarea
        rows={6}
        value={value}
        aria-labelledby="bible-verse-text"
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-label text-muted-foreground">{translationName(translation)}</p>
    </section>
  )
}

import type { ReactNode } from 'react'
import { Textarea } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'
import { translationName } from '../model/translations'

export interface VerseTextPanelProps {
  value: string
  onChange: (value: string) => void
  /** True once the Bible library filled the box, so the note says where the text came from. */
  prefilled: boolean
  /** Said only once a complete passage is chosen; before that there is nothing to report on. */
  note: boolean
  /** The translation's id; the panel shows its name. */
  translation: string
  /** An extra control beside the translation line — today the dev-mode publish button. */
  action?: ReactNode
}

/**
 * On screen at every step, including before a book is picked — that is what lets a learner paste a
 * passage they already have without first walking the picker, and it needs no separate mode.
 *
 * Never `autoFocus`: on a full-page input that opens the keyboard over the page's own footer before
 * the learner has seen it, and the mount-time pan lands before any keyboard height is measured
 * (CODE_STYLE §11).
 */
export function VerseTextPanel({
  value,
  onChange,
  prefilled,
  note,
  translation,
  action,
}: VerseTextPanelProps) {
  const t = useBibleT()
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-body font-bold text-heading">{t('verseText')}</h2>
      {note ? (
        <p className="text-label leading-snug text-muted-foreground">
          {prefilled ? t('textImported') : t('textMissing')}
        </p>
      ) : null}
      <Textarea
        rows={6}
        value={value}
        aria-label={t('verseText')}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-label text-muted-foreground">
          {t('translation')}: {translationName(translation)}
        </p>
        {action}
      </div>
    </section>
  )
}

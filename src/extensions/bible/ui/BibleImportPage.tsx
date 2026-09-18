import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppScreen, Button, ScreenHeader } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'
import { formatPartial } from '../model/reference'
import { usePassagePicker } from '../model/use-passage-picker'
import { BookPicker } from './BookPicker'
import { NumberGrid } from './NumberGrid'
import { VerseTextPanel } from './VerseTextPanel'

export interface BibleImportPageProps {
  onBack?: () => void
}

export function BibleImportPage({ onBack }: BibleImportPageProps) {
  const t = useBibleT()
  // The back label is core copy, not the extension's — one word, one place.
  const { t: core } = useTranslation()
  const picker = usePassagePicker()
  const [text, setText] = useState('')
  const { book, chapter, from, to, step } = picker
  const breadcrumb = formatPartial({ book, chapter, from, to })

  return (
    <AppScreen
      gutter="end"
      header={
        <ScreenHeader title={t('importTitle')} onBack={onBack} backLabel={core('common.back')} />
      }
    >
      <div className="mt-4 flex flex-col gap-5">
        {breadcrumb ? (
          <p className="text-center text-title font-semibold tabular-nums text-heading">
            {breadcrumb}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={picker.startOver}>
            {t('startOver')}
          </Button>
          {step === 'done' ? (
            <Button variant="secondary" size="sm" onClick={picker.changeVerses}>
              {t('changeVerses')}
            </Button>
          ) : null}
        </div>

        {step === 'book' ? <BookPicker onPick={picker.pickBook} /> : null}
        {step === 'chapter' ? (
          <NumberGrid
            label={t('pickChapter')}
            values={picker.chapterOptions}
            onPick={picker.pickChapter}
          />
        ) : null}
        {step === 'from' ? (
          <NumberGrid
            label={t('pickStart')}
            values={picker.startOptions}
            onPick={picker.pickFrom}
          />
        ) : null}
        {step === 'to' && from ? (
          <NumberGrid
            label={t('pickEnd')}
            values={picker.endOptions}
            onPick={picker.pickTo}
            lead={{ label: t('justVerse', { verse: from }), onPick: () => picker.pickTo(from) }}
          />
        ) : null}

        <VerseTextPanel value={text} onChange={setText} />
      </div>
    </AppScreen>
  )
}

export function BibleImportScreen() {
  return <BibleImportPage />
}

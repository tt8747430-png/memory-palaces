import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BookOpen, ClipboardPaste, Eraser, Sparkles } from 'lucide-react'
import {
  AppScreen,
  Button,
  FooterBar,
  Input,
  ScreenHeader,
  Textarea,
  TextButton,
} from '@/shared/ui'
import { useImportDraft } from '@/widgets/content-editor'
import { usePasteParsing } from '../model/use-paste-parsing'
import { FormatToggle } from './FormatToggle'
import { CountBadge, PastePreview } from './PastePreview'
import { SeparatorSettings } from './SeparatorSettings'

export interface PasteNotesPageProps {
  onBack: () => void
  newDeck?: boolean
  defaultDeckName?: string
  onReview: (deckName?: string) => void
}

export function PasteNotesPage({
  onBack,
  onReview,
  newDeck = false,
  defaultDeckName = '',
}: PasteNotesPageProps) {
  const { t } = useTranslation()
  const setDraft = useImportDraft((s) => s.setDraft)
  const parsing = usePasteParsing()

  // A pasted Bible chapter names the deck after itself, so the name follows what is in the box —
  // until the reader types one. From then on the field is theirs and no paste overwrites it.
  const [typedName, setTypedName] = useState<string | null>(null)
  const deckName = typedName ?? (parsing.suggestedName || defaultDeckName)

  const canReadClipboard =
    typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function'

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (clip.trim()) parsing.setText(clip)
    } catch {
      toast.error(t('cards.paste.clipboardError'))
    }
  }

  const canCreate = parsing.cards.length > 0 && (!newDeck || deckName.trim().length > 0)

  const create = () => {
    if (!canCreate) return
    setDraft('paste', parsing.cards)
    onReview(newDeck ? deckName.trim() : undefined)
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('cards.paste.title')} onBack={onBack} backLabel={t('common.back')} />
      }
      footer={
        <FooterBar>
          <Button size="lg" className="w-full" disabled={!canCreate} onClick={create}>
            <Sparkles className="size-4.5" aria-hidden />
            {parsing.cards.length > 0
              ? t('cards.paste.createCount', { count: parsing.cards.length })
              : t('cards.paste.create')}
          </Button>
        </FooterBar>
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-6">
        {newDeck ? (
          <div>
            <span className="mb-2 block text-(length:--p-text-sub) font-bold text-heading">
              {t('cards.paste.deckNameLabel')}
            </span>
            <Input
              aria-label={t('cards.paste.deckNameLabel')}
              value={deckName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={t('deck.namePlaceholder')}
              maxLength={60}
            />
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-(length:--p-text-sub) font-bold text-heading">
              {t('cards.paste.dataLabel')}
            </span>
            <CountBadge count={parsing.cards.length} />
          </div>
          <Textarea
            value={parsing.text}
            onChange={(e) => parsing.setText(e.target.value)}
            placeholder={
              parsing.format === 'bible'
                ? t('cards.paste.biblePlaceholder')
                : t('cards.paste.notesPlaceholder')
            }
            rows={8}
            className="min-h-46 font-mono text-(length:--p-text-label) leading-relaxed"
          />
          <div className="mt-2 flex items-center gap-4">
            {canReadClipboard ? (
              <TextButton
                icon={<ClipboardPaste className="size-4" aria-hidden />}
                onClick={() => void pasteFromClipboard()}
              >
                {t('cards.paste.pasteFromClipboard')}
              </TextButton>
            ) : null}
            {parsing.text ? (
              <TextButton
                icon={<Eraser className="size-4" aria-hidden />}
                tone="muted"
                onClick={() => parsing.setText('')}
              >
                {t('cards.paste.clear')}
              </TextButton>
            ) : null}
          </div>
        </div>

        <FormatToggle
          value={parsing.format}
          auto={parsing.auto}
          onChange={parsing.setFormat}
          onReset={parsing.resetFormat}
        />

        {parsing.format === 'bible' ? <BibleHint /> : <SeparatorSettings parsing={parsing} />}

        {parsing.text.trim() ? (
          parsing.cards.length > 0 ? (
            <PastePreview cards={parsing.cards} />
          ) : (
            <p className="rounded-card bg-secondary/40 px-4 py-3 text-(length:--p-text-label) text-muted-foreground">
              {t('cards.paste.noneParsed')}
            </p>
          )
        ) : null}
      </div>
    </AppScreen>
  )
}

function BibleHint() {
  const { t } = useTranslation()
  return (
    <div className="flex items-start gap-3 rounded-card bg-info-surface p-4">
      <BookOpen className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
      <div>
        <p className="text-(length:--p-text-sub) font-semibold text-heading">
          {t('cards.paste.bibleHintTitle')}
        </p>
        <p className="mt-0.5 text-(length:--p-text-label) leading-snug text-info-foreground">
          {t('cards.paste.bibleHint')}
        </p>
      </div>
    </div>
  )
}

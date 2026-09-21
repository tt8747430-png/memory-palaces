import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Layers, Maximize2, RotateCcw } from 'lucide-react'
import { type CardStyle, DEFAULT_CARD_STYLE, useDeck, useDeckStoreApi } from '@/entities/deck'
import {
  applyCardStyle,
  cardStyleTargets,
  type CardStyleScope,
  updateDeckSettings,
} from '@/features/deck'
import { sameCardStyle } from '@/shared/lib'
import { CardStyleFields, StylePreview } from '@/widgets/card-style-form'
import {
  ActionSheet,
  AppScreen,
  Button,
  CardScene,
  ConfirmDialog,
  FooterBar,
  IconButton,
  ScreenHeader,
  type SheetAction,
} from '@/shared/ui'
import { StyleFullscreen } from './StyleFullscreen'

export interface DeckCardStylePageProps {
  deckId: string
  onBack?: () => void
}

const PREVIEW_PANE = 'grid place-items-center h-(--preview-pane-height) px-5 py-4'

export function DeckCardStylePage({ deckId, onBack }: DeckCardStylePageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const { decks, deck, settings, ready } = useDeck(deckId)
  const [fullscreen, setFullscreen] = useState(false)
  /** One question at a time: which scope, then — for every deck — whether they meant it. */
  const [ask, setAsk] = useState<'scope' | 'everywhere' | null>(null)
  const [draft, setDraft] = useState<CardStyle | null>(null)

  if (!ready || !deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('cardStyle.title')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const saved = settings.cardStyle
  const style = draft ?? saved
  const dirty = draft !== null && !sameCardStyle(draft, saved)
  const canReset = !sameCardStyle(style, DEFAULT_CARD_STYLE)

  const subtreeCount = cardStyleTargets(decks, { kind: 'subtree', deckId }).length
  const libraryCount = cardStyleTargets(decks, { kind: 'all' }).length

  const apply = () => {
    void updateDeckSettings(deckStore, deckId, { cardStyle: style })
      .then(() => {
        setDraft(null)
        toast.success(t('cardStyle.applied'))
      })
      .catch(() => toast.error(t('cardStyle.applyFailed')))
  }

  const applyTo = (scope: CardStyleScope) => {
    void applyCardStyle(deckStore, style, scope)
      .then((changed) => {
        setDraft(null)
        toast.success(t('cardStyle.appliedToDecks', { count: changed }))
      })
      .catch(() => toast.error(t('cardStyle.applyFailed')))
  }

  const scopeActions: SheetAction[] = [
    {
      id: 'deck',
      label: t('cardStyle.scopeThisDeck'),
      onSelect: () => applyTo({ kind: 'deck', deckId }),
    },
    ...(subtreeCount > 1
      ? [
          {
            id: 'subtree',
            label: t('cardStyle.scopeSubtree', { count: subtreeCount }),
            onSelect: () => applyTo({ kind: 'subtree', deckId }),
          },
        ]
      : []),
    {
      id: 'all',
      label: t('cardStyle.scopeEveryDeck', { count: libraryCount }),
      onSelect: () => setAsk('everywhere'),
    },
  ]

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={t('cardStyle.title')}
          subtitle={deck.name}
          onBack={onBack}
          backLabel={t('common.back')}
          action={
            <div className="flex items-center gap-1">
              <IconButton
                variant="glass"
                aria-label={t('cardStyle.fullscreen')}
                onClick={() => setFullscreen(true)}
              >
                <Maximize2 className="size-5" aria-hidden />
              </IconButton>
              <IconButton
                variant="glass"
                aria-label={t('cardStyle.reset')}
                disabled={!canReset}
                onClick={() => setDraft(DEFAULT_CARD_STYLE)}
              >
                <RotateCcw className="size-5" aria-hidden />
              </IconButton>
            </div>
          }
        />
      }
      pinned={
        <CardScene style={style} className={PREVIEW_PANE}>
          <StylePreview
            style={style}
            front={t('cardStyle.previewFront')}
            back={t('cardStyle.previewBack')}
            className="h-full w-full"
          />
        </CardScene>
      }
      footer={
        <FooterBar className="flex gap-2">
          <Button
            size="lg"
            variant="secondary"
            className={dirty ? 'flex-1' : 'w-full'}
            onClick={() => setAsk('scope')}
          >
            <Layers className="size-4.5" aria-hidden />
            {t('cardStyle.applyTo')}
          </Button>
          {dirty ? (
            <Button size="lg" className="flex-1" onClick={apply}>
              <Check className="size-4.5" aria-hidden />
              {t('cardStyle.apply')}
            </Button>
          ) : null}
        </FooterBar>
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-8">
        <CardStyleFields style={style} onChange={setDraft} />
      </div>

      <StyleFullscreen
        open={fullscreen}
        onOpenChange={setFullscreen}
        style={style}
        front={t('cardStyle.previewFront')}
        back={t('cardStyle.previewBack')}
      />

      <ActionSheet
        open={ask === 'scope'}
        onOpenChange={(open) => setAsk(open ? 'scope' : null)}
        title={t('cardStyle.applyTo')}
        description={t('cardStyle.applyToHint')}
        actions={scopeActions}
        cancelLabel={t('common.cancel')}
      />

      <ConfirmDialog
        open={ask === 'everywhere'}
        onOpenChange={(open) => setAsk(open ? 'everywhere' : null)}
        title={t('cardStyle.applyEverywhereTitle')}
        description={t('cardStyle.applyEverywhereBody', { count: libraryCount })}
        confirmLabel={t('cardStyle.applyEverywhereConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => applyTo({ kind: 'all' })}
      />
    </AppScreen>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlignCenter, AlignLeft, AlignRight, Check, Maximize2, RotateCcw, Type } from 'lucide-react'
import {
  CARD_FONTS,
  CARD_ALIGNMENTS,
  type CardAlignment,
  type CardStyle,
  DEFAULT_CARD_STYLE,
  useDeck,
  useDeckStoreApi,
} from '@/entities/deck'
import { updateDeckSettings } from '@/features/deck'
import { clampCardTextSize, sameCardStyle } from '@/shared/lib'
import {
  ActionSheet,
  AppScreen,
  Button,
  CardScene,
  FooterBar,
  IconButton,
  ScreenHeader,
  SegmentedControl,
  SettingsRow,
  SettingsSection,
  StepperRow,
} from '@/shared/ui'
import { PresetStrip } from './PresetStrip'
import { StyleFullscreen } from './StyleFullscreen'
import { StylePreview } from './StylePreview'

export interface DeckCardStylePageProps {
  deckId: string
  onBack?: () => void
}

const SIZE_STEP = 2

const PREVIEW_PANE = 'grid place-items-center h-(--preview-pane-height) px-5 py-4'

const ALIGN_ICONS: Record<CardAlignment, typeof AlignLeft> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
}

const ALIGN_LABEL_KEYS: Record<CardAlignment, string> = {
  left: 'cardStyle.alignLeft',
  center: 'cardStyle.alignCenter',
  right: 'cardStyle.alignRight',
}

export function DeckCardStylePage({ deckId, onBack }: DeckCardStylePageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const { deck, settings, ready } = useDeck(deckId)
  const [fontOpen, setFontOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
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

  const edit = (patch: Partial<CardStyle>) => setDraft({ ...style, ...patch })
  const step = (delta: number) => edit({ textSize: clampCardTextSize(style.textSize + delta) })

  const apply = () => {
    void updateDeckSettings(deckStore, deckId, { cardStyle: style })
    setDraft(null)
    toast.success(t('cardStyle.applied'))
  }

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
        dirty ? (
          <FooterBar>
            <Button size="lg" className="w-full" onClick={apply}>
              <Check className="size-4.5" aria-hidden />
              {t('cardStyle.apply')}
            </Button>
          </FooterBar>
        ) : (
          <div aria-hidden className="h-(--app-bottom-inset)" />
        )
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-8">
        <PresetStrip style={style} value={style.preset} onChange={(preset) => edit({ preset })} />

        <SettingsSection>
          <SettingsRow
            kind="nav"
            icon={<Type />}
            label={t('cardStyle.font')}
            value={t(`cardStyle.fontName.${style.font}` as never)}
            onClick={() => setFontOpen(true)}
          />
          <StepperRow
            label={t('cardStyle.textSize')}
            value={String(style.textSize)}
            decreaseLabel={t('cardStyle.decrease')}
            increaseLabel={t('cardStyle.increase')}
            onDecrease={() => step(-SIZE_STEP)}
            onIncrease={() => step(SIZE_STEP)}
          />
        </SettingsSection>

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-label font-semibold text-muted-foreground">
            {t('cardStyle.alignment')}
          </h2>
          <SegmentedControl
            aria-label={t('cardStyle.alignment')}
            value={style.alignment}
            onChange={(alignment) => edit({ alignment })}
            options={CARD_ALIGNMENTS.map((alignment) => {
              const Icon = ALIGN_ICONS[alignment]
              return {
                value: alignment,
                ariaLabel: t(ALIGN_LABEL_KEYS[alignment] as never),
                label: <Icon className="size-4.5" aria-hidden />,
              }
            })}
          />
        </section>
      </div>

      <StyleFullscreen
        open={fullscreen}
        onOpenChange={setFullscreen}
        style={style}
        front={t('cardStyle.previewFront')}
        back={t('cardStyle.previewBack')}
      />

      <ActionSheet
        open={fontOpen}
        onOpenChange={setFontOpen}
        title={t('cardStyle.fontTitle')}
        cancelLabel={t('common.cancel')}
        actions={CARD_FONTS.map((font) => ({
          id: font,
          label: t(`cardStyle.fontName.${font}` as never),
          selected: font === style.font,
          onSelect: () => edit({ font }),
        }))}
      />
    </AppScreen>
  )
}

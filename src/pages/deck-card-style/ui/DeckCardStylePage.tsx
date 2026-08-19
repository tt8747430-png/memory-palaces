import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Minus,
  Plus,
  RotateCcw,
  Type,
  Vibrate,
} from 'lucide-react'
import {
  CARD_FONTS,
  CARD_ALIGNMENTS,
  type CardAlignment,
  type CardStyle,
  DEFAULT_CARD_STYLE,
  useDeck,
  useDeckStoreApi,
} from '@/entities/deck'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { updateDeckSettings } from '@/features/deck'
import { setPreferences } from '@/features/preferences'
import { clampCardTextSize } from '@/shared/lib'
import {
  ActionSheet,
  AppScreen,
  IconButton,
  ScreenHeader,
  SegmentedControl,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { PresetStrip } from './PresetStrip'
import { StylePreview } from './StylePreview'

export interface DeckCardStylePageProps {
  deckId: string
  onBack?: () => void
}

const SIZE_STEP = 2

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
  const prefsStore = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const { deck, settings, ready } = useDeck(deckId)
  const [fontOpen, setFontOpen] = useState(false)

  if (!ready || !deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('cardStyle.title')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const style = settings.cardStyle

  const write = (patch: Partial<CardStyle>) =>
    void updateDeckSettings(deckStore, deckId, { cardStyle: { ...style, ...patch } })

  const step = (delta: number) => write({ textSize: clampCardTextSize(style.textSize + delta) })

  return (
    <AppScreen
      fill
      className="pb-nav"
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
                aria-label={t('cardStyle.haptics')}
                aria-pressed={prefs.haptics}
                onClick={() => void setPreferences(prefsStore, { haptics: !prefs.haptics })}
              >
                <Vibrate className="size-5" aria-hidden />
              </IconButton>
              <IconButton
                variant="glass"
                aria-label={t('cardStyle.reset')}
                onClick={() => {
                  write(DEFAULT_CARD_STYLE)
                  toast.success(t('cardStyle.resetDone'))
                }}
              >
                <RotateCcw className="size-5" aria-hidden />
              </IconButton>
            </div>
          }
        />
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-8">
        <StylePreview
          style={style}
          front={t('cardStyle.previewFront')}
          back={t('cardStyle.previewBack')}
        />

        <PresetStrip style={style} value={style.preset} onChange={(preset) => write({ preset })} />

        <SettingsSection>
          <SettingsRow
            kind="nav"
            icon={<Type />}
            label={t('cardStyle.font')}
            value={t(`cardStyle.fontName.${style.font}` as never)}
            onClick={() => setFontOpen(true)}
          />
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 text-(length:--p-text-sub) font-semibold text-heading">
              {t('cardStyle.textSize')}
            </span>
            <IconButton
              variant="glass"
              aria-label={t('cardStyle.decrease')}
              onClick={() => step(-SIZE_STEP)}
            >
              <Minus className="size-4.5" aria-hidden />
            </IconButton>
            <span className="w-8 text-center text-(length:--p-text-sub) font-semibold tabular-nums text-heading">
              {style.textSize}
            </span>
            <IconButton
              variant="glass"
              aria-label={t('cardStyle.increase')}
              onClick={() => step(SIZE_STEP)}
            >
              <Plus className="size-4.5" aria-hidden />
            </IconButton>
          </div>
        </SettingsSection>

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-(length:--p-text-label) font-semibold text-muted-foreground">
            {t('cardStyle.alignment')}
          </h2>
          <SegmentedControl
            aria-label={t('cardStyle.alignment')}
            value={style.alignment}
            onChange={(alignment) => write({ alignment })}
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

      <ActionSheet
        open={fontOpen}
        onOpenChange={setFontOpen}
        title={t('cardStyle.fontTitle')}
        cancelLabel={t('common.cancel')}
        actions={CARD_FONTS.map((font) => ({
          id: font,
          label: t(`cardStyle.fontName.${font}` as never),
          selected: font === style.font,
          onSelect: () => write({ font }),
        }))}
      />
    </AppScreen>
  )
}

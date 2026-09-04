import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlignCenter, AlignLeft, AlignRight, Check, RotateCcw, Type, Vibrate } from 'lucide-react'
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
import { StylePreview } from './StylePreview'

export interface DeckCardStylePageProps {
  deckId: string
  onBack?: () => void
}

const SIZE_STEP = 2

/**
 * The pinned pane keeps the card in view while the controls under it scroll. Its height is
 * `--preview-pane-height` (theme.css): a share of `--app-height`, the shell's own height
 * (CODE_STYLE §11), so this is not a second opinion about how tall the app is.
 */
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
  const prefsStore = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const { deck, settings, ready } = useDeck(deckId)
  const [fontOpen, setFontOpen] = useState(false)
  // Edits are previewed, not saved: `null` means "showing what the deck already has". Leaving the
  // screen drops the draft, which is the whole point of a separate Apply.
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
  // Nothing to reset to when the style already is the default — an enabled button that silently
  // does nothing is worse than one that says so.
  const canReset = !sameCardStyle(style, DEFAULT_CARD_STYLE)

  const edit = (patch: Partial<CardStyle>) => setDraft({ ...style, ...patch })
  const step = (delta: number) => edit({ textSize: clampCardTextSize(style.textSize + delta) })

  const apply = () => {
    void updateDeckSettings(deckStore, deckId, { cardStyle: style })
    setDraft(null)
    toast.success(t('cardStyle.applied'))
  }

  return (
    // No `gutter`: the tab bar never renders on a deck route, and the footer dock below already
    // owns the bottom inset. Its deck-settings siblings keep `gutter="nav"` — that is the spacing
    // they shipped with, not a rule this screen is breaking.
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
                aria-label={t('cardStyle.haptics')}
                aria-pressed={prefs.haptics}
                onClick={() => void setPreferences(prefsStore, { haptics: !prefs.haptics })}
              >
                <Vibrate className="size-5" aria-hidden />
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
            className="max-h-full w-full overflow-hidden"
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
          // The dock stays mounted with nothing in it. `AppScreen` reads the bottom inset off the
          // footer's presence, so letting the slot empty out would re-pad the scroll body the
          // instant the draft goes dirty — the controls would jump as the apply bar arrives, on
          // top of the room the bar itself takes. Empty, it is only the home-indicator clearance
          // that `FooterBar` would have carried anyway.
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
          <h2 className="px-1 text-(length:--p-text-label) font-semibold text-muted-foreground">
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

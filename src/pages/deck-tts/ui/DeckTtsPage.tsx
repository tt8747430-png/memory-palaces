import { useTranslation } from 'react-i18next'
import { Minus, Plus, Speech, Volume2 } from 'lucide-react'
import {
  type DeckSettings,
  TTS_SIDES,
  type TtsSide,
  useDeck,
  useDeckStoreApi,
} from '@/entities/deck'
import { updateDeckSettings } from '@/features/deck'
import { clamp, speak, speechAvailable } from '@/shared/lib'
import {
  AppScreen,
  Empty,
  IconButton,
  ScreenHeader,
  SegmentedControl,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'

export interface DeckTtsPageProps {
  deckId: string
  onBack?: () => void
}

const RATE_STEP = 0.25
const MIN_RATE = 0.5
const MAX_RATE = 2

const SIDE_LABEL_KEYS: Record<TtsSide, string> = {
  front: 'tts.sideFront',
  back: 'tts.sideBack',
  both: 'tts.sideBoth',
}

export function DeckTtsPage({ deckId, onBack }: DeckTtsPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const { deck, settings, ready } = useDeck(deckId)

  const header = (
    <ScreenHeader
      title={t('tts.title')}
      subtitle={deck?.name}
      onBack={onBack}
      backLabel={t('common.back')}
    />
  )

  if (!ready || !deck) return <AppScreen header={header} />

  if (!speechAvailable()) {
    return (
      <AppScreen fill className="pb-nav" header={header}>
        <Empty
          className="mt-10"
          emoji="🔇"
          title={t('tts.unsupported')}
          description={t('tts.unsupportedBody')}
        />
      </AppScreen>
    )
  }

  const override = (patch: Partial<DeckSettings>) =>
    void updateDeckSettings(deckStore, deckId, patch)

  const { side, rate } = settings.tts
  const stepRate = (delta: number) =>
    override({
      tts: { side, rate: Math.round(clamp(rate + delta, MIN_RATE, MAX_RATE) * 100) / 100 },
    })

  return (
    <AppScreen fill className="pb-nav" header={header}>
      <div className="mt-4 flex flex-col gap-6 pb-8">
        <SettingsSection>
          <SettingsRow
            kind="toggle"
            icon={<Speech />}
            label={t('tts.enable')}
            checked={settings.textToSpeech}
            onCheckedChange={(textToSpeech) => override({ textToSpeech })}
          />
        </SettingsSection>

        {settings.textToSpeech ? (
          <>
            <section className="flex flex-col gap-2">
              <h2 className="px-1 text-(length:--p-text-label) font-semibold text-muted-foreground">
                {t('tts.side')}
              </h2>
              <SegmentedControl
                aria-label={t('tts.side')}
                value={side}
                onChange={(next) => override({ tts: { side: next, rate } })}
                options={TTS_SIDES.map((id) => ({
                  value: id,
                  label: t(SIDE_LABEL_KEYS[id] as never),
                }))}
              />
            </section>

            <SettingsSection>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 text-(length:--p-text-sub) font-semibold text-heading">
                  {t('tts.rate')}
                </span>
                <IconButton
                  variant="glass"
                  aria-label={t('cardStyle.decrease')}
                  disabled={rate <= MIN_RATE}
                  onClick={() => stepRate(-RATE_STEP)}
                >
                  <Minus className="size-4.5" aria-hidden />
                </IconButton>
                <span className="w-12 text-center text-(length:--p-text-sub) font-semibold tabular-nums text-heading">
                  {rate.toFixed(2)}×
                </span>
                <IconButton
                  variant="glass"
                  aria-label={t('cardStyle.increase')}
                  disabled={rate >= MAX_RATE}
                  onClick={() => stepRate(RATE_STEP)}
                >
                  <Plus className="size-4.5" aria-hidden />
                </IconButton>
              </div>
              <SettingsRow
                kind="action"
                icon={<Volume2 />}
                label={t('tts.test')}
                onClick={() => speak(t('tts.testPhrase'))}
              />
            </SettingsSection>
          </>
        ) : null}
      </div>
    </AppScreen>
  )
}

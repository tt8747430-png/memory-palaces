import { useTranslation } from 'react-i18next'
import { Speech, Volume2 } from 'lucide-react'
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
  ScreenHeader,
  SegmentedControl,
  SettingsRow,
  SettingsSection,
  StepperRow,
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
              <StepperRow
                label={t('tts.rate')}
                value={`${rate.toFixed(2)}×`}
                decreaseLabel={t('tts.slower')}
                increaseLabel={t('tts.faster')}
                canDecrease={rate > MIN_RATE}
                canIncrease={rate < MAX_RATE}
                onDecrease={() => stepRate(-RATE_STEP)}
                onIncrease={() => stepRate(RATE_STEP)}
              />
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

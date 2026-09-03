import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, Shuffle, Sliders } from 'lucide-react'
import { type DeckSettings, useDeck, useDeckStoreApi } from '@/entities/deck'
import { updateDeckSettings } from '@/features/deck'
import { AlgorithmCard, AlgorithmSheet } from '@/widgets/algorithm'
import { AppScreen, Button, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'
import { NumberRow } from './NumberRow'

export interface DeckAlgorithmPageProps {
  deckId: string
  onBack?: () => void
  onOpenAdvanced?: () => void
}

export function DeckAlgorithmPage({ deckId, onBack, onOpenAdvanced }: DeckAlgorithmPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const { deck, settings, ready } = useDeck(deckId)
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!ready || !deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('algorithm.title')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const override = (patch: Partial<DeckSettings>) =>
    void updateDeckSettings(deckStore, deckId, patch)

  const spaced = settings.algorithm === 'spaced'

  return (
    <AppScreen
      fill
      gutter="nav"
      header={
        <ScreenHeader
          title={t('algorithm.title')}
          subtitle={deck.name}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-8">
        <AlgorithmCard algorithm={settings.algorithm} onClick={() => setPickerOpen(true)} />

        <SettingsSection>
          {spaced ? (
            <>
              <NumberRow
                icon={<Layers />}
                label={t('algorithm.newPerDay')}
                value={settings.newCardsPerDay}
                onChange={(newCardsPerDay) => override({ newCardsPerDay })}
              />
              <NumberRow
                icon={<Layers />}
                label={t('algorithm.maxPerDay')}
                value={settings.maxCardsPerDay}
                onChange={(maxCardsPerDay) => override({ maxCardsPerDay })}
              />
            </>
          ) : null}
          <SettingsRow
            kind="toggle"
            icon={<Shuffle />}
            label={t('algorithm.shuffle')}
            checked={settings.shuffleCards}
            onCheckedChange={(shuffleCards) => override({ shuffleCards })}
          />
        </SettingsSection>

        {spaced ? (
          <Button variant="secondary" size="lg" className="w-full" onClick={onOpenAdvanced}>
            <Sliders className="size-4.5" aria-hidden />
            {t('algorithm.advanced')}
          </Button>
        ) : null}
      </div>

      <AlgorithmSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={settings.algorithm}
        onChange={(algorithm) => override({ algorithm })}
      />
    </AppScreen>
  )
}

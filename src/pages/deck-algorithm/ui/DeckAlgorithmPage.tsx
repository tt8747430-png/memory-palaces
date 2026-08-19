import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Layers, Shuffle, Sliders } from 'lucide-react'
import { type DeckSettings, useDeck, useDeckStoreApi } from '@/entities/deck'
import { updateDeckSettings } from '@/features/deck'
import { AlgorithmSheet, ALGORITHM_META } from '@/widgets/algorithm'
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

  const meta = ALGORITHM_META[settings.algorithm]
  const spaced = settings.algorithm === 'spaced'

  return (
    <AppScreen
      fill
      className="pb-nav"
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
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-3.5 rounded-card bg-info-surface p-4 text-left transition-transform active:scale-[0.99]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-control bg-card">
            {meta.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-(length:--p-text-sub) font-semibold text-heading">
              {t(meta.nameKey as never)}
            </span>
            <span className="mt-0.5 block text-(length:--p-text-label) text-muted-foreground">
              {t('deckSettings.algorithmRow')}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>

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

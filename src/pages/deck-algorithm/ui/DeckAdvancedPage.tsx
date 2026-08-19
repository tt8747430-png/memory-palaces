import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Clock, Gauge, RotateCcw, Sprout, TrendingUp, TriangleAlert } from 'lucide-react'
import {
  DEFAULT_SPACED_ADVANCED,
  type DeckSettings,
  type SpacedAdvanced,
  useDeck,
  useDeckStoreApi,
} from '@/entities/deck'
import { editDeck } from '@/features/deck'
import { AppScreen, PromptSheet, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'
import { NumberRow } from './NumberRow'

export interface DeckAdvancedPageProps {
  deckId: string
  onBack?: () => void
}

/** Minutes, comma-separated. Anything that is not a positive number is dropped, not guessed at. */
function parseLearningSteps(value: string): number[] {
  return value
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((step) => Number.isFinite(step) && step > 0)
}

export function DeckAdvancedPage({ deckId, onBack }: DeckAdvancedPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const { deck, settings, ready } = useDeck(deckId)
  const [stepsOpen, setStepsOpen] = useState(false)
  const [bonusOpen, setBonusOpen] = useState(false)

  if (!ready || !deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('algorithm.advancedTitle')}
            onBack={onBack}
            backLabel={t('common.back')}
          />
        }
      />
    )
  }

  const override = (patch: Partial<DeckSettings>) =>
    void editDeck(deckStore, deckId, { settings: { ...deck.settings, ...patch } })

  const advance = (patch: Partial<SpacedAdvanced>) =>
    override({ advanced: { ...settings.advanced, ...patch } })

  const steps = settings.advanced.learningSteps.join(', ')

  return (
    <AppScreen
      fill
      className="pb-nav"
      header={
        <ScreenHeader
          title={t('algorithm.advancedTitle')}
          subtitle={deck.name}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-8">
        <p className="text-(length:--p-text-label) text-muted-foreground">
          {t('algorithm.advancedHint')}
        </p>

        <SettingsSection>
          <SettingsRow
            kind="nav"
            icon={<Clock />}
            label={t('algorithm.learningSteps')}
            value={steps}
            onClick={() => setStepsOpen(true)}
          />
          <NumberRow
            icon={<Sprout />}
            label={t('algorithm.graduatingInterval')}
            value={settings.advanced.graduatingInterval}
            onChange={(graduatingInterval) => advance({ graduatingInterval })}
          />
          <NumberRow
            icon={<TrendingUp />}
            label={t('algorithm.maximumInterval')}
            value={settings.advanced.maximumInterval}
            onChange={(maximumInterval) => advance({ maximumInterval })}
          />
          <NumberRow
            icon={<TriangleAlert />}
            label={t('algorithm.leechThreshold')}
            value={settings.advanced.leechThreshold}
            onChange={(leechThreshold) => advance({ leechThreshold })}
          />
          <SettingsRow
            kind="nav"
            icon={<Gauge />}
            label={t('algorithm.easyBonus')}
            value={String(settings.advanced.easyBonus)}
            onClick={() => setBonusOpen(true)}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            kind="action"
            icon={<RotateCcw />}
            label={t('algorithm.resetDefaults')}
            onClick={() => {
              advance(DEFAULT_SPACED_ADVANCED)
              toast.success(t('algorithm.resetDefaultsDone'))
            }}
          />
        </SettingsSection>
      </div>

      <PromptSheet
        open={bonusOpen}
        onOpenChange={setBonusOpen}
        title={t('algorithm.easyBonus')}
        fieldLabel={t('algorithm.easyBonus')}
        initialValue={String(settings.advanced.easyBonus)}
        confirmLabel={t('deckSettings.appearanceSave')}
        onSubmit={(value) => {
          const easyBonus = Number.parseFloat(value)
          if (!Number.isFinite(easyBonus) || easyBonus <= 0) return
          advance({ easyBonus })
        }}
      />

      <PromptSheet
        open={stepsOpen}
        onOpenChange={setStepsOpen}
        title={t('algorithm.learningSteps')}
        fieldLabel={t('algorithm.learningSteps')}
        initialValue={steps}
        confirmLabel={t('deckSettings.appearanceSave')}
        onSubmit={(value) => {
          const learningSteps = parseLearningSteps(value)
          if (learningSteps.length === 0) return
          advance({ learningSteps })
        }}
      />
    </AppScreen>
  )
}

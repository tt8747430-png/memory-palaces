import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_DECK_SETTINGS,
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import { useCardStoreApi } from '@/entities/card'
import { resolveDeckSettings } from '@/shared/lib'
import { deleteDeck, editDeck } from '@/features/deck'
import { resetDeckSrs } from '@/features/card'
import { AppScreen, Button, ScreenHeader, Switch, TextField } from '@/shared/ui'

export interface DeckSettingsPageProps {
  deckId: string
  onBack?: () => void
  /** After delete, leave the settings (and the deck) — the route wrapper goes home. */
  onDeleted?: () => void
}

/** The full-page settings for one deck (route `/decks/:deckId/settings`). Each study field
 * resolves from the parent chain and can be overridden here (ADR-0002); reset clears the whole
 * subtree's schedule; delete removes the deck and its subtree. */
export function DeckSettingsPage({ deckId, onBack, onDeleted }: DeckSettingsPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()

  useEffect(() => {
    deckStore.getState().start()
    cardStore.getState().start()
  }, [deckStore, cardStore])

  const decks = useDeckStore(selectDecks)
  const ready = useDeckStore(selectDecksReady)
  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])
  const settings = useMemo(
    () => resolveDeckSettings(decks, deckId, DEFAULT_DECK_SETTINGS),
    [decks, deckId],
  )

  if (!ready || !deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('deck.settings')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const override = (patch: Partial<typeof settings>) =>
    void editDeck(deckStore, deckId, { settings: { ...deck.settings, ...patch } })

  return (
    <AppScreen
      header={
        <ScreenHeader title={t('deck.settings')} onBack={onBack} backLabel={t('common.back')} />
      }
    >
      <div className="space-y-6 py-4">
        <section className="rounded-card bg-card p-3">
          <label
            htmlFor="deck-name"
            className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading"
          >
            {t('deckSettings.name', { defaultValue: 'Name' })}
          </label>
          <TextField
            id="deck-name"
            key={deck.id}
            defaultValue={deck.name}
            onBlur={(event) => {
              const value = event.target.value.trim()
              if (value && value !== deck.name) void editDeck(deckStore, deckId, { name: value })
            }}
          />
        </section>

        <section className="space-y-1 rounded-card bg-card p-1">
          <Row label={t('deckSettings.shuffle')}>
            <Switch
              label={t('deckSettings.shuffle')}
              checked={settings.shuffleCards}
              onCheckedChange={(v) => override({ shuffleCards: v })}
            />
          </Row>
          <Row label={t('deckSettings.textToSpeech')}>
            <Switch
              label={t('deckSettings.textToSpeech')}
              checked={settings.textToSpeech}
              onCheckedChange={(v) => override({ textToSpeech: v })}
            />
          </Row>
          <Row label={t('deckSettings.studyBack')}>
            <Switch
              label={t('deckSettings.studyBack')}
              checked={settings.studyDirection === 'back'}
              onCheckedChange={(v) => override({ studyDirection: v ? 'back' : 'front' })}
            />
          </Row>
        </section>

        <section className="space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => void resetDeckSrs(deckStore, cardStore, deckId)}
          >
            {t('deckSettings.reset')}
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              void deleteDeck(deckStore, cardStore, deckId)
              onDeleted?.()
            }}
          >
            {t('common.delete')}
          </Button>
        </section>
      </div>
    </AppScreen>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-3">
      <span className="text-[length:var(--p-text-body)] text-heading">{label}</span>
      {children}
    </div>
  )
}

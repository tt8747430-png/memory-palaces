import { useTranslation } from 'react-i18next'
import { BookOpen, Layers, Library, Power, WifiOff, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import {
  isExtensionFeatureOn,
  selectDevMode,
  selectDisabledFeatures,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setExtensionEnabled, setExtensionFeature } from '@/features/preferences'
import { cn, useContributedT } from '@/shared/lib'
import {
  AppScreen,
  cardSurface,
  ConfirmDialog,
  ScreenHeader,
  ScreenLoading,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { DestinationSheet } from '@/widgets/deck-tree'
import { useBibleT } from '../i18n/use-bible-t'
import { BIBLE_FEATURES, BIBLE_ID } from '../ids'
import { bibleManifest } from '../manifest'
import { useBibleLibrary } from '../model/use-bible-library'

export interface BibleOverviewPageProps {
  onBack?: () => void
  /** Opens the developer tools screen. Shown only in dev mode. */
  onOpenDeveloper?: () => void
  /** Where switching the extension off leaves the learner — Settings → Extensions. */
  onSwitchedOff?: () => void
}

/**
 * The extension's front door: what it is, what it provides, which parts are switched on, and what
 * its library holds. Every switch here is a local write, so the screen works offline and says so.
 */
export function BibleOverviewPage({
  onBack,
  onOpenDeveloper,
  onSwitchedOff,
}: BibleOverviewPageProps) {
  const t = useBibleT()
  // The keys a feature declares are already namespaced — they are what a host surface would read.
  const contributed = useContributedT()
  const { t: core } = useTranslation()
  const store = usePreferencesStoreApi()
  const disabledFeatures = usePreferencesStore(selectDisabledFeatures)
  const devMode = usePreferencesStore(selectDevMode)
  const page = useBibleLibrary()

  const featureOn = (id: string) => isExtensionFeatureOn({ disabledFeatures }, BIBLE_ID, id)
  const libraryOn = featureOn(BIBLE_FEATURES.library)

  const toggleFeature = (id: string, on: boolean) => {
    void setExtensionFeature(store, BIBLE_ID, id, on).catch(() => toast.error(t('featureFailed')))
  }

  const header = <ScreenHeader title={t('label')} onBack={onBack} backLabel={core('common.back')} />

  if (!page.ready) {
    return (
      <AppScreen gutter="end" header={header}>
        <ScreenLoading />
      </AppScreen>
    )
  }

  return (
    <AppScreen gutter="end" header={header}>
      <div className="mt-4 flex flex-col gap-5">
        <section className={cn(cardSurface, 'flex flex-col gap-3 p-5')}>
          <span className="grid size-12 place-items-center rounded-card bg-info-surface text-info-foreground">
            <BookOpen className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-title font-semibold text-heading">{t('label')}</h2>
            <p className="text-body leading-relaxed text-muted-foreground">{t('overviewWhat')}</p>
          </div>
          <p className="flex items-center gap-2 text-label text-muted-foreground">
            <BookOpen className="size-4 shrink-0" aria-hidden />
            {page.translation.name}
          </p>
          <p className="flex items-center gap-2 text-label text-muted-foreground">
            <WifiOff className="size-4 shrink-0" aria-hidden />
            {t('offline')}
          </p>
        </section>

        <SettingsSection title={t('overviewFeatures')}>
          {(bibleManifest.features ?? []).map((feature) => (
            <SettingsRow
              key={feature.id}
              kind="toggle"
              icon={feature.icon}
              label={contributed(feature.labelKey)}
              description={contributed(feature.descriptionKey)}
              checked={featureOn(feature.id)}
              onCheckedChange={(on) => toggleFeature(feature.id, on)}
            />
          ))}
        </SettingsSection>

        <SettingsSection title={t('libraryTitle')}>
          <SettingsRow
            kind="value"
            icon={<Library />}
            label={t('overviewHolding')}
            value={
              page.empty
                ? t('overviewHoldingNone')
                : t('overviewHoldingCount', {
                    books: page.totals.books,
                    count: page.totals.verses,
                  })
            }
          />
          {libraryOn ? (
            <>
              <SettingsRow
                kind="action"
                icon={<Library />}
                label={t('addFromCards')}
                description={t('addFromCardsHint')}
                onClick={page.addFromAllCards}
              />
              <SettingsRow
                kind="action"
                icon={<Layers />}
                label={t('addFromDeck')}
                description={t('addFromDeckHint')}
                onClick={page.requestDeckPick}
              />
            </>
          ) : (
            <SettingsRow kind="info" icon={<Library />} label={t('libraryOff')} />
          )}
        </SettingsSection>

        <SettingsSection title={t('overviewManage')}>
          {devMode ? (
            <SettingsRow
              kind="nav"
              icon={<Wrench />}
              label={t('developerTitle')}
              description={t('developerHint')}
              onClick={() => onOpenDeveloper?.()}
            />
          ) : null}
          <SettingsRow
            kind="action"
            icon={<Power />}
            label={t('switchOff')}
            description={t('switchOffHint')}
            onClick={() => {
              void setExtensionEnabled(store, BIBLE_ID, false).then(
                () => onSwitchedOff?.(),
                () => toast.error(t('featureFailed')),
              )
            }}
          />
        </SettingsSection>
      </div>

      <DestinationSheet
        open={page.pending?.kind === 'pick-deck'}
        onOpenChange={(open) => {
          if (!open) page.dismiss()
        }}
        title={t('addFromDeck')}
        subtitle={t('addFromDeckHint')}
        action={{ prompt: t('pickDeckPrompt'), confirm: (name) => t('addDeck', { name }) }}
        targets="deck"
        decks={page.decks}
        folders={page.folders}
        onPick={(dest) => {
          if (dest.kind === 'deck') page.addFromDeck(dest.deckId)
        }}
      />

      {page.pending?.kind === 'add' ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) page.dismiss()
          }}
          icon={<Library className="size-6" aria-hidden />}
          title={t('addFromCards')}
          description={t('addPreview', {
            fresh: page.pending.text.fresh.length,
            cards: page.pending.text.cards,
            held: page.pending.text.held,
          })}
          confirmLabel={t('addVerses', { count: page.pending.text.fresh.length })}
          cancelLabel={core('common.cancel')}
          onConfirm={page.confirm}
        />
      ) : null}
    </AppScreen>
  )
}

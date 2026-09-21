import { useTranslation } from 'react-i18next'
import { BookOpen, Trash2 } from 'lucide-react'
import {
  AppScreen,
  ConfirmDialog,
  EmptyNotice,
  ScreenHeader,
  ScreenLoading,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { selectDevMode, usePreferencesStore } from '@/entities/preferences'
import { useBibleT } from '../i18n/use-bible-t'
import { bookName } from '../model/book-names'
import { useBibleDeveloper } from '../model/use-bible-developer'
import { CoverageList } from './settings/CoverageList'

export interface BibleDeveloperPageProps {
  onBack?: () => void
}

/**
 * The extension's developer tools, reached from its overview and only while Developer mode is on.
 * Everything here is destructive or diagnostic; what a learner actually manages lives on the
 * overview.
 */
export function BibleDeveloperPage({ onBack }: BibleDeveloperPageProps) {
  const t = useBibleT()
  const { t: core } = useTranslation()
  const page = useBibleDeveloper()
  const devMode = usePreferencesStore(selectDevMode)

  const header = (
    <ScreenHeader title={t('developerTitle')} onBack={onBack} backLabel={core('common.back')} />
  )

  if (!page.ready) {
    return (
      <AppScreen gutter="end" header={header}>
        <ScreenLoading />
      </AppScreen>
    )
  }

  // Reachable by a link as well as from the overview, so the screen answers for itself rather than
  // trusting the row that leads to it.
  if (!devMode) {
    return (
      <AppScreen gutter="end" header={header}>
        <div className="mt-4">
          <EmptyNotice>{t('developerOff')}</EmptyNotice>
        </div>
      </AppScreen>
    )
  }

  return (
    <AppScreen gutter="end" header={header}>
      <div className="mt-4 flex flex-col gap-5">
        <p className="text-label leading-snug text-muted-foreground">{t('developerHint')}</p>

        <SettingsSection title={t('translation')}>
          <SettingsRow
            kind="info"
            icon={<BookOpen />}
            label={page.translation.name}
            description={t('translationLanguage')}
          />
        </SettingsSection>

        {page.empty ? (
          <EmptyNotice>{t('libraryEmpty')}</EmptyNotice>
        ) : (
          <CoverageList coverage={page.coverage} onForget={page.requestForget} />
        )}
      </div>

      {page.pending ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) page.dismiss()
          }}
          icon={<Trash2 className="size-6" aria-hidden />}
          title={t('forgetBook', { name: bookName(page.pending.book) })}
          description={t('forgetPreview', { count: page.pending.verses })}
          confirmLabel={t('forget')}
          cancelLabel={core('common.cancel')}
          destructive
          onConfirm={page.confirm}
        />
      ) : null}
    </AppScreen>
  )
}

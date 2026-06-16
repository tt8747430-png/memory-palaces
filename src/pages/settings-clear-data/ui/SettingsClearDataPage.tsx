import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Bell, Layers, RotateCcw, TrendingUp } from 'lucide-react'
import { usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { useRoomStoreApi } from '@/entities/room'
import { useLocusStoreApi } from '@/entities/locus'
import { useQuestionStoreApi } from '@/entities/question'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { useNotificationStore, useNotificationStoreApi } from '@/entities/notification'
import {
  clearAllContent,
  clearNotifications,
  resetEverything,
  resetProgress,
} from '@/features/data'
import { ActionSheet, AppScreen, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'

type ActionKind = 'palaces' | 'stats' | 'notifications' | 'all'

export interface SettingsClearDataPageProps {
  onBack?: () => void
}

/** Clear data — four destructive actions, each gated by a confirmation sheet, that run
 * the features/data commands against the live stores. */
export function SettingsClearDataPage({ onBack }: SettingsClearDataPageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const progressStore = useProgressStoreApi()
  const notificationStore = useNotificationStoreApi()
  const palaceCount = usePalaceStore((state) => state.palaces.length)
  const notificationCount = useNotificationStore((state) => state.notifications.length)
  const progress = useProgressStore(selectProgress)
  const [pending, setPending] = useState<ActionKind | null>(null)

  useEffect(() => {
    for (const store of [
      palaceStore,
      roomStore,
      locusStore,
      questionStore,
      progressStore,
      notificationStore,
    ]) {
      store.getState().start()
    }
  }, [palaceStore, roomStore, locusStore, questionStore, progressStore, notificationStore])

  const labels: Record<ActionKind, string> = {
    palaces: t('settings.clearScreen.palaces'),
    stats: t('settings.clearScreen.stats'),
    notifications: t('settings.clearScreen.notifications'),
    all: t('settings.clearScreen.all'),
  }

  const run = async (kind: ActionKind) => {
    const content = { palaceStore, roomStore, locusStore, questionStore }
    if (kind === 'palaces') await clearAllContent(content)
    else if (kind === 'stats') await resetProgress(progressStore)
    else if (kind === 'notifications') await clearNotifications(notificationStore)
    else await resetEverything({ ...content, progressStore, notificationStore })
    toast.success(t('settings.clearScreen.done'))
    setPending(null)
  }

  const trainedDays = progress?.trainingDays.length ?? 0
  const xp = progress?.xp ?? 0
  const counts: Partial<Record<ActionKind, string>> = {
    palaces: t(
      palaceCount === 1
        ? 'settings.clearScreen.palacesCountOne'
        : 'settings.clearScreen.palacesCountOther',
      { count: palaceCount },
    ),
    stats: t(
      trainedDays === 1
        ? 'settings.clearScreen.statsCountOne'
        : 'settings.clearScreen.statsCountOther',
      { count: trainedDays, xp: xp.toLocaleString() },
    ),
    notifications: t(
      notificationCount === 1
        ? 'settings.clearScreen.notificationsCountOne'
        : 'settings.clearScreen.notificationsCountOther',
      { count: notificationCount },
    ),
  }

  const rows: { kind: ActionKind; icon: ReactNode; hint: string }[] = [
    { kind: 'palaces', icon: <Layers />, hint: t('settings.clearScreen.palacesHint') },
    { kind: 'stats', icon: <TrendingUp />, hint: t('settings.clearScreen.statsHint') },
    { kind: 'notifications', icon: <Bell />, hint: t('settings.clearScreen.notificationsHint') },
    { kind: 'all', icon: <RotateCcw />, hint: t('settings.clearScreen.allHint') },
  ]

  const confirmTitle =
    pending === 'all'
      ? t('settings.clearScreen.confirmTitleAll')
      : pending
        ? t('settings.clearScreen.confirmTitle', { target: labels[pending].toLowerCase() })
        : ''

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader
        title={t('settings.clearScreen.title')}
        onBack={onBack}
        backLabel={t('settings.back')}
      />

      <div className="mt-4 flex flex-col gap-5 pb-28">
        <div className="rounded-card bg-[var(--danger-surface)] p-4">
          <p className="text-[length:var(--p-text-sub)] font-semibold text-[var(--danger-on-surface)]">
            {t('settings.clearScreen.warningTitle')}
          </p>
          <p className="mt-1 text-[length:var(--p-text-label)] leading-snug text-[var(--danger-on-surface)]">
            {t('settings.clearScreen.warningBody')}
          </p>
        </div>

        <SettingsSection>
          {rows.map((row) => (
            <SettingsRow
              key={row.kind}
              kind="nav"
              tone="danger"
              icon={row.icon}
              label={labels[row.kind]}
              description={row.hint}
              value={counts[row.kind]}
              onClick={() => setPending(row.kind)}
            />
          ))}
        </SettingsSection>
      </div>

      <ActionSheet
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        title={confirmTitle}
        description={t('settings.clearScreen.confirmBody')}
        cancelLabel={t('settings.clearScreen.cancel')}
        actions={
          pending
            ? [
                {
                  id: 'confirm',
                  label: t('settings.clearScreen.confirm'),
                  destructive: true,
                  onSelect: () => void run(pending),
                },
              ]
            : []
        }
      />
    </AppScreen>
  )
}

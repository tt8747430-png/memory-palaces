import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, BarChart3, Bell, Building2, Trash2 } from 'lucide-react'
import { AppScreen, ConfirmDialog, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'
import { useClearData } from '../model/useClearData'

export interface SettingsClearPageProps {
  onBack?: () => void
}

type Target = 'palaces' | 'stats' | 'notifications' | 'all'

/** Clear data — the one destructive surface, kept off the main Settings list behind its
 * own screen. Each target shows exactly what it will remove (live counts), dims when
 * there is nothing to clear, and is gated by a confirm dialog. "Reset everything" sits
 * apart so the heaviest action is never a mis-tap away from the lighter ones. */
export function SettingsClearPage({ onBack }: SettingsClearPageProps) {
  const { t } = useTranslation()
  const { counts, clearPalaces, resetStats, clearNotificationHistory, resetEverything } =
    useClearData()
  const [pending, setPending] = useState<Target | null>(null)

  const targets: {
    id: Exclude<Target, 'all'>
    icon: ReactNode
    label: string
    hint: string
    value: string
    disabled: boolean
  }[] = [
    {
      id: 'palaces',
      icon: <Building2 />,
      label: t('settings.clearScreen.palaces'),
      hint: t('settings.clearScreen.palacesHint'),
      value: t(
        counts.palaces === 1
          ? 'settings.clearScreen.palacesCountOne'
          : 'settings.clearScreen.palacesCountOther',
        { count: counts.palaces },
      ),
      disabled: counts.palaces === 0,
    },
    {
      id: 'stats',
      icon: <BarChart3 />,
      label: t('settings.clearScreen.stats'),
      hint: t('settings.clearScreen.statsHint'),
      value: t(
        counts.days === 1
          ? 'settings.clearScreen.statsCountOne'
          : 'settings.clearScreen.statsCountOther',
        { count: counts.days, xp: counts.xp },
      ),
      disabled: counts.days === 0 && counts.xp === 0,
    },
    {
      id: 'notifications',
      icon: <Bell />,
      label: t('settings.clearScreen.notifications'),
      hint: t('settings.clearScreen.notificationsHint'),
      value: t(
        counts.notifications === 1
          ? 'settings.clearScreen.notificationsCountOne'
          : 'settings.clearScreen.notificationsCountOther',
        { count: counts.notifications },
      ),
      disabled: counts.notifications === 0,
    },
  ]

  const allEmpty =
    counts.palaces === 0 && counts.days === 0 && counts.xp === 0 && counts.notifications === 0

  const targetLabel: Record<Target, string> = {
    palaces: t('settings.clearScreen.palaces'),
    stats: t('settings.clearScreen.stats'),
    notifications: t('settings.clearScreen.notifications'),
    all: t('settings.clearScreen.all'),
  }

  const run = (target: Target) => {
    const actions: Record<Target, () => Promise<void>> = {
      palaces: clearPalaces,
      stats: resetStats,
      notifications: clearNotificationHistory,
      all: resetEverything,
    }
    void actions[target]()
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={t('settings.clearScreen.title')}
          onBack={onBack}
          backLabel={t('settings.back')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-28">
        <div className="flex items-start gap-3 rounded-card bg-[var(--danger-surface)] p-4">
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-[var(--danger-on-surface)]"
            aria-hidden
          />
          <div>
            <p className="text-[length:var(--p-text-sub)] font-semibold text-[var(--danger-on-surface)]">
              {t('settings.clearScreen.warningTitle')}
            </p>
            <p className="mt-1 text-[length:var(--p-text-label)] leading-snug text-[var(--danger-on-surface)]/80">
              {t('settings.clearScreen.warningBody')}
            </p>
          </div>
        </div>

        <SettingsSection title={t('settings.clearScreen.title')}>
          {targets.map((target) => (
            <SettingsRow
              key={target.id}
              kind="nav"
              icon={target.icon}
              label={target.label}
              description={target.hint}
              value={target.value}
              disabled={target.disabled}
              onClick={() => setPending(target.id)}
            />
          ))}
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            kind="nav"
            tone="danger"
            icon={<Trash2 />}
            label={t('settings.clearScreen.all')}
            description={t('settings.clearScreen.allHint')}
            disabled={allEmpty}
            onClick={() => setPending('all')}
          />
        </SettingsSection>
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        icon={<Trash2 className="size-6" aria-hidden />}
        title={
          pending === 'all'
            ? t('settings.clearScreen.confirmTitleAll')
            : t('settings.clearScreen.confirmTitle', {
                target: pending ? targetLabel[pending].toLowerCase() : '',
              })
        }
        description={t('settings.clearScreen.confirmBody')}
        confirmLabel={t('settings.clearScreen.confirm')}
        cancelLabel={t('settings.clearScreen.cancel')}
        destructive
        onConfirm={() => {
          if (pending) run(pending)
        }}
      />
    </AppScreen>
  )
}

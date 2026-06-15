import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Sparkles, Vibrate, Volume2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
  type PreferencesChanges,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface SettingsPageProps {
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Settings — the behaviour-driving preference toggles, persisted through the
 * preferences store. (Applying them to the running app — motion, haptics, toast
 * gating — is wired in a follow-up; here they save and survive reload.) */
export function SettingsPage({ onBack }: SettingsPageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)

  useEffect(() => {
    store.getState().start()
  }, [store])

  const update = (changes: PreferencesChanges) => void setPreferences(store, changes)

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader title={t('settings.title')} onBack={onBack} backLabel={t('settings.back')} />

      <section className="mt-4 flex flex-col gap-2.5 pb-28">
        <SettingToggle
          icon={<Volume2 className="size-[18px]" aria-hidden />}
          label={t('settings.sound')}
          description={t('settings.soundHint')}
          checked={prefs.soundEffects}
          onChange={(value) => update({ soundEffects: value })}
        />
        <SettingToggle
          icon={<Vibrate className="size-[18px]" aria-hidden />}
          label={t('settings.haptics')}
          description={t('settings.hapticsHint')}
          checked={prefs.haptics}
          onChange={(value) => update({ haptics: value })}
        />
        <SettingToggle
          icon={<Sparkles className="size-[18px]" aria-hidden />}
          label={t('settings.reducedMotion')}
          description={t('settings.reducedMotionHint')}
          checked={prefs.reducedMotion}
          onChange={(value) => update({ reducedMotion: value })}
        />
        <SettingToggle
          icon={<Bell className="size-[18px]" aria-hidden />}
          label={t('settings.notifications')}
          description={t('settings.notificationsHint')}
          checked={prefs.notifications}
          onChange={(value) => update({ notifications: value })}
        />
      </section>
    </AppScreen>
  )
}

function SettingToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-card bg-card px-4 py-3.5 text-left shadow-rest transition-transform active:scale-[0.99]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-heading">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
            {label}
          </span>
          <span className="mt-0.5 block text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
      <span
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-[color-mix(in_oklch,var(--text-muted)_32%,transparent)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 block size-6 rounded-full bg-card shadow-rest transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

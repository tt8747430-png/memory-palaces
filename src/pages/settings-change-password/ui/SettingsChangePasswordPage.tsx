import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppScreen, Button, PasswordField, ScreenHeader } from '@/shared/ui'

const MIN_PASSWORD = 8

export interface SettingsChangePasswordPageProps {
  onBack?: () => void
}

/** Change password — mock for now (no verification): it validates shape, confirms the
 * match, and reports success. Real credential security lands with the auth backend. */
export function SettingsChangePasswordPage({ onBack }: SettingsChangePasswordPageProps) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  // Validate live so the eye-toggle fields guide as you type and Save only lights up
  // once the change is actually valid.
  const nextError =
    next.length > 0 && next.length < MIN_PASSWORD ? t('settings.changePasswordScreen.short') : undefined
  const confirmError =
    confirm.length > 0 && confirm !== next ? t('settings.changePasswordScreen.mismatch') : undefined
  const canSave = current.length > 0 && next.length >= MIN_PASSWORD && confirm === next

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    toast.success(t('settings.changePasswordScreen.saved'))
    setCurrent('')
    setNext('')
    setConfirm('')
  }

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader
        title={t('settings.changePasswordScreen.title')}
        onBack={onBack}
        backLabel={t('settings.back')}
      />

      <form className="mt-4 flex flex-col gap-4 pb-28" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="current-password"
          label={t('settings.changePasswordScreen.current')}
          autoComplete="current-password"
          placeholder={t('settings.changePasswordScreen.currentPlaceholder')}
          value={current}
          onValueChange={setCurrent}
        />
        <PasswordField
          id="new-password"
          label={t('settings.changePasswordScreen.next')}
          autoComplete="new-password"
          placeholder={t('settings.changePasswordScreen.nextPlaceholder')}
          value={next}
          onValueChange={setNext}
          error={nextError}
        />
        <PasswordField
          id="confirm-password"
          label={t('settings.changePasswordScreen.confirm')}
          autoComplete="new-password"
          placeholder={t('settings.changePasswordScreen.confirmPlaceholder')}
          value={confirm}
          onValueChange={setConfirm}
          error={confirmError}
        />

        <p className="text-[length:var(--p-text-label)] text-muted-foreground">
          {t('settings.changePasswordScreen.note')}
        </p>

        <Button type="submit" size="lg" className="w-full" disabled={!canSave}>
          {t('settings.changePasswordScreen.submit')}
        </Button>
      </form>
    </AppScreen>
  )
}

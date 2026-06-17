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
  const [errors, setErrors] = useState<{ next?: string; confirm?: string }>({})

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const found: typeof errors = {}
    if (next.length < MIN_PASSWORD) found.next = t('settings.changePasswordScreen.short')
    if (!found.next && confirm !== next) found.confirm = t('settings.changePasswordScreen.mismatch')
    setErrors(found)
    if (found.next || found.confirm) return

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
          error={errors.next}
        />
        <PasswordField
          id="confirm-password"
          label={t('settings.changePasswordScreen.confirm')}
          autoComplete="new-password"
          placeholder={t('settings.changePasswordScreen.confirmPlaceholder')}
          value={confirm}
          onValueChange={setConfirm}
          error={errors.confirm}
        />

        <p className="text-[length:var(--p-text-label)] text-muted-foreground">
          {t('settings.changePasswordScreen.note')}
        </p>

        <Button type="submit" size="lg" className="w-full">
          {t('settings.changePasswordScreen.submit')}
        </Button>
      </form>
    </AppScreen>
  )
}

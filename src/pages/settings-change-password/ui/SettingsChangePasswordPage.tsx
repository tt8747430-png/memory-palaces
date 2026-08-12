import { type SyntheticEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { authErrorMessage, isLongEnoughPassword } from '@/shared/lib'
import { AppScreen, Button, PasswordField, ScreenHeader } from '@/shared/ui'
import { useAuthActions } from '@/features/session'

export interface SettingsChangePasswordPageProps {
  onBack?: () => void
  /**
   * True when the user arrived from a recovery link. The link already proved they own the address,
   * and they are here precisely because they do not know the old password — so asking for it would
   * be a dead end.
   */
  recovery?: boolean
}

export function SettingsChangePasswordPage({
  onBack,
  recovery = false,
}: SettingsChangePasswordPageProps) {
  const { t } = useTranslation()
  const { setPassword } = useAuthActions()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const nextError =
    next.length > 0 && !isLongEnoughPassword(next)
      ? t('settings.changePasswordScreen.short')
      : undefined
  const confirmError =
    confirm.length > 0 && confirm !== next ? t('settings.changePasswordScreen.mismatch') : undefined
  const canSave =
    (recovery || current.length > 0) && isLongEnoughPassword(next) && confirm === next && !saving

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    try {
      await setPassword(next)
    } catch (error) {
      toast.error(authErrorMessage(error, t, t('settings.changePasswordScreen.failed')))
      return
    } finally {
      setSaving(false)
    }

    toast.success(t('settings.changePasswordScreen.saved'))
    setCurrent('')
    setNext('')
    setConfirm('')
    onBack?.()
  }

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={
            recovery
              ? t('settings.changePasswordScreen.recoveryTitle')
              : t('settings.changePasswordScreen.title')
          }
          onBack={onBack}
          backLabel={t('settings.back')}
        />
      }
    >
      <form
        className="mt-4 flex flex-col gap-4 pb-gutter"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        {recovery ? null : (
          <PasswordField
            id="current-password"
            label={t('settings.changePasswordScreen.current')}
            autoComplete="current-password"
            placeholder={t('settings.changePasswordScreen.currentPlaceholder')}
            value={current}
            onValueChange={setCurrent}
          />
        )}
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

        <p className="text-(length:--p-text-label) text-muted-foreground">
          {recovery
            ? t('settings.changePasswordScreen.recoveryNote')
            : t('settings.changePasswordScreen.note')}
        </p>

        <Button type="submit" size="lg" className="w-full" disabled={!canSave}>
          {t('settings.changePasswordScreen.submit')}
        </Button>
      </form>
    </AppScreen>
  )
}

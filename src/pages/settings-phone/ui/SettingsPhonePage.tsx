import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Smartphone } from 'lucide-react'
import { AppScreen, AuthField, Button, ScreenHeader } from '@/shared/ui'

const PHONE_KEY = 'mindscape:phone'
const MIN_DIGITS = 6

export interface SettingsPhonePageProps {
  onBack?: () => void
}

/** Phone — mock for now: no verification, the number is saved on the device so the
 * field is honest rather than a dead control. Account recovery wiring comes later. */
export function SettingsPhonePage({ onBack }: SettingsPhonePageProps) {
  const { t } = useTranslation()
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) ?? '')
  const [error, setError] = useState<string>()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < MIN_DIGITS) {
      setError(t('settings.phoneScreen.invalid'))
      return
    }
    setError(undefined)
    localStorage.setItem(PHONE_KEY, phone.trim())
    toast.success(t('settings.phoneScreen.saved'))
  }

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader
        title={t('settings.phoneScreen.title')}
        onBack={onBack}
        backLabel={t('settings.back')}
      />

      <form className="mt-4 flex flex-col gap-4 pb-28" onSubmit={handleSubmit} noValidate>
        <p className="text-[length:var(--p-text-body)] text-muted-foreground">
          {t('settings.phoneScreen.intro')}
        </p>
        <AuthField
          id="phone"
          label={t('settings.phoneScreen.label')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          icon={<Smartphone />}
          placeholder={t('settings.phoneScreen.placeholder')}
          value={phone}
          onValueChange={setPhone}
          error={error}
        />
        <p className="text-[length:var(--p-text-label)] text-muted-foreground">
          {t('settings.phoneScreen.note')}
        </p>
        <Button type="submit" size="lg" className="w-full">
          {t('settings.phoneScreen.submit')}
        </Button>
      </form>
    </AppScreen>
  )
}

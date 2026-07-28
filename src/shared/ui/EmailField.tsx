import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { isEmail } from '@/shared/lib'
import { AuthField } from './AuthField'

export interface EmailFieldProps {
  value: string
  onValueChange: (value: string) => void
  error?: string
  id?: string
}

/** The email input every auth screen asks for, checkmark and all. */
export function EmailField({ value, onValueChange, error, id = 'email' }: EmailFieldProps) {
  const { t } = useTranslation()
  return (
    <AuthField
      id={id}
      label={t('auth.emailLabel')}
      type="email"
      inputMode="email"
      autoComplete="email"
      placeholder={t('auth.emailPlaceholder')}
      icon={<Mail />}
      value={value}
      onValueChange={onValueChange}
      valid={isEmail(value)}
      error={error}
    />
  )
}

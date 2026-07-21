import { type ReactNode, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthField, type AuthFieldProps } from './AuthField'
import { IconButton } from './primitives/icon-button'

export type PasswordFieldProps = Omit<AuthFieldProps, 'type' | 'rightSlot' | 'icon'> & {
  icon?: ReactNode
}

export function PasswordField({ icon, ...props }: PasswordFieldProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <AuthField
      {...props}
      type={visible ? 'text' : 'password'}
      icon={icon ?? <Lock />}
      autoComplete={props.autoComplete ?? 'current-password'}
      rightSlot={
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden />
          ) : (
            <Eye className="size-5" aria-hidden />
          )}
        </IconButton>
      }
    />
  )
}

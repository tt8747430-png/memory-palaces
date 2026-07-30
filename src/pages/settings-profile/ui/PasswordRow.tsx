import { useTranslation } from 'react-i18next'
import { ChevronRight, Lock } from 'lucide-react'

export function PasswordRow({ onChangePassword }: { onChangePassword: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-1 text-(length:--p-text-label) font-medium text-muted-foreground">
        {t('settings.profileEdit.password')}
      </span>
      <button
        type="button"
        onClick={onChangePassword}
        aria-label={t('settings.changePassword')}
        className="flex h-11 w-full items-center justify-between rounded-control border border-border bg-card px-3.5 text-left transition-colors active:bg-primary/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="flex items-center gap-2.5 text-foreground">
          <Lock className="size-4 text-muted-foreground" aria-hidden />
          <span aria-hidden className="text-[18px] leading-none tracking-[0.2em]">
            ••••••••
          </span>
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="text-(length:--p-text-label) font-medium">
            {t('settings.profileEdit.passwordAction')}
          </span>
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </button>
    </div>
  )
}

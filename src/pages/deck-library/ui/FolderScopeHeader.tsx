import { useTranslation } from 'react-i18next'
import { ChevronLeft, MoreVertical } from 'lucide-react'
import { IconButton } from '@/shared/ui'

export interface FolderScopeHeaderProps {
  name: string
  onBack: () => void
  onOpenMenu: () => void
}

/**
 * The library scoped to one folder. A folder is a page, not a mode of home, so it gets a page's
 * header: back on the left, the folder's name centred, its actions on the right.
 */
export function FolderScopeHeader({ name, onBack, onOpenMenu }: FolderScopeHeaderProps) {
  const { t } = useTranslation()
  return (
    <header className="bg-glass pt-safe">
      <div className="flex items-center gap-2 px-2 py-2">
        <IconButton variant="glass" aria-label={t('common.back')} onClick={onBack}>
          <ChevronLeft className="size-5" aria-hidden />
        </IconButton>
        <h1 className="min-w-0 flex-1 truncate text-center text-(length:--p-text-title) font-semibold text-heading">
          {name}
        </h1>
        <IconButton
          variant="glass"
          aria-label={t('folder.rowActions', { name })}
          onClick={onOpenMenu}
        >
          <MoreVertical className="size-5" aria-hidden />
        </IconButton>
      </div>
    </header>
  )
}

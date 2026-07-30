import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CollectionPreview } from '@/shared/ui'

export const PREVIEW_COUNT = 4

export interface RewardPreviewProps<T> {
  title: string
  ariaLabel: string
  items: ReadonlyArray<T>
  keyOf: (item: T) => string
  onSeeAll: () => void
  children: (item: T) => ReactNode
}

/** The profile's row of four medallions with a "see all" link. */
export function RewardPreview<T>({
  title,
  ariaLabel,
  items,
  keyOf,
  onSeeAll,
  children,
}: RewardPreviewProps<T>) {
  const { t } = useTranslation()
  return (
    <CollectionPreview
      title={title}
      seeAllLabel={t('common.seeAll')}
      ariaLabel={ariaLabel}
      onSeeAll={onSeeAll}
    >
      {items.slice(0, PREVIEW_COUNT).map((item) => (
        <span key={keyOf(item)} className="flex w-0 flex-1">
          {children(item)}
        </span>
      ))}
    </CollectionPreview>
  )
}

export interface RewardPreviewTileProps {
  onOpen: () => void
  ariaLabel: string
  children: ReactNode
}

export function RewardPreviewTile({ onOpen, ariaLabel, children }: RewardPreviewTileProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel}
      className="flex w-full flex-col items-center gap-1.5 rounded-card py-1 transition-transform duration-200 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {children}
    </button>
  )
}

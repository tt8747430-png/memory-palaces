import { useTranslation } from 'react-i18next'
import { ChevronRight, Folder, Layers, WalletCards } from 'lucide-react'
import { accentStyleOf } from '@/shared/config/actions'
import type { SwipeActionId, SwipeConfig, SwipeItemType } from '@/shared/config/swipe'
import { cn } from '@/shared/lib'
import { swipeActionIcon } from '@/shared/ui'

const TYPE_ICON: Record<SwipeItemType, typeof Layers> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}

export interface SwipePreviewProps {
  type: SwipeItemType
  config: SwipeConfig
}

/**
 * A row of this kind with both its swipes open at once, at the size and in the colours the real
 * rails wear. Inert on purpose: the strips below it are where a swipe is arranged, and a picture
 * that could also be edited would put two ways of doing one thing on the same screen. Its job is
 * to say which side is which — the right-swipe rail comes in from the left edge, which no label
 * conveys as well as the picture does.
 */
export function SwipePreview({ type, config }: SwipePreviewProps) {
  const { t } = useTranslation()
  const TypeIcon = TYPE_ICON[type]

  return (
    <div aria-hidden className="flex items-center gap-1">
      <Caps ids={config.leading} />
      <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-card bg-card px-3 py-2.5 shadow-rest">
        <span className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-primary">
          <TypeIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-body font-semibold text-heading">
          {t(`swipe.sample.${type}` as never)}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <Caps ids={config.trailing} />
    </div>
  )
}

function Caps({ ids }: { ids: readonly SwipeActionId[] }) {
  return (
    <div className="flex min-h-9 shrink-0 items-center gap-1">
      {ids.length === 0 ? (
        <span className="size-8 rounded-tile-slot border-2 border-dashed border-border" />
      ) : (
        ids.map((id) => <Cap key={id} action={id} />)
      )}
    </div>
  )
}

function Cap({ action }: { action: SwipeActionId }) {
  const accent = accentStyleOf(action)
  return (
    <span
      style={{ backgroundColor: accent.fill }}
      className={cn(
        'grid size-9 place-items-center rounded-tile [&_svg]:size-4',
        accent.ink === 'dark' ? 'text-(--p-navy-900)' : 'text-white',
      )}
    >
      {swipeActionIcon(action)}
    </span>
  )
}

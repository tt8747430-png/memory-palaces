import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Archive, BookOpen, Folder, FolderPlus, Heart } from 'lucide-react'
import { cn } from '@/shared/lib'

export type CollectionKind = 'all' | 'favorites' | 'bible' | 'folder' | 'unfiled' | 'archived'

export interface Collection {
  id: string
  label: string
  count: number
  kind: CollectionKind
  /** Folders only: their gradient class pair (or custom hex), shown as a swatch so the
   * rail becomes the user's own visual taxonomy instead of a row of identical chips. */
  color?: string
}

/** A folder's colour rendered as a small swatch. Folder colours are gradient class pairs
 * (`from-… to-…`) like a palace cover, or a free hex; both are handled here. Shared by the
 * rail chips and the page's folder header so the swatch never drifts. */
export function FolderSwatch({ color }: { color: string }) {
  const gradient = color.startsWith('from-')
  return (
    <span
      aria-hidden
      className={cn('size-3.5 shrink-0 rounded-full ring-1 ring-black/10', gradient && 'bg-linear-to-br', gradient && color)}
      style={
        gradient
          ? undefined
          : { backgroundImage: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color}, black 22%))` }
      }
    />
  )
}

export interface CollectionRailProps {
  collections: Collection[]
  activeId: string
  onSelect: (id: string) => void
  onNewFolder: () => void
}

const KIND_ICON: Partial<Record<CollectionKind, typeof Heart>> = {
  favorites: Heart,
  bible: BookOpen,
  folder: Folder,
  archived: Archive,
}

/** Horizontally scrollable collection filter for the Palaces screen: the built-in
 * collections (All, Favorites, Bible, Archived), the user's folders, and Unfiled, plus
 * a "+ Folder" affordance. The active chip carries the navy gradient; the rest are calm
 * white chips over the daylight ground. */
export function CollectionRail({ collections, activeId, onSelect, onNewFolder }: CollectionRailProps) {
  const { t } = useTranslation()
  return (
    <div
      role="tablist"
      aria-label={t('palaces.collectionsLabel')}
      className="-mx-5 flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-1"
    >
      {collections.map((collection) => {
        const active = collection.id === activeId
        // A folder leads with its own colour swatch; built-ins keep their semantic icon.
        const showSwatch = collection.kind === 'folder' && !!collection.color
        const Icon = showSwatch ? undefined : KIND_ICON[collection.kind]
        return (
          <motion.button
            key={collection.id}
            type="button"
            role="tab"
            aria-selected={active}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(collection.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              active
                ? 'bg-linear-to-r from-primary to-accent text-primary-foreground shadow-interactive'
                : 'border border-border bg-card text-heading shadow-rest',
            )}
          >
            {showSwatch && collection.color ? <FolderSwatch color={collection.color} /> : null}
            {Icon ? (
              <Icon
                className={cn(
                  'size-3.5 shrink-0',
                  collection.kind === 'favorites' && !active && 'fill-favorite text-favorite',
                  collection.kind === 'favorites' && active && 'fill-current',
                  active && collection.kind !== 'favorites' && 'text-current',
                  !active && collection.kind !== 'favorites' && 'text-accent',
                )}
                aria-hidden
              />
            ) : null}
            <span className="whitespace-nowrap text-[length:var(--p-text-label)] font-semibold">
              {collection.label}
            </span>
            <span
              className={cn(
                'rounded-full px-1.5 text-[length:var(--p-text-tiny)] font-bold tabular-nums',
                active ? 'bg-white/25 text-current' : 'bg-info-surface text-info-foreground',
              )}
            >
              {collection.count}
            </span>
          </motion.button>
        )
      })}

      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={onNewFolder}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-pill bg-info-surface px-3.5 py-2 text-info-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        )}
      >
        <FolderPlus className="size-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap text-[length:var(--p-text-label)] font-semibold">
          {t('palaces.newFolderChip')}
        </span>
      </motion.button>
    </div>
  )
}

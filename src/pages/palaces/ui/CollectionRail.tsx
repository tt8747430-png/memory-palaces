import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Archive, BookOpen, FolderPlus, Heart, LayoutGrid } from 'lucide-react'
import { cn } from '@/shared/lib'
import { PalaceCover } from '@/shared/ui'

export type CollectionKind = 'all' | 'favorites' | 'bible' | 'folder' | 'unfiled' | 'archived'

export interface Collection {
  id: string
  label: string
  count: number
  kind: CollectionKind
  /** Folders only: the colour their glyph is painted in (a `from-… to-…` gradient pair
   * or a free hex), paired with {@link icon} so the rail becomes the user's own visual
   * taxonomy instead of a row of identical chips. */
  color?: string
  /** Folders only: the emoji shown on the glyph. */
  icon?: string
}

/** A folder's identity rendered as a small emoji-on-colour tile — the same cover language
 * palaces use, so a folder reads as "a place my palaces live". One renderer, shared by the
 * rail, the move sheet, and the folder header, so the glyph never drifts. */
export function FolderGlyph({
  color,
  icon,
  className,
  iconClassName,
}: {
  color: string
  icon: string
  className?: string
  iconClassName?: string
}) {
  return (
    <PalaceCover
      icon={icon}
      color={color}
      variant="identity"
      className={cn('shrink-0 rounded-[7px] ring-1 ring-black/10', className)}
      iconClassName={iconClassName}
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
  all: LayoutGrid,
  favorites: Heart,
  bible: BookOpen,
  archived: Archive,
}

/** Horizontally scrollable collection filter for the home library: the built-in
 * collections (All, Favorites, Bible, Archived), the user's folders, and Unfiled, plus a
 * trailing "+ Folder" affordance. Built-ins lead with a semantic line icon; folders lead
 * with their own colour-and-emoji glyph. The active chip carries the navy→action gradient;
 * the rest stay calm white chips over the daylight ground. */
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
        const isFolder = collection.kind === 'folder' && !!collection.color
        const Icon = KIND_ICON[collection.kind]
        return (
          <motion.button
            key={collection.id}
            type="button"
            role="tab"
            aria-selected={active}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(collection.id)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-pill pr-3 transition-colors',
              isFolder ? 'pl-1.5' : 'pl-3',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              active
                ? 'bg-linear-to-r from-primary to-accent text-primary-foreground shadow-interactive'
                : 'border border-border bg-card text-heading shadow-rest',
            )}
          >
            {isFolder && collection.color ? (
              <FolderGlyph
                color={collection.color}
                icon={collection.icon ?? '🗂️'}
                className="size-6 rounded-full"
                iconClassName="text-[11px] leading-none"
              />
            ) : Icon ? (
              <Icon
                className={cn(
                  'size-4 shrink-0',
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
          'flex h-9 shrink-0 items-center gap-1.5 rounded-pill border border-dashed border-accent/40 bg-info-surface px-3.5 text-info-foreground',
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

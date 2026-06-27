import type { CSSProperties } from 'react'
import { cn } from '@/shared/lib'

export interface PalaceCoverProps {
  icon: string
  /** A preset Tailwind gradient (`from-… to-…`) or a custom hex (`#7C3AED`). */
  color: string
  /** When set, a downscaled photo data URL shown as the cover. */
  image?: string
  /**
   * No-photo backdrop. `identity` paints the palace's own color; `brand` keeps the
   * calm daylight gradient (large card covers, per the Cool-Daylight Rule). A photo
   * overrides both.
   */
  variant?: 'identity' | 'brand'
  /** Box geometry: size + radius (e.g. "size-11 rounded-control"). */
  className?: string
  /** Emoji size class (e.g. "text-2xl"). */
  iconClassName?: string
  /** Hide the emoji entirely (tiny avatars where it would just be noise). */
  hideIcon?: boolean
}

/**
 * The one place that knows how a palace cover renders, so custom photos and free
 * colors work everywhere a palace is shown (cards, list rows, the create preview).
 * Three cases:
 * - `image` → the photo under a navy scrim so an overlaid title stays legible.
 * - preset `color` (`from-… to-…`) → a Tailwind gradient + emoji.
 * - custom `color` (hex) → an inline gradient derived from the hex + emoji.
 */
export function PalaceCover({
  icon,
  color,
  image,
  variant = 'identity',
  className,
  iconClassName = 'text-2xl',
  hideIcon = false,
}: PalaceCoverProps) {
  if (image) {
    return (
      <div className={cn('relative overflow-hidden bg-primary', className)}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-[color-mix(in_oklch,var(--primary)_45%,transparent)] via-transparent to-[color-mix(in_oklch,var(--primary)_12%,transparent)]" />
        {!hideIcon ? (
          <span
            className={cn('absolute bottom-1 right-1.5 drop-shadow', iconClassName)}
            style={{ fontSize: '0.7em' }}
          >
            {icon}
          </span>
        ) : null}
      </div>
    )
  }

  if (variant === 'brand') {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-linear-to-br from-secondary to-surface-sky',
          className,
        )}
      >
        {!hideIcon ? <span className={iconClassName}>{icon}</span> : null}
      </div>
    )
  }

  const isPreset = color?.startsWith('from-')
  const style: CSSProperties | undefined = isPreset
    ? undefined
    : {
        backgroundImage: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color}, black 22%))`,
      }

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        isPreset && `bg-linear-to-br ${color}`,
        className,
      )}
      style={style}
    >
      {!hideIcon ? <span className={iconClassName}>{icon}</span> : null}
    </div>
  )
}

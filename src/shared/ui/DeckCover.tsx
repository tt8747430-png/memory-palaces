import type { CSSProperties } from 'react'
import { cn, useImageSrc } from '@/shared/lib'

export interface DeckCoverProps {
  icon: string
  color: string
  /** The deck's stored cover: an object path in the private bucket, or an inline `data:` image. */
  image?: string
  variant?: 'identity' | 'brand'
  className?: string
  iconClassName?: string
}

export function DeckCover({
  icon,
  color,
  image,
  variant = 'identity',
  className,
  iconClassName = 'text-glyph-xl',
}: DeckCoverProps) {
  // The bucket is private, so the bytes are read from the device's image cache rather than fetched
  // during render. Until the keeper has filled it, `pending` falls through to the colour and icon —
  // which is a cover, not an error state.
  const cover = useImageSrc('deck-images', image)

  if (cover.state === 'inline' || cover.state === 'cached') {
    return (
      <div className={cn('relative overflow-hidden bg-(--scrim)', className)}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cover.src})` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-[color-mix(in_oklch,var(--scrim)_45%,transparent)] via-transparent to-[color-mix(in_oklch,var(--scrim)_12%,transparent)]" />
        <span
          className={cn('absolute bottom-1 right-1.5 drop-shadow', iconClassName)}
          style={{ fontSize: '0.7em' }}
        >
          {icon}
        </span>
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
        <span className={iconClassName}>{icon}</span>
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
      <span className={iconClassName}>{icon}</span>
    </div>
  )
}

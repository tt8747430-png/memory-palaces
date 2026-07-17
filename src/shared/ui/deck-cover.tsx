import type { CSSProperties } from 'react'
import { cn } from '@/shared/lib'

export interface DeckCoverProps {
  icon: string
  color: string
  image?: string
  variant?: 'identity' | 'brand'
  className?: string
  iconClassName?: string
  hideIcon?: boolean
}

export function DeckCover({
  icon,
  color,
  image,
  variant = 'identity',
  className,
  iconClassName = 'text-2xl',
  hideIcon = false,
}: DeckCoverProps) {
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

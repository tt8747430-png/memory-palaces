import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn, EASE_OUT } from '@/shared/lib'

/**
 * `panel` sits in the flow of a scrolling screen. `hero` is the whole message a session screen
 * shows when it has nothing to run, and leaves the centring to its container.
 */
export type EmptyVariant = 'panel' | 'hero'

export interface EmptyProps {
  icon?: ReactNode
  emoji?: string
  title: string
  description: string
  action?: ReactNode
  variant?: EmptyVariant
  className?: string
}

export function Empty({
  icon,
  emoji,
  title,
  description,
  action,
  variant = 'panel',
  className,
}: EmptyProps) {
  const hero = variant === 'hero'
  const Title = hero ? 'h2' : 'h3'
  return (
    <motion.div
      data-slot="empty"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        hero ? 'gap-5' : 'py-16',
        className,
      )}
    >
      <div
        className={cn(
          'grid size-16 place-items-center rounded-card-featured bg-info-surface text-accent',
          !hero && 'mb-5',
        )}
      >
        {icon ?? (emoji ? <span className="text-3xl">{emoji}</span> : null)}
      </div>
      <div>
        <Title
          className={cn(
            'text-balance text-heading',
            hero
              ? 'mb-1 text-(length:--p-text-headline) font-bold'
              : 'mb-2 text-(length:--p-text-sub) font-semibold',
          )}
        >
          {title}
        </Title>
        <p
          className={cn(
            'mx-auto max-w-[34ch] text-pretty text-(length:--p-text-body)',
            !hero && 'mb-6',
          )}
        >
          {description}
        </p>
      </div>
      {action}
    </motion.div>
  )
}

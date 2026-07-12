import type { LucideIcon } from 'lucide-react'
import { Check, Lock } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'

const TIER_BG: Record<number, string> = {
  1: 'linear-gradient(135deg, var(--secondary), var(--accent))',
  2: 'linear-gradient(135deg, var(--accent), var(--primary))',
  3: 'linear-gradient(135deg, var(--primary), var(--accent))',
  4: 'linear-gradient(135deg, var(--rating-edge), var(--rating))',
  5: 'linear-gradient(135deg, var(--rating), var(--primary))',
}

export interface BadgeMedallionProps {
  icon: LucideIcon
  value?: string | number
  locked?: boolean
  tier?: number
  showLock?: boolean
  showCheck?: boolean
  shine?: boolean
  className?: string
}

export function BadgeMedallion({
  icon: Icon,
  value,
  locked = false,
  tier = 3,
  showLock = false,
  showCheck = false,
  shine = false,
  className,
}: BadgeMedallionProps) {
  const background = locked ? undefined : TIER_BG[Math.min(Math.max(tier, 1), 5)]
  return (
    <span
      aria-hidden
      style={background ? { background } : undefined}
      className={cn(
        'relative grid size-20 shrink-0 place-items-center rounded-full',
        locked ? 'bg-primary/[0.06]' : 'shadow-interactive',
        className,
      )}
    >
      {locked ? null : (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/35 to-transparent" />
      )}
      {shine && !locked ? (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <motion.span
            aria-hidden
            className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent"
            initial={{ x: '-60%' }}
            animate={{ x: '460%' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          />
        </span>
      ) : null}
      <span className="relative flex flex-col items-center gap-0.5">
        <Icon
          className={cn('size-7', locked ? 'text-primary/30' : 'text-white')}
          strokeWidth={2.25}
          aria-hidden
        />
        {value != null ? (
          <span
            className={cn(
              'text-[12px] font-extrabold leading-none tabular-nums',
              locked ? 'text-primary/35' : 'text-white',
            )}
          >
            {value}
          </span>
        ) : null}
      </span>
      {locked && showLock ? (
        <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-[color:var(--surface)] bg-primary/15 text-primary/60">
          <Lock className="size-3" strokeWidth={2.5} aria-hidden />
        </span>
      ) : null}
      {!locked && showCheck ? (
        <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-[color:var(--surface)] bg-[var(--success-foreground)] text-white">
          <Check className="size-3" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
    </span>
  )
}

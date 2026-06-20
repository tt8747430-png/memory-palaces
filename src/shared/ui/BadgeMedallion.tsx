import type { LucideIcon } from 'lucide-react'
import { Check, Lock } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'

/**
 * Tier color ramp, brand-aligned (sky → action → navy → gold → gold+navy) so a badge's
 * prestige reads through color while staying inside the daylight palette — no metallic
 * bronze/silver that would clash with the system. Tiers cap at 5.
 */
const TIER_BG: Record<number, string> = {
  1: 'linear-gradient(135deg, var(--secondary), var(--accent))',
  2: 'linear-gradient(135deg, var(--accent), var(--primary))',
  3: 'linear-gradient(135deg, var(--primary), var(--accent))',
  4: 'linear-gradient(135deg, var(--rating-edge), var(--rating))',
  5: 'linear-gradient(135deg, var(--rating), var(--primary))',
}

export interface BadgeMedallionProps {
  icon: LucideIcon
  /** Bold number stacked under the icon (a tier threshold or milestone count). */
  value?: string | number
  /** Locked badges render greyscale with a faded target; earned ones get the tier color. */
  locked?: boolean
  /** 1-based tier; selects the color ramp. Ignored when locked. Defaults to 3 (the brand pairing). */
  tier?: number
  /** Show a small lock glyph on a locked medallion (used on full grids, not previews). */
  showLock?: boolean
  /** Show a success check on an earned medallion — the binary "done" mark that sets a
   * one-shot achievement apart from a tiered badge. Earned only. */
  showCheck?: boolean
  /** Hero treatment: a single specular highlight sweeps across the disc on entry. Earned
   * only; reserved for the detail-screen hero, never the dense grids. */
  shine?: boolean
  /** Size the disc here (default `size-20`); the icon and number scale with it. */
  className?: string
}

/**
 * A circular, glossy achievement/badge medallion: a tier-colored disc with a top
 * highlight, a centered icon, and an optional bold number. Locked medallions go
 * greyscale (icon faded, optional lock). Shared by the profile preview rows and the
 * full Badges / Achievements grids so a medallion looks identical everywhere.
 */
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
      {/* Top gloss — only on earned medallions, where it catches the light. */}
      {locked ? null : (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/35 to-transparent" />
      )}
      {/* Specular sweep for the hero, clipped to the disc so it never overruns the lock
          badge. MotionConfig holds the transform still under reduced motion, leaving the
          static gloss above. */}
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

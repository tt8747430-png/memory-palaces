import type { LucideIcon } from 'lucide-react'
import { Lock } from 'lucide-react'
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
    </span>
  )
}

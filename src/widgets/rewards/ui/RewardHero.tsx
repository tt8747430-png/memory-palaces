import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { BadgeMedallion } from '@/shared/ui'

export interface RewardHeroProps {
  icon: LucideIcon
  /** The accent bloom behind the medallion — earned rewards get it, locked ones do not. */
  glow?: boolean
  locked?: boolean
  tier?: number
  shine?: boolean
  /** Status chip, tally or note shown under the medallion. */
  children?: ReactNode
}

/** The top of a reward's detail screen: a medallion that springs in, and its status. */
export function RewardHero({ icon, glow = false, locked, tier, shine, children }: RewardHeroProps) {
  return (
    <section className="relative flex flex-col items-center pt-3 text-center">
      {glow ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-40 -translate-x-1/2 -translate-y-4 rounded-full opacity-35 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 68%)' }}
        />
      ) : null}
      <motion.div
        initial={{ opacity: 0, scale: 0.84, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative"
      >
        <BadgeMedallion icon={icon} locked={locked} tier={tier} shine={shine} className="size-28" />
      </motion.div>
      {children}
    </section>
  )
}

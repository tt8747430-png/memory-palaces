import { cn } from '@/shared/lib'

/**
 * The app icon itself — the favicon is the full icon, cut to its tile — so the sign-in screen shows
 * the thing the learner tapped to get here.
 */
export function AuthLogo({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.svg"
      alt="Mindscape"
      draggable={false}
      className={cn('drop-shadow-[0_8px_18px_oklch(var(--p-tint-navy)/0.28)]', className)}
    />
  )
}

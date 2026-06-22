import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface SpeedDialAction {
  id: string
  label: string
  icon: ReactNode
  onSelect: () => void
}

export interface SpeedDialProps {
  /** Accessible name for the closed trigger, e.g. "Quick actions". */
  label: string
  actions: SpeedDialAction[]
  className?: string
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/**
 * Floating speed-dial (signature action affordance). A navy `+` pinned bottom-right above
 * the liquid-glass nav; pressing it rotates to a × and springs a short stack of labelled
 * circular actions up over a soft navy scrim. Built for thumbs: 56px trigger, 48px actions,
 * Esc to close, focus moves into the dial and returns to the trigger on close. Motion is
 * staggered top-down and degrades to a crossfade under reduced-motion.
 */
export function SpeedDial({ label, actions, className }: SpeedDialProps) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstActionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    // Move focus into the revealed dial so keyboard users land on the actions.
    firstActionRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const fire = (action: SpeedDialAction) => {
    setOpen(false)
    action.onSelect()
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[210] bg-[oklch(29%_0.063_254.3_/_0.3)] backdrop-blur-[2px]"
          />
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          'fixed right-5 z-[220] flex flex-col items-end gap-3',
          'bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]',
          className,
        )}
      >
        <AnimatePresence>
          {open ? (
            <motion.ul className="flex list-none flex-col items-end gap-3">
              {actions.map((action, index) => (
                <motion.li
                  key={action.id}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.85 }}
                  transition={{
                    delay: reduce ? 0 : (actions.length - 1 - index) * 0.045,
                    duration: 0.22,
                    ease: EASE_OUT,
                  }}
                  className="flex items-center gap-2.5"
                >
                  <span className="rounded-full bg-card px-3 py-1 text-[length:var(--p-text-label)] font-semibold text-heading shadow-rest">
                    {action.label}
                  </span>
                  <button
                    ref={index === 0 ? firstActionRef : undefined}
                    type="button"
                    aria-label={action.label}
                    onClick={() => fire(action)}
                    className="grid size-12 place-items-center rounded-full bg-card text-primary shadow-rest transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    {action.icon}
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>

        <motion.button
          ref={triggerRef}
          type="button"
          aria-label={label}
          aria-expanded={open}
          aria-haspopup="menu"
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen((value) => !value)}
          className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]"
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="grid place-items-center"
          >
            <Plus className="size-6" aria-hidden />
          </motion.span>
        </motion.button>
      </div>
    </>
  )
}

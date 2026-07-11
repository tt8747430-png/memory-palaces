import { type ReactNode, useEffect, useRef, useState } from 'react'
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

  // One action needs no stack: the trigger fires it directly, skipping the scrim, the reveal,
  // and the +→× rotation. Keeps the toolbar honest per surface — a folder's dial is just
  // "Add deck", not a menu that also offers things the surface can't do.
  const soleAction = actions.length === 1 ? actions[0]! : null

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
                  className="flex items-center"
                >
                  {/* The whole pill is one target — label text and icon both fire the action. */}
                  <button
                    ref={index === 0 ? firstActionRef : undefined}
                    type="button"
                    aria-label={action.label}
                    onClick={() => fire(action)}
                    className="group flex items-center gap-2.5 rounded-full transition-transform active:scale-[0.97] focus-visible:outline-none"
                  >
                    <span className="rounded-full bg-card px-3 py-1 text-[length:var(--p-text-label)] font-semibold text-heading shadow-rest transition-colors group-hover:bg-info-surface">
                      {action.label}
                    </span>
                    <span className="grid size-12 place-items-center rounded-full bg-card text-primary shadow-rest transition-colors group-hover:bg-info-surface group-focus-visible:ring-2 group-focus-visible:ring-primary/50">
                      {action.icon}
                    </span>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>

        <motion.button
          ref={triggerRef}
          type="button"
          aria-label={soleAction ? soleAction.label : label}
          aria-expanded={soleAction ? undefined : open}
          aria-haspopup={soleAction ? undefined : 'menu'}
          whileTap={{ scale: 0.92 }}
          onClick={() => (soleAction ? soleAction.onSelect() : setOpen((value) => !value))}
          className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]"
        >
          <motion.span
            animate={{ rotate: soleAction ? 0 : open ? 45 : 0 }}
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

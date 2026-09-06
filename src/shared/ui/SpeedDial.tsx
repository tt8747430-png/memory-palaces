import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn, EASE_OUT } from '@/shared/lib'

export interface SpeedDialAction {
  id: string
  label: string
  icon: ReactNode
  onSelect: () => void
}

/**
 * Where the dial sits above the bottom edge: clear of the app nav where there is one, clear of the
 * home indicator where there is not.
 */
export type SpeedDialPlacement = 'above-nav' | 'above-safe-area'

const PLACEMENT: Record<SpeedDialPlacement, string> = {
  'above-nav': 'bottom-[calc(var(--app-bottom-inset)+1rem)]',
  'above-safe-area': 'bottom-[calc(var(--p-safe-bottom)+0.75rem)]',
}

export interface SpeedDialProps {
  label: string
  actions: SpeedDialAction[]
  placement?: SpeedDialPlacement
  className?: string
}

export function SpeedDial({ label, actions, placement = 'above-nav', className }: SpeedDialProps) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstActionRef = useRef<HTMLButtonElement>(null)

  const soleAction = actions.length === 1 ? actions[0]! : null

  /**
   * Closing always hands focus back to the trigger. Escape did this already; clicking the scrim
   * did not, so dismissing the dial by tapping away dropped focus onto `<body>` and a keyboard or
   * screen-reader user restarted from the top of the document.
   */
  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    firstActionRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [close, open])

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
            onClick={close}
            className="fixed inset-0 z-(--z-dial-scrim) bg-[color-mix(in_oklch,var(--scrim)_34%,transparent)] backdrop-blur-[2px] in-data-keyboard:hidden"
          />
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          'fixed right-5 z-(--z-dial) flex flex-col items-end gap-3',
          // WebKit re-clamps bottom-anchored fixed boxes to the visual viewport when the keyboard
          // shows, which floats the dial mid-screen over the field being typed into. AppNav and
          // AppScreen's footer dock yield for the same reason. CODE_STYLE §11.
          'in-data-keyboard:hidden',
          PLACEMENT[placement],
          className,
        )}
      >
        <AnimatePresence>
          {open ? (
            <motion.ul
              role="menu"
              aria-label={label}
              className="flex list-none flex-col items-end gap-3"
            >
              {actions.map((action, index) => (
                <motion.li
                  key={action.id}
                  role="none"
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
                  <button
                    ref={index === 0 ? firstActionRef : undefined}
                    type="button"
                    role="menuitem"
                    aria-label={action.label}
                    onClick={() => fire(action)}
                    className="group flex items-center gap-2.5 rounded-full transition-transform active:scale-[0.97]"
                  >
                    <span className="rounded-full bg-card px-3 py-1 text-label font-semibold text-heading shadow-rest transition-colors group-hover:bg-info-surface">
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
          className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface)"
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

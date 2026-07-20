import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import {
  animate,
  AnimatePresence,
  motion,
  type PanInfo,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  GraduationCap,
  Lightbulb,
  MapPin,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import type { Card } from '@/decks'
import { tick } from '@/shared/domain'
import { cn } from '@/shared/lib'
import { FlyoutMenu, type MenuAction } from '@/shared/ui'

const SPRING = { type: 'spring', stiffness: 500, damping: 36 } as const
const CARD_EASE = [0.16, 1, 0.3, 1] as const

/** Past this much drag, or this much throw, the card commits to the next one. */
const COMMIT_DISTANCE = 70
/** `main` reads use-gesture's px/ms velocity (0.45); motion reports px/s. */
const COMMIT_VELOCITY = 450

export interface CardBrowserProps {
  open: boolean
  cards: Card[]
  startId: string | null
  onClose: () => void
  onEdit: (id: string) => void
  onToggleFlag: (id: string) => void
  onDuplicate: (id: string) => void
  onMarkKnown: (id: string) => void
  onResetSrs: (id: string) => void
  onDelete: (id: string) => void
}

export function CardBrowser({
  open,
  cards,
  startId,
  onClose,
  onEdit,
  onToggleFlag,
  onDuplicate,
  onMarkKnown,
  onResetSrs,
  onDelete,
}: CardBrowserProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-240, 0, 240], [-6, 0, 6])
  const count = cards.length
  const dragged = useRef(false)

  useEffect(() => {
    if (!open) return
    const at = startId ? cards.findIndex((card) => card.id === startId) : 0
    // Opening is the one moment this dialog syncs itself to its props: which card the
    // learner tapped is an input, and every later index change is theirs, not the list's.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(at < 0 ? 0 : at)
    setFlipped(false)
    x.set(0)
    // `cards` is deliberately absent: re-running on every store emission would yank the
    // learner back to the card they opened with mid-browse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startId])

  useEffect(() => {
    if (open && count === 0) onClose()
  }, [open, count, onClose])

  // Reads clamp instead of an effect normalising `index`, so deleting the last card
  // cannot land a stale index on screen for a frame.
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0
  const current = count > 0 ? cards[safeIndex]! : null

  const go = (delta: number) => {
    const next = safeIndex + delta
    if (next < 0 || next > count - 1) {
      void animate(x, 0, SPRING)
      return
    }
    setFlipped(false)
    setIndex(next)
    tick()
    x.set(0)
  }

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    dragged.current = true
    const dx = info.offset.x
    const vx = info.velocity.x
    if ((dx < -COMMIT_DISTANCE || vx < -COMMIT_VELOCITY) && safeIndex < count - 1) go(1)
    else if ((dx > COMMIT_DISTANCE || vx > COMMIT_VELOCITY) && safeIndex > 0) go(-1)
    else void animate(x, 0, SPRING)
  }

  const menuActions: MenuAction[] = current
    ? [
        {
          id: 'flag',
          label: current.flagged ? t('cards.row.unflag') : t('cards.row.flag'),
          icon: <Flag className="size-5" aria-hidden />,
          onSelect: () => onToggleFlag(current.id),
        },
        {
          id: 'duplicate',
          label: t('cards.row.duplicate'),
          icon: <Copy className="size-5" aria-hidden />,
          onSelect: () => onDuplicate(current.id),
        },
        {
          id: 'known',
          label: t('cards.row.markKnown'),
          icon: <GraduationCap className="size-5" aria-hidden />,
          onSelect: () => onMarkKnown(current.id),
        },
        {
          id: 'reset',
          label: t('cards.row.resetSchedule'),
          icon: <RotateCcw className="size-5" aria-hidden />,
          onSelect: () => onResetSrs(current.id),
        },
        {
          id: 'delete',
          label: t('common.delete'),
          icon: <Trash2 className="size-5" aria-hidden />,
          destructive: true,
          onSelect: () => onDelete(current.id),
        },
      ]
    : []

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      modal="trap-focus"
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 bg-[color-mix(in_oklch,var(--primary)_42%,transparent)] backdrop-blur-md',
            'transition-opacity duration-300 ease-out',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          )}
        />
        <Dialog.Popup
          className={cn(
            'fixed inset-0 mx-auto flex w-full max-w-[26.875rem] flex-col outline-none',
            'transition-[opacity,transform] duration-300 ease-out',
            'data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0',
          )}
        >
          {current ? (
            <>
              <div className="flex min-h-14 w-full items-center justify-between gap-2 px-4 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))]">
                <Dialog.Close
                  aria-label={t('common.close')}
                  className="grid size-10 place-items-center rounded-full bg-card-glass text-heading shadow-rest ring-1 ring-[color:var(--border-glass)] transition-transform active:scale-95"
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
                <Dialog.Title className="rounded-pill bg-card-glass px-4 py-1.5 text-[length:var(--ms-text-label)] font-bold tabular-nums text-heading shadow-rest ring-1 ring-[color:var(--border-glass)]">
                  {t('cards.browser.position', { current: safeIndex + 1, total: count })}
                </Dialog.Title>
                <FlyoutMenu
                  label={t('cards.browser.menu')}
                  actions={menuActions}
                  side="bottom"
                  align="end"
                  trigger={
                    <button
                      type="button"
                      aria-label={t('cards.browser.menu')}
                      className="grid size-10 place-items-center rounded-full bg-card-glass text-heading shadow-rest ring-1 ring-[color:var(--border-glass)] transition-transform active:scale-95"
                    >
                      <MoreVertical className="size-5" aria-hidden />
                    </button>
                  }
                />
              </div>

              <div className="relative flex flex-1 items-center px-5 pb-2 [perspective:1400px]">
                {count > 1 ? (
                  <div
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-[58%] w-[86%] rounded-card-featured border border-white/25 bg-card/30"
                    style={{ transform: 'translate(-50%,-46%) scale(0.95)' }}
                  />
                ) : null}
                <motion.div
                  drag="x"
                  dragMomentum={false}
                  // Cleared at the start of every gesture, not inside the tap handler: motion
                  // cancels the tap once a drag passes its threshold, so a flag cleared on tap
                  // would still be set when the *next* gesture began and swallow that flip.
                  onPointerDown={() => {
                    dragged.current = false
                  }}
                  onDragStart={() => {
                    dragged.current = true
                  }}
                  onDragEnd={onDragEnd}
                  onTap={() => {
                    if (!dragged.current) setFlipped((value) => !value)
                  }}
                  style={{ x, rotate }}
                  className="relative z-10 w-full touch-pan-y"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={current.id}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.22, ease: CARD_EASE }}
                      className="h-[clamp(21.25rem,62vh,35rem)]"
                    >
                      <motion.div
                        animate={{ rotateY: flipped ? 180 : 0 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.45, ease: CARD_EASE }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="relative size-full cursor-pointer select-none"
                      >
                        <div
                          style={{ backfaceVisibility: 'hidden' }}
                          className="absolute inset-0 flex flex-col rounded-card-featured border border-border bg-card p-6 shadow-elevated"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-control bg-info-surface px-2.5 py-1 text-[length:var(--ms-text-tiny)] font-semibold text-info-foreground">
                              {t('cards.browser.front')}
                            </span>
                            {current.flagged ? (
                              <Flag
                                className="size-4 fill-[var(--rating)] text-[var(--rating-edge)]"
                                aria-label={t('cards.row.flagged')}
                              />
                            ) : null}
                          </div>
                          <div className="flex flex-1 items-center justify-center overflow-y-auto px-1 py-3 text-center scrollbar-hide">
                            <p className="text-balance break-words text-[clamp(1.5rem,6.5vw,2.125rem)] font-bold leading-tight text-heading">
                              {current.front}
                            </p>
                          </div>
                          <p className="text-center text-[length:var(--ms-text-label)] font-medium text-muted-foreground">
                            {t('cards.browser.flip')}
                          </p>
                        </div>
                        <div
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          className="absolute inset-0 flex flex-col rounded-card-featured border border-border bg-card p-6 shadow-elevated"
                        >
                          <span className="self-start rounded-control bg-info-surface px-2.5 py-1 text-[length:var(--ms-text-tiny)] font-semibold text-info-foreground">
                            {t('cards.browser.back')}
                          </span>
                          <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-3 text-center scrollbar-hide">
                            <p className="text-balance break-words text-[clamp(1.125rem,5vw,1.5rem)] font-semibold leading-snug text-heading">
                              {current.back}
                            </p>
                            {current.hint ? (
                              <p className="flex max-w-[34ch] items-center gap-1.5 text-[length:var(--ms-text-label)] italic leading-relaxed text-accent">
                                <MapPin className="size-3.5 shrink-0" aria-hidden />
                                {current.hint}
                              </p>
                            ) : null}
                            {current.tip ? (
                              <p className="flex max-w-[34ch] items-center gap-1.5 rounded-control bg-[var(--warning-surface)] px-3 py-1.5 text-[length:var(--ms-text-label)] italic leading-relaxed text-[var(--warning-foreground)]">
                                <Lightbulb className="size-3.5 shrink-0" aria-hidden />
                                {current.tip}
                              </p>
                            ) : null}
                          </div>
                          <p className="text-center text-[length:var(--ms-text-label)] font-medium text-muted-foreground">
                            {t('cards.browser.flipBack')}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              <div className="flex items-center justify-between px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={safeIndex === 0}
                  aria-label={t('cards.browser.prev')}
                  className="grid size-12 place-items-center rounded-full bg-card-glass text-heading shadow-rest ring-1 ring-[color:var(--border-glass)] transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(current.id)}
                  className="flex h-12 items-center gap-2 rounded-control bg-primary px-6 text-[length:var(--ms-text-sub)] font-semibold text-primary-foreground shadow-interactive transition-transform active:scale-[0.97]"
                >
                  <Pencil className="size-[1.125rem]" aria-hidden />
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={safeIndex >= count - 1}
                  aria-label={t('cards.browser.next')}
                  className="grid size-12 place-items-center rounded-full bg-card-glass text-heading shadow-rest ring-1 ring-[color:var(--border-glass)] transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>
            </>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import {
  animate,
  type HTMLMotionProps,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { useDrag } from '@use-gesture/react'
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
import type { Card } from '@/entities/card'
import { cn, tick } from '@/shared/lib'
import { FlyoutMenu, type SheetAction } from '@/shared/ui'

const SPRING = { type: 'spring', stiffness: 500, damping: 36 } as const
const CARD_EASE = [0.16, 1, 0.3, 1] as const

/**
 * Where each card in the stack sits. Depth 0 is the card in play; the rest step back and down so
 * the deck has a readable edge. Going forward, the next card animates from depth 1 to depth 0 —
 * it rises out of the stack it was already part of instead of sliding in from nowhere.
 */
const DEPTH_POSE = [
  { scale: 1, y: 0, x: 0, opacity: 1 },
  { scale: 0.94, y: 16, x: 0, opacity: 1 },
  { scale: 0.88, y: 30, x: 0, opacity: 0.7 },
] as const

/** How many cards deep the stack is drawn. Beyond this nothing is visible anyway. */
const STACK_DEPTH = 2

/** Where the card in play enters from: out of the deck (forward) or back from the edge (back). */
type EnterFrom = 'behind' | 'edge' | null

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
  const [enterFrom, setEnterFrom] = useState<EnterFrom>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-240, 0, 240], [-6, 0, 6])
  const count = cards.length
  const shellRef = useRef<HTMLDivElement>(null)
  // True while a card is flying out and its successor is sliding in, so drags and
  // repeat taps can't start a second transition mid-flight.
  const animating = useRef(false)

  useEffect(() => {
    if (!open) return
    const at = startId ? cards.findIndex((l) => l.id === startId) : 0
    setIndex(at < 0 ? 0 : at)
    setFlipped(false)
    setEnterFrom(null)
    animating.current = false
    x.set(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startId])

  useEffect(() => {
    if (!open) return
    if (count === 0) onClose()
    else if (index > count - 1) setIndex(count - 1)
  }, [open, count, index, onClose])

  /**
   * Forward, the card in play is thrown off and the card *behind* it is promoted into its place —
   * it was already on screen, one layer down, so the move reads as the deck advancing. Backward
   * has no deck to draw from (the stack only holds what is still ahead), so the card returns the
   * way it left: out to the right, the previous one back in from the left.
   */
  const go = (delta: number) => {
    const next = index + delta
    if (animating.current || next < 0 || next > count - 1) {
      animate(x, 0, SPRING)
      return
    }
    tick()
    if (reduce) {
      setFlipped(false)
      setEnterFrom(null)
      setIndex(next)
      x.set(0)
      return
    }
    animating.current = true
    const off = (shellRef.current?.offsetWidth ?? 430) + 48
    const dir = delta > 0 ? -1 : 1 // next exits left, prev exits right
    animate(x, dir * off, {
      duration: 0.2,
      ease: CARD_EASE,
      onComplete: () => {
        setFlipped(false)
        setEnterFrom(delta > 0 ? 'behind' : 'edge')
        setIndex(next)
        // The outgoing card has unmounted with its key; the slot is free to sit at rest again
        // while the arriving card runs its own entrance.
        x.set(0)
        animating.current = false
      },
    })
  }

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx], tap }) => {
      if (animating.current) return
      if (tap) {
        setFlipped((value) => !value)
        return
      }
      if (down) {
        x.set(mx)
        return
      }
      const fling = vx > 0.45
      if ((mx < -70 || (fling && dx < 0)) && index < count - 1) go(1)
      else if ((mx > 70 || (fling && dx > 0)) && index > 0) go(-1)
      else animate(x, 0, SPRING)
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } },
  )

  const current = count > 0 ? cards[Math.min(index, count - 1)]! : null
  /** The cards still to come, nearest first — the deck drawn under the one in play. */
  const ahead = cards.slice(index + 1, index + 1 + STACK_DEPTH)

  const menuActions: SheetAction[] = current
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
            'fixed inset-0 z-[300] bg-[color-mix(in_oklch,var(--primary)_42%,transparent)] backdrop-blur-md',
            'transition-opacity duration-300 ease-out',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          )}
        />
        <Dialog.Popup
          className={cn(
            'fixed inset-0 z-[310] mx-auto flex w-full max-w-[430px] flex-col outline-none',
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
                  className="grid size-10 place-items-center rounded-full bg-card-glass text-heading ring-1 ring-[color:var(--border-glass)] shadow-rest transition-transform active:scale-95"
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
                <Dialog.Title className="rounded-pill bg-card-glass px-4 py-1.5 text-[length:var(--p-text-label)] font-bold tabular-nums text-heading ring-1 ring-[color:var(--border-glass)] shadow-rest">
                  {t('cards.browser.position', { current: index + 1, total: count })}
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
                      className="grid size-10 place-items-center rounded-full bg-card-glass text-heading ring-1 ring-[color:var(--border-glass)] shadow-rest transition-transform active:scale-95"
                    >
                      <MoreVertical className="size-5" aria-hidden />
                    </button>
                  }
                />
              </div>

              <div
                ref={shellRef}
                className="relative flex flex-1 items-center px-5 pb-2 [perspective:1400px]"
              >
                <div className="relative h-[clamp(340px,62vh,560px)] w-full">
                  {/* The rest of the deck: the real next cards, showing their real fronts, so the
                      card that arrives next is one you have already seen the edge of. */}
                  {ahead.map((queued, i) => (
                    <QueuedPreview
                      key={queued.id}
                      card={queued}
                      // `ahead` is nearest-first, so depth counts up with the index. Inverting
                      // this draws the *furthest* card in the visible slot: you peek at card 15
                      // and then swipe up card 14.
                      depth={i + 1}
                      reduce={Boolean(reduce)}
                    />
                  ))}

                  <motion.div
                    {...(bind() as unknown as HTMLMotionProps<'div'>)}
                    style={{ x, rotate }}
                    className="absolute inset-0 z-10 touch-pan-y"
                  >
                    {/* Keyed by card: the one leaving is already off screen and simply goes. The
                        one arriving enters from the pose it held one layer down (forward) or from
                        the edge it was last seen at (backward). */}
                    <motion.div
                      key={current.id}
                      initial={
                        reduce || enterFrom === null
                          ? false
                          : enterFrom === 'behind'
                            ? DEPTH_POSE[1]
                            : {
                                ...DEPTH_POSE[0],
                                x: -((shellRef.current?.offsetWidth ?? 430) + 48),
                              }
                      }
                      animate={DEPTH_POSE[0]}
                      transition={reduce ? { duration: 0 } : { duration: 0.3, ease: CARD_EASE }}
                      className="size-full"
                    >
                      <motion.div
                        animate={{ rotateY: flipped ? 180 : 0 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.45, ease: CARD_EASE }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="relative size-full cursor-pointer select-none"
                      >
                        <PreviewFace card={current} />
                        <PreviewFace card={current} back />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={index === 0}
                  aria-label={t('cards.browser.prev')}
                  className="grid size-12 place-items-center rounded-full bg-card-glass text-heading ring-1 ring-[color:var(--border-glass)] shadow-rest transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(current.id)}
                  className="flex h-12 items-center gap-2 rounded-control bg-primary px-6 text-[length:var(--p-text-sub)] font-semibold text-primary-foreground shadow-interactive transition-transform active:scale-[0.97]"
                >
                  <Pencil className="size-[18px]" aria-hidden />
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={index >= count - 1}
                  aria-label={t('cards.browser.next')}
                  className="grid size-12 place-items-center rounded-full bg-card-glass text-heading ring-1 ring-[color:var(--border-glass)] shadow-rest transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-35"
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

const FACE_SURFACE =
  'absolute inset-0 flex flex-col rounded-card-featured border border-border bg-card p-6 shadow-elevated'

/**
 * One side of a preview card. Shared by the card in play and by the cards waiting behind it, so a
 * card that is promoted out of the deck is already exactly the thing it becomes — no cross-fade
 * between a placeholder and the real face.
 */
function PreviewFace({ card, back = false }: { card: Card; back?: boolean }) {
  const { t } = useTranslation()

  if (!back) {
    return (
      <div style={{ backfaceVisibility: 'hidden' }} className={FACE_SURFACE}>
        <div className="flex items-center justify-between">
          <span className="rounded-control bg-info-surface px-2.5 py-1 text-[length:var(--p-text-tiny)] font-semibold text-info-foreground">
            {t('cards.browser.front')}
          </span>
          {card.flagged ? (
            <Flag
              className="size-4 fill-[var(--rating)] text-[var(--rating-edge)]"
              aria-label={t('cards.row.flagged')}
            />
          ) : null}
        </div>
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-1 py-3 text-center scrollbar-hide">
          <p className="text-balance break-words text-[clamp(24px,6.5vw,34px)] font-bold leading-tight text-heading">
            {card.front}
          </p>
        </div>
        <p className="text-center text-[length:var(--p-text-label)] font-medium text-muted-foreground">
          {t('cards.browser.flip')}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      className={FACE_SURFACE}
    >
      <span className="self-start rounded-control bg-info-surface px-2.5 py-1 text-[length:var(--p-text-tiny)] font-semibold text-info-foreground">
        {t('cards.browser.back')}
      </span>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-3 text-center scrollbar-hide">
        <p className="text-balance break-words text-[clamp(18px,5vw,24px)] font-semibold leading-snug text-heading">
          {card.back}
        </p>
        {card.hint ? (
          <p className="flex max-w-[34ch] items-center gap-1.5 text-[length:var(--p-text-label)] italic leading-relaxed text-accent">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {card.hint}
          </p>
        ) : null}
        {card.tip ? (
          <p className="flex max-w-[34ch] items-center gap-1.5 rounded-control bg-[var(--warning-surface)] px-3 py-1.5 text-[length:var(--p-text-label)] italic leading-relaxed text-[var(--warning-foreground)]">
            <Lightbulb className="size-3.5 shrink-0" aria-hidden />
            {card.tip}
          </p>
        ) : null}
      </div>
      <p className="text-center text-[length:var(--p-text-label)] font-medium text-muted-foreground">
        {t('cards.browser.flipBack')}
      </p>
    </div>
  )
}

/** A card waiting its turn: the real card, its real front, inert and one step further back. */
function QueuedPreview({ card, depth, reduce }: { card: Card; depth: number; reduce: boolean }) {
  const pose = DEPTH_POSE[Math.min(depth, DEPTH_POSE.length - 1)]!
  return (
    <motion.div
      aria-hidden
      inert
      initial={reduce ? false : DEPTH_POSE[Math.min(depth + 1, DEPTH_POSE.length - 1)]}
      animate={pose}
      transition={reduce ? { duration: 0 } : { duration: 0.3, ease: CARD_EASE }}
      style={{ zIndex: -depth }}
      className="pointer-events-none absolute inset-0"
    >
      <PreviewFace card={card} />
    </motion.div>
  )
}

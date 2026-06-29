import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import {
  animate,
  AnimatePresence,
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
  Lightbulb,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import type { Locus } from '@/entities/locus'
import { cn, tick } from '@/shared/lib'
import { FlyoutMenu, type SheetAction } from '@/shared/ui'

const SPRING = { type: 'spring', stiffness: 500, damping: 36 } as const
const CARD_EASE = [0.16, 1, 0.3, 1] as const

export interface CardBrowserProps {
  open: boolean
  loci: Locus[]
  /** The card the browser opens on; falls back to the first card. */
  startId: string | null
  onClose: () => void
  /** Open the full editor for a card (the host closes the browser and navigates). */
  onEdit: (id: string) => void
  onToggleFlag: (id: string) => void
  onDuplicate: (id: string) => void
  /** Request deletion (the host closes the browser and runs its confirm). */
  onDelete: (id: string) => void
}

/**
 * A full-screen card browser: swipe (or arrow) through the room's whole deck from the card
 * the user tapped, tap to flip front/back, and act on the current card (edit / flag /
 * duplicate / delete). Built on the same Base UI Dialog as {@link Sheet} (focus-trapped,
 * Escape- and backdrop-dismissible) over a navy scrim, so it reads as a focused lightbox on
 * the daylight ground. Replaces the always-on preview carousel — the deck is now on demand.
 */
export function CardBrowser({
  open,
  loci,
  startId,
  onClose,
  onEdit,
  onToggleFlag,
  onDuplicate,
  onDelete,
}: CardBrowserProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-240, 0, 240], [-6, 0, 6])
  const count = loci.length

  // Open on the tapped card; reset the flip + drag each time.
  useEffect(() => {
    if (!open) return
    const at = startId ? loci.findIndex((l) => l.id === startId) : 0
    setIndex(at < 0 ? 0 : at)
    setFlipped(false)
    x.set(0)
    // Seed only on open / target change, not on every deck mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startId])

  // Keep the pointer in range if the deck shrinks (e.g. the current card is deleted), and
  // close once the deck empties out so the browser never lingers over nothing.
  useEffect(() => {
    if (!open) return
    if (count === 0) onClose()
    else if (index > count - 1) setIndex(count - 1)
  }, [open, count, index, onClose])

  const go = (delta: number) => {
    const next = index + delta
    if (next < 0 || next > count - 1) {
      animate(x, 0, SPRING)
      return
    }
    setFlipped(false)
    setIndex(next)
    tick()
    x.set(0)
  }

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx], tap }) => {
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

  const current = count > 0 ? loci[Math.min(index, count - 1)]! : null

  const menuActions: SheetAction[] = current
    ? [
        {
          id: 'flag',
          label: current.flagged ? t('loci.row.unflag') : t('loci.row.flag'),
          icon: <Flag className="size-5" aria-hidden />,
          onSelect: () => onToggleFlag(current.id),
        },
        {
          id: 'duplicate',
          label: t('loci.row.duplicate'),
          icon: <Copy className="size-5" aria-hidden />,
          onSelect: () => onDuplicate(current.id),
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
            'fixed inset-0 z-[300] bg-[color-mix(in_oklch,var(--primary)_42%,transparent)] backdrop-blur-sm',
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
              <div className="flex min-h-14 items-center justify-between gap-2 px-4 pt-safe">
                <div className="flex w-full items-center justify-between gap-2 pt-2">
                  <Dialog.Close
                    aria-label={t('common.close')}
                    className="grid size-10 place-items-center rounded-full bg-card text-heading shadow-rest transition-transform active:scale-95"
                  >
                    <X className="size-5" aria-hidden />
                  </Dialog.Close>
                  <Dialog.Title className="rounded-pill bg-card px-3.5 py-1.5 text-[length:var(--p-text-label)] font-semibold text-heading shadow-rest">
                    {t('loci.browser.position', { current: index + 1, total: count })}
                  </Dialog.Title>
                  <FlyoutMenu
                    label={t('loci.browser.menu')}
                    actions={menuActions}
                    side="bottom"
                    align="end"
                    trigger={
                      <button
                        type="button"
                        aria-label={t('loci.browser.menu')}
                        className="grid size-10 place-items-center rounded-full bg-card text-heading shadow-rest transition-transform active:scale-95"
                      >
                        <MoreVertical className="size-5" aria-hidden />
                      </button>
                    }
                  />
                </div>
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
                  {...(bind() as unknown as HTMLMotionProps<'div'>)}
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
                      className="h-[clamp(340px,62vh,560px)]"
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
                            <span className="rounded-control bg-info-surface px-2.5 py-1 text-[length:var(--p-text-tiny)] font-semibold text-info-foreground">
                              {t('loci.browser.front')}
                            </span>
                            {current.flagged ? (
                              <Flag
                                className="size-4 fill-[var(--rating)] text-[var(--rating-edge)]"
                                aria-label={t('loci.row.flagged')}
                              />
                            ) : null}
                          </div>
                          <div className="flex flex-1 items-center justify-center overflow-y-auto px-1 py-3 text-center scrollbar-hide">
                            <p className="text-balance break-words text-[clamp(24px,6.5vw,34px)] font-bold leading-tight text-heading">
                              {current.front}
                            </p>
                          </div>
                          <p className="text-center text-[length:var(--p-text-label)] font-medium text-muted-foreground">
                            {t('loci.browser.flip')}
                          </p>
                        </div>
                        <div
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          className="absolute inset-0 flex flex-col rounded-card-featured border border-border bg-card p-6 shadow-elevated"
                        >
                          <span className="self-start rounded-control bg-info-surface px-2.5 py-1 text-[length:var(--p-text-tiny)] font-semibold text-info-foreground">
                            {t('loci.browser.back')}
                          </span>
                          <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-3 text-center scrollbar-hide">
                            <p className="text-balance break-words text-[clamp(18px,5vw,24px)] font-semibold leading-snug text-heading">
                              {current.back}
                            </p>
                            {current.hint ? (
                              <p className="flex max-w-[34ch] items-center gap-1.5 text-[length:var(--p-text-label)] italic leading-relaxed text-accent">
                                <MapPin className="size-3.5 shrink-0" aria-hidden />
                                {current.hint}
                              </p>
                            ) : null}
                            {current.tip ? (
                              <p className="flex max-w-[34ch] items-center gap-1.5 rounded-control bg-[var(--warning-surface)] px-3 py-1.5 text-[length:var(--p-text-label)] italic leading-relaxed text-[var(--warning-foreground)]">
                                <Lightbulb className="size-3.5 shrink-0" aria-hidden />
                                {current.tip}
                              </p>
                            ) : null}
                          </div>
                          <p className="text-center text-[length:var(--p-text-label)] font-medium text-muted-foreground">
                            {t('loci.browser.flipBack')}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-4 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={index === 0}
                  aria-label={t('loci.browser.prev')}
                  className="grid size-12 place-items-center rounded-full bg-card text-heading shadow-rest transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-35"
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
                  aria-label={t('loci.browser.next')}
                  className="grid size-12 place-items-center rounded-full bg-card text-heading shadow-rest transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-35"
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

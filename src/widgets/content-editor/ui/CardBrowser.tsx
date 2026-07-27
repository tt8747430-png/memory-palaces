import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import { type HTMLMotionProps, motion, useReducedMotion } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  GraduationCap,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import type { Card } from '@/entities/card'
import { cn } from '@/shared/lib'
import { FlyoutMenu, type SheetAction } from '@/shared/ui'
import { useCardBrowser } from '../model/use-card-browser'
import { CARD_EASE, DEPTH_POSE } from './browser-poses'
import { PreviewFace, QueuedPreview } from './CardPreviewFace'

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

const CHROME_BUTTON =
  'grid place-items-center rounded-full bg-card-glass text-heading ring-1 ring-[color:var(--border-glass)] shadow-rest transition-transform active:scale-95'

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
  const shellRef = useRef<HTMLDivElement>(null)
  const deck = useCardBrowser({
    open,
    cards,
    startId,
    reduce: Boolean(reduce),
    shellRef,
    onClose,
  })
  const { current } = deck

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
                  className={cn(CHROME_BUTTON, 'size-10')}
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
                <Dialog.Title className="rounded-pill bg-card-glass px-4 py-1.5 text-(length:--p-text-label) font-bold tabular-nums text-heading ring-1 ring-[color:var(--border-glass)] shadow-rest">
                  {t('cards.browser.position', { current: deck.index + 1, total: cards.length })}
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
                      className={cn(CHROME_BUTTON, 'size-10')}
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
                  {deck.ahead.map((queued, i) => (
                    <QueuedPreview
                      key={queued.id}
                      card={queued}
                      depth={i + 1}
                      reduce={Boolean(reduce)}
                    />
                  ))}

                  <motion.div
                    {...(deck.bind() as unknown as HTMLMotionProps<'div'>)}
                    style={{ x: deck.x, rotate: deck.rotate }}
                    className="absolute inset-0 z-10 touch-pan-y"
                  >
                    <motion.div
                      key={current.id}
                      initial={
                        reduce || deck.enterFrom === null
                          ? false
                          : deck.enterFrom === 'behind'
                            ? DEPTH_POSE[1]
                            : { ...DEPTH_POSE[0], x: -deck.offscreen() }
                      }
                      animate={DEPTH_POSE[0]}
                      transition={reduce ? { duration: 0 } : { duration: 0.3, ease: CARD_EASE }}
                      className="size-full"
                    >
                      <motion.div
                        animate={{ rotateY: deck.flipped ? 180 : 0 }}
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
                  onClick={() => deck.go(-1)}
                  disabled={deck.index === 0}
                  aria-label={t('cards.browser.prev')}
                  className={cn(
                    CHROME_BUTTON,
                    'size-12 disabled:pointer-events-none disabled:opacity-35',
                  )}
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(current.id)}
                  className="flex h-12 items-center gap-2 rounded-control bg-primary px-6 text-(length:--p-text-sub) font-semibold text-primary-foreground shadow-interactive transition-transform active:scale-[0.97]"
                >
                  <Pencil className="size-[18px]" aria-hidden />
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => deck.go(1)}
                  disabled={deck.index >= cards.length - 1}
                  aria-label={t('cards.browser.next')}
                  className={cn(
                    CHROME_BUTTON,
                    'size-12 disabled:pointer-events-none disabled:opacity-35',
                  )}
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

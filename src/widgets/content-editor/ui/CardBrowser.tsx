import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import {
  type HTMLMotionProps,
  type MotionValue,
  motion,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { ChevronLeft, ChevronRight, MoreVertical, Pencil, X } from 'lucide-react'
import type { Card } from '@/entities/card'
import { cn } from '@/shared/lib'
import { type ActionHandlers, buildMenuActions, FlyoutMenu, FullscreenDialog } from '@/shared/ui'
import { useCardBrowser } from '../model/use-card-browser'
import { BROWSER_CARD_ACTIONS } from '../model/card-actions'
import { CARD_EASE, DEPTH_POSE } from './browser-poses'
import { CardFilmstrip } from './CardFilmstrip'
import { PreviewFace, QueuedPreview } from './CardPreviewFace'

export interface CardBrowserProps {
  open: boolean
  cards: Card[]
  startId: string | null
  onClose: () => void
  onEdit: (id: string) => void
  /** The same catalog the row menu and swipe rails use, for the card on screen. */
  actionsFor: (card: Card) => ActionHandlers
}

const CHROME_BUTTON =
  'grid place-items-center rounded-full bg-card-glass text-heading ring-1 ring-[color:var(--border-glass)] shadow-rest transition-transform active:scale-95'

export function CardBrowser({
  open,
  cards,
  startId,
  onClose,
  onEdit,
  actionsFor,
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
  /**
   * Which stack shows is the card's own position, read as a value rather than as state: a
   * `useMotionValueEvent` that toggled here would re-render the browser on every frame of the
   * drag (CODE_STYLE §12). Pulled back, the previous cards are behind; otherwise the next ones.
   */
  const nextBehind = useTransform<number, number>(deck.x, (value) => (value > 0 ? 0 : 1))
  const prevBehind = useTransform<number, number>(deck.x, (value) => (value > 0 ? 1 : 0))

  const menuActions = current ? buildMenuActions(BROWSER_CARD_ACTIONS, actionsFor(current), t) : []

  return (
    <FullscreenDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      className="flex flex-col"
    >
      {current ? (
        <>
          <div className="flex min-h-14 w-full items-center justify-between gap-2 px-4 pb-1 pt-[max(0.5rem,var(--safe-top))]">
            <Dialog.Close aria-label={t('common.close')} className={cn(CHROME_BUTTON, 'size-10')}>
              <X className="size-5" aria-hidden />
            </Dialog.Close>
            <Dialog.Title className="rounded-full bg-card-glass px-4 py-1.5 text-label font-bold tabular-nums text-heading ring-1 ring-(--border-glass) shadow-rest">
              {t('cards.browser.position', { current: deck.index + 1, total: cards.length })}
            </Dialog.Title>
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={t('common.edit')}
                onClick={() => onEdit(current.id)}
                className={cn(CHROME_BUTTON, 'size-10')}
              >
                <Pencil className="size-5" aria-hidden />
              </button>
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
            </span>
          </div>

          <div
            ref={shellRef}
            className="relative flex flex-1 items-center px-5 pb-2 perspective-[1400px]"
          >
            <div className="relative h-[clamp(300px,calc(var(--app-height)*0.55),520px)] w-full">
              <BehindStack cards={deck.behindNext} opacity={nextBehind} reduce={Boolean(reduce)} />
              <BehindStack cards={deck.behindPrev} opacity={prevBehind} reduce={Boolean(reduce)} />

              <motion.div
                {...(deck.bind() as unknown as HTMLMotionProps<'div'>)}
                {...deck.surface}
                style={{ x: deck.x, rotate: deck.rotate }}
                className="absolute inset-0 z-10 touch-pan-y"
              >
                <motion.div
                  key={current.id}
                  initial={reduce || !deck.entering ? false : DEPTH_POSE[1]}
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

          <div className="flex items-center gap-2 px-4 pb-(--p-safe-bottom) pt-2">
            <button
              type="button"
              onClick={() => deck.go(-1)}
              disabled={deck.index === 0}
              aria-label={t('cards.browser.prev')}
              className={cn(
                CHROME_BUTTON,
                'size-11 shrink-0 disabled:pointer-events-none disabled:opacity-35',
              )}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <CardFilmstrip
              cards={cards}
              index={deck.index}
              reduce={Boolean(reduce)}
              onPick={(at) => deck.go(at - deck.index)}
            />
            <button
              type="button"
              onClick={() => deck.go(1)}
              disabled={deck.index >= cards.length - 1}
              aria-label={t('cards.browser.next')}
              className={cn(
                CHROME_BUTTON,
                'size-11 shrink-0 disabled:pointer-events-none disabled:opacity-35',
              )}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </>
      ) : null}
    </FullscreenDialog>
  )
}

/**
 * One side's queued cards. Both sides are mounted and one is transparent, so the stack behind
 * changes with the drag without anything re-rendering; `pointerEvents` follows the same value, or
 * the transparent side would take the presses meant for the card over it.
 */
function BehindStack({
  cards,
  opacity,
  reduce,
}: {
  cards: Card[]
  opacity: MotionValue<number>
  reduce: boolean
}) {
  const hits = useTransform(opacity, (value) => (value > 0 ? 'auto' : 'none'))
  if (cards.length === 0) return null
  return (
    <motion.div aria-hidden style={{ opacity, pointerEvents: hits }} className="absolute inset-0">
      {cards.map((card, depth) => (
        <QueuedPreview key={card.id} card={card} depth={depth + 1} reduce={reduce} />
      ))}
    </motion.div>
  )
}

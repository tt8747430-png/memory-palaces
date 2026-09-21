import { useTranslation } from 'react-i18next'
import {
  FLASHCARD_SWIPE_ACTION_META,
  type FlashcardSwipeConfig,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { cn } from '@/shared/lib'

const DIRECTIONS: readonly SwipeDirection[] = ['left', 'right', 'up', 'down']

/**
 * Each hint sits on the strip it names. The side ones read along their edge rather than across it.
 * The top and bottom ones sit just inside the card's header and footer rows — those rows hold the
 * flip, speak, mode and aid controls, and a hint printed over a button is a hint nobody can read.
 */
const PLACE: Record<SwipeDirection, string> = {
  left: 'left-1 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180',
  right: 'right-1 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl]',
  up: 'left-1/2 top-10 -translate-x-1/2',
  down: 'left-1/2 bottom-14 -translate-x-1/2',
}

export interface ZoneHintsProps {
  config: FlashcardSwipeConfig
}

/**
 * What the four edges do, while answers are given by tap. The swipe chips cannot say it — they are
 * lit by how far the card has been dragged, and in this mode the card never moves — so without
 * these the strips would be invisible.
 */
export function ZoneHints({ config }: ZoneHintsProps) {
  const { t } = useTranslation()

  return (
    <>
      {DIRECTIONS.map((dir) => {
        const action = config[dir]
        if (action === 'none') return null
        return (
          <span
            key={dir}
            aria-hidden
            className={cn(
              'pointer-events-none absolute z-30 select-none text-tiny font-bold uppercase tracking-widest',
              'text-muted-foreground/45',
              PLACE[dir],
            )}
          >
            {t(FLASHCARD_SWIPE_ACTION_META[action].labelKey as never)}
          </span>
        )
      })}
    </>
  )
}

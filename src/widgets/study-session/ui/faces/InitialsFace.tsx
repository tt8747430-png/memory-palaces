import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { clamp, cn, tokenizeWords, wordInitial } from '@/shared/lib'
import { AidButton, BackPrompt, CardFace, HintCard } from './CardFace'
import { TokenLine } from './TokenLine'
import { type FaceProps, stopPress, useSwipeMechanic } from './types'

interface PeekPosition {
  index: number
  x: number
  top: number
  below: boolean
}

export function InitialsFace(props: FaceProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const { card, prompt, answer, wordSpaces, active } = props
  const [showAll, setShowAll] = useState(false)
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const rootRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const [peek, setPeek] = useState<PeekPosition | null>(null)

  const openPeek = (index: number, el: HTMLElement) => {
    const root = rootRef.current
    if (!root) return
    const rootBox = root.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    const below = box.top - rootBox.top < 44
    setPeek({
      index,
      x: box.left + box.width / 2 - rootBox.left,
      top: below ? box.bottom - rootBox.top + 6 : box.top - rootBox.top - 6,
      below,
    })
  }

  useLayoutEffect(() => {
    if (!peek) return
    const bubble = bubbleRef.current
    const root = rootRef.current
    if (!bubble || !root) return
    const half = bubble.offsetWidth / 2
    const clamped = clamp(peek.x, 4 + half, root.clientWidth - 4 - half)
    if (Math.abs(clamped - peek.x) > 0.5) setPeek({ ...peek, x: clamped })
  }, [peek])

  const toggleWords = () => {
    setShowAll((prev) => !prev)
    setPeek(null)
  }

  useSwipeMechanic(active, props.registerMechanic, { showWords: toggleWords })

  const footer = (
    <AidButton
      label={showAll ? t('study.showInitials') : t('study.showWords')}
      onClick={toggleWords}
    />
  )

  return (
    <CardFace face={props} speakText={answer} back footer={footer}>
      <BackPrompt prompt={prompt} onFlip={props.onFlip} />
      <div ref={rootRef} className="relative w-full" onClick={() => setPeek(null)}>
        <TokenLine
          tokens={tokens}
          className={cn('gap-y-3', wordSpaces ? 'gap-x-3' : 'gap-x-2')}
          renderWithheld={(token, i) => {
            if (showAll) return null
            const { lead, initial, hidden, trail } = wordInitial(token)
            const open = peek?.index === i
            return (
              <button
                type="button"
                aria-label={t('study.revealWord', { word: token })}
                onPointerDown={stopPress}
                onClick={(event) => {
                  event.stopPropagation()
                  if (open) setPeek(null)
                  else openPeek(i, event.currentTarget)
                }}
                className={cn(
                  'whitespace-nowrap rounded-control px-1 transition-colors',
                  open ? 'bg-primary/12 text-heading' : 'active:bg-primary/5',
                )}
              >
                {lead}
                <span className="font-bold">{initial}</span>
                {wordSpaces && hidden > 0 ? (
                  <span
                    aria-hidden
                    className="ml-0.5 inline-block border-b-2 border-[color-mix(in_oklch,var(--primary)_40%,transparent)] align-baseline"
                    style={{ width: `${clamp(hidden, 1, 16)}ch` }}
                  />
                ) : null}
                {trail}
              </button>
            )
          }}
        />

        <AnimatePresence>
          {peek ? (
            <span
              key={peek.index}
              aria-hidden
              className={cn(
                'pointer-events-none absolute z-20 -translate-x-1/2',
                !peek.below && '-translate-y-full',
              )}
              style={{ left: peek.x, top: peek.top }}
            >
              <motion.span
                ref={bubbleRef}
                initial={
                  reduce ? { opacity: 0 } : { opacity: 0, y: peek.below ? -6 : 6, scale: 0.9 }
                }
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                className="block whitespace-nowrap rounded-control bg-primary px-2.5 py-1.5 text-(length:--p-text-sub) font-semibold text-primary-foreground shadow-interactive"
              >
                {tokens[peek.index]}
              </motion.span>
            </span>
          ) : null}
        </AnimatePresence>
      </div>
      {card.card.hint ? <HintCard hint={card.card.hint} /> : null}
    </CardFace>
  )
}

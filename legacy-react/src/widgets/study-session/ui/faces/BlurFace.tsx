import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isReferenceMarker, normalizeWord, scramble, tokenizeWords } from '@/shared/lib'
import { AidButton, BackPrompt, CardFace, HintCard } from './CardFace'
import { type FaceProps, stopPress, useSwipeMechanic } from './types'

const BLUR_BATCH = 3

export function BlurFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, canSpeak, active, onSpeak } = props
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const hideable = useMemo(
    () => tokens.flatMap((token, i) => (isReferenceMarker(token) ? [] : [i])),
    [tokens],
  )
  const [hidden, setHidden] = useState<ReadonlySet<number>>(() => new Set<number>())
  const visible = hideable.filter((i) => !hidden.has(i))

  const hideMore = () => {
    const batch = Math.max(1, Math.ceil(hideable.length / BLUR_BATCH))
    const picks = scramble(visible).slice(0, batch)
    setHidden((prev) => new Set([...prev, ...picks]))
  }

  const showWord = (index: number) => {
    setHidden((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }

  useSwipeMechanic(active, props.registerMechanic, {
    hideMore,
    showAll: () => setHidden(new Set()),
  })

  // A content-sized grid with equal `fr` columns sizes both buttons to the wider label, so the
  // pair reads as one balanced control instead of two mismatched pills.
  const footer = (
    <div className="inline-grid grid-flow-col auto-cols-fr gap-2">
      <AidButton className="w-full" label={t('study.blur')} onClick={hideMore} />
      <AidButton
        className="w-full"
        label={t('study.showAll')}
        onClick={() => setHidden(new Set())}
      />
    </div>
  )

  return (
    <CardFace
      flagged={card.card.flagged}
      canSpeak={canSpeak}
      speakText={answer}
      onSpeak={onSpeak}
      active={active}
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
      back
      footer={footer}
    >
      <BackPrompt prompt={prompt} onFlip={props.onFlip} />
      <p className="flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-2.5 text-[clamp(17px,4.6vw,22px)] font-semibold leading-relaxed text-heading">
        {tokens.map((token, i) => {
          if (isReferenceMarker(token)) {
            return (
              <span key={i} className="font-bold text-accent">
                {token}
              </span>
            )
          }
          if (!hidden.has(i)) {
            return (
              <span key={i} className="whitespace-nowrap">
                {token}
              </span>
            )
          }
          return (
            <button
              key={i}
              type="button"
              aria-label={t('study.revealWord', { word: token })}
              onPointerDown={stopPress}
              onClick={() => showWord(i)}
              className="rounded-control px-0.5 transition-transform active:scale-95"
            >
              <span
                aria-hidden
                className="inline-block h-[0.95em] border-b-2 border-[color-mix(in_oklch,var(--primary)_45%,transparent)] align-baseline"
                style={{ width: `${Math.min(Math.max(normalizeWord(token).length, 2), 14)}ch` }}
              />
            </button>
          )
        })}
      </p>
      {card.card.hint ? <HintCard hint={card.card.hint} /> : null}
    </CardFace>
  )
}

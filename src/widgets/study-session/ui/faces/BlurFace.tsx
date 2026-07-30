import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clamp, isReferenceMarker, normalizeWord, scramble, tokenizeWords } from '@/shared/lib'
import { AidButton, BackPrompt, CardFace, HintCard } from './CardFace'
import { TokenLine } from './TokenLine'
import { type FaceProps, stopPress, useSwipeMechanic } from './types'

const BLUR_BATCH = 3

export function BlurFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, active } = props
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
    <CardFace face={props} speakText={answer} back footer={footer}>
      <BackPrompt prompt={prompt} onFlip={props.onFlip} />
      <TokenLine
        tokens={tokens}
        className="gap-x-2 gap-y-2.5 leading-relaxed"
        renderWithheld={(token, i) =>
          hidden.has(i) ? (
            <button
              type="button"
              aria-label={t('study.revealWord', { word: token })}
              onPointerDown={stopPress}
              onClick={() => showWord(i)}
              className="rounded-control px-0.5 transition-transform active:scale-95"
            >
              <span
                aria-hidden
                className="inline-block h-[0.95em] border-b-2 border-[color-mix(in_oklch,var(--primary)_45%,transparent)] align-baseline"
                style={{ width: `${clamp(normalizeWord(token).length, 2, 14)}ch` }}
              />
            </button>
          ) : null
        }
      />
      {card.card.hint ? <HintCard hint={card.card.hint} /> : null}
    </CardFace>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { typedRecallStatus, withNextWord } from '@/shared/lib'
import { useInitialsRecall } from '../../model/use-initials-recall'
import { AidButton, CardFace, TipRow } from './CardFace'
import { TypeInitials } from './TypeInitials'
import { TypeWords } from './TypeWords'
import { type FaceProps, useSwipeMechanic } from './types'

/** Recall by typing: either the whole answer, or just each word's first letter. */
export function TypeFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, canSpeak, typeInitialsOnly, active, onSpeak } = props
  const [text, setText] = useState('')
  const initials = useInitialsRecall(answer, typeInitialsOnly, props.onRevealInPlace)
  const typed = useMemo(() => typedRecallStatus(answer, text), [answer, text])
  const solved = typeInitialsOnly ? initials.complete : typed.complete

  useEffect(() => {
    if (!typeInitialsOnly && typed.complete) props.onRevealInPlace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeInitialsOnly, typed.complete])

  const reset = () => {
    if (typeInitialsOnly) initials.reset()
    else setText('')
    props.onHideInPlace()
  }

  const nextWord = () => {
    if (typeInitialsOnly) initials.nextWord()
    else setText((prev) => withNextWord(answer, prev))
  }

  const started = typeInitialsOnly ? initials.typedCount > 0 : text.trim().length > 0

  useSwipeMechanic(active, props.registerMechanic, {
    nextWord: solved ? undefined : nextWord,
    reset,
  })

  return (
    <CardFace
      flagged={card.card.flagged}
      canSpeak={canSpeak}
      speakText={prompt}
      onSpeak={onSpeak}
      active={active}
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
      align="start"
      footer={
        solved ? (
          <AidButton label={t('study.reset')} onClick={reset} />
        ) : (
          <>
            <AidButton label={t('study.nextWord')} onClick={nextWord} />
            {started ? <AidButton tone="quiet" label={t('study.reset')} onClick={reset} /> : null}
          </>
        )
      }
    >
      <div className="shrink-0 text-center">
        <h2 className="text-balance wrap-break-word text-[clamp(18px,5vw,22px)] font-bold leading-tight tracking-[-0.01em] text-heading">
          {prompt}
        </h2>
        {card.card.tip ? <TipRow tip={card.card.tip} /> : null}
      </div>
      <div className="h-px shrink-0 bg-border" aria-hidden />
      {typeInitialsOnly ? (
        <TypeInitials recall={initials} />
      ) : (
        <TypeWords
          value={text}
          onChange={setText}
          slots={typed.slots}
          solved={solved}
          active={active}
        />
      )}
    </CardFace>
  )
}

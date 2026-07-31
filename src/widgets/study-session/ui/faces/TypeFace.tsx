import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { typedRecallStatus, withNextWord } from '@/shared/lib'
import { useInitialsRecall } from '../../model/use-initials-recall'
import { AidButton, CardFace, WorkPrompt } from './CardFace'
import { TypeInitials } from './TypeInitials'
import { TypeWords } from './TypeWords'
import { type FaceProps, useSwipeMechanic } from './types'

export function TypeFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, typeInitialsOnly, active } = props
  const [text, setText] = useState('')
  const initials = useInitialsRecall(answer, typeInitialsOnly, props.onRevealInPlace)
  const typed = useMemo(() => typedRecallStatus(answer, text), [answer, text])
  const solved = typeInitialsOnly ? initials.complete : typed.complete

  // Reveals on the solve edge. `props.onRevealInPlace` is a fresh closure each render, so depending
  // on it would re-reveal on every keystroke after the answer is complete.
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
      face={props}
      speakText={prompt}
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
      <WorkPrompt prompt={prompt} tip={card.card.tip} />
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

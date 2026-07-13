import { BackPrompt, CardFace, HintCard } from './CardFace'
import type { FaceProps } from './types'

export function AnswerFace(props: FaceProps) {
  const { card, prompt, answer, canSpeak, active, onSpeak } = props
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
    >
      <BackPrompt prompt={prompt} onFlip={props.onFlip} />
      <p className="allow-select text-balance wrap-break-word text-center text-[clamp(17px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
        {answer}
      </p>
      {card.card.hint ? <HintCard hint={card.card.hint} /> : null}
    </CardFace>
  )
}

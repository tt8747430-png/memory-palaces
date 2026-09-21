import { CardFace, TipRow } from './CardFace'
import type { FaceProps } from './types'

/**
 * The plain front: the prompt, and the card's tip if it has one. There is no "tap to reveal" chip
 * on the card any more — the footer owns that affordance now, as a real button, in every mode.
 * Tapping the card still turns it over.
 */
export function PromptFace(props: FaceProps) {
  const { card, prompt } = props
  return (
    <CardFace face={props} speakText={prompt}>
      <h2 className="text-balance wrap-break-word text-center text-card-prompt font-bold leading-[1.15] tracking-[-0.01em] text-heading">
        {prompt}
      </h2>
      {card.card.tip ? <TipRow tip={card.card.tip} /> : null}
    </CardFace>
  )
}

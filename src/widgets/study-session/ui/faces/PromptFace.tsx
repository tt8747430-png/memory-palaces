import { useTranslation } from 'react-i18next'
import { CardFace, FlipZone, TipRow } from './CardFace'
import type { FaceProps } from './types'

export function PromptFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, canSpeak, active, onSpeak, onFlip } = props
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
    >
      <h2 className="text-balance wrap-break-word text-center text-[clamp(22px,6vw,28px)] font-bold leading-[1.15] tracking-[-0.01em] text-heading">
        {prompt}
      </h2>
      {card.card.tip ? <TipRow tip={card.card.tip} /> : null}
      <FlipZone label={t('study.showAnswer')} onFlip={onFlip} className="mx-auto w-fit">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-info-surface px-3.5 py-1.5 text-(length:--p-text-label) font-medium text-muted-foreground">
          {t('study.tapToReveal')}
        </span>
      </FlipZone>
    </CardFace>
  )
}

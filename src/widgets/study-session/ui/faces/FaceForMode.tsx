import { AnswerFace } from './AnswerFace'
import { BlurFace } from './BlurFace'
import { InitialsFace } from './InitialsFace'
import { PromptFace } from './PromptFace'
import { RebuildFace } from './RebuildFace'
import { TypeFace } from './TypeFace'
import type { FaceProps } from './types'

/**
 * Which face a mode leads with. One function for the card in play and for the cards queued
 * behind it, so promoting a card changes nothing on screen except its pose — there is no
 * placeholder to cross-fade out of.
 */
export function FrontFace(props: FaceProps) {
  if (props.mode === 'type') return <TypeFace {...props} />
  if (props.mode === 'words') return <RebuildFace {...props} />
  return <PromptFace {...props} />
}

/** The face behind it: what turning the card over reveals, in this mode. */
export function BackFace(props: FaceProps) {
  if (props.mode === 'blur') return <BlurFace {...props} />
  if (props.mode === 'initials') return <InitialsFace {...props} />
  return <AnswerFace {...props} />
}

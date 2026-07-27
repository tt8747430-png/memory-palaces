import { AnswerFace } from './AnswerFace'
import { BlurFace } from './BlurFace'
import { InitialsFace } from './InitialsFace'
import { PromptFace } from './PromptFace'
import { RebuildFace } from './RebuildFace'
import { TypeFace } from './TypeFace'
import type { FaceProps } from './types'

export function FrontFace(props: FaceProps) {
  if (props.mode === 'type') return <TypeFace {...props} />
  if (props.mode === 'words') return <RebuildFace {...props} />
  return <PromptFace {...props} />
}

export function BackFace(props: FaceProps) {
  if (props.mode === 'blur') return <BlurFace {...props} />
  if (props.mode === 'initials') return <InitialsFace {...props} />
  return <AnswerFace {...props} />
}

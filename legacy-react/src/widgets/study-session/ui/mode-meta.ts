import type { LucideIcon } from 'lucide-react'
import { Blocks, EyeOff, Keyboard, WholeWord } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'

export const STUDY_MODE_META: Record<
  StudyMode,
  { Icon: LucideIcon; labelKey: string; hintKey: string }
> = {
  blur: { Icon: EyeOff, labelKey: 'study.modeBlur', hintKey: 'study.modeBlurHint' },
  words: { Icon: Blocks, labelKey: 'study.modeWords', hintKey: 'study.modeWordsHint' },
  initials: {
    Icon: WholeWord,
    labelKey: 'study.modeInitials',
    hintKey: 'study.modeInitialsHint',
  },
  type: { Icon: Keyboard, labelKey: 'study.modeType', hintKey: 'study.modeTypeHint' },
}

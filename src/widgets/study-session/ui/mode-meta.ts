import type { LucideIcon } from 'lucide-react'
import { Blocks, EyeOff, Keyboard, Repeat, WholeWord } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'

/** Display metadata for every study mode, keyed for the picker order in `STUDY_MODES`.
 * One name and one hint per mode, shared by the header mode button and the mode sheet. */
export const STUDY_MODE_META: Record<
  StudyMode,
  { Icon: LucideIcon; labelKey: string; hintKey: string }
> = {
  flip: { Icon: Repeat, labelKey: 'study.modeFlip', hintKey: 'study.modeFlipHint' },
  type: { Icon: Keyboard, labelKey: 'study.modeType', hintKey: 'study.modeTypeHint' },
  initials: {
    Icon: WholeWord,
    labelKey: 'study.modeInitials',
    hintKey: 'study.modeInitialsHint',
  },
  blur: { Icon: EyeOff, labelKey: 'study.modeBlur', hintKey: 'study.modeBlurHint' },
  words: { Icon: Blocks, labelKey: 'study.modeWords', hintKey: 'study.modeWordsHint' },
}

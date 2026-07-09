import type { LucideIcon } from 'lucide-react'
import { Blocks, EyeOff, Keyboard, WholeWord } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'

/** Display metadata for every study mode, keyed for the picker order in `STUDY_MODES`.
 * One name and one hint per mode, shared by the header mode button and the mode sheet. */
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

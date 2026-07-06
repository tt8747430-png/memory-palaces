import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import {
  Blocks,
  Brain,
  ChevronRight,
  Dumbbell,
  EyeOff,
  Keyboard,
  Puzzle,
  WholeWord,
} from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import { cn } from '@/shared/lib'

/** The study modes that open the study session preset to an active-recall variant. */
export type PracticeStudyMode = Exclude<StudyMode, 'flip'>

export interface PracticeModesProps {
  /** Cards in scope — the study-mode rows need one, Match needs at least two. */
  cardCount: number
  /** Authored questions in scope — Test needs at least one. */
  questionCount: number
  /** Open the study session preset to the given mode (deep-links `?mode=`). */
  onPractice?: (mode: PracticeStudyMode) => void
  onMatch?: () => void
  onTest?: () => void
  /** Keep the Test tile enabled even with no questions — used where it opens the questions
   * page (author + start) rather than launching the quiz directly. */
  alwaysEnableTest?: boolean
}

/** The four study-session modes surfaced as practice entries. Labels reuse the session's
 * mode names (one name per mode, everywhere); sublabels are the hub-length hints. */
const PRACTICE_STUDY_MODES: {
  mode: PracticeStudyMode
  icon: ReactNode
  labelKey: string
  sublabelKey: string
}[] = [
  {
    mode: 'type',
    icon: <Keyboard className="size-5" aria-hidden />,
    labelKey: 'study.modeType',
    sublabelKey: 'practice.typeSub',
  },
  {
    mode: 'initials',
    icon: <WholeWord className="size-5" aria-hidden />,
    labelKey: 'study.modeInitials',
    sublabelKey: 'practice.initialsSub',
  },
  {
    mode: 'blur',
    icon: <EyeOff className="size-5" aria-hidden />,
    labelKey: 'study.modeBlur',
    sublabelKey: 'practice.blurSub',
  },
  {
    mode: 'words',
    icon: <Blocks className="size-5" aria-hidden />,
    labelKey: 'study.modeWords',
    sublabelKey: 'practice.wordsSub',
  },
]

/** The Practice mode list, one full row per mode — every way to exercise the scope's cards
 * beyond the flip session: the four recall modes of the study session (each deep-links into
 * it), the Match game, and the Test. Rendered by the Practice page; the hubs link there
 * through {@link PracticeEntry}. */
export function PracticeModes({
  cardCount,
  questionCount,
  onPractice,
  onMatch,
  onTest,
  alwaysEnableTest = false,
}: PracticeModesProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2.5">
      {PRACTICE_STUDY_MODES.map(({ mode, icon, labelKey, sublabelKey }) => (
        <ModeTile
          key={mode}
          icon={icon}
          label={t(labelKey as never)}
          sublabel={t(sublabelKey as never)}
          onClick={onPractice ? () => onPractice(mode) : undefined}
          disabled={cardCount < 1}
        />
      ))}
      <ModeTile
        icon={<Puzzle className="size-5" aria-hidden />}
        label={t('practice.match')}
        sublabel={t('practice.matchSub')}
        onClick={onMatch}
        disabled={cardCount < 2}
      />
      <ModeTile
        icon={<Brain className="size-5" aria-hidden />}
        label={t('practice.test')}
        sublabel={
          questionCount > 0
            ? t(questionCount === 1 ? 'practice.testSubOne' : 'practice.testSubOther', {
                count: questionCount,
              })
            : alwaysEnableTest
              ? t('practice.testManage')
              : t('practice.testEmpty')
        }
        onClick={onTest}
        disabled={!alwaysEnableTest && questionCount === 0}
      />
    </div>
  )
}

/** The single Practice row on the room hub and palace detail: one door to the Practice page,
 * where the full mode list lives. */
export function PracticeEntry({ onOpen }: { onOpen?: () => void }) {
  const { t } = useTranslation()
  return (
    <ModeTile
      icon={<Dumbbell className="size-5" aria-hidden />}
      label={t('practice.entry')}
      sublabel={t('practice.entrySub')}
      onClick={onOpen}
    />
  )
}

function ModeTile({
  icon,
  label,
  sublabel,
  onClick,
  disabled,
}: {
  icon: ReactNode
  label: string
  sublabel: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-card border border-border bg-card p-3.5 text-left shadow-rest',
        'transition-opacity disabled:opacity-45',
      )}
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-(length:--p-text-sub) font-semibold text-heading">{label}</span>
        <span className="block truncate text-(length:--p-text-label) text-muted-foreground">
          {sublabel}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
    </motion.button>
  )
}

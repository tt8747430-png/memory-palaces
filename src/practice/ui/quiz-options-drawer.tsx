import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Shuffle, Timer } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, Switch } from '@/shared/ui'

export interface QuizOptionsDrawerProps {
  open: boolean
  onClose: () => void
  quizTimer: boolean
  shuffleQuestions: boolean
  onQuizTimer: (value: boolean) => void
  onShuffleQuestions: (value: boolean) => void
}

/**
 * Mid-run quiz settings. Deliberately a controlled Drawer rather than a promise-returning
 * `openQuizOptionsDrawer()`: it resolves no value — each toggle writes straight through to the
 * deck so it applies to the run already in progress.
 */
export function QuizOptionsDrawer({
  open,
  onClose,
  quizTimer,
  shuffleQuestions,
  onQuizTimer,
  onShuffleQuestions,
}: QuizOptionsDrawerProps) {
  const { t } = useTranslation()
  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('quiz.options.title')}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-2.5 px-4 pb-2">
          <ToggleRow
            icon={<Timer className="size-[18px]" aria-hidden />}
            label={t('quiz.options.autoAdvance')}
            description={t('quiz.options.autoAdvanceHint')}
            checked={quizTimer}
            onChange={onQuizTimer}
          />
          <ToggleRow
            icon={<Shuffle className="size-[18px]" aria-hidden />}
            label={t('quiz.options.shuffle')}
            description={t('quiz.options.shuffleHint')}
            checked={shuffleQuestions}
            onChange={onShuffleQuestions}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-primary">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[length:var(--ms-text-sub)] font-semibold text-heading">
            {label}
          </span>
          <span className="mt-0.5 block text-[length:var(--ms-text-label)] leading-snug text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  )
}

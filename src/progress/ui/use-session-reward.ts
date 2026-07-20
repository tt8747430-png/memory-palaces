import { useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useServices } from '@/shell/services-provider'
import { completeSession, outcomeToReward, type SessionOutcome } from '@/progress'

/**
 * Binds a finished practice or study session to the progress store: awards XP, rolls the
 * streak, records a best quiz, then announces the result on the event bus and — unless the
 * learner muted notifications — as toasts.
 *
 * Lives in `progress/ui` rather than in either consuming area because both practice (P2) and
 * study (P3) end their sessions through it, and the rules it applies are progress's own.
 *
 * Preferences are read at call time rather than subscribed: a session's reward depends on the
 * preferences in force when it ends, and re-rendering every consumer on an unrelated
 * preference change would be noise.
 */
export function useSessionReward(): (outcome: SessionOutcome) => Promise<void> {
  const { progressStore, preferencesStore, eventBus } = useServices()
  const { t } = useTranslation()

  return useCallback(
    async (outcome: SessionOutcome) => {
      const preferences = preferencesStore.effective()
      const reward = await completeSession(progressStore, {
        ...outcomeToReward(outcome),
        dailyGoal: preferences.dailyGoal,
      })

      if (reward.leveledUp) eventBus.emit('level-up', { level: reward.level })
      if (reward.isMilestone) eventBus.emit('streak', { count: reward.streakCount })
      if (reward.isBestQuiz && reward.quizAccuracy !== undefined) {
        eventBus.emit('quiz', { accuracy: reward.quizAccuracy, xp: reward.xpGained })
      }

      if (!preferences.notifications) return
      if (reward.xpGained > 0) toast.success(t('reward.xp', { amount: reward.xpGained }))
      if (reward.leveledUp) toast(t('reward.levelUp', { level: reward.level }))
      if (reward.isMilestone) toast(t('reward.streak', { count: reward.streakCount }))
      if (reward.dayBecameActive)
        toast.success(t('reward.dayComplete', { count: reward.dailyGoal }))
    },
    [progressStore, preferencesStore, eventBus, t],
  )
}

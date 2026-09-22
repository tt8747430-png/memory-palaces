import { useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useEventBusOptional } from '@/shared/lib'
import { useProgressStoreApiOptional } from '@/entities/progress'
import {
  DEFAULT_PREFERENCES,
  selectEffectivePreferences,
  usePreferencesStoreApiOptional,
} from '@/entities/preferences'
import {
  completeStudySession,
  outcomeToReward,
  type StudySessionOutcome,
} from '@/features/progress'

export function useStudySessionReward(): (outcome: StudySessionOutcome) => Promise<void> {
  const store = useProgressStoreApiOptional()
  const preferencesStore = usePreferencesStoreApiOptional()
  const eventBus = useEventBusOptional()
  const { t } = useTranslation()
  return useCallback(
    async (outcome: StudySessionOutcome) => {
      if (!store) return
      // One snapshot, through the selector that owns what an unwritten preference falls back to.
      const preferences = preferencesStore
        ? selectEffectivePreferences(preferencesStore.getState())
        : DEFAULT_PREFERENCES
      const reward = await completeStudySession(store, {
        ...outcomeToReward(outcome),
        dailyGoal: preferences.dailyGoal,
      })

      if (reward.leveledUp) eventBus?.emit('level-up', { level: reward.level })
      if (reward.isMilestone) eventBus?.emit('streak', { count: reward.streakCount })
      if (reward.isBestQuiz && reward.quizAccuracy !== undefined) {
        eventBus?.emit('quiz', { accuracy: reward.quizAccuracy, xp: reward.xpGained })
      }

      if (!preferences.notifications) return
      if (reward.xpGained > 0) toast.success(t('reward.xp', { amount: reward.xpGained }))
      if (reward.leveledUp) toast(t('reward.levelUp', { level: reward.level }))
      if (reward.isMilestone) toast(t('reward.streak', { count: reward.streakCount }))
      if (reward.dayBecameActive)
        toast.success(t('reward.dayComplete', { count: reward.dailyGoal }))
    },
    [store, preferencesStore, eventBus, t],
  )
}

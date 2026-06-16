import { useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useEventBusOptional } from '@/shared/lib'
import { useProgressStoreApiOptional } from '@/entities/progress'
import { usePreferencesStoreApiOptional } from '@/entities/preferences'
import { completeSession, type CompleteSessionOptions } from '@/features/progress'

/**
 * Returns `reward(options)` — applies a finished session's XP / streak / quiz-accuracy
 * through `completeSession`, then both publishes the milestones on the EventBus (the
 * bridge turns them into persistent notification history) and celebrates them with
 * toasts. History is always recorded; the *toasts* honour the `notifications`
 * preference. No-ops where no progress store is mounted (focused tests), so callers
 * can fire it unconditionally.
 */
export function useSessionReward(): (options: CompleteSessionOptions) => Promise<void> {
  const store = useProgressStoreApiOptional()
  const preferencesStore = usePreferencesStoreApiOptional()
  const eventBus = useEventBusOptional()
  const { t } = useTranslation()
  return useCallback(
    async (options: CompleteSessionOptions) => {
      if (!store) return
      const reward = await completeSession(store, options)

      if (reward.leveledUp) eventBus?.emit('level-up', { level: reward.level })
      if (reward.isMilestone) eventBus?.emit('streak', { count: reward.streakCount })
      if (reward.isBestQuiz && reward.quizAccuracy !== undefined) {
        eventBus?.emit('quiz', { accuracy: reward.quizAccuracy, xp: reward.xpGained })
      }

      const notify = preferencesStore?.getState().preferences?.notifications ?? true
      if (!notify) return
      if (reward.xpGained > 0) toast.success(t('reward.xp', { amount: reward.xpGained }))
      if (reward.leveledUp) toast(t('reward.levelUp', { level: reward.level }))
      if (reward.isMilestone) toast(t('reward.streak', { count: reward.streakCount }))
    },
    [store, preferencesStore, eventBus, t],
  )
}

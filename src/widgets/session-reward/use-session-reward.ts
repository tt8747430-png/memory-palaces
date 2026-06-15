import { useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useProgressStoreApiOptional } from '@/entities/progress'
import { completeSession, type CompleteSessionOptions } from '@/features/progress'

/**
 * Returns `reward(options)` — applies a finished session's XP / streak / quiz-accuracy
 * through `completeSession` and celebrates the outcome with toasts. No-ops where no
 * progress store is mounted (focused tests), so callers can fire it unconditionally.
 */
export function useSessionReward(): (options: CompleteSessionOptions) => Promise<void> {
  const store = useProgressStoreApiOptional()
  const { t } = useTranslation()
  return useCallback(
    async (options: CompleteSessionOptions) => {
      if (!store) return
      const reward = await completeSession(store, options)
      if (reward.xpGained > 0) toast.success(t('reward.xp', { amount: reward.xpGained }))
      if (reward.leveledUp) toast(t('reward.levelUp', { level: reward.level }))
      if (reward.isMilestone) toast(t('reward.streak', { count: reward.streakCount }))
    },
    [store, t],
  )
}

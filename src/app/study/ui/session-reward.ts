import { inject, Injectable } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { EVENT_BUS } from '@app/shared/data/event-bus.token'
import { ToastService } from '@app/shared/ui/toast'
import { PreferencesStore } from '@app/settings'
import { ProgressStore } from '../data/progress-store'
import { completeSession, outcomeToReward } from '../commands/progress-index'
import type { SessionOutcome } from '../commands/progress-index'

/**
 * Closes out a practice pass (study, quiz, match): applies the reward through the
 * progress command, emits gamification events for the notification bridge, and —
 * unless the learner disabled notifications — narrates the win as toasts.
 */
@Injectable({ providedIn: 'root' })
export class SessionReward {
  private readonly transloco = inject(TranslocoService)
  private readonly toast = inject(ToastService)
  private readonly bus = inject(EVENT_BUS)
  private readonly progressStore = inject(ProgressStore)
  private readonly preferencesStore = inject(PreferencesStore)

  async complete(outcome: SessionOutcome): Promise<void> {
    const dailyGoal = this.preferencesStore.effective().dailyGoal
    const reward = await completeSession(this.progressStore, {
      ...outcomeToReward(outcome),
      dailyGoal,
    })

    if (reward.leveledUp) this.bus.emit('level-up', { level: reward.level })
    if (reward.isMilestone) this.bus.emit('streak', { count: reward.streakCount })
    if (reward.isBestQuiz && reward.quizAccuracy !== undefined) {
      this.bus.emit('quiz', { accuracy: reward.quizAccuracy, xp: reward.xpGained })
    }

    if (!this.preferencesStore.effective().notifications) return
    const t = (key: string, params?: Record<string, unknown>): string =>
      this.transloco.translate(key, params)
    if (reward.xpGained > 0) this.toast.success(t('reward.xp', { amount: reward.xpGained }))
    if (reward.leveledUp) this.toast.success(t('reward.levelUp', { level: reward.level }))
    if (reward.isMilestone) this.toast.success(t('reward.streak', { count: reward.streakCount }))
    if (reward.dayBecameActive) {
      this.toast.success(t('reward.dayComplete', { count: reward.dailyGoal }))
    }
  }
}

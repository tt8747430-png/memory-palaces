import { Inject, Injectable, InjectionToken, computed } from '@angular/core'
import { SingletonDocStore } from '@app/shared/data/singleton-doc-store'
import type { Repository } from '@app/shared/data'
import { levelFromXp, totalTrainingDays } from '@app/shared/domain'
import type { Progress } from '../model/progress'
import type { RxJsonSchema } from 'rxdb'

export const PROGRESS_REPOSITORY = new InjectionToken<Repository<Progress>>('PROGRESS_REPOSITORY')

@Injectable({ providedIn: 'root' })
export class ProgressStore extends SingletonDocStore<Progress> {
  readonly progress = this.value
  readonly level = computed(() => levelFromXp(this.value()?.xp ?? 0))
  readonly trainingDayCount = computed(() => totalTrainingDays(this.value()?.trainingDays ?? []))

  // eslint-disable-next-line @angular-eslint/prefer-inject -- constructor param keeps the store directly constructible in unit tests (new XStore(repo))
  constructor(@Inject(PROGRESS_REPOSITORY) repo: Repository<Progress>) {
    super(repo)
  }
}

export const progressSchema: RxJsonSchema<Progress> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    xp: { type: 'number' },
    streakCount: { type: 'number' },
    longestStreak: { type: 'number' },
    lastTrainingDate: { type: ['string', 'null'] },
    streakFreezes: { type: 'number' },
    bestQuizAccuracy: { type: 'number' },
    trainingDays: { type: 'array', items: { type: 'string' } },
    activeDayKey: { type: ['string', 'null'] },
    activeDayCount: { type: 'number' },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'xp',
    'streakCount',
    'longestStreak',
    'lastTrainingDate',
    'streakFreezes',
    'bestQuizAccuracy',
    'trainingDays',
    'activeDayKey',
    'activeDayCount',
  ],
}

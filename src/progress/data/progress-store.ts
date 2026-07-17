import { SingletonDocStore } from '@/shared/data/singleton-doc-store'
import { derived } from '@/shared/data/observable'
import type { Repository } from '@/shared/data'
import { levelFromXp, totalTrainingDays } from '@/shared/domain'
import type { Progress } from '../model/progress'
import type { RxJsonSchema } from 'rxdb'

export class ProgressStore extends SingletonDocStore<Progress> {
  readonly progress = this.value
  readonly level = derived(this.value, (progress) => levelFromXp(progress?.xp ?? 0))
  readonly trainingDayCount = derived(this.value, (progress) =>
    totalTrainingDays(progress?.trainingDays ?? []),
  )

  constructor(repo: Repository<Progress>) {
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

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { cleanup, renderHook } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { EventBus, EventBusContext, dayKey, type AppEvents } from '@/shared/lib'
import {
  createProgressStore,
  makeProgress,
  ProgressStoreContext,
  type Progress,
} from '@/entities/progress'
import { useSessionReward } from './use-session-reward'

afterEach(cleanup)

const DAY = 86_400_000

function setup(seed: Progress[] = []) {
  const bus = new EventBus<AppEvents>()
  const store = createProgressStore(new InMemoryRepository<Progress>(seed))
  store.getState().start()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <ProgressStoreContext value={store}>
        <EventBusContext value={bus}>{children}</EventBusContext>
      </ProgressStoreContext>
    </I18nextProvider>
  )
  const { result } = renderHook(() => useSessionReward(), { wrapper })
  return { bus, reward: () => result.current }
}

describe('useSessionReward — EventBus emission', () => {
  it('emits level-up and quiz for a best-quiz session that crosses a level', async () => {
    const { bus, reward } = setup()
    let levelUp: AppEvents['level-up'] | undefined
    let quiz: AppEvents['quiz'] | undefined
    bus.on('level-up', (payload) => {
      levelUp = payload
    })
    bus.on('quiz', (payload) => {
      quiz = payload
    })

    await reward()({ xp: 300, quizAccuracy: 90 })

    expect(levelUp?.level).toBeGreaterThanOrEqual(2)
    expect(quiz?.accuracy).toBe(90)
  })

  it('emits a streak event when the session hits a milestone', async () => {
    const yesterday = dayKey(Date.now() - DAY)
    const seed = makeProgress({
      id: 'progress',
      createdAt: new Date(0).toISOString(),
      streakCount: 6,
      longestStreak: 6,
      lastTrainingDate: yesterday,
      trainingDays: [yesterday],
    })
    const { bus, reward } = setup([seed])
    const streak = vi.fn()
    bus.on('streak', streak)

    await reward()({ xp: 50 })

    expect(streak).toHaveBeenCalledWith({ count: 7 })
  })
})

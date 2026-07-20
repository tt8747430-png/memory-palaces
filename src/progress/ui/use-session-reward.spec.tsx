import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import '@/shared/i18n'
import { dayKey } from '@/shared/domain'
import { createTestServices, type Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { makeProgress, PROGRESS_ID } from '@/progress'
import { useSessionReward } from './use-session-reward'

const DAY = 86_400_000

function setup(services: Services) {
  services.progressStore.start()
  services.preferencesStore.start()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ServicesProvider services={services}>{children}</ServicesProvider>
  )
  const { result } = renderHook(() => useSessionReward(), { wrapper })
  return () => result.current
}

describe('useSessionReward', () => {
  it('emits level-up and quiz for a best-quiz session that crosses a level', async () => {
    const services = createTestServices()
    const reward = setup(services)
    let levelUp: { level: number } | undefined
    let quiz: { accuracy: number; xp: number } | undefined
    services.eventBus.on('level-up', (payload) => {
      levelUp = payload
    })
    services.eventBus.on('quiz', (payload) => {
      quiz = payload
    })

    await reward()({ kind: 'quiz', correct: 13, total: 13, accuracy: 90 })

    expect(levelUp?.level).toBeGreaterThanOrEqual(2)
    expect(quiz?.accuracy).toBe(90)
  })

  it('emits a streak event when the session hits a milestone', async () => {
    const yesterday = dayKey(Date.now() - DAY)
    const services = createTestServices()
    await services.progressStore.save(
      makeProgress({
        id: PROGRESS_ID,
        createdAt: new Date(0).toISOString(),
        streakCount: 6,
        longestStreak: 6,
        lastTrainingDate: yesterday,
        trainingDays: [yesterday],
      }),
    )
    const reward = setup(services)
    const streak = vi.fn()
    services.eventBus.on('streak', streak)

    await reward()({ kind: 'study', graded: 5 })

    expect(streak).toHaveBeenCalledWith({ count: 7 })
  })
})

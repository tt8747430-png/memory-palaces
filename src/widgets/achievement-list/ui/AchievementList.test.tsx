import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { Achievement } from '@/shared/lib'
import { AchievementList } from './AchievementList'

afterEach(cleanup)

const achievements: Achievement[] = [
  { id: 'first-palace', earned: true },
  { id: 'week-warrior', earned: false },
  { id: 'palace-master', earned: false },
  { id: 'xp-champion', earned: false },
  { id: 'perfectionist', earned: false },
  { id: 'dedicated-learner', earned: false },
]

function renderList(list: Achievement[] = achievements) {
  render(
    <I18nextProvider i18n={i18n}>
      <AchievementList achievements={list} />
    </I18nextProvider>,
  )
}

describe('AchievementList', () => {
  it('shows the earned-over-total count', () => {
    renderList()
    expect(screen.getByText('1/6')).toBeInTheDocument()
  })

  it('renders a title and description for every badge', () => {
    renderList()
    expect(screen.getByText('First Palace')).toBeInTheDocument()
    expect(screen.getByText('Built your first memory palace')).toBeInTheDocument()
    expect(screen.getByText('Week Warrior')).toBeInTheDocument()
    expect(screen.getByText('Dedicated Learner')).toBeInTheDocument()
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { SrsState } from '@/shared/lib'
import { SrsStatusChip } from './SrsStatusChip'

afterEach(cleanup)

const NOW = Date.UTC(2026, 0, 1)
const iso = (ms: number) => new Date(ms).toISOString()
const DAY = 86_400_000

const srs = (over: Partial<SrsState>): SrsState => ({
  due: iso(NOW),
  interval: 1,
  ease: 2.5,
  reps: 1,
  lapses: 0,
  lastReviewed: iso(NOW),
  ...over,
})

function renderChip(state?: SrsState) {
  render(
    <I18nextProvider i18n={i18n}>
      <SrsStatusChip srs={state} now={NOW} />
    </I18nextProvider>,
  )
}

describe('SrsStatusChip', () => {
  it('labels a card with no schedule as New', () => {
    renderChip(undefined)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('labels a past-due reviewed card as Due', () => {
    renderChip(srs({ due: iso(NOW - DAY), reps: 2 }))
    expect(screen.getByText('Due')).toBeInTheDocument()
  })

  it('labels a long-interval, not-due card as Known', () => {
    renderChip(srs({ due: iso(NOW + 30 * DAY), interval: 30, reps: 6 }))
    expect(screen.getByText('Known')).toBeInTheDocument()
  })

  it('labels a short-interval, not-due card as Learning', () => {
    renderChip(srs({ due: iso(NOW + 2 * DAY), interval: 3, reps: 2 }))
    expect(screen.getByText('Learning')).toBeInTheDocument()
  })
})

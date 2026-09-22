import { describe, expect, it, vi } from 'vitest'
import type { TFunction } from 'i18next'
import { type Card, makeCard } from '@/entities/card'
import { cardActionHandlers, type CardActionContext, type CardActionIntents } from './card-actions'

const at = (ms: number) => new Date(ms).toISOString()

const card = (over: Partial<Card> = {}): Card => ({
  ...makeCard({ id: 'c1', createdAt: at(0), deckId: 'd1', front: 'ante', back: 'before' }),
  ...over,
})

const intents = (): CardActionIntents => ({
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onGrade: vi.fn(),
  onStudyFrom: vi.fn(),
  onToggleFlag: vi.fn(),
  onMarkKnown: vi.fn(),
  onResetSrs: vi.fn(),
  onToggleFreeze: vi.fn(),
  onToggleReverse: vi.fn(),
  onMove: vi.fn(),
  onDuplicate: vi.fn(),
  onHistory: vi.fn(),
  onDelete: vi.fn(),
})

const t = ((key: string) => key) as unknown as TFunction

const handlers = (subject: Card, context: Partial<CardActionContext> = {}) =>
  cardActionHandlers(subject, intents(), t, { hasHistory: false, canMove: true, ...context })

const scheduled = { due: at(0), interval: 1, ease: 2.5, reps: 1, lapses: 0, lastReviewed: at(0) }

describe('cardActionHandlers availability', () => {
  it('withholds History from a card nothing has been recorded against', () => {
    expect(handlers(card()).history).toBeUndefined()
    expect(handlers(card(), { hasHistory: true }).history).toBeDefined()
  })

  it('withholds Reset from a card with no schedule, no outcome and no reviews', () => {
    expect(handlers(card()).reset).toBeUndefined()
  })

  it('offers Reset for a schedule, a Fast outcome or a history alike — each is something to clear', () => {
    expect(handlers(card({ srs: scheduled })).reset).toBeDefined()
    expect(handlers(card({ fastReview: 'gotIt' })).reset).toBeDefined()
    expect(handlers(card(), { hasHistory: true }).reset).toBeDefined()
  })

  it('withholds Move while there is nowhere to move the card to', () => {
    expect(handlers(card(), { canMove: false }).move).toBeUndefined()
    expect(handlers(card(), { canMove: true }).move).toBeDefined()
  })

  it('keeps every toggle on every card — each has a second reading, not an inert one', () => {
    const bare = handlers(card())
    expect(bare.flag).toBeDefined()
    expect(bare.freeze).toBeDefined()
    expect(bare.reverse).toBeDefined()
    expect(bare.grade).toBeDefined()
    // Mark known re-masters and re-schedules a card that already reads as known, so it is never
    // the no-op it looks like.
    expect(bare.known).toBeDefined()
  })

  it('still drops an action whose intent the surface never supplied', () => {
    const withoutStudy = cardActionHandlers(
      card(),
      { ...intents(), onSelect: undefined, onStudyFrom: undefined },
      t,
      { hasHistory: true, canMove: true },
    )
    expect(withoutStudy.select).toBeUndefined()
    expect(withoutStudy.studyFrom).toBeUndefined()
  })
})

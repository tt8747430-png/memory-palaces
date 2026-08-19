import { describe, expect, it } from 'vitest'
import { type Card, makeCard } from '@/entities/card'
import { studyFaces } from './study-faces'

const card = (over: Partial<Card> = {}): Card => ({
  ...makeCard({
    id: 'c1',
    createdAt: new Date(0).toISOString(),
    deckId: 'd1',
    front: 'Front',
    back: 'Back',
  }),
  ...over,
})

describe('studyFaces', () => {
  it('asks the front under a front-first deck', () => {
    expect(studyFaces(card(), 'front').prompt).toBe('Front')
  })

  it('asks the back under a back-first deck', () => {
    expect(studyFaces(card(), 'back').prompt).toBe('Back')
  })

  it('a reversed card flips a front-first deck', () => {
    const faces = studyFaces(card({ reversed: true }), 'front')
    expect(faces.prompt).toBe('Back')
    expect(faces.answer).toBe('Front')
  })

  it('a reversed card in a back-first deck reads front-first again', () => {
    expect(studyFaces(card({ reversed: true }), 'back').prompt).toBe('Front')
  })
})

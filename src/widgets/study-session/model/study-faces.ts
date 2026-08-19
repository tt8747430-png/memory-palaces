import type { Card } from '@/entities/card'
import { recallAnswer } from '@/shared/lib'
import type { StudyDirection } from './types'

export interface StudyFaces {
  prompt: string
  answer: string
}

/**
 * Which side of a card the learner is asked, and which they are shown. The deck sets the direction;
 * a reversed card flips it for itself, so the two settings compose rather than one overriding the
 * other. The one place this is decided, so the visible card, the cards queued behind it and
 * read-aloud can never disagree.
 */
export function studyFaces(card: Card, direction: StudyDirection): StudyFaces {
  const frontFirst = card.reversed ? direction === 'back' : direction === 'front'
  const prompt = frontFirst ? card.front : card.back
  return { prompt, answer: recallAnswer(prompt, frontFirst ? card.back : card.front) }
}

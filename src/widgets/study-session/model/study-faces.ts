import type { Card } from '@/entities/card'
import { recallAnswer } from '@/shared/lib'
import type { StudyDirection } from './types'

export interface StudyFaces {
  prompt: string
  answer: string
}

export function studyFaces(card: Card, direction: StudyDirection): StudyFaces {
  const frontFirst = card.reversed ? false : direction === 'front'
  const prompt = frontFirst ? card.front : card.back
  return { prompt, answer: recallAnswer(prompt, frontFirst ? card.back : card.front) }
}

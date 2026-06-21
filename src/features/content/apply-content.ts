import type { LocusStore } from '@/entities/locus'
import type { QuestionStore } from '@/entities/question'
import { createLocus } from '@/features/locus'
import { createQuestion } from '@/features/question'
import type { RoomContentData } from '@/shared/lib'

export interface AppliedContent {
  loci: number
  questions: number
}

/**
 * Command — write parsed import content into a room through the create commands, so
 * imported cards/questions get fresh ids, timestamps, and appended order like any other.
 * Sequential by design: each create reads the running order off the store.
 */
export async function applyRoomContent(
  locusStore: LocusStore,
  questionStore: QuestionStore,
  roomId: string,
  data: RoomContentData,
): Promise<AppliedContent> {
  for (const locus of data.loci) {
    await createLocus(locusStore, roomId, locus)
  }
  for (const question of data.questions) {
    await createQuestion(questionStore, roomId, question)
  }
  return { loci: data.loci.length, questions: data.questions.length }
}

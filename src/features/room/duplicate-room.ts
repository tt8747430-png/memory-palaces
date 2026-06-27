import { makeRoom, roomsForPalace, selectRooms, type Room, type RoomStore } from '@/entities/room'
import { lociForRoom, makeLocus, selectLoci, type LocusStore } from '@/entities/locus'
import {
  makeQuestion,
  questionsForRoom,
  selectQuestions,
  type QuestionStore,
} from '@/entities/question'
import { nextOrder } from '@/shared/lib'
import { requireRoom } from './require-room'

/**
 * Command — duplicate a room *with its contents*. Unlike the (still shallow)
 * `duplicatePalace`, a room is only useful with its cards, so this deep-copies the
 * room's loci and questions into a fresh room appended to the same palace. The copies
 * carry the original content and order but start with a clean schedule (no `srs`,
 * unflagged) — it's new material to learn, not a clone of the original's progress.
 */
export async function duplicateRoom(
  roomStore: RoomStore,
  locusStore: LocusStore,
  questionStore: QuestionStore,
  roomId: string,
): Promise<Room> {
  const original = requireRoom(roomStore, roomId)
  const now = new Date().toISOString()
  const order = nextOrder(roomsForPalace(selectRooms(roomStore.getState()), original.palaceId))

  const copy = makeRoom({
    id: crypto.randomUUID(),
    createdAt: now,
    palaceId: original.palaceId,
    title: `${original.title} (copy)`,
    description: original.description,
    order,
  })
  await roomStore.getState().save(copy)

  const loci = lociForRoom(selectLoci(locusStore.getState()), original.id)
  await Promise.all(
    loci.map((locus) =>
      locusStore.getState().save(
        makeLocus({
          id: crypto.randomUUID(),
          createdAt: now,
          roomId: copy.id,
          front: locus.front,
          back: locus.back,
          hint: locus.hint,
          tip: locus.tip,
          order: locus.order,
        }),
      ),
    ),
  )

  const questions = questionsForRoom(selectQuestions(questionStore.getState()), original.id)
  await Promise.all(
    questions.map((question) =>
      questionStore.getState().save(
        makeQuestion({
          id: crypto.randomUUID(),
          createdAt: now,
          roomId: copy.id,
          prompt: question.prompt,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          order: question.order,
        }),
      ),
    ),
  )

  return copy
}

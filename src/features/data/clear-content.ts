import type { PalaceStore } from '@/entities/palace'
import type { RoomStore } from '@/entities/room'
import type { LocusStore } from '@/entities/locus'
import type { QuestionStore } from '@/entities/question'

export interface ContentStores {
  palaceStore: PalaceStore
  roomStore: RoomStore
  locusStore: LocusStore
  questionStore: QuestionStore
}

async function removeEach(ids: string[], remove: (id: string) => Promise<void>): Promise<void> {
  for (const id of ids) await remove(id)
}

/** Command — delete every palace and all of its rooms, loci, and questions. Children
 * are removed first because deleteRoom/deletePalace don't cascade. */
export async function clearAllContent({
  palaceStore,
  roomStore,
  locusStore,
  questionStore,
}: ContentStores): Promise<void> {
  await removeEach(
    questionStore.getState().questions.map((q) => q.id),
    (id) => questionStore.getState().remove(id),
  )
  await removeEach(
    locusStore.getState().loci.map((l) => l.id),
    (id) => locusStore.getState().remove(id),
  )
  await removeEach(
    roomStore.getState().rooms.map((r) => r.id),
    (id) => roomStore.getState().remove(id),
  )
  await removeEach(
    palaceStore.getState().palaces.map((p) => p.id),
    (id) => palaceStore.getState().remove(id),
  )
}

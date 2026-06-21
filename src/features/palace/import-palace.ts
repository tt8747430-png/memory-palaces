import type { PalaceContentData } from '@/shared/lib'
import {
  DEFAULT_PALACE_COLOR,
  DEFAULT_PALACE_ICON,
  type Palace,
  type PalaceStore,
} from '@/entities/palace'
import type { RoomStore } from '@/entities/room'
import type { LocusStore } from '@/entities/locus'
import type { QuestionStore } from '@/entities/question'
import { importRooms } from '@/features/content'
import { createPalace } from './create-palace'

export interface ImportPalaceResult {
  palace: Palace
  rooms: number
  loci: number
  questions: number
}

/**
 * Command — create a brand-new palace from a parsed Mindscape palace file, then bring in
 * all of its rooms with their content. The counterpart to `exportPalaceJson`; identity
 * falls back to the app defaults when the file omits an icon or colour.
 */
export async function importPalace(
  palaceStore: PalaceStore,
  roomStore: RoomStore,
  locusStore: LocusStore,
  questionStore: QuestionStore,
  data: PalaceContentData,
): Promise<ImportPalaceResult> {
  const palace = await createPalace(palaceStore, {
    name: data.palace.name,
    description: data.palace.description,
    icon: data.palace.icon ?? DEFAULT_PALACE_ICON,
    color: data.palace.color ?? DEFAULT_PALACE_COLOR,
    category: data.palace.category,
    bibleMode: data.palace.bibleMode,
  })
  const result = await importRooms(roomStore, locusStore, questionStore, palace.id, data.rooms)
  return { palace, ...result }
}

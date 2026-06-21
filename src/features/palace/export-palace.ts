import { contentSlug, lociToAnkiTsv, palaceContentToJson } from '@/shared/lib'
import type { Palace } from '@/entities/palace'
import { roomsForPalace, type Room } from '@/entities/room'
import { lociForRoom, type Locus } from '@/entities/locus'
import { questionsForRoom, type Question } from '@/entities/question'

/** A ready-to-download file: what to name it, what's in it, and its MIME type. */
export interface PalaceExportFile {
  filename: string
  text: string
  type: string
}

/**
 * Serialize a whole palace — its identity plus every room's loci and questions — as a
 * Mindscape JSON file (the same format `parsePalaceContent` re-imports). Pure: takes the
 * palace and the full entity arrays (it filters to this palace's rooms/loci/questions
 * itself) and returns the file, so the caller owns the download and it stays testable.
 */
export function exportPalaceJson(
  palace: Palace,
  rooms: ReadonlyArray<Room>,
  loci: ReadonlyArray<Locus>,
  questions: ReadonlyArray<Question>,
): PalaceExportFile {
  const ordered = roomsForPalace([...rooms], palace.id)
  const text = palaceContentToJson(
    {
      name: palace.name,
      description: palace.description,
      icon: palace.icon,
      color: palace.color,
      category: palace.category,
      bibleMode: palace.bibleMode,
      settings: palace.settings,
    },
    ordered.map((room) => ({
      title: room.title,
      description: room.description,
      loci: lociForRoom([...loci], room.id),
      questions: questionsForRoom([...questions], room.id),
    })),
  )
  return {
    filename: `${contentSlug(palace.name)}.mindscape.json`,
    text,
    type: 'application/json',
  }
}

/**
 * Serialize a palace's cards as Anki "Notes in Plain Text" (tab-separated Front/Back),
 * flattening every room in order. Reuses the room-level Anki serializer.
 */
export function exportPalaceAnki(
  palace: Palace,
  rooms: ReadonlyArray<Room>,
  loci: ReadonlyArray<Locus>,
): PalaceExportFile {
  const ordered = roomsForPalace([...rooms], palace.id)
  const allLoci = ordered.flatMap((room) => lociForRoom([...loci], room.id))
  return {
    filename: `${contentSlug(palace.name)}.anki.txt`,
    text: lociToAnkiTsv(allLoci),
    type: 'text/plain',
  }
}

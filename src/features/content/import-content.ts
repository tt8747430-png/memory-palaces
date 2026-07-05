import {
  ContentImportError,
  type PalaceContentData,
  parseAnkiText,
  parseMindscapeRoom,
  parsePalaceContent,
  parseRoomContent,
  type RoomContentData,
} from '@/shared/lib'

/** Read a `.json` / `.csv` Mindscape export into room content (the file-IO boundary). Used by
 * the palace-rooms and questions imports; the room card import uses the split readers below. */
export function readContentFile(file: File): Promise<RoomContentData> {
  return readText(file).then((text) => parseRoomContent(text, file.name))
}

/** Read a Mindscape room export (`.json`) at full card fidelity (cues, flag, known, schedule). */
export function readMindscapeFile(file: File): Promise<RoomContentData> {
  return readText(file).then((text) => parseMindscapeRoom(text))
}

/**
 * Read an Anki / delimited cards file. `.csv` maps by column (front/back/hint); `.tsv` and
 * `.txt` parse as Anki "Notes in Plain Text" (tab/`#separator`-delimited). Binary decks
 * (`.apkg` / `.colpkg`) are routed to a clear re-export message — Mindscape doesn't bundle a
 * SQLite/zip reader to keep the offline bundle lean.
 */
export async function readAnkiFile(file: File): Promise<RoomContentData> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.apkg') || name.endsWith('.colpkg')) {
    throw new ContentImportError(
      'Binary Anki decks (.apkg) aren’t supported. In Anki, export as Notes in Plain Text (.txt) and import that.',
    )
  }
  const text = await file.text()
  if (name.endsWith('.csv')) return parseRoomContent(text, file.name)
  const loci = parseAnkiText(text)
  if (loci.length === 0) throw new ContentImportError('No cards found in that file.')
  return { loci, questions: [] }
}

/** Read a Mindscape palace export (`.json`) into its identity and rooms. */
export function readPalaceFile(file: File): Promise<PalaceContentData> {
  return readText(file).then((text) => parsePalaceContent(text, file.name))
}

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new ContentImportError("Couldn't read that file."))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsText(file)
  })
}

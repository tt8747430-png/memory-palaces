import {
  ContentImportError,
  parseAnkiText,
  parsePalaceContent,
  parseRoomContent,
  type PalaceContentData,
  type RoomContentData,
} from '@/shared/lib'

/** Read a `.json` / `.csv` Mindscape export into room content (the file-IO boundary). */
export function readContentFile(file: File): Promise<RoomContentData> {
  return readText(file).then((text) => parseRoomContent(text, file.name))
}

/**
 * Read an Anki export. Plain-text exports (`.txt` / `.tsv`, "Notes in Plain Text") parse
 * directly; binary decks (`.apkg` / `.colpkg`) are routed to a clear re-export message —
 * Mindscape doesn't bundle a SQLite/zip reader to keep the offline bundle lean.
 */
export async function readAnkiFile(file: File): Promise<RoomContentData> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.apkg') || name.endsWith('.colpkg')) {
    throw new ContentImportError(
      'Binary Anki decks (.apkg) aren’t supported. In Anki, export as Notes in Plain Text (.txt) and import that.',
    )
  }
  const loci = parseAnkiText(await file.text())
  if (loci.length === 0) throw new ContentImportError('No cards found in that Anki file.')
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

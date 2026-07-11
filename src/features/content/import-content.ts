import {
  ContentImportError,
  type DeckTreeContentData,
  parseAnkiText,
  parseMindscapeDeck,
  parseDeckTreeContent,
  parseDeckContent,
  type DeckContentData,
} from '@/shared/lib'

/** Read a `.json` / `.csv` Mindscape export into room content (the file-IO boundary). Used by
 * the deck-tree and questions imports; the per-deck card import uses the split readers below. */
export function readContentFile(file: File): Promise<DeckContentData> {
  return readText(file).then((text) => parseDeckContent(text, file.name))
}

/** Read a Mindscape room export (`.json`) at full card fidelity (cues, flag, known, schedule). */
export function readMindscapeFile(file: File): Promise<DeckContentData> {
  return readText(file).then((text) => parseMindscapeDeck(text))
}

/**
 * Read an Anki / delimited cards file. `.csv` maps by column (front/back/hint); `.tsv` and
 * `.txt` parse as Anki "Notes in Plain Text" (tab/`#separator`-delimited). Binary decks
 * (`.apkg` / `.colpkg`) are routed to a clear re-export message — Mindscape doesn't bundle a
 * SQLite/zip reader to keep the offline bundle lean.
 */
export async function readAnkiFile(file: File): Promise<DeckContentData> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.apkg') || name.endsWith('.colpkg')) {
    throw new ContentImportError(
      'Binary Anki decks (.apkg) aren’t supported. In Anki, export as Notes in Plain Text (.txt) and import that.',
    )
  }
  const text = await file.text()
  if (name.endsWith('.csv')) return parseDeckContent(text, file.name)
  const cards = parseAnkiText(text)
  if (cards.length === 0) throw new ContentImportError('No cards found in that file.')
  return { cards, questions: [] }
}

/** Read a Mindscape decks export (`.json`, legacy palace files included) into its decks. */
export function readDeckTreeFile(file: File): Promise<DeckTreeContentData> {
  return readText(file).then((text) => parseDeckTreeContent(text, file.name))
}

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new ContentImportError("Couldn't read that file."))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsText(file)
  })
}

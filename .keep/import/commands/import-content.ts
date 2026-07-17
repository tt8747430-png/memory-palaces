import {
  ContentImportError,
  parseAnkiText,
  parseDeckContent,
  type DeckContentData,
} from '@app/shared/domain'

export function readContentFile(file: File): Promise<DeckContentData> {
  return readText(file).then((text) => parseDeckContent(text))
}

export async function readAnkiFile(file: File): Promise<DeckContentData> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.apkg') || name.endsWith('.colpkg')) {
    throw new ContentImportError(
      'Binary Anki decks (.apkg) aren’t supported. In Anki, export as Notes in Plain Text (.txt) and import that.',
    )
  }
  const text = await file.text()
  if (name.endsWith('.csv')) return parseDeckContent(text)
  const cards = parseAnkiText(text)
  if (cards.length === 0) throw new ContentImportError('No cards found in that file.')
  return { cards, questions: [] }
}

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new ContentImportError("Couldn't read that file."))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsText(file)
  })
}

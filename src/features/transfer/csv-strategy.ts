import type { TransferStrategy } from './model'

function escapeField(field: string): string {
  return /[",\n\r]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field
}

/** Parse CSV into rows of fields (RFC 4180-ish: quoted fields may contain commas,
 * quotes (doubled), and newlines). */
function parseRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let sawAny = false

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i)
    sawAny = true
    if (inQuotes) {
      if (ch === '"' && text.charAt(i + 1) === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text.charAt(i + 1) === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }

  // Flush a final field/row unless the text ended exactly on a row break.
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return sawAny ? rows : []
}

/** Simple two-column front,back format (Anki-style). hint/tip are dropped — use
 * JSON for the full shape. */
export const csvStrategy: TransferStrategy = {
  id: 'csv',
  serialize: (cards) =>
    cards.map((card) => `${escapeField(card.front)},${escapeField(card.back)}`).join('\n'),
  parse: (text) =>
    parseRows(text)
      .filter((row) => row.some((field) => field !== ''))
      .map((row) => ({ front: row[0] ?? '', back: row[1] ?? '' })),
}

import type { SrsState } from './srs'

export interface ParsedCard {
  front: string
  back: string
  hint?: string
  tip?: string
  flagged?: boolean
  memorized?: boolean
  srs?: SrsState
}

export interface ParsedQuestion {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface DeckContentData {
  cards: ParsedCard[]
  questions: ParsedQuestion[]
}

export type CardLike = { front: string; back: string; hint?: string }
export type QuestionLike = {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export class ContentImportError extends Error {}

export function importErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ContentImportError ? error.message : fallback
}

export function contentSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'deck'
  )
}

function csvCell(value: string): string {
  const v = value ?? ''
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export function cardsToCsv(cards: ReadonlyArray<CardLike>): string {
  const header = 'front,back,hint'
  const lines = cards.map((c) =>
    [csvCell(c.front), csvCell(c.back), csvCell(c.hint ?? '')].join(','),
  )
  return [header, ...lines].join('\n')
}

export function questionsToCsv(questions: ReadonlyArray<QuestionLike>): string {
  const maxOptions = questions.reduce((max, q) => Math.max(max, q.options.length), 2)
  const optionHeaders = Array.from({ length: maxOptions }, (_, i) => `option${i + 1}`)
  const header = ['prompt', ...optionHeaders, 'answer', 'explanation'].join(',')
  const lines = questions.map((q) => {
    const cells = [csvCell(q.prompt)]
    for (let i = 0; i < maxOptions; i++) cells.push(csvCell(q.options[i] ?? ''))
    cells.push(String(q.correctAnswer + 1))
    cells.push(csvCell(q.explanation ?? ''))
    return cells.join(',')
  })
  return [header, ...lines].join('\n')
}

function ankiField(value: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\t/g, ' ')
    .replace(/\r?\n/g, '<br>')
}

export function cardsToAnkiTsv(cards: ReadonlyArray<CardLike>): string {
  const header = '#separator:tab\n#html:true\n#columns:Front\tBack'
  const lines = cards.map((c) => `${ankiField(c.front)}\t${ankiField(c.back)}`)
  return [header, ...lines].join('\n')
}

function contentFromCsv(rows: string[][]): DeckContentData {
  const header = rows[0]
  if (!header) return { cards: [], questions: [] }
  const cols = header.map((h) => h.trim().toLowerCase())
  const body = rows.slice(1)

  const isQuestions =
    cols.includes('prompt') || cols.some((h) => h.startsWith('option')) || cols.includes('answer')

  if (isQuestions) {
    const promptIdx = cols.findIndex((h) => h === 'prompt' || h === 'question')
    const optionIdxs = cols.map((h, i) => (h.startsWith('option') ? i : -1)).filter((i) => i >= 0)
    const answerIdx = cols.findIndex(
      (h) => h === 'answer' || h === 'correctanswer' || h === 'correct',
    )
    const explIdx = cols.findIndex((h) => h === 'explanation' || h === 'explain')
    const questions = body.flatMap((cells) => {
      const prompt = (cells[promptIdx] ?? '').trim()
      const options = optionIdxs.map((i) => (cells[i] ?? '').trim()).filter(Boolean)
      if (!prompt || options.length < 2) return []
      let answer = answerIdx >= 0 ? Number(cells[answerIdx]) : 1
      if (!Number.isFinite(answer)) answer = 1
      answer = Math.max(1, Math.min(options.length, answer)) - 1
      const explanation = explIdx >= 0 ? (cells[explIdx] ?? '').trim() : ''
      return [{ prompt, options, correctAnswer: answer, ...(explanation ? { explanation } : {}) }]
    })
    return { cards: [], questions }
  }

  const frontIdx = Math.max(
    0,
    cols.findIndex((h) => h === 'front' || h === 'term' || h === 'question'),
  )
  const backIdxRaw = cols.findIndex((h) => h === 'back' || h === 'definition' || h === 'answer')
  const backIdx = backIdxRaw >= 0 ? backIdxRaw : 1
  const hintIdx = cols.findIndex((h) => h === 'hint' || h === 'cue' || h === 'note')
  const cards = body.flatMap((cells) => {
    const front = (cells[frontIdx] ?? '').trim()
    const back = (cells[backIdx] ?? '').trim()
    if (!front || !back) return []
    const hint = hintIdx >= 0 ? (cells[hintIdx] ?? '').trim() : ''
    return [{ front, back, ...(hint ? { hint } : {}) }]
  })
  return { cards, questions: [] }
}

export function parsePastedCards(text: string): ParsedCard[] {
  return text.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim()
    if (!trimmed) return []
    const m = trimmed.match(/^(.*?)[\t;,](.*)$/)
    if (!m) return []
    const front = (m[1] ?? '').trim()
    const back = (m[2] ?? '').trim()
    if (!front || !back) return []
    return [{ front, back }]
  })
}

export interface NoteDelimiters {
  field: string
  card: string
  swap?: boolean
  skipHeader?: boolean
}

export function parseDelimitedNotes(
  text: string,
  { field, card, swap = false, skipHeader = false }: NoteDelimiters,
): ParsedCard[] {
  let chunks = card === '\n' ? text.split(/\r?\n/) : text.split(card)
  if (skipHeader) {
    const first = chunks.findIndex((c) => c.trim() !== '')
    if (first >= 0) chunks = chunks.slice(first + 1)
  }
  return chunks.flatMap((chunk) => {
    const trimmed = chunk.trim()
    if (!trimmed || !field) return []
    const at = trimmed.indexOf(field)
    if (at < 0) return []
    const a = trimmed.slice(0, at).trim()
    const b = trimmed.slice(at + field.length).trim()
    if (!a || !b) return []
    return [swap ? { front: b, back: a } : { front: a, back: b }]
  })
}

export function guessFieldSeparator(text: string): string {
  const first = text.split(/\r?\n/).find((l) => l.trim() !== '') ?? ''
  for (const sep of ['\t', ',', ';', '|']) if (first.includes(sep)) return sep
  return '\t'
}

function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const ANKI_SEPARATORS: Record<string, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
  space: ' ',
  pipe: '|',
  colon: ':',
}

export function parseAnkiText(text: string): ParsedCard[] {
  let separator = '\t'
  const cards: ParsedCard[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\r$/, '')
    if (!line.trim()) continue
    if (line.startsWith('#')) {
      const sep = line.match(/^#separator:(.+)$/i)?.[1]?.trim()
      if (sep) separator = ANKI_SEPARATORS[sep.toLowerCase()] ?? sep
      continue
    }
    const fields = line.split(separator)
    if (fields.length < 2) continue
    const front = stripHtml(fields[0] ?? '')
    const back = stripHtml(fields[1] ?? '')
    if (front && back) cards.push({ front, back })
  }
  return cards
}

export function parseDeckContent(text: string): DeckContentData {
  let content: DeckContentData
  try {
    content = contentFromCsv(parseCsv(text))
  } catch {
    throw new ContentImportError("That file isn't a valid CSV.")
  }
  if (content.cards.length === 0 && content.questions.length === 0) {
    throw new ContentImportError('No cards or questions found in that file.')
  }
  return content
}

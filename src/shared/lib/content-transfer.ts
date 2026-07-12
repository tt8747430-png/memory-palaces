/**
 * Pure import/export for a deck's study content (cards + questions). Parsers turn text
 * (CSV / pasted lines / Anki notes / verse paste) into plain content data; the serializers
 * turn content back into CSV / Anki TSV strings. No DOM, no IO, no entity imports — the
 * `features/content` slice handles file reads, downloads, and mapping this data onto the
 * create commands.
 */

import type { SrsState } from './srs'

/**
 * A card's importable content. Text + cues are the common case; the schedule/status fields
 * stay absent for the lighter sources (CSV / Anki / paste) and are assigned by the create
 * command.
 */
export interface ParsedCard {
  front: string
  back: string
  hint?: string
  tip?: string
  flagged?: boolean
  memorized?: boolean
  srs?: SrsState
}

/** A question's importable content. */
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

/** Minimal shapes the serializers read — structural, so no entity dependency. */
type CardLike = { front: string; back: string; hint?: string }
type QuestionLike = {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

/** A user-facing import failure; the UI shows `.message` verbatim. */
export class ContentImportError extends Error {}

/** Filesystem-safe slug for a download name. */
export function contentSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'deck'
  )
}

// --- CSV plumbing -----------------------------------------------------------

/** Wrap a single CSV cell, escaping quotes and quoting only when needed. */
function csvCell(value: string): string {
  const v = value ?? ''
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** Parse a CSV document into rows of string cells (RFC-4180-ish). */
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

// --- Serialize (export) -----------------------------------------------------

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
    cells.push(String(q.correctAnswer + 1)) // 1-based reads naturally in a spreadsheet
    cells.push(csvCell(q.explanation ?? ''))
    return cells.join(',')
  })
  return [header, ...lines].join('\n')
}

/** Escape one field for Anki's tab-separated "Notes in Plain Text" import. */
function ankiField(value: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\t/g, ' ')
    .replace(/\r?\n/g, '<br>')
}

/** Cards as Anki "Notes in Plain Text" (tab-separated Front/Back); drops in via Anki's
 * File → Import. */
export function cardsToAnkiTsv(cards: ReadonlyArray<CardLike>): string {
  const header = '#separator:tab\n#html:true\n#columns:Front\tBack'
  const lines = cards.map((c) => `${ankiField(c.front)}\t${ankiField(c.back)}`)
  return [header, ...lines].join('\n')
}

// --- Coerce / parse (import) ------------------------------------------------

/** Map CSV rows (with a header) onto cards or questions by their columns. */
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
      answer = Math.max(1, Math.min(options.length, answer)) - 1 // CSV answer is 1-based
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

/**
 * Parse pasted text into cards. Each non-empty line is one card, split on the first tab,
 * semicolon, or comma into `front` then `back`. Lines without a separator are skipped.
 */
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
  /** Separator between a card's front and back — only the FIRST occurrence per card splits,
   * so a comma-separated back keeps its commas. */
  field: string
  /** Separator between cards. `'\n'` treats any newline (CRLF or LF) as a break. */
  card: string
  /** Flip which side is the front — for `answer, prompt` pastes. */
  swap?: boolean
  /** Drop the first non-empty row — for spreadsheet pastes that lead with a header line. */
  skipHeader?: boolean
}

/**
 * Parse pasted text into cards using explicit delimiters (the Paste screen's "Notes" flow).
 * Each card chunk splits once on `field` into front/back; blank chunks and chunks without
 * the separator are skipped. `swap` flips the two sides; `skipHeader` drops the first row.
 */
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

/** The two shapes the Paste screen understands. */
export type PasteFormat = 'bible' | 'notes'

/**
 * Guess whether pasted text is a Bible chapter (verse-reference lines like `(1:1) …`) or
 * plain delimited notes. Bible wins when verse lines are present and dominate; anything
 * else parses as notes. The user can always override the guess.
 */
export function detectPasteFormat(text: string): PasteFormat {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return 'notes'
  const verseLines = lines.filter((l) => /^\(\d+:\d+\)/.test(l)).length
  return verseLines >= 2 && verseLines >= lines.length * 0.4 ? 'bible' : 'notes'
}

/** Guess the front/back separator from the first non-empty line — tab and comma are the
 * common spreadsheet/CSV pastes; pipe and semicolon are the fallbacks. Defaults to tab. */
export function guessFieldSeparator(text: string): string {
  const first = text.split(/\r?\n/).find((l) => l.trim() !== '') ?? ''
  for (const sep of ['\t', ',', ';', '|']) if (first.includes(sep)) return sep
  return '\t'
}

/** Strip HTML (and entities/`<br>`) to plain text — Anki notes store rich-text fields. */
export function stripHtml(input: string): string {
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

/** Parse Anki's "Notes in Plain Text" export (tab/`#separator`-delimited, `#`-directives
 * skipped) into cards — field 0 → front, field 1 → back, HTML stripped. */
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

/** One chapter from a verse paste: a title and its verse cards. */
export interface VerseChapter {
  title: string
  cards: ParsedCard[]
}

/**
 * Parse the eBiblia verse format, grouped by chapter. A header line ("Book Chapter")
 * opens a chapter; each `(chapter:verse) text` line becomes a card with
 * `front = "Book chapter:verse"` and `back = "Book chapter:verse text"`. Wrapped lines
 * append to the previous verse.
 */
export function parseVerseChapters(text: string): VerseChapter[] {
  const verseRe = /^\((\d+):(\d+)\)\s*(.*)$/
  const headerRe = /^(.*\p{L})\s+\d+(?:\s*[-–:]\s*\d+)*\.?$/u
  const chapterTail = /\s+\d+(?:\s*[-–:]\s*\d+)*\.?$/u

  const chapters: VerseChapter[] = []
  let current: VerseChapter | null = null
  let book = ''
  let last: ParsedCard | null = null

  const ensureChapter = (): VerseChapter => {
    if (!current) {
      current = { title: book || 'Verses', cards: [] }
      chapters.push(current)
    }
    return current
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue

    const verse = line.match(verseRe)
    if (verse) {
      const [, ch, vs, bodyText] = verse
      const ref = `${book ? `${book} ` : ''}${ch}:${vs}`.trim()
      const card: ParsedCard = { front: ref, back: bodyText ? `${ref} ${bodyText}`.trim() : ref }
      ensureChapter().cards.push(card)
      last = card
      continue
    }

    if (headerRe.test(line)) {
      book = line.replace(chapterTail, '').trim()
      current = { title: line, cards: [] }
      chapters.push(current)
      last = null
      continue
    }

    if (last) last.back = `${last.back} ${line}`.trim()
  }

  return chapters.filter((c) => c.cards.length > 0)
}

/** Flatten a verse paste into one card per verse (chapter-agnostic). */
export function parseVerses(text: string): ParsedCard[] {
  return parseVerseChapters(text).flatMap((c) => c.cards)
}

/** Parse a `.csv` file's text into deck content, mapping columns onto cards or questions.
 * Throws {@link ContentImportError} when nothing usable is found. */
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

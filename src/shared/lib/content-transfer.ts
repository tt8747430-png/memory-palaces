/**
 * Pure import/export for a deck's study content (cards + questions). Parsers turn text
 * (CSV / JSON / pasted lines / Anki notes / verse paste) into plain content data; the
 * serializers turn content back into CSV / JSON / Anki TSV strings. No DOM, no IO, no
 * entity imports — the `features/content` slice handles file reads, downloads, and
 * mapping this data onto the create commands.
 *
 * Wire compatibility: parsers accept both the current deck-era field names and the legacy
 * palace-era ones (`room`/`loci`/`rooms`), so exports from the old app still import.
 */

import type { SrsState } from './srs'

/**
 * A card's importable content. Text + cues are the common case; the extra fields carry the
 * full-fidelity Mindscape round-trip (flag, known status, schedule) and stay absent for the
 * lighter sources (CSV / Anki / paste). Identity and order are assigned by the create command.
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

const JSON_TYPE = 'mindscape-deck-content'
const JSON_VERSION = 3

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

/** The full card shape the Mindscape JSON export writes — the mirror of what
 * {@link parseMindscapeDeck} restores. Undefined fields are dropped so the file stays lean. */
function toMindscapeCard(c: ParsedCard): ParsedCard {
  return {
    front: c.front,
    back: c.back,
    ...(c.hint ? { hint: c.hint } : {}),
    ...(c.tip ? { tip: c.tip } : {}),
    ...(c.flagged ? { flagged: true } : {}),
    ...(c.memorized ? { memorized: true } : {}),
    ...(c.srs ? { srs: c.srs } : {}),
  }
}

export function deckContentToJson(
  deckName: string,
  cards: ReadonlyArray<ParsedCard>,
  questions: ReadonlyArray<QuestionLike>,
): string {
  return JSON.stringify(
    {
      type: JSON_TYPE,
      version: JSON_VERSION,
      deck: deckName,
      exportedAt: new Date().toISOString(),
      cards: cards.map(toMindscapeCard),
      questions,
    },
    null,
    2,
  )
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

/** Coerce a raw `srs` object into a valid {@link SrsState}, or drop it. A schedule is only
 * meaningful with a `due` date; the rest fall back to a "new"-card default so a partial or
 * lightly-malformed export never yields a broken schedule. */
function coerceSrs(raw: unknown): SrsState | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  if (typeof o.due !== 'string' || !o.due) return undefined
  const num = (value: unknown, fallback: number) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback
  return {
    due: o.due,
    interval: num(o.interval, 0),
    ease: num(o.ease, 2.5),
    reps: num(o.reps, 0),
    lapses: num(o.lapses, 0),
    lastReviewed: typeof o.lastReviewed === 'string' ? o.lastReviewed : o.due,
  }
}

function coerceCards(raw: unknown): ParsedCard[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const o = item as Record<string, unknown>
    const front = String(o.front ?? o.term ?? o.question ?? '').trim()
    const back = String(o.back ?? o.definition ?? o.answer ?? '').trim()
    if (!front || !back) return []
    const hint = o.hint ?? o.cue ?? o.note ?? o.place
    const srs = coerceSrs(o.srs)
    return [
      {
        front,
        back,
        ...(hint ? { hint: String(hint).trim() } : {}),
        ...(o.tip ? { tip: String(o.tip).trim() } : {}),
        ...(o.flagged === true ? { flagged: true } : {}),
        ...(o.memorized === true ? { memorized: true } : {}),
        ...(srs ? { srs } : {}),
      },
    ]
  })
}

function coerceQuestions(raw: unknown): ParsedQuestion[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const o = item as Record<string, unknown>
    const prompt = String(o.prompt ?? o.question ?? '').trim()
    const options = Array.isArray(o.options)
      ? o.options.map((x) => String(x).trim()).filter(Boolean)
      : []
    if (!prompt || options.length < 2) return []
    let correct = Number(o.correctAnswer ?? o.answer ?? 0)
    if (!Number.isFinite(correct)) correct = 0
    correct = Math.max(0, Math.min(options.length - 1, correct))
    const explanation = o.explanation
    return [
      {
        prompt,
        options,
        correctAnswer: correct,
        ...(explanation ? { explanation: String(explanation).trim() } : {}),
      },
    ]
  })
}

/** Cards from any wire shape: current `cards`, legacy `loci`, or ad-hoc `flashcards`. */
function coerceCardsField(root: Record<string, unknown>): ParsedCard[] {
  return coerceCards(root.cards ?? root.loci ?? root.flashcards)
}

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
}

/**
 * Parse pasted text into cards using explicit delimiters (the "Paste notes → Notes" flow).
 * Each card chunk splits once on `field` into front/back; blank chunks and chunks without
 * the separator are skipped.
 */
export function parseDelimitedNotes(text: string, { field, card }: NoteDelimiters): ParsedCard[] {
  const chunks = card === '\n' ? text.split(/\r?\n/) : text.split(card)
  return chunks.flatMap((chunk) => {
    const trimmed = chunk.trim()
    if (!trimmed || !field) return []
    const at = trimmed.indexOf(field)
    if (at < 0) return []
    const front = trimmed.slice(0, at).trim()
    const back = trimmed.slice(at + field.length).trim()
    if (!front || !back) return []
    return [{ front, back }]
  })
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

/** Parse a `.json` or `.csv` file's text into deck content, choosing the format by
 * extension/shape. Throws {@link ContentImportError} when nothing usable is found. */
export function parseDeckContent(text: string, fileName: string): DeckContentData {
  const lower = fileName.toLowerCase()
  const isCsv =
    lower.endsWith('.csv') || (!lower.endsWith('.json') && !text.trimStart().startsWith('{'))
  let content: DeckContentData
  try {
    if (isCsv) {
      content = contentFromCsv(parseCsv(text))
    } else {
      const data = JSON.parse(text) as Record<string, unknown>
      content = {
        cards: coerceCardsField(data),
        questions: coerceQuestions(data.questions),
      }
    }
  } catch {
    throw new ContentImportError("That file isn't a valid Mindscape export (.json or .csv).")
  }
  if (content.cards.length === 0 && content.questions.length === 0) {
    throw new ContentImportError('No cards or questions found in that file.')
  }
  return content
}

/**
 * Parse a Mindscape deck export (`.json`, type `mindscape-deck-content`, or the legacy
 * `mindscape-room-content`) at full fidelity — cards keep their cues, flag, known status,
 * and schedule. JSON only; a `.csv`/`.tsv` file belongs to the Anki import. Throws
 * {@link ContentImportError} on a bad or empty file.
 */
export function parseMindscapeDeck(text: string): DeckContentData {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ContentImportError('That file isn’t a valid Mindscape export (.json).')
  }
  if (!data || typeof data !== 'object') {
    throw new ContentImportError('That file isn’t a Mindscape export.')
  }
  const root = data as Record<string, unknown>
  const content: DeckContentData = {
    cards: coerceCardsField(root),
    questions: coerceQuestions(root.questions),
  }
  if (content.cards.length === 0 && content.questions.length === 0) {
    throw new ContentImportError('No cards found in that Mindscape file.')
  }
  return content
}

// --- Deck-tree transfer ------------------------------------------------------

const TREE_JSON_TYPE = 'mindscape.decks'
/** Legacy type written by the palace-era app; still accepted on import. */
const TREE_JSON_TYPE_LEGACY = 'mindscape.palace'
const TREE_JSON_VERSION = 2

/** One deck's importable content: a name/description plus its cards and questions. */
export interface ImportedDeck {
  title: string
  description?: string
  cards: ParsedCard[]
  questions: ParsedQuestion[]
}

/** The export's top-level identity as it travels in a file — no ids or timestamps. */
export interface DeckTreeMeta {
  name: string
  description?: string
  icon?: string
  color?: string
}

export interface DeckTreeContentData {
  meta: DeckTreeMeta
  decks: ImportedDeck[]
}

/**
 * Serialize a deck and its subdecks' content as a Mindscape decks file. Structural inputs
 * (no entity dependency); the mirror of {@link parseDeckTreeContent}, so export and import
 * can never drift out of one format.
 */
export function deckTreeToJson(
  meta: DeckTreeMeta,
  decks: ReadonlyArray<{
    title: string
    description?: string
    cards: ReadonlyArray<CardLike & { tip?: string }>
    questions: ReadonlyArray<QuestionLike>
  }>,
): string {
  return JSON.stringify(
    {
      type: TREE_JSON_TYPE,
      version: TREE_JSON_VERSION,
      exportedAt: new Date().toISOString(),
      deck: meta,
      decks: decks.map((deck) => ({
        title: deck.title,
        description: deck.description,
        cards: deck.cards.map((c) => ({ front: c.front, back: c.back, hint: c.hint, tip: c.tip })),
        questions: deck.questions.map((q) => ({
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      })),
    },
    null,
    2,
  )
}

/**
 * Parse a Mindscape decks file (or a legacy palace file) into its identity and decks,
 * tolerating missing fields. Throws {@link ContentImportError} with a user-facing message
 * on a bad file.
 */
export function parseDeckTreeContent(text: string, fileName?: string): DeckTreeContentData {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ContentImportError('That file isn’t a valid Mindscape decks file.')
  }
  const type = data && typeof data === 'object' ? (data as Record<string, unknown>).type : undefined
  if (type !== TREE_JSON_TYPE && type !== TREE_JSON_TYPE_LEGACY) {
    throw new ContentImportError('That file isn’t a Mindscape decks export.')
  }
  const root = data as Record<string, unknown>
  const meta = (root.deck ?? root.palace ?? {}) as Record<string, unknown>
  const fallback = fileName ? fileName.replace(/\.[^.]+$/, '').trim() : ''
  const name = (String(meta.name ?? '').trim() || fallback || 'Imported deck').slice(0, 60)
  const decksRaw = Array.isArray(root.decks ?? root.rooms) ? (root.decks ?? root.rooms) : []
  const decks = (decksRaw as unknown[]).flatMap((entry): ImportedDeck[] => {
    if (!entry || typeof entry !== 'object') return []
    const deck = entry as Record<string, unknown>
    const title = String(deck.title ?? '').trim()
    if (!title) return []
    return [
      {
        title,
        description: deck.description ? String(deck.description).trim() : undefined,
        cards: coerceCardsField(deck),
        questions: coerceQuestions(deck.questions),
      },
    ]
  })
  if (decks.length === 0) {
    throw new ContentImportError('No decks found in that file.')
  }
  return {
    meta: {
      name,
      description: meta.description ? String(meta.description).trim() : undefined,
      icon: meta.icon ? String(meta.icon) : undefined,
      color: meta.color ? String(meta.color) : undefined,
    },
    decks,
  }
}

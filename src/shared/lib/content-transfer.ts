/**
 * Pure import/export for a room's study content (cards + questions). Parsers turn text
 * (CSV / JSON / pasted lines / Anki notes / verse paste) into plain content data; the
 * serializers turn content back into CSV / JSON / Anki TSV strings. No DOM, no IO, no
 * entity imports — the `features/content` slice handles file reads, downloads, and
 * mapping this data onto the create commands.
 */

/** A card's importable content (no identity/order/schedule — the create command adds those). */
export interface ParsedLocus {
  front: string
  back: string
  hint?: string
}

/** A question's importable content. */
export interface ParsedQuestion {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface RoomContentData {
  loci: ParsedLocus[]
  questions: ParsedQuestion[]
}

/** Minimal shapes the serializers read — structural, so no entity dependency. */
type LocusLike = { front: string; back: string; hint?: string }
type QuestionLike = { prompt: string; options: string[]; correctAnswer: number; explanation?: string }

const JSON_TYPE = 'mindscape-room-content'
const JSON_VERSION = 2

/** A user-facing import failure; the UI shows `.message` verbatim. */
export class ContentImportError extends Error {}

/** Filesystem-safe slug for a download name. */
export function contentSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'room'
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

export function roomContentToJson(
  roomName: string,
  loci: ReadonlyArray<LocusLike>,
  questions: ReadonlyArray<QuestionLike>,
): string {
  return JSON.stringify(
    {
      type: JSON_TYPE,
      version: JSON_VERSION,
      room: roomName,
      exportedAt: new Date().toISOString(),
      loci,
      questions,
    },
    null,
    2,
  )
}

export function lociToCsv(loci: ReadonlyArray<LocusLike>): string {
  const header = 'front,back,hint'
  const lines = loci.map((c) =>
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
export function lociToAnkiTsv(loci: ReadonlyArray<LocusLike>): string {
  const header = '#separator:tab\n#html:true\n#columns:Front\tBack'
  const lines = loci.map((c) => `${ankiField(c.front)}\t${ankiField(c.back)}`)
  return [header, ...lines].join('\n')
}

// --- Coerce / parse (import) ------------------------------------------------

function coerceLoci(raw: unknown): ParsedLocus[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const o = item as Record<string, unknown>
    const front = String(o.front ?? o.term ?? o.question ?? '').trim()
    const back = String(o.back ?? o.definition ?? o.answer ?? '').trim()
    if (!front || !back) return []
    const hint = o.hint ?? o.cue ?? o.note ?? o.place
    return [{ front, back, ...(hint ? { hint: String(hint).trim() } : {}) }]
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

/** Map CSV rows (with a header) onto cards or questions by their columns. */
function contentFromCsv(rows: string[][]): RoomContentData {
  const header = rows[0]
  if (!header) return { loci: [], questions: [] }
  const cols = header.map((h) => h.trim().toLowerCase())
  const body = rows.slice(1)

  const isQuestions =
    cols.includes('prompt') || cols.some((h) => h.startsWith('option')) || cols.includes('answer')

  if (isQuestions) {
    const promptIdx = cols.findIndex((h) => h === 'prompt' || h === 'question')
    const optionIdxs = cols.map((h, i) => (h.startsWith('option') ? i : -1)).filter((i) => i >= 0)
    const answerIdx = cols.findIndex((h) => h === 'answer' || h === 'correctanswer' || h === 'correct')
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
    return { loci: [], questions }
  }

  const frontIdx = Math.max(
    0,
    cols.findIndex((h) => h === 'front' || h === 'term' || h === 'question'),
  )
  const backIdxRaw = cols.findIndex((h) => h === 'back' || h === 'definition' || h === 'answer')
  const backIdx = backIdxRaw >= 0 ? backIdxRaw : 1
  const hintIdx = cols.findIndex((h) => h === 'hint' || h === 'cue' || h === 'note')
  const loci = body.flatMap((cells) => {
    const front = (cells[frontIdx] ?? '').trim()
    const back = (cells[backIdx] ?? '').trim()
    if (!front || !back) return []
    const hint = hintIdx >= 0 ? (cells[hintIdx] ?? '').trim() : ''
    return [{ front, back, ...(hint ? { hint } : {}) }]
  })
  return { loci, questions: [] }
}

/**
 * Parse pasted text into cards. Each non-empty line is one card, split on the first tab,
 * semicolon, or comma into `front` then `back`. Lines without a separator are skipped.
 */
export function parsePastedLoci(text: string): ParsedLocus[] {
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
export function parseAnkiText(text: string): ParsedLocus[] {
  let separator = '\t'
  const loci: ParsedLocus[] = []
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
    if (front && back) loci.push({ front, back })
  }
  return loci
}

/** One chapter from a verse paste: a title and its verse cards. */
export interface VerseChapter {
  title: string
  loci: ParsedLocus[]
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
  let last: ParsedLocus | null = null

  const ensureChapter = (): VerseChapter => {
    if (!current) {
      current = { title: book || 'Verses', loci: [] }
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
      const locus: ParsedLocus = { front: ref, back: bodyText ? `${ref} ${bodyText}`.trim() : ref }
      ensureChapter().loci.push(locus)
      last = locus
      continue
    }

    if (headerRe.test(line)) {
      book = line.replace(chapterTail, '').trim()
      current = { title: line, loci: [] }
      chapters.push(current)
      last = null
      continue
    }

    if (last) last.back = `${last.back} ${line}`.trim()
  }

  return chapters.filter((c) => c.loci.length > 0)
}

/** Flatten a verse paste into one card per verse (chapter-agnostic). */
export function parseVerses(text: string): ParsedLocus[] {
  return parseVerseChapters(text).flatMap((c) => c.loci)
}

/** Parse a `.json` or `.csv` file's text into room content, choosing the format by
 * extension/shape. Throws {@link ContentImportError} when nothing usable is found. */
export function parseRoomContent(text: string, fileName: string): RoomContentData {
  const lower = fileName.toLowerCase()
  const isCsv =
    lower.endsWith('.csv') || (!lower.endsWith('.json') && !text.trimStart().startsWith('{'))
  let content: RoomContentData
  try {
    if (isCsv) {
      content = contentFromCsv(parseCsv(text))
    } else {
      const data = JSON.parse(text) as Record<string, unknown>
      content = {
        loci: coerceLoci(data.loci ?? data.flashcards),
        questions: coerceQuestions(data.questions),
      }
    }
  } catch {
    throw new ContentImportError("That file isn't a valid Mindscape export (.json or .csv).")
  }
  if (content.loci.length === 0 && content.questions.length === 0) {
    throw new ContentImportError('No cards or questions found in that file.')
  }
  return content
}

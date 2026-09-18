export interface VerseRef {
  book: string
  chapter: number
  from: number
  to: number
}

const REF = /^(.+?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$/

export function formatRef({ book, chapter, from, to }: VerseRef): string {
  return to > from ? `${book} ${chapter}:${from}-${to}` : `${book} ${chapter}:${from}`
}

export function parseRef(text: string): VerseRef | null {
  const match = REF.exec(text.trim())
  if (!match) return null
  const [, book = '', chapter = '', from = '', to] = match
  return {
    book: book.trim(),
    chapter: Number(chapter),
    from: Number(from),
    to: Number(to ?? from),
  }
}

/**
 * A reference part-way through being picked. The four fields travel together everywhere — the
 * picker holds them, the breadcrumb reads them — so they are one type rather than four parameters.
 */
export interface PartialVerseRef {
  book: string | null
  chapter: number | null
  from: number | null
  to: number | null
}

/** The breadcrumb. `formatRef` cannot do this — it needs a complete reference. */
export function formatPartial(parts: PartialVerseRef): string {
  const { book, chapter, from, to } = parts
  if (!book) return ''
  if (!chapter) return book
  if (!from) return `${book} ${chapter}:`
  return formatRef({ book, chapter, from, to: to ?? from })
}

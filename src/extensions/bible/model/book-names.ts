import { BOOKS, type BookCode } from './canon'
import { CORNILESCU_2024 } from './translations'

/**
 * The names the app shows are the default translation's — references, deck names and picker
 * tiles are Romanian because the text is, whatever language the interface speaks.
 */
const TITLES = CORNILESCU_2024.books

export function bookName(code: BookCode): string {
  return TITLES[code].name
}

export function bookAbbreviation(code: BookCode): string {
  return TITLES[code].abbreviation
}

/**
 * Case, diacritics, spaces and dots do not tell two books apart: `1 Împărați.`, `1imparati` and
 * `1 Imparati` are one book. Covers both Romanian comma-below (`Ț`) and the older cedilla (`Ţ`).
 */
export function normalizeBookText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[\s.]/g, '')
}

/** Every alias of a book, normalized: the translation's name and abbreviation, and the English. */
const ALIASES: readonly (readonly [BookCode, readonly string[]])[] = BOOKS.map((book) => [
  book.code,
  [...new Set([bookName(book.code), bookAbbreviation(book.code), book.english])].map(
    normalizeBookText,
  ),
])

const BY_ALIAS: ReadonlyMap<string, BookCode> = new Map(
  ALIASES.flatMap(([code, aliases]) => aliases.map((alias) => [alias, code] as const)),
)

/** The book a name exactly names — no guessing, so a card front that is not a reference stays one. */
export function resolveBook(text: string): BookCode | undefined {
  const key = normalizeBookText(text)
  return key ? BY_ALIAS.get(key) : undefined
}

const DEFAULT_MATCHES = 6

/**
 * The books a typed prefix could mean, in canon order — with a book the prefix names exactly
 * moved to the front, so `ioan` offers John before anything that merely starts with it.
 */
export function matchBooks(prefix: string, limit = DEFAULT_MATCHES): BookCode[] {
  const key = normalizeBookText(prefix)
  if (!key) return []
  const exact = BY_ALIAS.get(key)
  const matches = ALIASES.filter(([, aliases]) => aliases.some((alias) => alias.startsWith(key)))
    .map(([code]) => code)
    .filter((code) => code !== exact)
  return (exact ? [exact, ...matches] : matches).slice(0, limit)
}

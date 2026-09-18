import type { Genre } from '../../model/canon'

/**
 * Each shelf of the canon takes one of the app's swatches, so the book grid reads as groups before
 * it reads as names. `.sw-tint` mixes the tile and its ink from `--sw` for either theme.
 */
export const GENRE_SWATCH: Record<Genre, string> = {
  law: 'var(--sw-rose)',
  history: 'var(--sw-amber)',
  wisdom: 'var(--sw-emerald)',
  majorProphets: 'var(--sw-indigo)',
  minorProphets: 'var(--sw-teal)',
  gospels: 'var(--sw-red)',
  acts: 'var(--sw-plum)',
  pauline: 'var(--sw-blue)',
  general: 'var(--sw-violet)',
  apocalyptic: 'var(--sw-gold)',
}

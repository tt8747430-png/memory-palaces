import { DEFAULT_TRANSLATION } from './verse'

/**
 * A translation's name, by its id. Proper nouns, not UI copy — "World English Bible" is the same
 * string in every locale — so they live here rather than in the extension's messages.
 */
const NAMES: Readonly<Record<string, string>> = {
  [DEFAULT_TRANSLATION]: 'World English Bible',
}

/** An unknown id is shown as it is, upper-cased, the way translations are normally abbreviated. */
export function translationName(id: string): string {
  return NAMES[id] ?? id.toUpperCase()
}

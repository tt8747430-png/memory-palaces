/** What an import link may carry: the deck the learner was already in. */
export interface BibleImportSearch extends Record<string, unknown> {
  deckId?: string
}

export function validateBibleImportSearch(search: Record<string, unknown>): BibleImportSearch {
  return typeof search.deckId === 'string' && search.deckId ? { deckId: search.deckId } : {}
}

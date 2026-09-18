export interface ExtensionsSearch {
  highlight?: string
}

/**
 * Exported beside the page so the route and the reader cannot drift — see
 * `app/routes/search.ts` for why this codebase validates rather than casts.
 */
export function validateExtensionsSearch(search: Record<string, unknown>): ExtensionsSearch {
  return typeof search.highlight === 'string' && search.highlight
    ? { highlight: search.highlight }
    : {}
}

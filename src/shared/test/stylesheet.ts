import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A stylesheet's source, for the tests that hold code and CSS to the same tokens.
 *
 * Read from disk rather than imported: Vitest stubs CSS modules, so `?raw` on a `.css` file comes
 * back empty. Resolved against this file, not the working directory, so the test passes wherever
 * the runner was started from.
 */
export function readStylesheet(name: 'tokens.css' | 'theme.css'): string {
  return readFileSync(join(import.meta.dirname, '../../styles', name), 'utf8')
}

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function readStylesheet(name: 'tokens.css' | 'theme.css'): string {
  return readFileSync(join(import.meta.dirname, '../../styles', name), 'utf8')
}

import { Pipe } from '@angular/core'
import type { PipeTransform } from '@angular/core'

const rules = new Intl.PluralRules('en')

/**
 * Resolves an i18next-style plural key from a count, for chaining into Transloco:
 * `'deck.dueToday' | msPluralKey: 2 | transloco: { count: 2 }` → `deck.dueToday_other`.
 */
@Pipe({ name: 'msPluralKey' })
export class PluralKeyPipe implements PipeTransform {
  transform(key: string, count: number): string {
    return `${key}_${rules.select(count)}`
  }
}

import { Observable } from '@/shared/data/observable'
import type { ParsedCard } from '@/shared/domain'
import {
  draftCardsFrom,
  editDraftCard,
  type DraftCardEdit,
  type ImportDraft,
  type ImportSource,
  removeDraftCard,
} from '@/import/model/import-draft'

/**
 * The in-flight import review, held between parsing a file/paste and applying it
 * to a deck. Unlike every other store there is no `Repository<T>` behind it and no
 * `start()`: a draft is deliberately ephemeral — abandoning the review must lose
 * it, so persisting it would be a bug, not a feature.
 */
export class ImportDraftStore {
  private readonly _draft = new Observable<ImportDraft | null>(null)
  readonly draft = this._draft.asReadonly()

  setDraft(source: ImportSource, cards: readonly ParsedCard[]): void {
    this._draft.set({ source, cards: draftCardsFrom(cards, () => crypto.randomUUID()) })
  }

  editCard(id: string, changes: DraftCardEdit): void {
    const draft = this._draft.get()
    if (draft) this._draft.set(editDraftCard(draft, id, changes))
  }

  removeCard(id: string): void {
    const draft = this._draft.get()
    if (draft) this._draft.set(removeDraftCard(draft, id))
  }

  clear(): void {
    this._draft.set(null)
  }
}

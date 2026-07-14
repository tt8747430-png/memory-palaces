import { Inject, Injectable, InjectionToken } from '@angular/core'
import { CollectionStore } from '@app/shared/data/collection-store'
import type { Repository } from '@app/shared/data'
import type { Deck } from '../model/deck'
import type { Card } from '../model/card'
import type { Question } from '../model/question'
import type { Folder } from '../model/folder'

export const DECK_REPOSITORY = new InjectionToken<Repository<Deck>>('DECK_REPOSITORY')
export const CARD_REPOSITORY = new InjectionToken<Repository<Card>>('CARD_REPOSITORY')
export const QUESTION_REPOSITORY = new InjectionToken<Repository<Question>>('QUESTION_REPOSITORY')
export const FOLDER_REPOSITORY = new InjectionToken<Repository<Folder>>('FOLDER_REPOSITORY')

const byOrder = (a: { order: number }, b: { order: number }): number => a.order - b.order

@Injectable({ providedIn: 'root' })
export class DeckStore extends CollectionStore<Deck> {
  protected override readonly compare = (a: Deck, b: Deck): number =>
    b.createdAt.localeCompare(a.createdAt)
  readonly decks = this.entities

  // eslint-disable-next-line @angular-eslint/prefer-inject -- constructor param keeps the store directly constructible in unit tests (new XStore(repo))
  constructor(@Inject(DECK_REPOSITORY) repo: Repository<Deck>) {
    super(repo)
  }
}

@Injectable({ providedIn: 'root' })
export class CardStore extends CollectionStore<Card> {
  protected override readonly compare = byOrder
  readonly cards = this.entities

  // eslint-disable-next-line @angular-eslint/prefer-inject -- constructor param keeps the store directly constructible in unit tests (new XStore(repo))
  constructor(@Inject(CARD_REPOSITORY) repo: Repository<Card>) {
    super(repo)
  }
}

@Injectable({ providedIn: 'root' })
export class QuestionStore extends CollectionStore<Question> {
  protected override readonly compare = byOrder
  readonly questions = this.entities

  // eslint-disable-next-line @angular-eslint/prefer-inject -- constructor param keeps the store directly constructible in unit tests (new XStore(repo))
  constructor(@Inject(QUESTION_REPOSITORY) repo: Repository<Question>) {
    super(repo)
  }
}

@Injectable({ providedIn: 'root' })
export class FolderStore extends CollectionStore<Folder> {
  protected override readonly compare = (a: Folder, b: Folder): number =>
    a.createdAt.localeCompare(b.createdAt)
  readonly folders = this.entities

  // eslint-disable-next-line @angular-eslint/prefer-inject -- constructor param keeps the store directly constructible in unit tests (new XStore(repo))
  constructor(@Inject(FOLDER_REPOSITORY) repo: Repository<Folder>) {
    super(repo)
  }
}

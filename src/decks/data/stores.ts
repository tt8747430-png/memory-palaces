import { CollectionStore } from '@/shared/data/collection-store'
import type { Repository } from '@/shared/data'
import type { Deck } from '../model/deck'
import type { Card } from '../model/card'
import type { Question } from '../model/question'
import type { Folder } from '../model/folder'

const byOrder = (a: { order: number }, b: { order: number }): number => a.order - b.order

export class DeckStore extends CollectionStore<Deck> {
  protected override readonly compare = (a: Deck, b: Deck): number =>
    b.createdAt.localeCompare(a.createdAt)
  readonly decks = this.entities

  constructor(repo: Repository<Deck>) {
    super(repo)
  }
}

export class CardStore extends CollectionStore<Card> {
  protected override readonly compare = byOrder
  readonly cards = this.entities

  constructor(repo: Repository<Card>) {
    super(repo)
  }
}

export class QuestionStore extends CollectionStore<Question> {
  protected override readonly compare = byOrder
  readonly questions = this.entities

  constructor(repo: Repository<Question>) {
    super(repo)
  }
}

export class FolderStore extends CollectionStore<Folder> {
  protected override readonly compare = (a: Folder, b: Folder): number =>
    a.createdAt.localeCompare(b.createdAt)
  readonly folders = this.entities

  constructor(repo: Repository<Folder>) {
    super(repo)
  }
}

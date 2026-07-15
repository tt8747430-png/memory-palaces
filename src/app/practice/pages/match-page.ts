import { Component, computed, inject, input } from '@angular/core'
import { Location } from '@angular/common'
import { TranslocoPipe } from '@jsverse/transloco'
import { cardsInSubtree, deckPath } from '@app/shared/domain'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { CardStore, DeckStore } from '@app/decks/data/stores'
import { SessionReward } from '@app/study/ui/session-reward'
import type { MatchCard } from '../commands/match-index'
import { MatchBoard } from '../ui/match-board'

/** The match game over a deck's subtree; finishing routes through the session reward. */
@Component({
  selector: 'ms-match-page',
  imports: [MatchBoard, ScreenHeader, TranslocoPipe],
  template: `
    @if (!ready()) {
      <div class="grid h-full place-items-center">
        <span class="size-8 animate-pulse rounded-full bg-secondary" aria-hidden="true"></span>
      </div>
    } @else if (!deck()) {
      <ms-screen-header
        [title]="'match.notFound' | transloco"
        [backLabel]="'match.back' | transloco"
        (back)="goBack()"
      />
    } @else {
      <ms-match-board
        [cards]="matchCards()"
        [subtitle]="subtitle()"
        (back)="goBack()"
        (completed)="complete()"
      />
    }
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class MatchPage {
  readonly deckId = input.required<string>()

  private readonly location = inject(Location)
  private readonly reward = inject(SessionReward)
  private readonly cardStore = inject(CardStore)
  private readonly deckStore = inject(DeckStore)

  constructor() {
    this.cardStore.start()
    this.deckStore.start()
  }

  protected readonly ready = computed(() => this.cardStore.status() === 'ready')

  protected readonly deck = computed(
    () => this.deckStore.decks().find((d) => d.id === this.deckId()) ?? null,
  )

  protected readonly matchCards = computed<MatchCard[]>(() =>
    cardsInSubtree(this.deckStore.decks(), this.cardStore.cards(), this.deckId()).map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
    })),
  )

  protected readonly subtitle = computed(() =>
    deckPath(this.deckStore.decks(), this.deckId())
      .map((each) => each.name)
      .join(' · '),
  )

  protected complete(): void {
    void this.reward.complete({ kind: 'match', pairs: this.matchCards().length })
    this.goBack()
  }

  protected goBack(): void {
    this.location.back()
  }
}

import { Component, computed, inject, input, signal } from '@angular/core'
import { Router } from '@angular/router'
import { Location } from '@angular/common'
import { MatIconButton } from '@angular/material/button'
import { LucideAngularModule, Settings } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import { cardsInSubtree, studyOverview } from '@app/shared/domain'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { CardStore, DeckStore, QuestionStore } from '../data/stores'
import { PreferencesStore } from '@app/settings/data/preferences-store'
import { questionsForDeck } from '../model/question'
import { DeckContentEditor } from '../ui/deck-content-editor'
import { PracticeModes } from '../ui/practice-modes'
import { StudyOverviewCard } from '../ui/study-overview-card'

/** One deck: today's study standing, practice entry points, and the card list. */
@Component({
  selector: 'ms-deck-detail-page',
  imports: [
    ScreenHeader,
    StudyOverviewCard,
    PracticeModes,
    DeckContentEditor,
    MatIconButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  template: `
    @if (!ready()) {
      <div class="grid flex-1 place-items-center">
        <span class="size-8 animate-pulse rounded-full bg-secondary" aria-hidden="true"></span>
      </div>
    } @else if (!deck()) {
      <ms-screen-header
        [title]="'deck.notFound' | transloco"
        [backLabel]="'common.back' | transloco"
        (back)="back()"
      />
    } @else {
      <ms-screen-header
        [title]="deck()!.name"
        [backLabel]="'common.back' | transloco"
        (back)="back()"
      >
        <button
          matIconButton
          type="button"
          class="bg-card-glass shadow-rest"
          [attr.aria-label]="'deck.settings' | transloco"
          (click)="go(path.deckSettings)"
        >
          <lucide-icon [img]="settingsIcon" class="size-5" aria-hidden="true" />
        </button>
      </ms-screen-header>

      <main class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe overscroll-contain scrollbar-hide">
        <div class="mt-2 space-y-4 pb-24">
          @if (subtreeCards().length > 0) {
            <ms-study-overview-card
              [count]="overview().count"
              [breakdown]="overview().breakdown"
              (study)="go(path.deckStudy)"
              (studyAhead)="go(path.deckStudy)"
            />
          }

          @if (subtreeCards().length > 0 || questions().length > 0) {
            <ms-practice-modes
              [cardCount]="subtreeCards().length"
              [questionCount]="questions().length"
              (match)="go(path.deckMatch)"
              (test)="go(path.deckQuestions)"
            />
          }

          <section [attr.aria-label]="'deck.cards' | transloco" class="space-y-3 pt-1">
            <ms-deck-content-editor
              [deckId]="deckId()"
              (addCard)="go(path.deckCardNew)"
              (editCard)="editCard($event)"
            />
          </section>
        </div>
      </main>
    }
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class DeckDetailPage {
  readonly deckId = input.required<string>()

  private readonly router = inject(Router)
  private readonly location = inject(Location)
  private readonly deckStore = inject(DeckStore)
  private readonly cardStore = inject(CardStore)
  private readonly questionStore = inject(QuestionStore)
  private readonly preferencesStore = inject(PreferencesStore)

  protected readonly settingsIcon = Settings
  protected readonly path = ROUTES

  private readonly now = signal(Date.now())

  constructor() {
    this.deckStore.start()
    this.cardStore.start()
    this.questionStore.start()
    this.preferencesStore.start()
  }

  protected readonly ready = computed(
    () => this.deckStore.status() === 'ready' && this.cardStore.status() === 'ready',
  )

  protected readonly deck = computed(
    () => this.deckStore.decks().find((d) => d.id === this.deckId()) ?? null,
  )

  protected readonly subtreeCards = computed(() =>
    cardsInSubtree(this.deckStore.decks(), this.cardStore.cards(), this.deckId()),
  )

  protected readonly questions = computed(() =>
    questionsForDeck(this.questionStore.questions(), this.deckId()),
  )

  protected readonly overview = computed(() => studyOverview(this.subtreeCards(), this.now()))

  protected back(): void {
    this.location.back()
  }

  protected go(pattern: string): void {
    void this.router.navigateByUrl(pattern.replace(':deckId', this.deckId()))
  }

  protected editCard(cardId: string): void {
    void this.router.navigateByUrl(
      ROUTES.deckCardEdit.replace(':deckId', this.deckId()).replace(':cardId', cardId),
    )
  }
}

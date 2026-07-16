import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core'
import { Location } from '@angular/common'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { resolveDeckSettings, shuffle, subtreeDeckIds } from '@app/shared/domain'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { DeckStore, QuestionStore, editDeck, DEFAULT_DECK_SETTINGS } from '@app/decks'
import { SessionReward } from '@app/study/ui/session-reward'
import type { QuizQuestion } from '../commands/quiz-index'
import { QuizSession } from '../ui/quiz-session'
import type { QuizResult } from '../ui/quiz-session'
import { QuizOptionsSheet } from '../ui/quiz-options-sheet'
import type { QuizOptionsSheetData } from '../ui/quiz-options-sheet'

/**
 * A quiz run over a deck's subtree. The question set freezes when the stores are
 * first ready, so shuffle and edits don't reshuffle a quiz mid-run; completing
 * routes the outcome through the session reward.
 */
@Component({
  selector: 'ms-quiz-page',
  imports: [QuizSession, ScreenHeader, TranslocoPipe],
  template: `
    @if (!ready()) {
      <div class="grid h-full place-items-center">
        <span class="size-8 animate-pulse rounded-full bg-secondary" aria-hidden="true"></span>
      </div>
    } @else if (!deck()) {
      <ms-screen-header
        [title]="'quiz.notFound' | transloco"
        [backLabel]="'quiz.back' | transloco"
        (back)="goBack()"
      />
    } @else {
      <ms-quiz-session
        [questions]="runQuestions()"
        [title]="titleText()"
        [autoAdvance]="settings().quizTimer"
        (openOptions)="openOptions()"
        (back)="goBack()"
        (completed)="complete($event)"
      />
    }
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class QuizPage {
  readonly deckId = input.required<string>()

  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly sheets = inject(MatBottomSheet)
  private readonly reward = inject(SessionReward)
  private readonly deckStore = inject(DeckStore)
  private readonly questionStore = inject(QuestionStore)

  constructor() {
    // Freeze the question order at first readiness — a mid-run store emission
    // (or the shuffle setting) must not rebuild the running quiz.
    effect(() => {
      if (!this.ready() || untracked(() => this.frozen()) !== null) return
      const questions = this.builtQuestions()
      untracked(() => this.frozen.set(questions))
    })
  }

  private readonly frozen = signal<QuizQuestion[] | null>(null)

  protected readonly ready = computed(
    () => this.deckStore.status() === 'ready' && this.questionStore.status() === 'ready',
  )

  protected readonly deck = computed(
    () => this.deckStore.decks().find((d) => d.id === this.deckId()) ?? null,
  )

  protected readonly settings = computed(() =>
    resolveDeckSettings(this.deckStore.decks(), this.deckId(), DEFAULT_DECK_SETTINGS),
  )

  private readonly builtQuestions = computed<QuizQuestion[]>(() => {
    const decks = this.deckStore.decks()
    const nameById = new Map(decks.map((each) => [each.id, each.name]))
    const subtree = new Set(subtreeDeckIds(decks, this.deckId()))
    const built = this.questionStore.questions().flatMap((question) =>
      subtree.has(question.deckId)
        ? [
            {
              id: question.id,
              prompt: question.prompt,
              options: question.options,
              correctAnswer: question.correctAnswer,
              deckName: nameById.get(question.deckId) ?? '',
              explanation: question.explanation,
            },
          ]
        : [],
    )
    return this.settings().shuffleQuestions ? shuffle(built) : built
  })

  protected readonly runQuestions = computed(() => this.frozen() ?? this.builtQuestions())

  protected readonly titleText = computed(() =>
    this.transloco.translate('quiz.title', { deck: this.deck()?.name ?? '' }),
  )

  protected openOptions(): void {
    const data: QuizOptionsSheetData = {
      quizTimer: this.settings().quizTimer,
      shuffleQuestions: this.settings().shuffleQuestions,
      onQuizTimer: (value) => this.setSetting({ quizTimer: value }),
      onShuffleQuestions: (value) => this.setSetting({ shuffleQuestions: value }),
    }
    this.sheets.open(QuizOptionsSheet, { data, panelClass: 'ms-sheet-panel' })
  }

  private setSetting(changes: Partial<{ quizTimer: boolean; shuffleQuestions: boolean }>): void {
    const deck = this.deck()
    if (deck) void editDeck(this.deckStore, deck.id, { settings: { ...deck.settings, ...changes } })
  }

  protected complete(result: QuizResult): void {
    void this.reward.complete({
      kind: 'quiz',
      correct: result.score,
      total: result.total,
      accuracy: result.accuracy,
    })
    this.goBack()
  }

  protected goBack(): void {
    this.location.back()
  }
}

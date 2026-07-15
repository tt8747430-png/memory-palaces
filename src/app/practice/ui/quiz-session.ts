import { Component, computed, effect, input, output, signal, untracked } from '@angular/core'
import type { OnDestroy } from '@angular/core'
import { MatButton, MatIconButton } from '@angular/material/button'
import {
  Brain,
  Check,
  CheckCircle2,
  Flame,
  LucideAngularModule,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
  X,
  XCircle,
  Zap,
} from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { initQuiz, quizAccuracy, quizReducer } from '../commands/quiz-index'
import type { QuizAction, QuizQuestion, QuizState } from '../commands/quiz-index'

export interface QuizResult {
  score: number
  total: number
  accuracy: number
}

type OptionDisplay = 'idle' | 'selected' | 'correct' | 'wrong'

const OPTION_TONE: Record<OptionDisplay, string> = {
  idle: 'border-border bg-card text-heading',
  selected: 'border-secondary bg-info-surface text-heading',
  correct: 'border-[var(--success)] bg-[var(--success-surface)] text-[var(--success-on-surface)]',
  wrong: 'border-[var(--danger)] bg-[var(--danger-surface)] text-[var(--danger-on-surface)]',
}

const FEEDBACK_MS = 2200

/**
 * One quiz run over the pure quiz machine: progress bar, one question card at a
 * time with lettered options, answer feedback (streak flame, explanation),
 * optional auto-advance, and the completion overlay with retry.
 */
@Component({
  selector: 'ms-quiz-session',
  imports: [MatButton, MatIconButton, LucideAngularModule, TranslocoPipe],
  template: `
    @if (questions().length === 0) {
      <div class="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
        <div class="grid size-16 place-items-center rounded-card-featured bg-info-surface">
          <lucide-icon [img]="icons.brain" class="size-8 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 class="mb-1 text-[length:var(--ms-text-headline)] font-bold text-heading">
            {{ 'quiz.empty' | transloco }}
          </h2>
          <p class="mx-auto max-w-[34ch] text-[length:var(--ms-text-body)]">
            {{ 'quiz.emptyHint' | transloco }}
          </p>
        </div>
        <button matButton="filled" type="button" (click)="back.emit()">
          {{ 'quiz.back' | transloco }}
        </button>
      </div>
    } @else {
      <div class="relative flex h-full flex-col overflow-hidden">
        <div class="px-5 pt-safe">
          <div class="flex items-center justify-between gap-2 pt-3">
            <button
              matIconButton
              type="button"
              class="bg-card-glass shadow-rest"
              [attr.aria-label]="'quiz.goBack' | transloco"
              (click)="back.emit()"
            >
              <lucide-icon [img]="icons.x" class="size-5" aria-hidden="true" />
            </button>
            <h1
              class="min-w-0 flex-1 truncate text-center text-[length:var(--ms-text-title)] font-semibold text-heading"
            >
              {{ title() }}
            </h1>
            <div class="flex items-center gap-2">
              <button
                matIconButton
                type="button"
                class="bg-card-glass shadow-rest"
                [attr.aria-label]="'quiz.options.title' | transloco"
                (click)="openOptions.emit()"
              >
                <lucide-icon [img]="icons.options" class="size-5" aria-hidden="true" />
              </button>
              <button
                matIconButton
                type="button"
                class="bg-card-glass shadow-rest"
                [attr.aria-label]="'quiz.skip' | transloco"
                [disabled]="current() === null"
                (click)="dispatch({ type: 'skip' })"
              >
                <lucide-icon [img]="icons.skip" class="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-3">
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-secondary/30" aria-hidden="true">
              <div
                class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300"
                [style.width.%]="progressPercent()"
              ></div>
            </div>
            <span
              class="shrink-0 text-[length:var(--ms-text-label)] font-semibold text-heading tabular-nums"
            >
              {{ 'quiz.questionCount' | transloco: { current: displayIndex(), total: total() } }}
            </span>
          </div>
        </div>

        @if (current(); as question) {
          <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5 scrollbar-hide">
            <div class="ms-question-card rounded-card bg-card p-6 shadow-card">
              <div class="mb-5 flex items-start gap-3">
                <div
                  class="grid size-10 shrink-0 place-items-center rounded-control bg-info-surface"
                >
                  <lucide-icon [img]="icons.brain" class="size-5 text-heading" aria-hidden="true" />
                </div>
                <div class="min-w-0 flex-1">
                  <span
                    class="mb-2 inline-flex rounded-pill bg-info-surface px-2 py-0.5 text-[length:var(--ms-text-tiny)] font-semibold text-info-foreground"
                  >
                    {{ question.deckName }}
                  </span>
                  <h2
                    class="text-[length:var(--ms-text-sub)] leading-relaxed font-medium text-heading"
                  >
                    {{ question.prompt }}
                  </h2>
                </div>
              </div>

              <div class="space-y-3">
                @for (option of question.options; track $index) {
                  <button
                    type="button"
                    (click)="dispatch({ type: 'select', option: $index })"
                    [disabled]="answered()"
                    class="flex w-full items-center justify-between rounded-control border-2 p-4 text-left transition-transform active:scale-[0.99]"
                    [class]="optionTone($index, question)"
                  >
                    <span class="flex items-center gap-3">
                      <span
                        class="grid size-8 shrink-0 place-items-center rounded-control bg-card text-[length:var(--ms-text-label)] font-semibold text-muted-foreground"
                      >
                        {{ letter($index) }}
                      </span>
                      <span class="font-medium">{{ option }}</span>
                    </span>
                    @if (optionDisplay($index, question) === 'correct') {
                      <lucide-icon [img]="icons.correct" class="size-5" aria-hidden="true" />
                    } @else if (optionDisplay($index, question) === 'wrong') {
                      <lucide-icon [img]="icons.wrong" class="size-5" aria-hidden="true" />
                    }
                  </button>
                }
              </div>
            </div>

            @if (answered()) {
              <div
                class="ms-feedback rounded-card border p-4"
                [class]="
                  answeredCorrectly(question)
                    ? 'border-[var(--success)]/30 bg-[var(--success-surface)]'
                    : 'border-[var(--danger)]/30 bg-[var(--danger-surface)]'
                "
              >
                <div class="flex items-start gap-2.5">
                  <lucide-icon
                    [img]="answeredCorrectly(question) ? icons.correct : icons.wrong"
                    class="mt-0.5 size-5 shrink-0"
                    [class]="
                      answeredCorrectly(question)
                        ? 'text-[var(--success-on-surface)]'
                        : 'text-[var(--danger-on-surface)]'
                    "
                    aria-hidden="true"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p
                        class="font-semibold"
                        [class]="
                          answeredCorrectly(question)
                            ? 'text-[var(--success-on-surface)]'
                            : 'text-[var(--danger-on-surface)]'
                        "
                      >
                        {{
                          (answeredCorrectly(question) ? 'quiz.correct' : 'quiz.notQuite')
                            | transloco
                        }}
                      </p>
                      @if (answeredCorrectly(question) && streak() >= 2) {
                        <span
                          class="inline-flex items-center gap-1 rounded-full bg-[var(--warning-surface)] px-2 py-0.5 text-[length:var(--ms-text-label)] font-semibold text-[var(--warning-foreground)]"
                        >
                          <lucide-icon [img]="icons.flame" class="size-3" aria-hidden="true" />
                          {{ 'quiz.streakOther' | transloco: { count: streak() } }}
                        </span>
                      }
                    </div>
                    <p
                      class="mt-1 text-[length:var(--ms-text-label)]"
                      [class]="
                        answeredCorrectly(question)
                          ? 'text-[var(--success-on-surface)]'
                          : 'text-[var(--danger-on-surface)]'
                      "
                    >
                      {{
                        question.explanation ??
                          ((answeredCorrectly(question) ? 'quiz.wellRecalled' : 'quiz.reviewHint')
                            | transloco)
                      }}
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="px-5 pt-2 pb-7">
            @if (answered()) {
              <button
                matButton="filled"
                type="button"
                class="w-full"
                (click)="dispatch({ type: 'next' })"
              >
                <lucide-icon [img]="icons.check" class="size-5" aria-hidden="true" />
                {{ (isLast() ? 'quiz.seeResults' : 'quiz.continue') | transloco }}
              </button>
            } @else {
              <button
                matButton="filled"
                type="button"
                class="w-full"
                [disabled]="selected() === null"
                (click)="submit(question)"
              >
                {{ (selected() === null ? 'quiz.selectAnswer' : 'quiz.submit') | transloco }}
              </button>
            }
          </div>
        } @else {
          <div class="flex-1"></div>
        }

        @if (done()) {
          <div
            class="ms-complete absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-card-glass px-6 text-center"
          >
            <div
              class="mb-3 grid size-24 place-items-center rounded-full"
              [class]="result().accuracy >= 80 ? 'bg-[var(--success-surface)]' : 'bg-info-surface'"
            >
              <lucide-icon
                [img]="icons.zap"
                class="size-12"
                [class]="
                  result().accuracy >= 80 ? 'text-[var(--success-on-surface)]' : 'text-accent'
                "
                aria-hidden="true"
              />
            </div>
            <h2 class="text-[length:var(--ms-text-headline)] font-bold text-heading">
              {{ 'quiz.complete' | transloco }}
            </h2>
            <p class="text-[length:var(--ms-text-sub)] font-semibold text-heading">
              {{ 'quiz.scoreLine' | transloco: { score: result().score, total: result().total } }}
            </p>
            <p class="text-[length:var(--ms-text-body)] text-muted-foreground">
              {{ 'quiz.accuracy' | transloco: { accuracy: result().accuracy } }}
            </p>
            <div class="mt-4 flex gap-3">
              <button matButton="tonal" type="button" (click)="dispatch({ type: 'restart' })">
                <lucide-icon [img]="icons.retry" class="size-5" aria-hidden="true" />
                {{ 'quiz.retry' | transloco }}
              </button>
              <button matButton="filled" type="button" (click)="finish()">
                {{ 'quiz.done' | transloco }}
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  host: { class: 'relative mx-auto block h-full w-full max-w-[430px]' },
  styles: `
    @keyframes ms-rise-in {
      from {
        opacity: 0;
        translate: 0 16px;
      }
    }

    @keyframes ms-fade-in {
      from {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      .ms-question-card,
      .ms-feedback {
        animation: ms-rise-in 0.25s ease-out;
      }

      .ms-complete {
        animation: ms-fade-in 0.25s ease-out;
      }
    }
  `,
})
export class QuizSession implements OnDestroy {
  readonly questions = input.required<QuizQuestion[]>()
  readonly title = input.required<string>()
  readonly autoAdvance = input(true)
  readonly back = output<void>()
  readonly completed = output<QuizResult>()
  readonly openOptions = output<void>()

  protected readonly icons = {
    brain: Brain,
    check: Check,
    correct: CheckCircle2,
    wrong: XCircle,
    flame: Flame,
    retry: RotateCcw,
    skip: SkipForward,
    options: SlidersHorizontal,
    x: X,
    zap: Zap,
  }

  protected readonly state = signal<QuizState>(initQuiz(0))
  private advanceTimer: number | undefined
  private completeTimer: number | undefined

  constructor() {
    // A new question set restarts the machine at its size.
    effect(() => {
      const total = this.questions().length
      untracked(() => this.state.set(initQuiz(total)))
    })

    // Auto-advance: the feedback beat, then on to the next question.
    effect(() => {
      const state = this.state()
      window.clearTimeout(this.advanceTimer)
      if (state.status === 'answering' && state.answered && this.autoAdvance()) {
        this.advanceTimer = window.setTimeout(() => this.dispatch({ type: 'next' }), FEEDBACK_MS)
      }
    })

    // Completion lingers on the overlay, then hands the result up.
    effect(() => {
      const state = this.state()
      window.clearTimeout(this.completeTimer)
      if (state.status === 'complete') {
        this.completeTimer = window.setTimeout(() => this.finish(), FEEDBACK_MS)
      }
    })
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.advanceTimer)
    window.clearTimeout(this.completeTimer)
  }

  protected dispatch(action: QuizAction): void {
    this.state.update((state) => quizReducer(state, action))
  }

  protected readonly current = computed<QuizQuestion | null>(() => {
    const state = this.state()
    return state.status === 'answering' ? (this.questions()[state.index] ?? null) : null
  })

  protected readonly answered = computed(() => {
    const state = this.state()
    return state.status === 'answering' && state.answered
  })

  protected readonly selected = computed(() => {
    const state = this.state()
    return state.status === 'answering' ? state.selected : null
  })

  protected readonly streak = computed(() => {
    const state = this.state()
    return state.status === 'answering' ? state.streak : 0
  })

  protected readonly total = computed(() => this.state().total)

  protected readonly done = computed(() => this.state().status === 'complete')

  protected readonly isLast = computed(() => {
    const state = this.state()
    return state.status === 'answering' && state.index >= state.total - 1
  })

  protected readonly displayIndex = computed(() => {
    const state = this.state()
    return state.status === 'answering' ? state.index + 1 : state.total
  })

  protected readonly progressPercent = computed(() => {
    const state = this.state()
    const position = state.status === 'answering' ? state.index + 1 : state.total
    return state.total > 0 ? (position / state.total) * 100 : 0
  })

  protected readonly result = computed<QuizResult>(() => {
    const state = this.state()
    if (state.status !== 'complete') {
      return { score: 0, total: this.questions().length, accuracy: 0 }
    }
    return {
      score: state.score,
      total: state.total,
      accuracy: quizAccuracy(state.score, state.total),
    }
  })

  protected optionDisplay(index: number, question: QuizQuestion): OptionDisplay {
    const state = this.state()
    if (state.status !== 'answering') return 'idle'
    if (state.answered) {
      if (index === question.correctAnswer) return 'correct'
      if (index === state.selected) return 'wrong'
      return 'idle'
    }
    return index === state.selected ? 'selected' : 'idle'
  }

  protected optionTone(index: number, question: QuizQuestion): string {
    return OPTION_TONE[this.optionDisplay(index, question)]
  }

  protected answeredCorrectly(question: QuizQuestion): boolean {
    return this.selected() === question.correctAnswer
  }

  protected letter(index: number): string {
    return String.fromCharCode(65 + index)
  }

  protected submit(question: QuizQuestion): void {
    const selected = this.selected()
    if (selected === null) return
    this.dispatch({ type: 'submit', correct: selected === question.correctAnswer })
  }

  protected finish(): void {
    window.clearTimeout(this.completeTimer)
    this.completed.emit(this.result())
  }
}

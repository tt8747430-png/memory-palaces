import { Component, effect, inject, input } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { Brain, HelpCircle, LucideAngularModule, Play, Plus } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { SelectToolbar } from '@app/shared/ui/select-toolbar'
import { SpeedDial } from '@app/shared/ui/speed-dial'
import { QuestionRow } from '../ui/question-row'
import { SelectModeBar } from '../ui/select-mode-bar'
import { SortControl } from '../ui/sort-control'
import { DeckQuestionsVm } from './deck-questions.vm'

/**
 * A deck's quiz questions: the start-test lead, the sortable question list with
 * per-row actions, and CSV import (confirmed before applying) and export.
 *
 * The view. Everything reactive lives on DeckQuestionsVm (ADR-0008).
 */
@Component({
  selector: 'ms-deck-questions-page',
  providers: [DeckQuestionsVm],
  imports: [
    ScreenHeader,
    QuestionRow,
    SelectModeBar,
    SelectToolbar,
    SortControl,
    SpeedDial,
    MatButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  template: `
    <ms-screen-header
      [title]="'questions.title' | transloco"
      [subtitle]="vm.deck()?.name ?? ''"
      [backLabel]="'common.back' | transloco"
      (back)="vm.goBack()"
    />

    @if (!vm.ready()) {
      <div class="grid flex-1 place-items-center">
        <span class="size-8 animate-pulse rounded-full bg-secondary" aria-hidden="true"></span>
      </div>
    } @else {
      <main class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe overscroll-contain scrollbar-hide">
        <div class="mt-2 space-y-4 pb-24">
          <div class="rounded-card-featured bg-card p-4 shadow-featured">
            <div class="flex items-center gap-3">
              <span
                class="grid size-11 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
                aria-hidden="true"
              >
                <lucide-icon [img]="icons.brain" class="size-5" aria-hidden="true" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-[length:var(--ms-text-sub)] font-bold text-heading">
                  {{ 'questions.testLead' | transloco }}
                </p>
                <p class="text-[length:var(--ms-text-label)] text-muted-foreground">
                  @if (vm.questions().length > 0) {
                    {{
                      (vm.questions().length === 1
                        ? 'questions.testReadyOne'
                        : 'questions.testReadyOther'
                      ) | transloco: { count: vm.questions().length }
                    }}
                  } @else {
                    {{ 'questions.testNone' | transloco }}
                  }
                </p>
              </div>
            </div>
            <button
              matButton="filled"
              type="button"
              class="mt-3.5 w-full"
              [disabled]="vm.questions().length === 0"
              (click)="vm.startTest()"
            >
              <lucide-icon [img]="icons.play" class="size-[18px]" aria-hidden="true" />
              {{ 'questions.startTest' | transloco }}
            </button>
          </div>

          <section [attr.aria-label]="'questions.inDeck' | transloco" class="space-y-3">
            @if (!vm.selectMode() && vm.questions().length > 1) {
              <div class="flex justify-end">
                <ms-sort-control
                  [label]="'cards.sortLabel' | transloco"
                  [value]="vm.sort()"
                  [options]="vm.sortOptions()"
                  (valueChange)="vm.sort.set($event)"
                />
              </div>
            }

            @if (vm.selectMode()) {
              <ms-select-mode-bar
                [allSelected]="vm.allSelected()"
                [count]="vm.selectedCount()"
                (toggleAll)="vm.toggleSelectAll()"
                (done)="vm.exitSelect()"
              />
            }

            @if (vm.questions().length === 0) {
              <div class="flex flex-col items-center px-6 py-10 text-center">
                <div
                  class="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent"
                >
                  <lucide-icon [img]="icons.help" class="size-6" aria-hidden="true" />
                </div>
                <h3
                  class="mb-1.5 text-[length:var(--ms-text-sub)] font-semibold text-balance text-heading"
                >
                  {{ 'questions.emptyTitle' | transloco }}
                </h3>
                <p
                  class="max-w-[34ch] text-[length:var(--ms-text-body)] text-pretty text-muted-foreground"
                >
                  {{ 'questions.emptyHint' | transloco }}
                </p>
                <button matButton="filled" type="button" class="mt-5" (click)="vm.addQuestion()">
                  <lucide-icon [img]="icons.plus" class="size-[18px]" aria-hidden="true" />
                  {{ 'questions.addQuestion' | transloco }}
                </button>
              </div>
            } @else {
              <div class="flex flex-col gap-3">
                @for (question of vm.sortedQuestions(); track question.id) {
                  <ms-question-row
                    [question]="question"
                    [index]="$index"
                    [swipe]="vm.swipe()"
                    [selectMode]="vm.selectMode()"
                    [selected]="vm.selectedIds().has(question.id)"
                    (more)="vm.questionActions(question)"
                    (requestSelect)="vm.requestSelect(question.id)"
                    (toggleSelect)="vm.toggleSelect(question.id)"
                    (swipeAction)="vm.onQuestionSwipe(question, $event)"
                  />
                }
              </div>
            }
          </section>
        </div>
      </main>

      @if (vm.selectMode()) {
        <div class="px-4 pt-2 pb-[calc(max(0.75rem,env(safe-area-inset-bottom)))]">
          <ms-select-toolbar
            [actions]="vm.selectToolbarConfig()"
            [handlers]="vm.selectHandlers()"
          />
        </div>
      } @else {
        <ms-speed-dial
          [label]="'questions.quickActions' | transloco"
          [actions]="vm.dialActions()"
          dock="edge"
        />
      }
    }
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class DeckQuestionsPage {
  readonly deckId = input.required<string>()

  protected readonly vm = inject(DeckQuestionsVm)

  protected readonly icons = { brain: Brain, play: Play, help: HelpCircle, plus: Plus }

  constructor() {
    // The route input is the view's; the view model reads it as plain state.
    effect(() => this.vm.deckId.set(this.deckId()))
  }
}

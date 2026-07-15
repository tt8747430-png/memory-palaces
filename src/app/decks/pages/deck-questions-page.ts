import { Component, computed, inject, input, signal, viewChild } from '@angular/core'
import type { ElementRef } from '@angular/core'
import { Router } from '@angular/router'
import { Location } from '@angular/common'
import { MatButton } from '@angular/material/button'
import {
  ArrowDownAZ,
  Brain,
  Clock,
  Copy,
  Download,
  GripVertical,
  HelpCircle,
  LucideAngularModule,
  Pencil,
  Play,
  Plus,
  Trash2,
  Upload,
} from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import { ContentImportError } from '@app/shared/domain'
import { ActionSheet } from '@app/shared/ui/action-sheet'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { SpeedDial } from '@app/shared/ui/speed-dial'
import { ToastService } from '@app/shared/ui/toast'
import {
  applyDeckContent,
  exportQuestionsCsv,
  readContentFile,
} from '@app/import/commands/content-index'
import { CardStore, DeckStore, QuestionStore } from '../data/stores'
import { deleteQuestion, duplicateQuestion } from '../commands/question-index'
import { questionsForDeck } from '../model/question'
import type { Question } from '../model/question'
import { QuestionRow } from '../ui/question-row'
import { SortControl } from '../ui/sort-control'
import type { SortOption } from '../ui/sort-control'

type QuestionSort = 'manual' | 'recent' | 'name'

function sortQuestions(questions: Question[], sort: QuestionSort): Question[] {
  switch (sort) {
    case 'name':
      return [...questions].sort((a, b) => a.prompt.localeCompare(b.prompt))
    case 'recent':
      return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    default:
      return questions
  }
}

/**
 * A deck's quiz questions: the start-test lead, the sortable question list with
 * per-row actions, and CSV import (confirmed before applying) and export.
 */
@Component({
  selector: 'ms-deck-questions-page',
  imports: [
    ScreenHeader,
    QuestionRow,
    SortControl,
    SpeedDial,
    MatButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  template: `
    <ms-screen-header
      [title]="'questions.title' | transloco"
      [subtitle]="deck()?.name ?? ''"
      [backLabel]="'common.back' | transloco"
      (back)="goBack()"
    />

    @if (!ready()) {
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
                  @if (questions().length > 0) {
                    {{
                      (questions().length === 1
                        ? 'questions.testReadyOne'
                        : 'questions.testReadyOther'
                      ) | transloco: { count: questions().length }
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
              [disabled]="questions().length === 0"
              (click)="startTest()"
            >
              <lucide-icon [img]="icons.play" class="size-[18px]" aria-hidden="true" />
              {{ 'questions.startTest' | transloco }}
            </button>
          </div>

          <section [attr.aria-label]="'questions.inDeck' | transloco" class="space-y-3">
            @if (questions().length > 1) {
              <div class="flex justify-end">
                <ms-sort-control
                  [label]="'cards.sortLabel' | transloco"
                  [value]="sort()"
                  [options]="sortOptions()"
                  (valueChange)="sort.set($event)"
                />
              </div>
            }

            @if (questions().length === 0) {
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
                <button matButton="filled" type="button" class="mt-5" (click)="addQuestion()">
                  <lucide-icon [img]="icons.plus" class="size-[18px]" aria-hidden="true" />
                  {{ 'questions.addQuestion' | transloco }}
                </button>
              </div>
            } @else {
              <div class="flex flex-col gap-3">
                @for (question of sortedQuestions(); track question.id) {
                  <ms-question-row
                    [question]="question"
                    [index]="sortedQuestions().indexOf(question)"
                    (open)="editQuestion(question.id)"
                    (more)="questionActions(question)"
                  />
                }
              </div>
            }
          </section>
        </div>
      </main>

      <input
        #fileInput
        type="file"
        accept=".csv"
        class="hidden"
        (change)="onFile(fileInput)"
        aria-hidden="true"
        tabindex="-1"
      />

      <ms-speed-dial
        [label]="'questions.quickActions' | transloco"
        [actions]="dialActions()"
        dock="edge"
      />
    }
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class DeckQuestionsPage {
  readonly deckId = input.required<string>()

  private readonly router = inject(Router)
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly actionSheet = inject(ActionSheet)
  private readonly confirmDialog = inject(ConfirmDialog)
  private readonly toast = inject(ToastService)
  private readonly questionStore = inject(QuestionStore)
  private readonly deckStore = inject(DeckStore)
  private readonly cardStore = inject(CardStore)

  protected readonly icons = { brain: Brain, play: Play, help: HelpCircle, plus: Plus }

  constructor() {
    this.questionStore.start()
    this.deckStore.start()
    this.cardStore.start()
  }

  protected readonly sort = signal<QuestionSort>('manual')

  protected readonly ready = computed(
    () => this.questionStore.status() === 'ready' && this.deckStore.status() === 'ready',
  )

  protected readonly deck = computed(
    () => this.deckStore.decks().find((d) => d.id === this.deckId()) ?? null,
  )

  protected readonly questions = computed(() =>
    questionsForDeck(this.questionStore.questions(), this.deckId()),
  )

  protected readonly sortedQuestions = computed(() => sortQuestions(this.questions(), this.sort()))

  protected readonly sortOptions = computed<SortOption<QuestionSort>[]>(() => [
    { value: 'manual', label: this.t('cards.sort.manual'), icon: GripVertical },
    { value: 'recent', label: this.t('cards.sort.recent'), icon: Clock },
    { value: 'name', label: this.t('cards.sort.name'), icon: ArrowDownAZ },
  ])

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput')

  protected readonly dialActions = computed(() => {
    const actions = [
      {
        id: 'question',
        label: this.t('questions.addQuestion'),
        icon: Plus,
        onSelect: () => this.addQuestion(),
      },
      {
        id: 'import',
        label: this.t('questions.transfer.importShort'),
        icon: Upload,
        onSelect: () => this.pickFile(),
      },
    ]
    if (this.questions().length > 0) {
      actions.push({
        id: 'export',
        label: this.t('questions.transfer.exportShort'),
        icon: Download,
        onSelect: () => this.exportCsv(),
      })
    }
    return actions
  })

  protected goBack(): void {
    this.location.back()
  }

  protected startTest(): void {
    void this.router.navigateByUrl(ROUTES.deckQuiz.replace(':deckId', this.deckId()))
  }

  protected addQuestion(): void {
    void this.router.navigateByUrl(ROUTES.deckQuestionNew.replace(':deckId', this.deckId()))
  }

  protected editQuestion(questionId: string): void {
    void this.router.navigateByUrl(
      ROUTES.deckQuestionEdit.replace(':deckId', this.deckId()).replace(':questionId', questionId),
    )
  }

  protected questionActions(question: Question): void {
    this.actionSheet.open({
      title: question.prompt,
      cancelLabel: this.t('common.cancel'),
      actions: [
        {
          id: 'edit',
          label: this.t('common.edit'),
          icon: Pencil,
          onSelect: () => this.editQuestion(question.id),
        },
        {
          id: 'duplicate',
          label: this.t('cards.row.duplicate'),
          icon: Copy,
          onSelect: () => {
            void duplicateQuestion(this.questionStore, question.id)
            this.toast.success(this.t('cards.row.duplicated'))
          },
        },
        {
          id: 'delete',
          label: this.t('common.delete'),
          icon: Trash2,
          destructive: true,
          onSelect: () => void this.confirmDelete(question),
        },
      ],
    })
  }

  private async confirmDelete(question: Question): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.t('cards.delete.questionTitle'),
      description: this.t('cards.delete.body'),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.cancel'),
      destructive: true,
    })
    if (!confirmed) return
    await deleteQuestion(this.questionStore, question.id)
    this.toast.success(this.t('cards.transfer.deleted'))
  }

  private pickFile(): void {
    const input = this.fileInput()?.nativeElement
    if (!input) return
    input.value = ''
    input.click()
  }

  protected async onFile(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0]
    if (!file) return
    try {
      const data = await readContentFile(file)
      if (data.questions.length === 0) {
        this.toast.error(this.t('questions.transfer.noneFound'))
        return
      }
      const confirmed = await this.confirmDialog.confirm({
        icon: Upload,
        title: this.t(
          data.questions.length === 1
            ? 'questions.transfer.importConfirmTitleOne'
            : 'questions.transfer.importConfirmTitleOther',
          { count: data.questions.length },
        ),
        description: this.t('questions.transfer.importConfirmBody'),
        confirmLabel: this.t('questions.transfer.importConfirm'),
        cancelLabel: this.t('common.cancel'),
      })
      if (!confirmed) return
      const applied = await applyDeckContent(this.cardStore, this.questionStore, this.deckId(), {
        cards: [],
        questions: data.questions,
      })
      this.toast.success(this.t('questions.transfer.imported', { count: applied.questions }))
    } catch (error) {
      this.toast.error(
        error instanceof ContentImportError
          ? error.message
          : this.t('questions.transfer.importFailed'),
      )
    }
  }

  private exportCsv(): void {
    exportQuestionsCsv(this.deck()?.name ?? '', this.questions())
    this.toast.success(this.t('questions.transfer.exported'))
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params)
  }
}

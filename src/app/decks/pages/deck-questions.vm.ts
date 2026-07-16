import { Injectable, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { Location } from '@angular/common'
import {
  ArrowDownAZ,
  Clock,
  Copy,
  Download,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-angular'
import { TranslocoService } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import type { SwipeActionId } from '@app/shared/config/swipe'
import { ContentImportError } from '@app/shared/domain'
import { ActionSheet } from '@app/shared/ui/action-sheet'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import { FilePicker } from '@app/shared/ui/file-picker'
import type { SelectActionHandlers } from '@app/shared/ui/select-actions'
import type { SpeedDialAction } from '@app/shared/ui/speed-dial'
import { ToastService } from '@app/shared/ui/toast'
import { applyDeckContent, exportQuestionsCsv, readContentFile } from '@app/import'
import { PreferencesStore } from '@app/settings'
import { CardStore, DeckStore, QuestionStore } from '../data/stores'
import { deleteQuestion, duplicateQuestion } from '../commands/question-index'
import { questionsForDeck } from '../model/question'
import type { Question } from '../model/question'
import type { SortOption } from '../ui/sort-control'

export type QuestionSort = 'manual' | 'recent' | 'name'

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
 * View model for a deck's quiz questions (ADR-0008): the sortable list, its
 * per-row and bulk actions, and CSV import/export.
 *
 * The page sets `deckId` once from its route input; everything else derives.
 */
@Injectable()
export class DeckQuestionsVm {
  private readonly router = inject(Router)
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly actionSheet = inject(ActionSheet)
  private readonly confirmDialog = inject(ConfirmDialog)
  private readonly filePicker = inject(FilePicker)
  private readonly toast = inject(ToastService)
  private readonly questionStore = inject(QuestionStore)
  private readonly deckStore = inject(DeckStore)
  private readonly cardStore = inject(CardStore)
  private readonly preferencesStore = inject(PreferencesStore)

  /** Set by the page from its route input. */
  readonly deckId = signal('')

  readonly sort = signal<QuestionSort>('manual')

  readonly ready = computed(
    () => this.questionStore.status() === 'ready' && this.deckStore.status() === 'ready',
  )

  readonly deck = computed(() => this.deckStore.decks().find((d) => d.id === this.deckId()) ?? null)

  readonly questions = computed(() =>
    questionsForDeck(this.questionStore.questions(), this.deckId()),
  )

  readonly sortedQuestions = computed(() => sortQuestions(this.questions(), this.sort()))

  /** Questions share the card swipe config — same list surface, same gestures. */
  readonly swipe = computed(() => this.preferencesStore.effective().swipe.card)

  readonly sortOptions = computed<SortOption<QuestionSort>[]>(() => [
    { value: 'manual', label: this.t('cards.sort.manual'), icon: GripVertical },
    { value: 'recent', label: this.t('cards.sort.recent'), icon: Clock },
    { value: 'name', label: this.t('cards.sort.name'), icon: ArrowDownAZ },
  ])

  // ---- Multi-select (long-press) ----
  readonly selectMode = signal(false)
  readonly selectedIds = signal<ReadonlySet<string>>(new Set())
  readonly selectedCount = computed(() => this.selectedIds().size)

  readonly allSelected = computed(() => {
    const questions = this.sortedQuestions()
    const selected = this.selectedIds()
    return questions.length > 0 && questions.every((q) => selected.has(q.id))
  })

  requestSelect(id: string): void {
    this.selectMode.set(true)
    this.selectedIds.update((prev) => new Set(prev).add(id))
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  toggleSelectAll(): void {
    const all = this.allSelected()
    this.selectedIds.update((prev) => {
      const next = new Set(prev)
      for (const question of this.sortedQuestions()) {
        if (all) next.delete(question.id)
        else next.add(question.id)
      }
      return next
    })
  }

  exitSelect(): void {
    this.selectMode.set(false)
    this.selectedIds.set(new Set())
  }

  readonly selectToolbarConfig = computed(
    () => this.preferencesStore.effective().selectToolbar.question,
  )

  // The bar the learner configured (Settings → Select toolbar) for questions.
  readonly selectHandlers = computed<SelectActionHandlers>(() => {
    const none = this.selectedIds().size === 0
    return {
      duplicate: { disabled: none, onAction: () => void this.bulkDuplicate() },
      delete: { disabled: none, onAction: () => void this.confirmBulkDelete() },
    }
  })

  private async bulkDuplicate(): Promise<void> {
    const ids = [...this.selectedIds()]
    await Promise.all(ids.map((id) => duplicateQuestion(this.questionStore, id)))
    this.toast.success(this.t('questions.bulk.duplicated', { count: ids.length }))
    this.exitSelect()
  }

  private async confirmBulkDelete(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.t('cards.delete.bulkTitle', { count: this.selectedIds().size }),
      description: this.t('cards.delete.body'),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.cancel'),
      destructive: true,
    })
    if (!confirmed) return
    const ids = [...this.selectedIds()]
    await Promise.all(ids.map((id) => deleteQuestion(this.questionStore, id)))
    this.toast.success(this.t('cards.transfer.deletedMany', { count: ids.length }))
    this.exitSelect()
  }

  readonly dialActions = computed<SpeedDialAction[]>(() => {
    const actions: SpeedDialAction[] = [
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
        onSelect: () => void this.importCsv(),
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

  // ---- Navigation ----
  goBack(): void {
    this.location.back()
  }

  startTest(): void {
    void this.router.navigateByUrl(ROUTES.deckQuiz.replace(':deckId', this.deckId()))
  }

  addQuestion(): void {
    void this.router.navigateByUrl(ROUTES.deckQuestionNew.replace(':deckId', this.deckId()))
  }

  private editQuestion(questionId: string): void {
    void this.router.navigateByUrl(
      ROUTES.deckQuestionEdit.replace(':deckId', this.deckId()).replace(':questionId', questionId),
    )
  }

  // ---- Row actions ----
  questionActions(question: Question): void {
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
          onSelect: () => this.duplicate(question),
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

  onQuestionSwipe(question: Question, id: SwipeActionId): void {
    switch (id) {
      case 'duplicate':
        this.duplicate(question)
        break
      case 'delete':
        void this.confirmDelete(question)
        break
    }
  }

  private duplicate(question: Question): void {
    void duplicateQuestion(this.questionStore, question.id)
    this.toast.success(this.t('cards.row.duplicated'))
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

  // ---- Transfer ----
  private async importCsv(): Promise<void> {
    const file = await this.filePicker.pick('.csv')
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

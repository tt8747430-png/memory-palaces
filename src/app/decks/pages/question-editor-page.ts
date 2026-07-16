import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core'
import { Location } from '@angular/common'
import { Check, LucideAngularModule } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { ToastService } from '@app/shared/ui/toast'
import { DeckStore, QuestionStore } from '../data/stores'
import { createQuestion, editQuestion } from '../commands/question-index'
import {
  QuestionFields,
  buildQuestionData,
  isQuestionValid,
  MAX_OPTIONS,
} from '../ui/question-fields'

/** Create or edit a quiz question; saving returns to the deck's questions list. */
@Component({
  selector: 'ms-question-editor-page',
  imports: [ScreenHeader, QuestionFields, LucideAngularModule, TranslocoPipe],
  template: `
    <ms-screen-header
      [title]="(editing() ? 'questions.editor.editTitle' : 'questions.editor.newTitle') | transloco"
      [subtitle]="deck()?.name ?? ''"
      [backLabel]="'common.back' | transloco"
      (back)="goBack()"
    >
      <button
        type="button"
        [disabled]="!valid()"
        (click)="submit()"
        class="flex h-11 shrink-0 items-center gap-1.5 rounded-control bg-primary px-5 text-[length:var(--ms-text-sub)] font-semibold text-primary-foreground shadow-interactive transition-transform duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
      >
        <lucide-icon [img]="check" class="size-[18px]" aria-hidden="true" />
        {{ (editing() ? 'common.saveChanges' : 'questions.editor.save') | transloco }}
      </button>
    </ms-screen-header>

    <main class="min-h-0 flex-1 overflow-y-auto px-5 overscroll-contain scrollbar-hide">
      <div class="mt-4 pb-8">
        <ms-question-fields
          [(prompt)]="prompt"
          [options]="options()"
          [correct]="correct()"
          [(explanation)]="explanation"
          (optionChange)="setOption($event.index, $event.value)"
          (optionAdd)="addOption()"
          (optionRemove)="removeOption($event)"
          (correctChange)="correct.set($event)"
        />
      </div>
    </main>
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class QuestionEditorPage {
  readonly deckId = input.required<string>()
  readonly questionId = input<string | undefined>(undefined)

  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly toast = inject(ToastService)
  private readonly questionStore = inject(QuestionStore)
  private readonly deckStore = inject(DeckStore)

  protected readonly check = Check

  constructor() {
    // Load fields when the edited question's identity changes, never on plain
    // store emissions — those must not wipe live edits.
    effect(() => {
      this.editingId()
      const editing = untracked(() => this.editing())
      this.prompt.set(editing?.prompt ?? '')
      this.options.set(editing?.options ? [...editing.options] : ['', ''])
      this.correct.set(editing?.correctAnswer ?? 0)
      this.explanation.set(editing?.explanation ?? '')
    })
  }

  protected readonly prompt = signal('')
  protected readonly options = signal<string[]>(['', ''])
  protected readonly correct = signal(0)
  protected readonly explanation = signal('')

  protected readonly deck = computed(
    () => this.deckStore.decks().find((d) => d.id === this.deckId()) ?? null,
  )

  protected readonly editing = computed(() => {
    const id = this.questionId()
    return id ? (this.questionStore.questions().find((q) => q.id === id) ?? null) : null
  })

  private readonly editingId = computed(() => this.editing()?.id ?? null)

  protected readonly valid = computed(() =>
    isQuestionValid(this.prompt(), this.options(), this.correct()),
  )

  protected setOption(index: number, value: string): void {
    this.options.update((prev) => prev.map((option, i) => (i === index ? value : option)))
  }

  protected addOption(): void {
    this.options.update((prev) => (prev.length < MAX_OPTIONS ? [...prev, ''] : prev))
  }

  protected removeOption(index: number): void {
    this.options.update((prev) => prev.filter((_, i) => i !== index))
    this.correct.update((prev) => (index === prev ? 0 : index < prev ? prev - 1 : prev))
  }

  protected async submit(): Promise<void> {
    if (!this.valid()) return
    const data = buildQuestionData(
      this.prompt(),
      this.options(),
      this.correct(),
      this.explanation(),
    )
    const editing = this.editing()
    if (editing) {
      await editQuestion(this.questionStore, editing.id, data)
      this.toast.success(this.transloco.translate('questions.editor.updated'))
    } else {
      await createQuestion(this.questionStore, this.deckId(), data)
      this.toast.success(this.transloco.translate('questions.editor.added'))
    }
    this.goBack()
  }

  protected goBack(): void {
    this.location.back()
  }
}

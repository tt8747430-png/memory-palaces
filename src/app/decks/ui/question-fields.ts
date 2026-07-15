import { Component, input, model, output } from '@angular/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { Check, LucideAngularModule, Plus, X } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'

export const MAX_OPTIONS = 6
export const MIN_OPTIONS = 2

export interface QuestionData {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

/** Drops blank options and re-points the correct index at the kept list. */
export function buildQuestionData(
  prompt: string,
  options: string[],
  correct: number,
  explanation: string,
): QuestionData {
  const kept: string[] = []
  let newCorrect = 0
  options.forEach((option, index) => {
    if (option.trim()) {
      if (index === correct) newCorrect = kept.length
      kept.push(option.trim())
    }
  })
  return {
    prompt: prompt.trim(),
    options: kept,
    correctAnswer: newCorrect,
    ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
  }
}

export function isQuestionValid(prompt: string, options: string[], correct: number): boolean {
  const filled = options.map((option) => option.trim())
  return (
    prompt.trim().length > 0 &&
    filled.filter(Boolean).length >= MIN_OPTIONS &&
    (filled[correct]?.length ?? 0) > 0
  )
}

/** The question form: prompt, its answer options with one marked correct, and an
 *  optional explanation. */
@Component({
  selector: 'ms-question-fields',
  imports: [MatFormFieldModule, MatInput, LucideAngularModule, TranslocoPipe],
  template: `
    <div>
      <div class="mb-2 flex items-baseline justify-between gap-2">
        <span class="text-[length:var(--ms-text-label)] font-semibold text-heading">
          {{ 'questions.editor.prompt' | transloco }}
        </span>
        <span class="text-[length:var(--ms-text-tiny)] text-muted-foreground tabular-nums">
          {{ prompt().length }}
        </span>
      </div>
      <mat-form-field appearance="outline" class="w-full">
        <textarea
          #promptInput
          matInput
          rows="2"
          [value]="prompt()"
          (input)="prompt.set(promptInput.value)"
          [placeholder]="'questions.editor.promptPlaceholder' | transloco"
        ></textarea>
      </mat-form-field>
    </div>

    <div>
      <p class="mb-0.5 text-[length:var(--ms-text-label)] font-semibold text-heading">
        {{ 'questions.editor.options' | transloco }}
      </p>
      <p class="mb-2 text-[length:var(--ms-text-label)] text-muted-foreground">
        {{ 'questions.editor.optionsHint' | transloco }}
      </p>
      <div class="flex flex-col gap-2">
        @for (option of options(); track $index) {
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="markCorrect($index)"
              [attr.aria-label]="
                ($index === correct()
                  ? 'questions.editor.correctAnswer'
                  : 'questions.editor.markCorrect'
                ) | transloco
              "
              [attr.aria-pressed]="$index === correct()"
              class="grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors"
              [class]="
                $index === correct()
                  ? 'border-success bg-success text-[color:var(--surface)]'
                  : 'border-border bg-card text-muted-foreground'
              "
            >
              @if ($index === correct()) {
                <lucide-icon [img]="icons.check" class="size-[15px]" aria-hidden="true" />
              } @else {
                <span class="text-[length:var(--ms-text-label)] font-bold">{{
                  letter($index)
                }}</span>
              }
            </button>
            <mat-form-field appearance="outline" class="flex-1">
              <input
                #optionInput
                matInput
                type="text"
                [value]="option"
                (input)="setOption($index, optionInput.value)"
                [placeholder]="
                  'questions.editor.optionPlaceholder' | transloco: { letter: letter($index) }
                "
              />
            </mat-form-field>
            @if (options().length > minOptions) {
              <button
                type="button"
                (click)="removeOption($index)"
                [attr.aria-label]="'questions.editor.removeOption' | transloco"
                class="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--danger-surface)] hover:text-[var(--danger-on-surface)]"
              >
                <lucide-icon [img]="icons.x" class="size-4" aria-hidden="true" />
              </button>
            }
          </div>
        }
      </div>
      @if (options().length < maxOptions) {
        <button
          type="button"
          (click)="addOption()"
          class="mt-2.5 inline-flex items-center gap-1.5 text-[length:var(--ms-text-label)] font-semibold text-accent transition-colors hover:text-heading"
        >
          <lucide-icon [img]="icons.plus" class="size-[15px]" aria-hidden="true" />
          {{ 'questions.editor.addOption' | transloco }}
        </button>
      }
    </div>

    <div>
      <p class="mb-2 text-[length:var(--ms-text-label)] font-semibold text-heading">
        {{ 'questions.editor.explanation' | transloco }}
      </p>
      <mat-form-field appearance="outline" class="w-full">
        <textarea
          #explanationInput
          matInput
          rows="2"
          [value]="explanation()"
          (input)="explanation.set(explanationInput.value)"
          [placeholder]="'questions.editor.explanationPlaceholder' | transloco"
        ></textarea>
      </mat-form-field>
    </div>
  `,
  host: { class: 'flex flex-col gap-4' },
})
export class QuestionFields {
  readonly prompt = model.required<string>()
  readonly options = input.required<string[]>()
  readonly correct = input.required<number>()
  readonly explanation = model.required<string>()
  readonly optionChange = output<{ index: number; value: string }>()
  readonly optionAdd = output<void>()
  readonly optionRemove = output<number>()
  readonly correctChange = output<number>()

  protected readonly icons = { check: Check, plus: Plus, x: X }
  protected readonly minOptions = MIN_OPTIONS
  protected readonly maxOptions = MAX_OPTIONS

  protected letter(index: number): string {
    return String.fromCharCode(65 + index)
  }

  protected setOption(index: number, value: string): void {
    this.optionChange.emit({ index, value })
  }

  protected addOption(): void {
    this.optionAdd.emit()
  }

  protected removeOption(index: number): void {
    this.optionRemove.emit(index)
  }

  protected markCorrect(index: number): void {
    this.correctChange.emit(index)
  }
}

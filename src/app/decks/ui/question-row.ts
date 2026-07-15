import { Component, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { Check, LucideAngularModule, MoreVertical } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { LongPress } from '@app/shared/ui/long-press'
import type { Question } from '../model/question'

/** One quiz question: numbered prompt and its options, the correct one marked.
 *  Tap opens the editor; hold or the overflow button asks for the row's actions. */
@Component({
  selector: 'ms-question-row',
  imports: [MatIconButton, LucideAngularModule, TranslocoPipe, LongPress],
  template: `
    <div class="flex items-start gap-3">
      <div class="relative min-w-0 flex-1">
        <button
          type="button"
          msLongPress
          (shortTap)="open.emit()"
          (longPress)="more.emit()"
          [attr.aria-label]="question().prompt"
          class="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.04]"
        ></button>

        <div class="pointer-events-none relative">
          <div class="mb-2 flex items-center gap-2">
            <span
              class="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[length:var(--ms-text-label)] font-bold text-primary-foreground"
            >
              {{ index() + 1 }}
            </span>
            <p
              class="min-w-0 flex-1 text-[length:var(--ms-text-sub)] leading-snug font-semibold text-heading"
            >
              {{ question().prompt }}
            </p>
          </div>
          <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
            @for (option of question().options; track $index) {
              <li
                class="flex items-center gap-2 rounded-control px-2.5 py-1.5 text-[length:var(--ms-text-label)]"
                [class]="
                  $index === question().correctAnswer
                    ? 'bg-[var(--success-surface)] font-semibold text-[var(--success-on-surface)]'
                    : 'bg-info-surface text-muted-foreground'
                "
              >
                <span
                  aria-hidden="true"
                  class="grid size-5 place-items-center rounded-full text-[length:var(--ms-text-tiny)] font-bold"
                  [class]="
                    $index === question().correctAnswer
                      ? 'bg-success text-[color:var(--surface)]'
                      : 'bg-card text-muted-foreground'
                  "
                >
                  @if ($index === question().correctAnswer) {
                    <lucide-icon [img]="check" class="size-3" aria-hidden="true" />
                  } @else {
                    {{ letter($index) }}
                  }
                </span>
                {{ option }}
              </li>
            }
          </ul>
        </div>
      </div>

      <button
        matIconButton
        type="button"
        class="ms-row-menu -mt-1 -mr-1 shrink-0 bg-info-surface text-info-foreground"
        [attr.aria-label]="'cards.row.menuLabel' | transloco"
        (click)="more.emit()"
      >
        <lucide-icon [img]="moreVertical" class="size-5" aria-hidden="true" />
      </button>
    </div>
  `,
  host: { class: 'block rounded-card border border-border bg-card p-4 shadow-rest' },
  styles: `
    .ms-row-menu {
      --mat-icon-button-state-layer-size: 36px;
      width: 36px;
      height: 36px;
      padding: 6px;
    }
  `,
})
export class QuestionRow {
  readonly question = input.required<Question>()
  readonly index = input.required<number>()
  readonly open = output<void>()
  readonly more = output<void>()

  protected readonly check = Check
  protected readonly moreVertical = MoreVertical

  protected letter(index: number): string {
    return String.fromCharCode(65 + index)
  }
}

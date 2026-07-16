import { Component, computed, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { Check, LucideAngularModule, MoreVertical } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import type { SwipeActionId, SwipeConfig } from '@app/shared/config/swipe'
import { LongPress } from '@app/shared/ui/long-press'
import { SelectDot } from '@app/shared/ui/select-dot'
import { buildSwipeActions } from '@app/shared/ui/swipe-actions'
import type { SwipeActionHandlers } from '@app/shared/ui/swipe-actions'
import { SwipeRow } from '@app/shared/ui/swipe-row'
import type { Question } from '../model/question'

/** One quiz question: numbered prompt and its options, the correct one marked.
 *  The overflow button asks for the row's actions; a swipe reveals the configured
 *  quick actions; press-and-hold starts a multi-selection, where a tap toggles. */
@Component({
  selector: 'ms-question-row',
  imports: [MatIconButton, LucideAngularModule, TranslocoPipe, LongPress, SelectDot, SwipeRow],
  template: `
    <ms-swipe-row
      [leading]="swipeActions().leading"
      [trailing]="swipeActions().trailing"
      [disabled]="selectMode() || swipeDisabled()"
      class="rounded-card"
    >
      <div
        class="rounded-card border bg-card p-4 shadow-rest transition-colors"
        [class]="rowSurface()"
      >
        <div class="flex items-start gap-3">
          @if (selectMode()) {
            <ms-select-dot class="mt-0.5" [selected]="selected()" />
          }
          <div class="relative min-w-0 flex-1">
            @if (selectMode()) {
              <button
                type="button"
                (click)="toggleSelect.emit()"
                [attr.aria-label]="question().prompt"
                [attr.aria-pressed]="selected()"
                class="absolute inset-0 touch-pan-y rounded-card transition-colors active:bg-primary/[0.04]"
              ></button>
            } @else {
              <button
                type="button"
                msLongPress
                (longPress)="requestSelect.emit()"
                [attr.aria-label]="question().prompt"
                class="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.04]"
              ></button>
            }

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

          @if (!selectMode()) {
            <button
              matIconButton
              type="button"
              class="ms-row-menu -mt-1 -mr-1 shrink-0 bg-info-surface text-info-foreground"
              [attr.aria-label]="'cards.row.menuLabel' | transloco"
              (click)="more.emit()"
            >
              <lucide-icon [img]="moreVertical" class="size-5" aria-hidden="true" />
            </button>
          }
        </div>
      </div>
    </ms-swipe-row>
  `,
  host: { class: 'block' },
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
  /** The learner's swipe config for cards (questions share it); null disables swipe. */
  readonly swipe = input<SwipeConfig | null>(null)
  readonly selectMode = input(false)
  readonly selected = input(false)
  readonly more = output<void>()
  /** Press-and-hold: enter select mode with this question selected. */
  readonly requestSelect = output<void>()
  readonly toggleSelect = output<void>()
  readonly swipeAction = output<SwipeActionId>()

  protected readonly check = Check
  protected readonly moreVertical = MoreVertical

  protected readonly rowSurface = computed(() => {
    const border = this.selected() ? 'border-accent ring-2 ring-accent/25' : 'border-border'
    return this.selectMode() ? `${border} cursor-pointer` : border
  })

  protected readonly swipeActions = computed(() => {
    const config = this.swipe()
    if (!config) return { leading: [], trailing: [] }
    const emit = (id: SwipeActionId) => () => this.swipeAction.emit(id)
    const handlers: SwipeActionHandlers = {
      duplicate: { onAction: emit('duplicate') },
      delete: { onAction: emit('delete') },
    }
    return buildSwipeActions(config, handlers)
  })

  protected readonly swipeDisabled = computed(() => {
    const { leading, trailing } = this.swipeActions()
    return leading.length === 0 && trailing.length === 0
  })

  protected letter(index: number): string {
    return String.fromCharCode(65 + index)
  }
}

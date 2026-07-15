import { afterNextRender, Component, input, model, viewChild } from '@angular/core'
import type { ElementRef } from '@angular/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { BookOpen, Lightbulb, LucideAngularModule, MapPin, MessageSquareText } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'

/** The card form: front and back up top, hint and tip as optional extras below. */
@Component({
  selector: 'ms-card-fields',
  imports: [MatFormFieldModule, MatInput, LucideAngularModule, TranslocoPipe],
  template: `
    <div class="flex flex-col gap-4">
      <div>
        <div class="mb-2 flex items-baseline justify-between gap-2">
          <span
            class="inline-flex items-center gap-1.5 text-[length:var(--ms-text-sub)] font-bold text-heading"
          >
            <lucide-icon [img]="icons.front" class="size-[18px]" aria-hidden="true" />
            {{ 'cards.editor.front' | transloco }}
          </span>
          <span class="text-[length:var(--ms-text-tiny)] text-muted-foreground tabular-nums">
            {{ front().length }}
          </span>
        </div>
        <mat-form-field appearance="outline" class="w-full">
          <input
            #frontInput
            matInput
            type="text"
            [value]="front()"
            (input)="front.set(frontInput.value)"
            [placeholder]="'cards.editor.frontPlaceholder' | transloco"
            enterkeyhint="next"
          />
        </mat-form-field>
      </div>

      <div>
        <div class="mb-2 flex items-baseline justify-between gap-2">
          <span
            class="inline-flex items-center gap-1.5 text-[length:var(--ms-text-sub)] font-bold text-heading"
          >
            <lucide-icon [img]="icons.back" class="size-[18px]" aria-hidden="true" />
            {{ 'cards.editor.back' | transloco }}
          </span>
          <span class="text-[length:var(--ms-text-tiny)] text-muted-foreground tabular-nums">
            {{ back().length }}
          </span>
        </div>
        <mat-form-field appearance="outline" class="w-full">
          <textarea
            #backInput
            matInput
            rows="3"
            [value]="back()"
            (input)="back.set(backInput.value)"
            [placeholder]="'cards.editor.backPlaceholder' | transloco"
          ></textarea>
        </mat-form-field>
      </div>
    </div>

    <div class="flex flex-col gap-4 border-t border-border pt-5">
      <div>
        <div class="mb-2 flex items-baseline gap-1.5">
          <lucide-icon
            [img]="icons.hint"
            class="size-3.5 self-center text-accent"
            aria-hidden="true"
          />
          <span class="text-[length:var(--ms-text-label)] font-semibold text-heading">
            {{ 'cards.editor.hint' | transloco }}
          </span>
        </div>
        <mat-form-field appearance="outline" class="w-full">
          <textarea
            #hintInput
            matInput
            rows="2"
            [value]="hint()"
            (input)="hint.set(hintInput.value)"
            [placeholder]="'cards.editor.hintPlaceholder' | transloco"
          ></textarea>
        </mat-form-field>
      </div>

      <div>
        <div class="mb-2 flex items-baseline gap-1.5">
          <lucide-icon
            [img]="icons.tip"
            class="size-3.5 self-center text-[var(--warning-foreground)]"
            aria-hidden="true"
          />
          <span class="text-[length:var(--ms-text-label)] font-semibold text-heading">
            {{ 'cards.editor.tip' | transloco }}
          </span>
        </div>
        <mat-form-field appearance="outline" class="w-full">
          <textarea
            #tipInput
            matInput
            rows="2"
            [value]="tip()"
            (input)="tip.set(tipInput.value)"
            [placeholder]="'cards.editor.tipPlaceholder' | transloco"
          ></textarea>
        </mat-form-field>
      </div>
    </div>
  `,
  host: { class: 'flex flex-col gap-5' },
})
export class CardFields {
  private readonly frontField = viewChild.required<ElementRef<HTMLInputElement>>('frontInput')

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) this.frontField().nativeElement.focus()
    })
  }

  protected readonly icons = {
    front: MessageSquareText,
    back: BookOpen,
    hint: MapPin,
    tip: Lightbulb,
  }

  readonly front = model.required<string>()
  readonly back = model.required<string>()
  readonly hint = model.required<string>()
  readonly tip = model.required<string>()
  readonly autoFocus = input(false)
}

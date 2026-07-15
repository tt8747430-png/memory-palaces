import { afterNextRender, Component, inject, Injectable, signal, viewChild } from '@angular/core'
import type { ElementRef } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet'
import { MatButton } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { SheetShell } from './sheet-shell'

export interface PromptSheetConfig {
  title: string
  description?: string
  fieldLabel: string
  placeholder?: string
  initialValue?: string
  confirmLabel: string
}

@Component({
  selector: 'ms-prompt-sheet',
  imports: [SheetShell, MatButton, MatFormFieldModule, MatInput],
  template: `
    <ms-sheet-shell
      [title]="config.title"
      [description]="config.description ?? ''"
      (closed)="ref.dismiss()"
    >
      <form class="pb-2" (submit)="submit($event)">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ config.fieldLabel }}</mat-label>
          <input
            #field
            matInput
            type="text"
            [value]="value()"
            (input)="value.set(field.value)"
            [placeholder]="config.placeholder ?? ''"
            maxlength="60"
            enterkeyhint="done"
            autocomplete="off"
          />
        </mat-form-field>
      </form>
      <button
        footer
        matButton="filled"
        type="button"
        class="w-full"
        [disabled]="!valid()"
        (click)="submit()"
      >
        {{ config.confirmLabel }}
      </button>
    </ms-sheet-shell>
  `,
  host: { class: 'flex max-h-full min-h-0 flex-col' },
})
export class PromptSheetComponent {
  protected readonly config = inject<PromptSheetConfig>(MAT_BOTTOM_SHEET_DATA)
  protected readonly ref = inject(MatBottomSheetRef<PromptSheetComponent, string>)

  protected readonly value = signal(this.config.initialValue ?? '')
  protected readonly valid = (): boolean => this.value().trim().length > 0

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field')

  constructor() {
    // The default name is a suggestion: focused and selected, one keystroke replaces it.
    afterNextRender(() => {
      const input = this.field().nativeElement
      input.focus()
      input.select()
    })
  }

  protected submit(event?: Event): void {
    event?.preventDefault()
    if (!this.valid()) return
    this.ref.dismiss(this.value().trim())
  }
}

/** Single-field prompt in a bottom sheet; resolves the trimmed value, or null when
 *  dismissed without submitting. */
@Injectable({ providedIn: 'root' })
export class PromptSheet {
  private readonly sheets = inject(MatBottomSheet)

  async prompt(config: PromptSheetConfig): Promise<string | null> {
    const ref = this.sheets.open<PromptSheetComponent, PromptSheetConfig, string>(
      PromptSheetComponent,
      { data: config, panelClass: 'ms-sheet-panel' },
    )
    return (await firstValueFrom(ref.afterDismissed())) ?? null
  }
}

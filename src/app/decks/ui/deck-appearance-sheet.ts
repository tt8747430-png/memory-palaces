import { Component, computed, inject, signal } from '@angular/core'
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatButton } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { Check, LucideAngularModule } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { SheetShell } from '@app/shared/ui/sheet-shell'
import { IconColorRow } from '@app/shared/ui/icon-color-row'
import { DECK_COLOR_OPTIONS, DEFAULT_DECK_COLOR, DEFAULT_DECK_ICON } from '../model/deck-appearance'
import type { Deck } from '../model/deck'

export interface DeckAppearanceSheetData {
  deck: Deck
}

export interface DeckAppearanceChanges {
  name: string
  color: string
  icon: string
}

/** Edit a deck's identity — name, icon, color. Dismisses with the changes, or
 *  undefined when cancelled. */
@Component({
  selector: 'ms-deck-appearance-sheet',
  imports: [
    SheetShell,
    IconColorRow,
    MatButton,
    MatFormFieldModule,
    MatInput,
    LucideAngularModule,
    TranslocoPipe,
  ],
  template: `
    <ms-sheet-shell [title]="'deckSettings.appearanceTitle' | transloco" (closed)="ref.dismiss()">
      <form class="flex flex-col gap-5 pb-2" (submit)="submit($event)">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ 'deck.nameLabel' | transloco }}</mat-label>
          <input
            #field
            matInput
            type="text"
            [value]="name()"
            (input)="name.set(field.value)"
            [placeholder]="'deck.namePlaceholder' | transloco"
            maxlength="60"
            enterkeyhint="done"
            autocomplete="off"
          />
        </mat-form-field>
        <ms-icon-color-row
          [icon]="icon()"
          [color]="color()"
          [colorOptions]="colorOptions"
          [label]="'folder.iconColorLabel' | transloco"
          [iconLabel]="'deckSettings.iconLabel' | transloco"
          (iconChange)="icon.set($event)"
          (colorChange)="color.set($event)"
        />
      </form>
      <button
        footer
        matButton="filled"
        type="button"
        class="w-full"
        [disabled]="!valid()"
        (click)="submit()"
      >
        <lucide-icon [img]="check" class="size-[18px]" aria-hidden="true" />
        {{ 'deckSettings.appearanceSave' | transloco }}
      </button>
    </ms-sheet-shell>
  `,
  host: { class: 'flex max-h-full min-h-0 flex-col' },
})
export class DeckAppearanceSheet {
  private readonly data = inject<DeckAppearanceSheetData>(MAT_BOTTOM_SHEET_DATA)
  protected readonly ref = inject(MatBottomSheetRef<DeckAppearanceSheet, DeckAppearanceChanges>)

  protected readonly check = Check
  protected readonly colorOptions = DECK_COLOR_OPTIONS

  protected readonly name = signal(this.data.deck.name)
  protected readonly color = signal(this.data.deck.color || DEFAULT_DECK_COLOR)
  protected readonly icon = signal(this.data.deck.icon || DEFAULT_DECK_ICON)
  protected readonly valid = computed(() => this.name().trim().length > 0)

  protected submit(event?: Event): void {
    event?.preventDefault()
    if (!this.valid()) return
    this.ref.dismiss({ name: this.name().trim(), color: this.color(), icon: this.icon() })
  }
}

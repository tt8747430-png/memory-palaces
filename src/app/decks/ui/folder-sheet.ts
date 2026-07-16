import { afterNextRender, Component, computed, inject, signal, viewChild } from '@angular/core'
import type { ElementRef } from '@angular/core'
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet'
import { firstValueFrom } from 'rxjs'
import { MatButton } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { Check, FolderPlus, LucideAngularModule } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { SheetShell } from '@app/shared/ui/sheet-shell'
import { IconColorRow } from '@app/shared/ui/icon-color-row'
import { DECK_COLOR_OPTIONS } from '../model/deck-appearance'
import { DEFAULT_FOLDER_ICON } from '../model/folder-appearance'
import type { Folder } from '../model/folder'

export interface FolderSheetData {
  /** Folder being edited; null creates a new one. */
  folder: Folder | null
  defaultName: string
  defaultColor: string
}

export interface FolderChanges {
  name: string
  color: string
  icon: string
}

/** Create/edit a folder: name plus its icon-and-color identity. Dismisses with the
 *  changes, or undefined when cancelled. */
@Component({
  selector: 'ms-folder-sheet',
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
    <ms-sheet-shell
      [title]="(isEdit ? 'folder.settingsTitle' : 'folder.newTitle') | transloco"
      (closed)="ref.dismiss()"
    >
      <form class="flex flex-col gap-5 pb-2" (submit)="submit($event)">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ 'folder.nameLabel' | transloco }}</mat-label>
          <input
            #field
            matInput
            type="text"
            [value]="name()"
            (input)="name.set(field.value)"
            [placeholder]="'folder.namePlaceholder' | transloco"
            maxlength="40"
            enterkeyhint="done"
            autocomplete="off"
          />
        </mat-form-field>
        <ms-icon-color-row
          [icon]="icon()"
          [color]="color()"
          [colorOptions]="colorOptions"
          [label]="'folder.iconColorLabel' | transloco"
          [iconLabel]="'folder.iconLabel' | transloco"
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
        <lucide-icon
          [img]="isEdit ? icons.check : icons.folderPlus"
          class="size-[18px]"
          aria-hidden="true"
        />
        {{ (isEdit ? 'folder.save' : 'folder.create') | transloco }}
      </button>
    </ms-sheet-shell>
  `,
  host: { class: 'flex max-h-full min-h-0 flex-col' },
})
export class FolderSheet {
  private readonly data = inject<FolderSheetData>(MAT_BOTTOM_SHEET_DATA)
  protected readonly ref = inject(MatBottomSheetRef<FolderSheet, FolderChanges>)

  protected readonly icons = { check: Check, folderPlus: FolderPlus }
  protected readonly colorOptions = DECK_COLOR_OPTIONS
  protected readonly isEdit = this.data.folder != null

  protected readonly name = signal(this.data.folder?.name ?? this.data.defaultName)
  protected readonly color = signal(this.data.folder?.color || this.data.defaultColor)
  protected readonly icon = signal(this.data.folder?.icon || DEFAULT_FOLDER_ICON)
  protected readonly valid = computed(() => this.name().trim().length > 0)

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field')

  constructor() {
    // Creating: the suggested name is focused and selected so one keystroke replaces it.
    afterNextRender(() => {
      if (this.isEdit) return
      const input = this.field().nativeElement
      input.focus()
      input.select()
    })
  }

  protected submit(event?: Event): void {
    event?.preventDefault()
    if (!this.valid()) return
    this.ref.dismiss({ name: this.name().trim(), color: this.color(), icon: this.icon() })
  }
}

/**
 * The sheet's own public API — the same promise-returning shape `ConfirmDialog`
 * and `PromptSheet` already offer. Resolves undefined when cancelled.
 */
export function openFolderSheet(
  sheets: MatBottomSheet,
  data: FolderSheetData,
): Promise<FolderChanges | undefined> {
  const ref = sheets.open<FolderSheet, FolderSheetData, FolderChanges>(FolderSheet, {
    data,
    panelClass: 'ms-sheet-panel',
  })
  return firstValueFrom(ref.afterDismissed())
}

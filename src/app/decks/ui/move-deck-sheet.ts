import { Component, computed, inject, signal } from '@angular/core'
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatButton } from '@angular/material/button'
import { Archive, Check, FolderPlus, Home, LucideAngularModule, Minus, Plus } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { childDecks, decksInFolder, rootDecks } from '@app/shared/domain'
import { SheetShell } from '@app/shared/ui/sheet-shell'
import { DeckCover } from '@app/shared/ui/deck-cover'
import { DEFAULT_DECK_COLOR, DEFAULT_DECK_ICON } from '../model/deck-appearance'
import { DEFAULT_FOLDER_ICON } from '../model/folder-appearance'
import type { Deck } from '../model/deck'
import type { Folder } from '../model/folder'

export type MoveDestination =
  | { kind: 'home' }
  | { kind: 'archive' }
  | { kind: 'folder'; folderId: string }
  | { kind: 'deck'; deckId: string }

/** Dismiss result: a picked destination, or a hand-off to the new-folder flow. */
export type MoveDeckResult = MoveDestination | 'new-folder'

export interface MoveDeckSheetData {
  /** What is being moved — the deck's name, or a selection count. */
  subtitle: string
  decks: Deck[]
  folders: Folder[]
  /** Decks that can't be a destination (the moved decks + their subtrees). */
  excludeIds: ReadonlySet<string>
}

interface MoveRow {
  key: string
  dest: MoveDestination
  depth: number
  label: string
  icon: string
  color: string
  isFolder: boolean
  disabled: boolean
  hasChildren: boolean
}

function destKey(dest: MoveDestination): string {
  if (dest.kind === 'folder') return `folder:${dest.folderId}`
  if (dest.kind === 'deck') return `deck:${dest.deckId}`
  return dest.kind
}

/**
 * Destination picker for moving decks: Archive and Home up top, then every folder
 * and (non-excluded) deck as a collapsible tree. Picking arms the footer button;
 * confirming dismisses with the destination.
 */
@Component({
  selector: 'ms-move-deck-sheet',
  imports: [SheetShell, DeckCover, MatButton, LucideAngularModule, TranslocoPipe],
  template: `
    <ms-sheet-shell
      [title]="'move.selectLocation' | transloco"
      [description]="data.subtitle"
      (closed)="ref.dismiss()"
    >
      <div class="-mx-1 flex flex-col">
        @for (row of rows(); track row.key) {
          <div
            class="relative flex items-center border-b border-border/50"
            [style.padding-left.px]="row.depth * 20"
          >
            @if (row.hasChildren) {
              <button
                type="button"
                (click)="toggle(row.key)"
                [attr.aria-label]="(isOpen(row.key) ? 'deck.collapse' : 'deck.expand') | transloco"
                [attr.aria-expanded]="isOpen(row.key)"
                class="relative z-10 ml-1 grid size-6 shrink-0 place-items-center rounded-full bg-secondary/30 text-primary transition-colors active:bg-secondary/50"
              >
                <lucide-icon
                  [img]="isOpen(row.key) ? icons.minus : icons.plus"
                  class="size-3.5"
                  aria-hidden="true"
                />
              </button>
            } @else {
              <span class="ml-1 size-6 shrink-0" aria-hidden="true"></span>
            }

            <button
              type="button"
              (click)="select(row.dest)"
              [disabled]="row.disabled"
              [attr.aria-pressed]="selectedKey() === row.key"
              class="flex min-w-0 flex-1 items-center gap-2.5 rounded-control py-2.5 pr-2 pl-1.5 text-left transition-colors"
              [class]="rowStateClass(row)"
            >
              @switch (row.dest.kind) {
                @case ('archive') {
                  <span
                    class="grid size-8 shrink-0 place-items-center rounded-xl bg-secondary/40 text-muted-foreground"
                  >
                    <lucide-icon [img]="icons.archive" class="size-[18px]" aria-hidden="true" />
                  </span>
                }
                @case ('home') {
                  <span
                    class="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
                  >
                    <lucide-icon [img]="icons.home" class="size-[18px]" aria-hidden="true" />
                  </span>
                }
                @default {
                  <ms-deck-cover
                    [icon]="row.icon"
                    [color]="row.color"
                    class="size-8 rounded-xl ring-1 ring-black/5"
                    [iconClass]="
                      row.isFolder ? 'text-[0.95rem] leading-none' : 'text-[0.85rem] leading-none'
                    "
                  />
                }
              }
              <span
                class="min-w-0 flex-1 truncate text-[length:var(--ms-text-body)] font-semibold"
                [class]="selectedKey() === row.key ? 'text-primary' : 'text-heading'"
              >
                {{ row.label }}
              </span>
              @if (selectedKey() === row.key) {
                <lucide-icon
                  [img]="icons.check"
                  class="size-5 shrink-0 text-accent"
                  aria-hidden="true"
                />
              }
            </button>
          </div>
        }
      </div>

      <button
        type="button"
        (click)="ref.dismiss('new-folder')"
        class="mt-1 flex w-full items-center gap-2.5 rounded-card px-2 py-3 text-left text-accent transition-colors active:bg-primary/[0.05]"
      >
        <span class="grid size-8 shrink-0 place-items-center rounded-xl bg-info-surface">
          <lucide-icon [img]="icons.folderPlus" class="size-[18px]" aria-hidden="true" />
        </span>
        <span class="text-[length:var(--ms-text-body)] font-semibold">
          {{ 'move.newFolder' | transloco }}
        </span>
      </button>

      <button
        footer
        matButton="filled"
        type="button"
        class="w-full"
        [disabled]="selected() === null"
        (click)="confirm()"
      >
        @if (selected() === null) {
          {{ 'move.pickPrompt' | transloco }}
        } @else {
          {{ 'move.moveTo' | transloco: { name: selectedName() } }}
        }
      </button>
    </ms-sheet-shell>
  `,
  host: { class: 'flex max-h-full min-h-0 flex-col' },
})
export class MoveDeckSheet {
  protected readonly data = inject<MoveDeckSheetData>(MAT_BOTTOM_SHEET_DATA)
  protected readonly ref = inject(MatBottomSheetRef<MoveDeckSheet, MoveDeckResult>)
  private readonly transloco = inject(TranslocoService)

  protected readonly icons = {
    archive: Archive,
    home: Home,
    check: Check,
    plus: Plus,
    minus: Minus,
    folderPlus: FolderPlus,
  }

  /** Everything opens expanded: the picker is a map, not a drawer to rummage in. */
  private readonly collapsed = signal<ReadonlySet<string>>(new Set())
  protected readonly selected = signal<MoveDestination | null>(null)

  protected readonly selectedKey = computed(() => {
    const dest = this.selected()
    return dest ? destKey(dest) : null
  })

  protected readonly selectedName = computed(() => {
    const dest = this.selected()
    if (dest === null) return ''
    if (dest.kind === 'home') return this.transloco.translate('move.home')
    if (dest.kind === 'archive') return this.transloco.translate('move.archive')
    if (dest.kind === 'folder')
      return this.data.folders.find((f) => f.id === dest.folderId)?.name ?? ''
    return this.data.decks.find((d) => d.id === dest.deckId)?.name ?? ''
  })

  protected readonly rows = computed<MoveRow[]>(() => {
    const rows: MoveRow[] = []
    rows.push({
      key: 'archive',
      dest: { kind: 'archive' },
      depth: 0,
      label: this.transloco.translate('move.archive'),
      icon: '',
      color: '',
      isFolder: false,
      disabled: false,
      hasChildren: false,
    })
    rows.push({
      key: 'home',
      dest: { kind: 'home' },
      depth: 0,
      label: this.transloco.translate('move.home'),
      icon: '',
      color: '',
      isFolder: false,
      disabled: false,
      hasChildren: false,
    })
    for (const folder of this.data.folders) {
      const children = decksInFolder(this.data.decks, folder.id).filter((d) => !d.archived)
      rows.push({
        key: `folder:${folder.id}`,
        dest: { kind: 'folder', folderId: folder.id },
        depth: 1,
        label: folder.name,
        icon: folder.icon || DEFAULT_FOLDER_ICON,
        color: folder.color || DEFAULT_DECK_COLOR,
        isFolder: true,
        disabled: false,
        hasChildren: children.length > 0,
      })
      if (this.isOpen(`folder:${folder.id}`)) {
        for (const child of children) this.pushDeckRows(rows, child, 2)
      }
    }
    for (const deck of rootDecks(this.data.decks).filter((d) => !d.archived)) {
      this.pushDeckRows(rows, deck, 1)
    }
    return rows
  })

  private pushDeckRows(rows: MoveRow[], deck: Deck, depth: number): void {
    const children = childDecks(this.data.decks, deck.id).filter((d) => !d.archived)
    const key = `deck:${deck.id}`
    rows.push({
      key,
      dest: { kind: 'deck', deckId: deck.id },
      depth,
      label: deck.name,
      icon: deck.icon || DEFAULT_DECK_ICON,
      color: deck.color || DEFAULT_DECK_COLOR,
      isFolder: false,
      disabled: this.data.excludeIds.has(deck.id),
      hasChildren: children.length > 0,
    })
    if (this.isOpen(key)) {
      for (const child of children) this.pushDeckRows(rows, child, depth + 1)
    }
  }

  protected rowStateClass(row: MoveRow): string {
    if (row.disabled) return 'opacity-40'
    const active = 'active:bg-primary/[0.04]'
    return this.selectedKey() === row.key ? `bg-primary/[0.06] ${active}` : active
  }

  protected isOpen(key: string): boolean {
    return !this.collapsed().has(key)
  }

  protected toggle(key: string): void {
    this.collapsed.update((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  protected select(dest: MoveDestination): void {
    this.selected.set(dest)
  }

  protected confirm(): void {
    const dest = this.selected()
    if (dest) this.ref.dismiss(dest)
  }
}

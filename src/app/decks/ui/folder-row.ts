import { Component, computed, input, output } from '@angular/core'
import { ChevronRight, Layers, LucideAngularModule } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import type { SwipeActionId, SwipeConfig } from '@app/shared/config/swipe'
import { DeckCover } from '@app/shared/ui/deck-cover'
import { LongPress } from '@app/shared/ui/long-press'
import { PluralKeyPipe } from '@app/shared/ui/plural-key.pipe'
import { SelectDot } from '@app/shared/ui/select-dot'
import { buildSwipeActions } from '@app/shared/ui/swipe-actions'
import type { SwipeActionHandlers } from '@app/shared/ui/swipe-actions'
import { SwipeRow } from '@app/shared/ui/swipe-row'
import { DEFAULT_FOLDER_ICON } from '../model/folder-appearance'
import type { Folder } from '../model/folder'

/** A folder in the library: the glyph carries pale "sheets" stacked behind it, so
 *  folders read as holding decks — not as another deck. Tap opens; swipe reveals
 *  the folder's configured quick actions; press-and-hold starts a multi-selection. */
@Component({
  selector: 'ms-folder-row',
  imports: [
    DeckCover,
    LongPress,
    LucideAngularModule,
    TranslocoPipe,
    PluralKeyPipe,
    SelectDot,
    SwipeRow,
  ],
  template: `
    <ms-swipe-row
      [leading]="swipeActions().leading"
      [trailing]="swipeActions().trailing"
      [disabled]="selectMode() || swipeDisabled()"
      [bleed]="true"
    >
      <div
        class="relative flex w-full items-center gap-3.5 rounded-card bg-card py-2.5 pr-2 pl-2.5 shadow-card"
        [class]="selected() ? 'ring-2 ring-accent ring-inset' : ''"
      >
        <!-- Whole-card activator — tap opens (or toggles selection); hold selects. -->
        @if (selectMode()) {
          <button
            type="button"
            (click)="toggleSelect.emit()"
            [attr.aria-label]="'library.select.toggle' | transloco: { name: folder().name }"
            [attr.aria-pressed]="selected()"
            class="absolute inset-0 touch-pan-y rounded-card transition-colors active:bg-primary/[0.06]"
          ></button>
        } @else {
          <button
            type="button"
            msLongPress
            (shortTap)="open.emit()"
            (longPress)="requestSelect.emit()"
            [attr.aria-label]="'folder.rowOpen' | transloco: { name: folder().name }"
            class="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]"
          ></button>
        }

        @if (selectMode()) {
          <span class="pointer-events-none relative z-20 grid shrink-0 place-items-center">
            <ms-select-dot [selected]="selected()" />
          </span>
        }

        <div class="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3.5">
          <span class="relative size-12 shrink-0">
            <span
              aria-hidden="true"
              class="absolute inset-0 translate-x-[5px] translate-y-[-4px] rounded-2xl bg-secondary/40 ring-1 ring-border/60 ring-inset"
            ></span>
            <span
              aria-hidden="true"
              class="absolute inset-0 translate-x-[2.5px] translate-y-[-2px] rounded-2xl bg-secondary/70 ring-1 ring-border/70 ring-inset"
            ></span>
            <ms-deck-cover
              [icon]="folder().icon || defaultIcon"
              [color]="folder().color"
              class="relative size-12 rounded-2xl ring-1 ring-black/10"
              iconClass="text-xl leading-none"
            />
          </span>

          <span class="min-w-0 flex-1">
            <span
              class="block truncate text-[length:var(--ms-text-title)] font-semibold text-heading"
            >
              {{ folder().name }}
            </span>
            <span
              class="mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[length:var(--ms-text-tiny)] font-semibold"
              [class]="
                deckCount() > 0
                  ? 'bg-primary/[0.07] text-primary/80'
                  : 'bg-secondary/40 text-muted-foreground'
              "
            >
              <lucide-icon [img]="layers" class="size-3" aria-hidden="true" />
              @if (deckCount() > 0) {
                {{
                  'folder.deckCount' | msPluralKey: deckCount() | transloco: { count: deckCount() }
                }}
              } @else {
                {{ 'folder.empty' | transloco }}
              }
            </span>
          </span>

          @if (!selectMode()) {
            <lucide-icon
              [img]="chevronRight"
              class="size-5 shrink-0 text-muted-foreground/70"
              aria-hidden="true"
            />
          }
        </div>
      </div>
    </ms-swipe-row>
  `,
  host: { class: 'block' },
})
export class FolderRow {
  readonly folder = input.required<Folder>()
  readonly deckCount = input.required<number>()
  /** The learner's swipe config for folders; null disables swipe on this row. */
  readonly swipe = input<SwipeConfig | null>(null)
  readonly selectMode = input(false)
  readonly selected = input(false)
  readonly open = output<void>()
  /** Press-and-hold: enter select mode with this folder selected. */
  readonly requestSelect = output<void>()
  readonly toggleSelect = output<void>()
  readonly swipeAction = output<SwipeActionId>()

  protected readonly defaultIcon = DEFAULT_FOLDER_ICON
  protected readonly layers = Layers
  protected readonly chevronRight = ChevronRight

  protected readonly swipeActions = computed(() => {
    const config = this.swipe()
    if (!config) return { leading: [], trailing: [] }
    const emit = (id: SwipeActionId) => () => this.swipeAction.emit(id)
    const handlers: SwipeActionHandlers = {
      edit: { onAction: emit('edit') },
      addDeck: { onAction: emit('addDeck') },
      delete: { onAction: emit('delete') },
    }
    return buildSwipeActions(config, handlers)
  })

  protected readonly swipeDisabled = computed(() => {
    const { leading, trailing } = this.swipeActions()
    return leading.length === 0 && trailing.length === 0
  })
}

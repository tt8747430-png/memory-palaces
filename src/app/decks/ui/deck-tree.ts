import { Component, computed, input, output } from '@angular/core'
import { ChevronRight, LucideAngularModule, Minus, Plus } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import type { SwipeActionId, SwipeConfig } from '@app/shared/config/swipe'
import { siblingDecks } from '@app/shared/domain'
import { DeckCover } from '@app/shared/ui/deck-cover'
import { LongPress } from '@app/shared/ui/long-press'
import { PluralKeyPipe } from '@app/shared/ui/plural-key.pipe'
import { SelectDot } from '@app/shared/ui/select-dot'
import { buildSwipeActions } from '@app/shared/ui/swipe-actions'
import type { SwipeActionHandlers } from '@app/shared/ui/swipe-actions'
import { SwipeRow } from '@app/shared/ui/swipe-row'
import { DECK_COLOR_OPTIONS, DEFAULT_DECK_COLOR, DEFAULT_DECK_ICON } from '../model/deck-appearance'
import type { Deck } from '../model/deck'

export interface DeckSwipeEvent {
  id: SwipeActionId
  deck: Deck
}

export function deckColor(deck: Deck): string {
  if (deck.color) return deck.color
  let hash = 0
  for (let i = 0; i < deck.id.length; i++) hash = (hash * 31 + deck.id.charCodeAt(i)) | 0
  return DECK_COLOR_OPTIONS[Math.abs(hash) % DECK_COLOR_OPTIONS.length]?.value ?? DEFAULT_DECK_COLOR
}

/**
 * One deck row and its subtree. Every row is a lifted card; subdecks stay legible
 * as children through indent, the spine, and a smaller cover rather than by
 * sitting flat. The subtree stays mounted and collapses via grid rows so open and
 * close both animate; `inert` keeps a collapsed branch out of focus and AT order.
 * The row swipes to its configured quick actions (bleeding out of the `px-5`
 * column so the tray reaches the screen edge); press-and-hold starts a
 * multi-selection, where a tap toggles the row instead of opening it.
 */
@Component({
  selector: 'ms-deck-tree-node',
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
        class="relative flex items-center gap-1.5 rounded-card bg-card py-2 pr-2 pl-1.5 shadow-card"
        [class]="selected() ? 'ring-2 ring-accent ring-inset' : ''"
      >
        <!-- Whole-card activator: a tap opens (or toggles selection); a
             press-and-hold starts a selection. -->
        @if (selectMode()) {
          <button
            type="button"
            (click)="toggleSelect.emit(deck().id)"
            [attr.aria-label]="'library.select.toggle' | transloco: { name: deck().name }"
            [attr.aria-pressed]="selected()"
            class="absolute inset-0 touch-pan-y rounded-card transition-colors active:bg-primary/[0.06]"
          ></button>
        } @else {
          <button
            type="button"
            msLongPress
            (shortTap)="open.emit(deck().id)"
            (longPress)="requestSelect.emit(deck().id)"
            [attr.aria-label]="'deck.rowOpen' | transloco: { name: deck().name }"
            class="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]"
          ></button>
        }

        <!-- The checkbox sits alongside the expand toggle, so a deck can still be
             expanded while it is selected. -->
        @if (selectMode()) {
          <span class="pointer-events-none relative z-20 grid size-6 shrink-0 place-items-center">
            <ms-select-dot [selected]="selected()" />
          </span>
        }

        @if (children().length > 0) {
          <button
            type="button"
            (click)="toggleExpand.emit(deck().id)"
            [attr.aria-label]="(isOpen() ? 'deck.collapse' : 'deck.expand') | transloco"
            [attr.aria-expanded]="isOpen()"
            class="relative z-20 grid shrink-0 place-items-center rounded-full ring-1 transition-[background-color,scale] duration-150 ease-out active:scale-[0.8]"
            [class]="toggleClass()"
          >
            <lucide-icon
              [img]="isOpen() ? icons.minus : icons.plus"
              [class]="isSub() ? 'size-3.5' : 'size-4'"
              aria-hidden="true"
            />
          </button>
        } @else {
          <span
            class="relative z-10 shrink-0"
            [class]="isSub() ? 'size-6' : 'size-7'"
            aria-hidden="true"
          ></span>
        }

        <div class="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3">
          <span class="relative shrink-0">
            <ms-deck-cover
              [icon]="deck().icon || defaultIcon"
              [color]="color()"
              class="rounded-2xl shadow-rest ring-1 ring-black/5"
              [class]="isSub() ? 'size-8' : 'size-9'"
              [iconClass]="isSub() ? 'text-[0.9rem] leading-none' : 'text-base leading-none'"
            />
            @if (due() > 0) {
              <span
                class="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[length:var(--ms-text-tiny)] font-bold text-primary-foreground tabular-nums shadow-interactive ring-2 ring-card"
                aria-hidden="true"
              >
                {{ due() > 99 ? '99+' : due() }}
              </span>
            }
          </span>

          <span class="min-w-0 flex-1">
            <span
              class="block truncate font-semibold text-heading"
              [class]="
                isSub() ? 'text-[length:var(--ms-text-sub)]' : 'text-[length:var(--ms-text-body)]'
              "
            >
              {{ deck().name }}
            </span>
            <span
              class="block truncate text-[length:var(--ms-text-label)]"
              [class]="due() > 0 ? 'font-medium text-primary/80' : 'text-muted-foreground'"
            >
              @if (due() > 0) {
                {{ 'deck.dueToday' | msPluralKey: due() | transloco: { count: due() } }}
              } @else {
                {{ 'deck.noCards' | transloco }}
              }
            </span>
          </span>

          @if (!selectMode()) {
            <lucide-icon
              [img]="icons.chevronRight"
              class="size-5 shrink-0 text-muted-foreground/70"
              aria-hidden="true"
            />
          }
        </div>
      </div>
    </ms-swipe-row>

    @if (children().length > 0) {
      <div
        class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        [class]="isOpen() ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      >
        <ul
          [inert]="!isOpen()"
          class="relative m-0 flex min-h-0 list-none flex-col gap-2 overflow-hidden p-0 pl-[22px] transition-opacity duration-300 motion-reduce:transition-none"
          [class]="isOpen() ? 'pt-2 opacity-100' : 'opacity-0'"
        >
          <!-- Nesting spine — a soft vertical guide down the indent gutter. -->
          <span
            aria-hidden="true"
            class="pointer-events-none absolute top-3 bottom-2 left-[10px] w-[2px] rounded-full bg-primary/[0.12]"
          ></span>
          @for (child of children(); track child.id) {
            <li>
              <ms-deck-tree-node
                [deck]="child"
                [depth]="depth() + 1"
                [decks]="decks()"
                [dueCounts]="dueCounts()"
                [expanded]="expanded()"
                [swipe]="swipe()"
                [selectMode]="selectMode()"
                [selectedIds]="selectedIds()"
                (toggleExpand)="toggleExpand.emit($event)"
                (open)="open.emit($event)"
                (requestSelect)="requestSelect.emit($event)"
                (toggleSelect)="toggleSelect.emit($event)"
                (swipeAction)="swipeAction.emit($event)"
              />
            </li>
          }
        </ul>
      </div>
    }
  `,
  host: { class: 'block' },
})
export class DeckTreeNode {
  readonly deck = input.required<Deck>()
  readonly depth = input.required<number>()
  readonly decks = input.required<Deck[]>()
  readonly dueCounts = input.required<ReadonlyMap<string, number>>()
  readonly expanded = input.required<ReadonlySet<string>>()
  /** The learner's swipe config for decks; null disables swipe on this row. */
  readonly swipe = input<SwipeConfig | null>(null)
  readonly selectMode = input(false)
  readonly selectedIds = input<ReadonlySet<string>>(new Set())
  readonly toggleExpand = output<string>()
  readonly open = output<string>()
  /** Press-and-hold: enter select mode with this deck selected. */
  readonly requestSelect = output<string>()
  readonly toggleSelect = output<string>()
  readonly swipeAction = output<DeckSwipeEvent>()

  protected readonly icons = { plus: Plus, minus: Minus, chevronRight: ChevronRight }
  protected readonly defaultIcon = DEFAULT_DECK_ICON

  protected readonly children = computed(() => siblingDecks(this.decks(), this.deck().id))
  protected readonly isOpen = computed(() => this.expanded().has(this.deck().id))
  protected readonly isSub = computed(() => this.depth() > 0)
  protected readonly due = computed(() => this.dueCounts().get(this.deck().id) ?? 0)
  protected readonly color = computed(() => deckColor(this.deck()))
  protected readonly selected = computed(() => this.selectedIds().has(this.deck().id))

  protected readonly swipeActions = computed(() => {
    const config = this.swipe()
    if (!config) return { leading: [], trailing: [] }
    const deck = this.deck()
    const emit = (id: SwipeActionId) => () => this.swipeAction.emit({ id, deck })
    const handlers: SwipeActionHandlers = {
      favorite: {
        onAction: emit('favorite'),
        labelKey: deck.favorite ? 'deck.unfavorite' : 'deck.favorite',
      },
      move: { onAction: emit('move') },
      settings: { onAction: emit('settings') },
      addSubdeck: { onAction: emit('addSubdeck') },
      duplicate: { onAction: emit('duplicate') },
      archive: { onAction: emit('archive') },
      delete: { onAction: emit('delete') },
    }
    return buildSwipeActions(config, handlers)
  })

  protected readonly swipeDisabled = computed(() => {
    const { leading, trailing } = this.swipeActions()
    return leading.length === 0 && trailing.length === 0
  })

  protected readonly toggleClass = computed(() => {
    const frame = this.isSub() ? 'size-6' : 'size-7'
    const surface = this.isOpen()
      ? 'bg-primary/10 text-primary ring-primary/15'
      : 'bg-info-surface text-primary ring-primary/10'
    return `${frame} ${surface}`
  })
}

/** The deck tree for one scope: root decks of `folderId` (or the unfiled root)
 *  with their nested subdecks. */
@Component({
  selector: 'ms-deck-tree',
  imports: [DeckTreeNode],
  template: `
    <ul class="m-0 flex list-none flex-col gap-2 p-0">
      @for (root of roots(); track root.id) {
        <li>
          <ms-deck-tree-node
            [deck]="root"
            [depth]="0"
            [decks]="decks()"
            [dueCounts]="dueCounts()"
            [expanded]="expanded()"
            [swipe]="swipe()"
            [selectMode]="selectMode()"
            [selectedIds]="selectedIds()"
            (toggleExpand)="toggleExpand.emit($event)"
            (open)="open.emit($event)"
            (requestSelect)="requestSelect.emit($event)"
            (toggleSelect)="toggleSelect.emit($event)"
            (swipeAction)="swipeAction.emit($event)"
          />
        </li>
      }
    </ul>
  `,
  host: { class: 'block' },
})
export class DeckTree {
  readonly decks = input.required<Deck[]>()
  readonly dueCounts = input.required<ReadonlyMap<string, number>>()
  readonly expanded = input.required<ReadonlySet<string>>()
  readonly folderId = input<string | null>(null)
  /** The learner's swipe config for decks; null disables swipe. */
  readonly swipe = input<SwipeConfig | null>(null)
  readonly selectMode = input(false)
  readonly selectedIds = input<ReadonlySet<string>>(new Set())
  readonly toggleExpand = output<string>()
  readonly open = output<string>()
  /** Press-and-hold: enter select mode with this deck selected. */
  readonly requestSelect = output<string>()
  readonly toggleSelect = output<string>()
  readonly swipeAction = output<DeckSwipeEvent>()

  protected readonly roots = computed(() => siblingDecks(this.decks(), null, this.folderId()))
}

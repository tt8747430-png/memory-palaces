import { Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { Location } from '@angular/common'
import { CdkDrag, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop'
import type { CdkDragDrop } from '@angular/cdk/drag-drop'
import { MatButton } from '@angular/material/button'
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ChevronRight,
  Folder,
  Layers,
  LucideAngularModule,
  RotateCcw,
  WalletCards,
} from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import {
  DEFAULT_SWIPE,
  normalizeSwipeConfig,
  SWIPE_ACCENT,
  SWIPE_ACTION_META,
  SWIPE_ACTIONS,
  SWIPE_ITEM_TYPES,
  SWIPE_SIDE_MAX,
} from '@app/shared/config/swipe'
import type { SwipeActionId, SwipeConfig, SwipeItemType } from '@app/shared/config/swipe'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { SegmentedControl } from '@app/shared/ui/segmented-control'
import type { SegmentedOption } from '@app/shared/ui/segmented-control'
import { swipeActionIcon } from '@app/shared/ui/swipe-actions'
import { PreferencesStore } from '../data/preferences-store'
import { setPreferences } from '../commands/set-preferences'

const TYPE_ICON: Record<SwipeItemType, LucideIconData> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}

type CapSide = keyof SwipeConfig

/**
 * Swipe-action preferences: pick what a left or right swipe does per row type.
 * The preview is live — caps drag to reorder within a side or hop across the
 * sample row to the other side (CDK drag-drop); the chip groups below toggle
 * actions on and off. An action lives on one side only.
 */
@Component({
  selector: 'ms-settings-swipe-page',
  imports: [
    CdkDrag,
    CdkDragPreview,
    CdkDropList,
    ScreenHeader,
    SegmentedControl,
    MatButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  template: `
    <ms-screen-header
      [title]="'swipe.title' | transloco"
      [backLabel]="'settings.back' | transloco"
      (back)="back()"
    />

    <main class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe overscroll-contain scrollbar-hide">
      <div class="mt-3 flex flex-col gap-4 pb-24">
        <p
          class="flex items-start gap-2 px-1 text-[length:var(--ms-text-label)] leading-relaxed text-muted-foreground"
        >
          <lucide-icon
            [img]="icons.arrowLeftRight"
            class="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          {{ 'swipe.subtitle' | transloco }}
        </p>

        <ms-segmented-control
          [label]="'swipe.title' | transloco"
          [value]="type()"
          [options]="typeOptions()"
          size="sm"
          (valueChange)="type.set($event)"
        />

        <!-- The preview is live: caps drag to reorder or hop sides. -->
        <div class="flex items-center gap-1">
          <div
            cdkDropList
            #leadingList="cdkDropList"
            cdkDropListOrientation="horizontal"
            [cdkDropListData]="leadingSide"
            [cdkDropListConnectedTo]="[trailingList]"
            [cdkDropListEnterPredicate]="canEnterLeading"
            (cdkDropListDropped)="onDrop($event)"
            class="flex min-h-9 shrink-0 items-center gap-1 rounded-2xl transition-colors"
            [class]="items().leading.length === 0 ? 'w-9 justify-center' : ''"
          >
            @for (id of items().leading; track id) {
              <button
                cdkDrag
                cdkDragLockAxis="x"
                type="button"
                [attr.aria-label]="reorderLabel(id)"
                class="shrink-0 cursor-grab rounded-[14px] active:cursor-grabbing"
              >
                <span
                  [style.background-color]="fill(id)"
                  class="grid size-9 place-items-center rounded-[14px]"
                  [class]="ink(id)"
                >
                  <lucide-icon [img]="icon(id)" class="size-4" aria-hidden="true" />
                </span>
                <span
                  *cdkDragPreview
                  [style.background-color]="fill(id)"
                  class="grid size-9 scale-105 place-items-center rounded-[14px] shadow-elevated"
                  [class]="ink(id)"
                >
                  <lucide-icon [img]="icon(id)" class="size-4" aria-hidden="true" />
                </span>
              </button>
            } @empty {
              <span
                aria-hidden="true"
                class="size-8 rounded-[13px] border-2 border-dashed border-border"
              ></span>
            }
          </div>

          <div
            aria-hidden="true"
            class="flex min-w-0 flex-1 items-center gap-2.5 rounded-card bg-card px-3 py-2.5 shadow-rest"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-primary"
            >
              <lucide-icon [img]="typeIcon()" class="size-4" />
            </span>
            <span
              class="min-w-0 flex-1 truncate text-[length:var(--ms-text-body)] font-semibold text-heading"
            >
              {{ 'swipe.sample.' + type() | transloco }}
            </span>
            <lucide-icon [img]="icons.chevronRight" class="size-4 shrink-0 text-muted-foreground" />
          </div>

          <div
            cdkDropList
            #trailingList="cdkDropList"
            cdkDropListOrientation="horizontal"
            [cdkDropListData]="trailingSide"
            [cdkDropListConnectedTo]="[leadingList]"
            [cdkDropListEnterPredicate]="canEnterTrailing"
            (cdkDropListDropped)="onDrop($event)"
            class="flex min-h-9 shrink-0 items-center gap-1 rounded-2xl transition-colors"
            [class]="items().trailing.length === 0 ? 'w-9 justify-center' : ''"
          >
            @for (id of items().trailing; track id) {
              <button
                cdkDrag
                cdkDragLockAxis="x"
                type="button"
                [attr.aria-label]="reorderLabel(id)"
                class="shrink-0 cursor-grab rounded-[14px] active:cursor-grabbing"
              >
                <span
                  [style.background-color]="fill(id)"
                  class="grid size-9 place-items-center rounded-[14px]"
                  [class]="ink(id)"
                >
                  <lucide-icon [img]="icon(id)" class="size-4" aria-hidden="true" />
                </span>
                <span
                  *cdkDragPreview
                  [style.background-color]="fill(id)"
                  class="grid size-9 scale-105 place-items-center rounded-[14px] shadow-elevated"
                  [class]="ink(id)"
                >
                  <lucide-icon [img]="icon(id)" class="size-4" aria-hidden="true" />
                </span>
              </button>
            } @empty {
              <span
                aria-hidden="true"
                class="size-8 rounded-[13px] border-2 border-dashed border-border"
              ></span>
            }
          </div>
        </div>

        <section class="divide-y divide-border/60 rounded-card bg-card shadow-rest">
          @for (side of sides; track side) {
            <div class="p-3.5">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="inline-flex items-center gap-1.5 text-[length:var(--ms-text-label)] font-bold text-heading"
                >
                  <span
                    class="grid size-5 place-items-center rounded-md bg-primary/[0.07] text-primary"
                  >
                    <lucide-icon
                      [img]="side === 'leading' ? icons.arrowRight : icons.arrowLeft"
                      class="size-3.5"
                      aria-hidden="true"
                    />
                  </span>
                  {{ 'swipe.' + side | transloco }}
                </span>
                <span
                  class="rounded-pill px-2 py-0.5 text-[length:var(--ms-text-tiny)] font-bold tabular-nums"
                  [class]="
                    atCap(side)
                      ? 'bg-info-surface text-info-foreground'
                      : 'bg-secondary/50 text-muted-foreground'
                  "
                >
                  {{
                    'swipe.sideCount' | transloco: { count: config()[side].length, max: max(side) }
                  }}
                </span>
              </div>

              <div class="mt-2.5 flex flex-wrap gap-1.5">
                @for (id of palette(); track id) {
                  <button
                    type="button"
                    [attr.aria-pressed]="isOn(side, id)"
                    [disabled]="!isOn(side, id) && atCap(side)"
                    (click)="toggle(side, id)"
                    [style.--sw]="isOn(side, id) ? fill(id) : null"
                    class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[length:var(--ms-text-label)] font-semibold transition-[transform,background-color,color,opacity] active:scale-[0.96] focus-visible:ring-[3px] focus-visible:ring-primary/30 focus-visible:outline-none disabled:opacity-40"
                    [class]="isOn(side, id) ? 'sw-tint' : 'bg-secondary/40 text-muted-foreground'"
                  >
                    <lucide-icon [img]="icon(id)" class="size-3.5" aria-hidden="true" />
                    {{ labelKey(id) | transloco }}
                  </button>
                }
              </div>
            </div>
          }
        </section>

        <button matButton type="button" class="self-start" (click)="resetAll()">
          <lucide-icon [img]="icons.rotateCcw" class="size-[18px]" aria-hidden="true" />
          {{ 'swipe.reset' | transloco }}
        </button>
      </div>
    </main>
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class SettingsSwipePage {
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly preferencesStore = inject(PreferencesStore)

  protected readonly icons = {
    arrowLeft: ArrowLeft,
    arrowLeftRight: ArrowLeftRight,
    arrowRight: ArrowRight,
    chevronRight: ChevronRight,
    rotateCcw: RotateCcw,
  }

  protected readonly sides: CapSide[] = ['leading', 'trailing']
  /** Bound as each drop list's data, so a drop knows which side it landed on. */
  protected readonly leadingSide: CapSide = 'leading'
  protected readonly trailingSide: CapSide = 'trailing'

  protected readonly type = signal<SwipeItemType>('deck')
  protected readonly config = computed(() => this.preferencesStore.effective().swipe[this.type()])

  /** Working copy for the preview caps: a drop is true on screen the instant the
   *  finger lifts, instead of waiting out the store round-trip. */
  protected readonly items = linkedSignal<SwipeConfig>(() => ({
    leading: [...this.config().leading],
    trailing: [...this.config().trailing],
  }))

  protected readonly typeOptions = computed<SegmentedOption<SwipeItemType>[]>(() =>
    SWIPE_ITEM_TYPES.map((value) => ({
      value,
      label: this.transloco.translate(`swipe.types.${value}`),
      icon: TYPE_ICON[value],
      ariaLabel: this.transloco.translate(`swipe.types.${value}`),
    })),
  )

  protected readonly typeIcon = computed(() => TYPE_ICON[this.type()])
  protected readonly palette = computed(() => SWIPE_ACTIONS[this.type()])

  protected readonly canEnterLeading = (): boolean =>
    this.items().leading.length < SWIPE_SIDE_MAX.leading
  protected readonly canEnterTrailing = (): boolean =>
    this.items().trailing.length < SWIPE_SIDE_MAX.trailing

  protected fill(id: SwipeActionId): string {
    return SWIPE_ACCENT[SWIPE_ACTION_META[id].accent].fill
  }

  protected ink(id: SwipeActionId): string {
    return SWIPE_ACCENT[SWIPE_ACTION_META[id].accent].ink === 'dark'
      ? 'text-[color:var(--ms-navy-900)]'
      : 'text-white'
  }

  protected icon(id: SwipeActionId): LucideIconData {
    return swipeActionIcon(id)
  }

  protected labelKey(id: SwipeActionId): string {
    return SWIPE_ACTION_META[id].labelKey
  }

  protected reorderLabel(id: SwipeActionId): string {
    return this.transloco.translate('swipe.reorderLabel', {
      name: this.transloco.translate(this.labelKey(id)),
    })
  }

  protected max(side: CapSide): number {
    return SWIPE_SIDE_MAX[side]
  }

  protected atCap(side: CapSide): boolean {
    return this.config()[side].length >= SWIPE_SIDE_MAX[side]
  }

  protected isOn(side: CapSide, id: SwipeActionId): boolean {
    return this.config()[side].includes(id)
  }

  protected onDrop(event: CdkDragDrop<CapSide>): void {
    const from = event.previousContainer.data
    const to = event.container.data
    const current = this.items()
    const next: SwipeConfig = {
      leading: [...current.leading],
      trailing: [...current.trailing],
    }
    const [moved] = next[from].splice(event.previousIndex, 1)
    if (!moved) return
    next[to].splice(event.currentIndex, 0, moved)
    this.items.set(next)
    this.save(next)
  }

  protected toggle(side: CapSide, id: SwipeActionId): void {
    const current = this.config()
    if (current[side].includes(id)) {
      this.save({ ...current, [side]: current[side].filter((x) => x !== id) })
      return
    }
    // An action lives on one side only, so picking it here takes it off the other.
    const other: CapSide = side === 'leading' ? 'trailing' : 'leading'
    this.save({
      ...current,
      [side]: [...current[side], id],
      [other]: current[other].filter((x) => x !== id),
    })
  }

  protected resetAll(): void {
    void setPreferences(this.preferencesStore, { swipe: DEFAULT_SWIPE })
  }

  protected back(): void {
    this.location.back()
  }

  private save(next: SwipeConfig): void {
    const type = this.type()
    void setPreferences(this.preferencesStore, {
      swipe: {
        ...this.preferencesStore.effective().swipe,
        [type]: normalizeSwipeConfig(type, next),
      },
    })
  }
}

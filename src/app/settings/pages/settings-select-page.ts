import { Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { Location } from '@angular/common'
import { CdkDrag, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop'
import type { CdkDragDrop } from '@angular/cdk/drag-drop'
import { MatButton } from '@angular/material/button'
import {
  CheckSquare,
  Layers,
  ListChecks,
  LucideAngularModule,
  Plus,
  RotateCcw,
  WalletCards,
  X,
} from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import {
  DEFAULT_SELECT_TOOLBAR,
  normalizeSelectToolbar,
  SELECT_ACTION_META,
  SELECT_ACTIONS,
  SELECT_SURFACES,
  SELECT_TOOLBAR_MAX,
} from '@app/shared/config/select-toolbar'
import type {
  SelectActionId,
  SelectSurface,
  SelectToolbarConfig,
} from '@app/shared/config/select-toolbar'
import { SWIPE_ACCENT } from '@app/shared/config/swipe'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { SegmentedControl } from '@app/shared/ui/segmented-control'
import type { SegmentedOption } from '@app/shared/ui/segmented-control'
import { selectActionIcon } from '@app/shared/ui/select-actions'
import { PreferencesStore } from '../data/preferences-store'
import { setPreferences } from '../commands/set-preferences'

const SURFACE_ICON: Record<SelectSurface, LucideIconData> = {
  library: Layers,
  card: WalletCards,
  question: ListChecks,
}

/**
 * Select-toolbar preferences: which actions the multi-select bar carries per
 * surface. The preview is the editor — the bar as it will appear, where tiles
 * drag to reorder (CDK drag-drop) and carry a remove badge; the palette below
 * adds what is not in the bar yet. The bar always keeps one action.
 */
@Component({
  selector: 'ms-settings-select-page',
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
      [title]="'select.title' | transloco"
      [backLabel]="'settings.back' | transloco"
      (back)="back()"
    />

    <main class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe overscroll-contain scrollbar-hide">
      <div class="mt-3 flex flex-col gap-4 pb-24">
        <p
          class="flex items-start gap-2 px-1 text-[length:var(--ms-text-label)] leading-relaxed text-muted-foreground"
        >
          <lucide-icon
            [img]="icons.checkSquare"
            class="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          {{ 'select.subtitle' | transloco }}
        </p>

        <ms-segmented-control
          [label]="'select.title' | transloco"
          [value]="surface()"
          [options]="surfaceOptions()"
          size="sm"
          (valueChange)="surface.set($event)"
        />

        <!-- The preview is the editor: this is the bar as it will appear, and it
             is where actions are reordered and removed. -->
        <div class="rounded-card bg-card p-3.5 shadow-rest">
          <span class="text-[length:var(--ms-text-label)] font-bold text-heading">
            {{ 'select.inBar' | transloco }}
          </span>

          <div
            cdkDropList
            cdkDropListOrientation="horizontal"
            (cdkDropListDropped)="onDrop($event)"
            class="mt-2.5 flex items-stretch gap-1.5 rounded-card-featured bg-card/95 p-2 shadow-elevated"
          >
            @for (id of items(); track id) {
              <div cdkDrag cdkDragLockAxis="x" class="relative min-w-0 flex-1">
                <button
                  type="button"
                  [attr.aria-label]="reorderLabel(id)"
                  class="w-full cursor-grab active:cursor-grabbing"
                >
                  <span
                    class="flex size-full min-w-0 flex-col items-center justify-center gap-1 rounded-control px-1 py-2"
                    [class]="tileTone(id)"
                  >
                    <lucide-icon [img]="icon(id)" class="size-[18px]" aria-hidden="true" />
                    <span
                      class="w-full truncate text-center text-[length:var(--ms-text-tiny)] font-semibold"
                    >
                      {{ labelKey(id) | transloco }}
                    </span>
                  </span>
                </button>

                @if (canRemove()) {
                  <button
                    type="button"
                    (click)="remove(id)"
                    [attr.aria-label]="removeLabel(id)"
                    class="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-heading text-[color:var(--surface)] shadow-rest transition-transform active:scale-90"
                  >
                    <lucide-icon
                      [img]="icons.x"
                      class="size-3"
                      [strokeWidth]="3"
                      aria-hidden="true"
                    />
                  </button>
                }

                <!-- The tile in hand keeps the footprint of the tile it came out
                     of; elevation carries the lift instead. -->
                <span
                  *cdkDragPreview
                  class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-control px-4 py-2 shadow-elevated ring-1 ring-accent/40"
                  [class]="tileTone(id)"
                >
                  <lucide-icon [img]="icon(id)" class="size-[18px]" aria-hidden="true" />
                  <span
                    class="w-full truncate text-center text-[length:var(--ms-text-tiny)] font-semibold"
                  >
                    {{ labelKey(id) | transloco }}
                  </span>
                </span>
              </div>
            }
          </div>
        </div>

        <section class="rounded-card bg-card p-3.5 shadow-rest">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[length:var(--ms-text-label)] font-bold text-heading">
              {{ 'select.available' | transloco }}
            </span>
            <span
              class="rounded-pill px-2 py-0.5 text-[length:var(--ms-text-tiny)] font-bold tabular-nums"
              [class]="
                full()
                  ? 'bg-info-surface text-info-foreground'
                  : 'bg-secondary/50 text-muted-foreground'
              "
            >
              {{ 'select.slots' | transloco: { count: config().length, max: maxSlots } }}
            </span>
          </div>

          @if (palette().length === 0) {
            <p class="mt-2.5 text-[length:var(--ms-text-label)] text-muted-foreground">
              {{ 'select.allInUse' | transloco }}
            </p>
          } @else {
            <div class="mt-2.5 flex flex-wrap gap-1.5">
              @for (id of palette(); track id) {
                <button
                  type="button"
                  [disabled]="full()"
                  (click)="add(id)"
                  [attr.aria-label]="addLabel(id)"
                  [style.--sw]="fill(id)"
                  class="sw-tint inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[length:var(--ms-text-label)] font-semibold transition-[transform,opacity] active:scale-[0.96] focus-visible:ring-[3px] focus-visible:ring-primary/30 focus-visible:outline-none disabled:opacity-40"
                >
                  <lucide-icon [img]="icon(id)" class="size-3.5" aria-hidden="true" />
                  {{ labelKey(id) | transloco }}
                  <lucide-icon [img]="icons.plus" class="size-3.5" aria-hidden="true" />
                </button>
              }
            </div>
          }

          @if (full()) {
            <p class="mt-2.5 text-[length:var(--ms-text-tiny)] text-muted-foreground">
              {{ 'select.full' | transloco }}
            </p>
          }
        </section>

        <button matButton type="button" class="self-start" (click)="resetAll()">
          <lucide-icon [img]="icons.rotateCcw" class="size-[18px]" aria-hidden="true" />
          {{ 'select.reset' | transloco }}
        </button>
      </div>
    </main>
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class SettingsSelectPage {
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly preferencesStore = inject(PreferencesStore)

  protected readonly icons = {
    checkSquare: CheckSquare,
    plus: Plus,
    rotateCcw: RotateCcw,
    x: X,
  }

  protected readonly maxSlots = SELECT_TOOLBAR_MAX

  protected readonly surface = signal<SelectSurface>('library')
  protected readonly config = computed(
    () => this.preferencesStore.effective().selectToolbar[this.surface()],
  )

  /** Working copy for the bar: a dropped tile is true on screen the instant the
   *  finger lifts, instead of waiting out the store round-trip. */
  protected readonly items = linkedSignal<SelectToolbarConfig>(() => [...this.config()])

  protected readonly surfaceOptions = computed<SegmentedOption<SelectSurface>[]>(() =>
    SELECT_SURFACES.map((value) => ({
      value,
      label: this.transloco.translate(`select.surfaces.${value}`),
      icon: SURFACE_ICON[value],
      ariaLabel: this.transloco.translate(`select.surfaces.${value}`),
    })),
  )

  protected readonly palette = computed(() =>
    SELECT_ACTIONS[this.surface()].filter((id) => !this.config().includes(id)),
  )

  protected readonly full = computed(() => this.config().length >= SELECT_TOOLBAR_MAX)
  protected readonly canRemove = computed(() => this.items().length > 1)

  protected fill(id: SelectActionId): string {
    return SWIPE_ACCENT[SELECT_ACTION_META[id].accent].fill
  }

  protected icon(id: SelectActionId): LucideIconData {
    return selectActionIcon(id)
  }

  protected labelKey(id: SelectActionId): string {
    return SELECT_ACTION_META[id].labelKey
  }

  protected tileTone(id: SelectActionId): string {
    return SELECT_ACTION_META[id].destructive
      ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
      : 'bg-info-surface text-heading'
  }

  protected reorderLabel(id: SelectActionId): string {
    return this.transloco.translate('select.reorderLabel', { name: this.actionName(id) })
  }

  protected removeLabel(id: SelectActionId): string {
    return this.transloco.translate('select.removeLabel', { name: this.actionName(id) })
  }

  protected addLabel(id: SelectActionId): string {
    return this.transloco.translate('select.addLabel', { name: this.actionName(id) })
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return
    const next = [...this.items()]
    const [moved] = next.splice(event.previousIndex, 1)
    if (!moved) return
    next.splice(event.currentIndex, 0, moved)
    this.items.set(next)
    this.save(next)
  }

  protected add(id: SelectActionId): void {
    if (this.full()) return
    this.save([...this.config(), id])
  }

  /** The bar always keeps one action — an empty toolbar would strand a selection. */
  protected remove(id: SelectActionId): void {
    const config = this.config()
    if (config.length <= 1) return
    this.save(config.filter((x) => x !== id))
  }

  /** The preview above snaps back to the defaults, so the reset speaks for itself. */
  protected resetAll(): void {
    void setPreferences(this.preferencesStore, { selectToolbar: DEFAULT_SELECT_TOOLBAR })
  }

  protected back(): void {
    this.location.back()
  }

  private save(next: SelectToolbarConfig): void {
    const surface = this.surface()
    void setPreferences(this.preferencesStore, {
      selectToolbar: {
        ...this.preferencesStore.effective().selectToolbar,
        [surface]: normalizeSelectToolbar(surface, next),
      },
    })
  }

  private actionName(id: SelectActionId): string {
    return this.transloco.translate(this.labelKey(id))
  }
}

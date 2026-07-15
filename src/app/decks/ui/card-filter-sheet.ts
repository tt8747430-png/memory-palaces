import { Component, computed, inject, signal } from '@angular/core'
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatButton } from '@angular/material/button'
import { MatSlideToggle } from '@angular/material/slide-toggle'
import { Flag, LucideAngularModule } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import type { SrsStatus } from '@app/shared/domain'
import { SheetShell } from '@app/shared/ui/sheet-shell'
import type { StudyBreakdown } from './study-overview-card'

export interface CardFilter {
  maturity: SrsStatus[]
  flagged: boolean
}

export interface CardFilterSheetData {
  filter: CardFilter
  counts: StudyBreakdown
}

const MATURITY_DOT: Record<SrsStatus, string> = {
  new: 'bg-[var(--text-faint)]',
  learning: 'bg-accent',
  known: 'bg-success',
}

/** Card list filter: maturity chips plus a flagged-only toggle; dismisses with the
 *  drafted filter on apply, or undefined when cancelled. */
@Component({
  selector: 'ms-card-filter-sheet',
  imports: [SheetShell, MatButton, MatSlideToggle, LucideAngularModule, TranslocoPipe],
  template: `
    <ms-sheet-shell [title]="'cards.filter.title' | transloco" (closed)="ref.dismiss()">
      <div class="flex flex-col gap-5 pb-2">
        <div>
          <p
            class="mb-2 px-1 text-[length:var(--ms-text-label)] font-bold tracking-wide text-muted-foreground uppercase"
          >
            {{ 'cards.filter.maturity' | transloco }}
          </p>
          <div class="flex flex-wrap gap-2">
            @for (key of maturityKeys; track key) {
              <button
                type="button"
                [attr.aria-pressed]="maturity().has(key)"
                (click)="toggleMaturity(key)"
                class="inline-flex items-center gap-2 rounded-pill py-2 pr-2 pl-3 text-[length:var(--ms-text-label)] font-semibold transition-[background-color,box-shadow,scale] duration-150 active:scale-[0.96]"
                [class]="
                  maturity().has(key)
                    ? 'bg-primary text-primary-foreground shadow-interactive'
                    : 'bg-secondary/40 text-heading ring-1 ring-primary/10 ring-inset'
                "
              >
                <span
                  aria-hidden="true"
                  class="size-2.5 rounded-full transition-colors"
                  [class]="maturity().has(key) ? 'bg-primary-foreground' : dots[key]"
                ></span>
                <span>{{ 'cards.filter.' + key | transloco }}</span>
                <span
                  class="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[length:var(--ms-text-tiny)] font-bold tabular-nums transition-colors"
                  [class]="
                    maturity().has(key)
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-card text-muted-foreground'
                  "
                >
                  {{ data.counts[key] }}
                </span>
              </button>
            }
          </div>
        </div>

        <div>
          <p
            class="mb-2 px-1 text-[length:var(--ms-text-label)] font-bold tracking-wide text-muted-foreground uppercase"
          >
            {{ 'cards.filter.status' | transloco }}
          </p>
          <div
            class="flex items-center justify-between gap-3 rounded-card bg-secondary/40 px-3.5 py-3"
          >
            <span
              class="inline-flex items-center gap-2.5 text-[length:var(--ms-text-body)] font-semibold text-heading"
            >
              <span
                aria-hidden="true"
                class="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--warning-surface)]"
              >
                <lucide-icon
                  [img]="flag"
                  class="size-4 text-[var(--warning-foreground)]"
                  aria-hidden="true"
                />
              </span>
              {{ 'cards.filter.flagged' | transloco }}
            </span>
            <mat-slide-toggle
              [checked]="flagged()"
              (change)="flagged.set($event.checked)"
              [attr.aria-label]="'cards.filter.flagged' | transloco"
            />
          </div>
        </div>
      </div>

      <div footer class="flex gap-2">
        <button
          matButton
          type="button"
          class="flex-1"
          [disabled]="draftCount() === 0"
          (click)="reset()"
        >
          {{ 'cards.filter.reset' | transloco }}
        </button>
        <button matButton="filled" type="button" class="flex-1" (click)="apply()">
          {{ 'cards.filter.apply' | transloco }}
        </button>
      </div>
    </ms-sheet-shell>
  `,
  host: { class: 'flex max-h-full min-h-0 flex-col' },
})
export class CardFilterSheet {
  protected readonly data = inject<CardFilterSheetData>(MAT_BOTTOM_SHEET_DATA)
  protected readonly ref = inject(MatBottomSheetRef<CardFilterSheet, CardFilter>)

  protected readonly flag = Flag
  protected readonly maturityKeys: readonly SrsStatus[] = ['new', 'learning', 'known']
  protected readonly dots = MATURITY_DOT

  protected readonly maturity = signal<ReadonlySet<SrsStatus>>(new Set(this.data.filter.maturity))
  protected readonly flagged = signal(this.data.filter.flagged)

  protected readonly draftCount = computed(() => this.maturity().size + (this.flagged() ? 1 : 0))

  protected toggleMaturity(key: SrsStatus): void {
    this.maturity.update((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  protected reset(): void {
    this.maturity.set(new Set())
    this.flagged.set(false)
  }

  protected apply(): void {
    this.ref.dismiss({ maturity: [...this.maturity()], flagged: this.flagged() })
  }
}

import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core'
import { Router } from '@angular/router'
import { Location } from '@angular/common'
import { Check, ChevronLeft, ChevronRight, LucideAngularModule, Plus } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import { cardsInSubtree } from '@app/shared/domain'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { ToastService } from '@app/shared/ui/toast'
import { CardStore, DeckStore } from '../data/stores'
import { createCard, editCard } from '../commands/card-index'
import { CardFields } from '../ui/card-fields'

interface CardData {
  front: string
  back: string
  hint?: string
  tip?: string
}

/**
 * Create or edit a card. Creating saves-and-clears so cards chain quickly; editing
 * saves in place with a saved flash, and prev/next walk the deck's whole subtree —
 * matching the deck page's list — committing any dirty edit on the way.
 */
@Component({
  selector: 'ms-card-editor-page',
  imports: [ScreenHeader, CardFields, LucideAngularModule, TranslocoPipe],
  template: `
    <ms-screen-header
      [title]="(editing() ? 'cards.editor.editTitle' : 'cards.editor.newTitle') | transloco"
      [subtitle]="deck()?.name ?? ''"
      [backLabel]="'common.back' | transloco"
      (back)="goBack()"
    >
      <button
        type="button"
        [disabled]="!valid()"
        (click)="save()"
        [attr.aria-label]="saveLabel()"
        class="flex h-11 shrink-0 items-center gap-1.5 rounded-control px-5 text-[length:var(--ms-text-sub)] font-semibold text-primary-foreground shadow-interactive transition-[background-color,scale] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
        [class]="justSaved() ? 'bg-success' : 'bg-primary'"
      >
        <lucide-icon
          [img]="justSaved() ? icons.check : editing() ? icons.check : icons.plus"
          class="size-[18px]"
          aria-hidden="true"
        />
        {{ (justSaved() ? 'cards.editor.saved' : 'cards.editor.save') | transloco }}
      </button>
    </ms-screen-header>

    <main class="min-h-0 flex-1 overflow-y-auto px-5 overscroll-contain scrollbar-hide">
      <div class="mt-4 pb-8">
        <ms-card-fields
          [(front)]="front"
          [(back)]="back"
          [(hint)]="hint"
          [(tip)]="tip"
          [autoFocus]="!editing()"
        />
      </div>
    </main>

    @if (showNav()) {
      <nav
        class="shrink-0 border-t border-white/40 bg-glass px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]"
        [attr.aria-label]="'cards.editor.prevCard' | transloco"
      >
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            [disabled]="!prevCard()"
            (click)="goToCard(prevCard())"
            class="inline-flex h-11 items-center gap-1 rounded-control bg-secondary px-3.5 text-[length:var(--ms-text-sub)] font-semibold text-secondary-foreground transition-transform duration-200 ease-out active:scale-95 disabled:pointer-events-none disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-50"
          >
            <lucide-icon [img]="icons.chevronLeft" class="size-5" aria-hidden="true" />
            {{ 'cards.editor.prevCard' | transloco }}
          </button>
          <div class="flex flex-col items-center gap-1.5">
            <span class="text-[length:var(--ms-text-sub)] font-bold text-heading tabular-nums">
              {{ position() + 1
              }}<span class="font-semibold text-muted-foreground"> / {{ deckCards().length }}</span>
            </span>
            <span class="block h-1 w-16 overflow-hidden rounded-full bg-border" aria-hidden="true">
              <span
                class="block h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                [style.width.%]="((position() + 1) / deckCards().length) * 100"
              ></span>
            </span>
          </div>
          <button
            type="button"
            [disabled]="!nextCard()"
            (click)="goToCard(nextCard())"
            class="inline-flex h-11 items-center gap-1 rounded-control bg-secondary px-3.5 text-[length:var(--ms-text-sub)] font-semibold text-secondary-foreground transition-transform duration-200 ease-out active:scale-95 disabled:pointer-events-none disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-50"
          >
            {{ 'cards.editor.nextCard' | transloco }}
            <lucide-icon [img]="icons.chevronRight" class="size-5" aria-hidden="true" />
          </button>
        </div>
      </nav>
    }
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class CardEditorPage {
  readonly deckId = input.required<string>()
  readonly cardId = input<string | undefined>(undefined)

  private readonly router = inject(Router)
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly toast = inject(ToastService)
  private readonly cardStore = inject(CardStore)
  private readonly deckStore = inject(DeckStore)

  protected readonly icons = {
    check: Check,
    plus: Plus,
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
  }

  constructor() {
    this.cardStore.start()
    this.deckStore.start()

    // Arriving on a card (including via prev/next) loads its fields fresh. Keyed to
    // the card *id* — store emissions for the same card must not wipe live edits.
    effect(() => {
      this.editingId()
      const editing = untracked(() => this.editing())
      this.front.set(editing?.front ?? '')
      this.back.set(editing?.back ?? '')
      this.hint.set(editing?.hint ?? '')
      this.tip.set(editing?.tip ?? '')
      this.justSaved.set(false)
    })
  }

  protected readonly front = signal('')
  protected readonly back = signal('')
  protected readonly hint = signal('')
  protected readonly tip = signal('')
  protected readonly justSaved = signal(false)
  private savedTimer: number | undefined

  protected readonly deck = computed(
    () => this.deckStore.decks().find((d) => d.id === this.deckId()) ?? null,
  )

  protected readonly editing = computed(() => {
    const id = this.cardId()
    return id ? (this.cardStore.cards().find((c) => c.id === id) ?? null) : null
  })

  /** Identity of the card being edited; stable across store emissions. */
  private readonly editingId = computed(() => this.editing()?.id ?? null)

  protected readonly deckCards = computed(() =>
    cardsInSubtree(this.deckStore.decks(), this.cardStore.cards(), this.deckId()),
  )

  protected readonly position = computed(() => {
    const editing = this.editing()
    return editing ? this.deckCards().findIndex((c) => c.id === editing.id) : -1
  })

  protected readonly prevCard = computed(() => {
    const at = this.position()
    return at > 0 ? this.deckCards()[at - 1] : undefined
  })

  protected readonly nextCard = computed(() => {
    const at = this.position()
    return at >= 0 && at < this.deckCards().length - 1 ? this.deckCards()[at + 1] : undefined
  })

  protected readonly showNav = computed(
    () => this.editing() !== null && this.deckCards().length > 1,
  )

  protected readonly valid = computed(
    () => this.front().trim().length > 0 && this.back().trim().length > 0,
  )

  private readonly dirty = computed(() => {
    const editing = this.editing()
    if (!editing) return false
    return (
      this.front().trim() !== editing.front ||
      this.back().trim() !== editing.back ||
      this.hint().trim() !== (editing.hint ?? '') ||
      this.tip().trim() !== (editing.tip ?? '')
    )
  })

  protected readonly saveLabel = computed(() => {
    if (this.justSaved()) return this.transloco.translate('cards.editor.saved')
    return this.transloco.translate(
      this.editing() ? 'common.saveChanges' : 'cards.editor.saveAndAdd',
    )
  })

  private build(): CardData {
    return {
      front: this.front().trim(),
      back: this.back().trim(),
      ...(this.hint().trim() ? { hint: this.hint().trim() } : {}),
      ...(this.tip().trim() ? { tip: this.tip().trim() } : {}),
    }
  }

  private flashSaved(): void {
    this.justSaved.set(true)
    window.clearTimeout(this.savedTimer)
    this.savedTimer = window.setTimeout(() => this.justSaved.set(false), 1500)
  }

  protected async save(): Promise<void> {
    if (!this.valid()) return
    const editing = this.editing()
    if (editing) {
      await editCard(this.cardStore, editing.id, this.build())
      this.flashSaved()
      return
    }
    await createCard(this.cardStore, this.deckId(), this.build())
    this.flashSaved()
    this.toast.success(this.transloco.translate('cards.editor.addedNext'))
    this.front.set('')
    this.back.set('')
    this.hint.set('')
    this.tip.set('')
  }

  protected async goToCard(target: { id: string } | undefined): Promise<void> {
    if (!target) return
    const editing = this.editing()
    if (editing && this.valid() && this.dirty()) {
      await editCard(this.cardStore, editing.id, this.build())
    }
    await this.router.navigateByUrl(
      ROUTES.deckCardEdit.replace(':deckId', this.deckId()).replace(':cardId', target.id),
    )
  }

  protected goBack(): void {
    this.location.back()
  }
}

import { Component, computed, inject, signal, viewChild } from '@angular/core'
import { Location } from '@angular/common'
import { MatButton, MatIconButton } from '@angular/material/button'
import { Menu } from 'primeng/menu'
import type { MenuItem } from 'primeng/api'
import { Archive, ArchiveRestore, LucideAngularModule, MoreVertical, Trash2 } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { cardsInSubtree } from '@app/shared/domain'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import { EmptyState } from '@app/shared/ui/empty-state'
import { PluralKeyPipe } from '@app/shared/ui/plural-key.pipe'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { ToastService } from '@app/shared/ui/toast'
import { CardStore, DeckStore } from '../data/stores'
import { deleteDeck, setDeckArchived } from '../commands/deck-index'
import type { Deck } from '../model/deck'

/**
 * The archive: the top of each archived branch (a subtree archives together, so
 * only its root shows). Restore puts the branch back in the library; the overflow
 * menu deletes it for good after a confirmation.
 */
@Component({
  selector: 'ms-archived-decks-page',
  imports: [
    ScreenHeader,
    EmptyState,
    MatButton,
    MatIconButton,
    Menu,
    LucideAngularModule,
    TranslocoPipe,
    PluralKeyPipe,
  ],
  template: `
    <ms-screen-header
      [title]="'archived.title' | transloco"
      [backLabel]="'common.back' | transloco"
      (back)="back()"
    />

    <main class="min-h-0 flex-1 overflow-y-auto px-5 pb-nav overscroll-contain scrollbar-hide">
      @if (!ready()) {
        <div class="grid flex-1 place-items-center py-16">
          <span class="size-8 animate-pulse rounded-full bg-secondary" aria-hidden="true"></span>
        </div>
      } @else if (archived().length === 0) {
        <ms-empty-state
          [title]="'archived.empty' | transloco"
          [description]="'archived.emptyBody' | transloco"
        >
          <lucide-icon icon [img]="icons.archive" class="size-7" aria-hidden="true" />
        </ms-empty-state>
      } @else {
        <ul class="m-0 flex list-none flex-col gap-2 p-0 py-4">
          @for (deck of archived(); track deck.id) {
            <li class="flex items-center gap-3 rounded-card bg-card p-3 shadow-rest">
              <span
                class="grid size-11 shrink-0 place-items-center rounded-card bg-info-surface text-2xl"
                aria-hidden="true"
              >
                {{ deck.icon || '🗂️' }}
              </span>
              <span class="min-w-0 flex-1">
                <span
                  class="block truncate text-[length:var(--ms-text-sub)] font-semibold text-heading"
                >
                  {{ deck.name }}
                </span>
                <span
                  class="block truncate text-[length:var(--ms-text-label)] text-muted-foreground"
                >
                  @if (cardCount(deck) > 0) {
                    {{
                      'archived.cardCount'
                        | msPluralKey: cardCount(deck)
                        | transloco: { count: cardCount(deck) }
                    }}
                  } @else {
                    {{ 'archived.noCards' | transloco }}
                  }
                </span>
              </span>
              <button matButton="tonal" type="button" (click)="restore(deck)">
                <lucide-icon [img]="icons.restore" class="size-4" aria-hidden="true" />
                {{ 'archived.restore' | transloco }}
              </button>
              <button
                matIconButton
                type="button"
                [attr.aria-label]="deck.name + ' ' + ('common.moreOptions' | transloco)"
                (click)="openMenu($event, deck)"
              >
                <lucide-icon [img]="icons.more" class="size-5" aria-hidden="true" />
              </button>
            </li>
          }
        </ul>
        <p-menu #menu [model]="menuItems()" [popup]="true" appendTo="body" />
      }
    </main>
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class ArchivedDecksPage {
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly confirmDialog = inject(ConfirmDialog)
  private readonly toast = inject(ToastService)
  private readonly deckStore = inject(DeckStore)
  private readonly cardStore = inject(CardStore)

  protected readonly icons = {
    archive: Archive,
    restore: ArchiveRestore,
    more: MoreVertical,
    trash: Trash2,
  }

  protected readonly ready = computed(
    () => this.deckStore.status() === 'ready' && this.cardStore.status() === 'ready',
  )

  protected readonly archived = computed(() => {
    const decks = this.deckStore.decks()
    const archivedIds = new Set(decks.filter((d) => d.archived).map((d) => d.id))
    return decks
      .filter(
        (deck) => deck.archived && (deck.parentId === null || !archivedIds.has(deck.parentId)),
      )
      .sort((a, b) => a.order - b.order)
  })

  private readonly menuDeck = signal<Deck | null>(null)

  protected readonly menuItems = computed<MenuItem[]>(() => {
    const deck = this.menuDeck()
    if (!deck) return []
    return [
      {
        label: this.transloco.translate('common.delete'),
        styleClass: 'ms-menu-danger',
        command: () => void this.confirmDelete(deck),
      },
    ]
  })

  protected cardCount(deck: Deck): number {
    return cardsInSubtree(this.deckStore.decks(), this.cardStore.cards(), deck.id).length
  }

  protected back(): void {
    this.location.back()
  }

  protected restore(deck: Deck): void {
    void setDeckArchived(this.deckStore, deck.id, false)
    this.toast.success(this.transloco.translate('archived.restored', { name: deck.name }))
  }

  private readonly menuRef = viewChild<Menu>('menu')

  protected openMenu(event: Event, deck: Deck): void {
    this.menuDeck.set(deck)
    this.menuRef()?.toggle(event)
  }

  private async confirmDelete(deck: Deck): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.transloco.translate('common.delete'),
      description: deck.name,
      confirmLabel: this.transloco.translate('common.delete'),
      cancelLabel: this.transloco.translate('common.cancel'),
      destructive: true,
    })
    if (confirmed) await deleteDeck(this.deckStore, this.cardStore, deck.id)
  }
}

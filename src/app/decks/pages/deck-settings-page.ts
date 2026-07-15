import { Component, computed, inject, input } from '@angular/core'
import { Router } from '@angular/router'
import { Location } from '@angular/common'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  FileText,
  LucideAngularModule,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import { cardsInSubtree, resolveDeckSettings } from '@app/shared/domain'
import { ActionSheet } from '@app/shared/ui/action-sheet'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import { DeckCover } from '@app/shared/ui/deck-cover'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { SettingsRow } from '@app/shared/ui/settings-row'
import { SettingsSection } from '@app/shared/ui/settings-section'
import { ToastService } from '@app/shared/ui/toast'
import { exportCardsAnki, exportCardsCsv } from '@app/import/commands/content-index'
import { CardStore, DeckStore } from '../data/stores'
import { deleteDeck, duplicateDeck, editDeck, setDeckArchived } from '../commands/deck-index'
import { resetDeckSrs } from '../commands/card-index'
import { DEFAULT_DECK_SETTINGS } from '../model/deck'
import type { DeckSettings } from '../model/deck'
import { DeckAppearanceSheet } from '../ui/deck-appearance-sheet'
import type { DeckAppearanceChanges, DeckAppearanceSheetData } from '../ui/deck-appearance-sheet'

/**
 * Per-deck settings: identity (appearance sheet), study behavior overrides that
 * resolve down the deck tree, management actions (duplicate, export, reset
 * schedule, archive), and deletion. Every write goes through a deck/card command.
 */
@Component({
  selector: 'ms-deck-settings-page',
  imports: [
    ScreenHeader,
    SettingsRow,
    SettingsSection,
    DeckCover,
    LucideAngularModule,
    TranslocoPipe,
  ],
  template: `
    <ms-screen-header
      [title]="'deck.settings' | transloco"
      [subtitle]="deck()?.name ?? ''"
      [backLabel]="'common.back' | transloco"
      (back)="back()"
    />

    @if (deck(); as deck) {
      <main class="min-h-0 flex-1 overflow-y-auto px-5 pb-nav overscroll-contain scrollbar-hide">
        <div class="mt-4 flex flex-col gap-6 pb-8">
          <button
            type="button"
            (click)="openAppearance()"
            [attr.aria-label]="'deckSettings.editAppearance' | transloco"
            class="flex items-center gap-3.5 rounded-card bg-card p-4 text-left shadow-rest transition-transform active:scale-[0.99]"
          >
            <ms-deck-cover
              [icon]="deck.icon || '🗂️'"
              [color]="deck.color"
              [image]="deck.image ?? ''"
              class="size-16 shrink-0 rounded-card shadow-rest"
              iconClass="text-3xl leading-none"
            />
            <span class="min-w-0 flex-1">
              <span
                class="block truncate text-[length:var(--ms-text-title)] font-bold tracking-tight text-heading"
              >
                {{ deck.name }}
              </span>
              <span class="mt-0.5 block text-[length:var(--ms-text-label)] text-muted-foreground">
                {{ 'deckSettings.editAppearanceHint' | transloco }}
              </span>
            </span>
            <lucide-icon
              [img]="icons.pencil"
              class="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>

          <ms-settings-section [title]="'deckSettings.study' | transloco">
            <ms-settings-row
              kind="toggle"
              [icon]="icons.rotate"
              [label]="'deckSettings.shuffle' | transloco"
              [checked]="settings().shuffleCards"
              (checkedChange)="overrideSettings({ shuffleCards: $event })"
            />
            <ms-settings-row
              kind="toggle"
              [icon]="icons.fileText"
              [label]="'deckSettings.textToSpeech' | transloco"
              [checked]="settings().textToSpeech"
              (checkedChange)="overrideSettings({ textToSpeech: $event })"
            />
            <ms-settings-row
              kind="toggle"
              [icon]="icons.copy"
              [label]="'deckSettings.studyBack' | transloco"
              [checked]="settings().studyDirection === 'back'"
              (checkedChange)="overrideSettings({ studyDirection: $event ? 'back' : 'front' })"
            />
          </ms-settings-section>

          <ms-settings-section [title]="'deckSettings.manage' | transloco">
            <ms-settings-row
              kind="nav"
              [icon]="icons.copy"
              [label]="'deckSettings.duplicate' | transloco"
              [description]="'deckSettings.duplicateHint' | transloco"
              (activate)="duplicate()"
            />
            <ms-settings-row
              kind="nav"
              [icon]="icons.download"
              [label]="'deckSettings.export' | transloco"
              [description]="'deckSettings.exportHint' | transloco"
              [disabled]="cards().length === 0"
              (activate)="openExport()"
            />
            <ms-settings-row
              kind="nav"
              [icon]="icons.rotate"
              [label]="'deckSettings.reset' | transloco"
              [description]="'deckSettings.resetHint' | transloco"
              (activate)="confirmReset()"
            />
            <ms-settings-row
              kind="nav"
              [icon]="deck.archived ? icons.restore : icons.archive"
              [label]="
                (deck.archived ? 'deckSettings.unarchive' : 'deckSettings.archive') | transloco
              "
              [description]="'deckSettings.archiveHint' | transloco"
              (activate)="toggleArchived()"
            />
          </ms-settings-section>

          <ms-settings-section>
            <ms-settings-row
              kind="nav"
              tone="danger"
              [icon]="icons.trash"
              [label]="'deckSettings.delete' | transloco"
              [description]="'deckSettings.deleteHint' | transloco"
              (activate)="confirmDelete()"
            />
          </ms-settings-section>
        </div>
      </main>
    }
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class DeckSettingsPage {
  readonly deckId = input.required<string>()

  private readonly router = inject(Router)
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly sheets = inject(MatBottomSheet)
  private readonly actionSheet = inject(ActionSheet)
  private readonly confirmDialog = inject(ConfirmDialog)
  private readonly toast = inject(ToastService)
  private readonly deckStore = inject(DeckStore)
  private readonly cardStore = inject(CardStore)

  protected readonly icons = {
    pencil: Pencil,
    rotate: RotateCcw,
    fileText: FileText,
    copy: Copy,
    download: Download,
    archive: Archive,
    restore: ArchiveRestore,
    trash: Trash2,
  }

  constructor() {
    this.deckStore.start()
    this.cardStore.start()
  }

  protected readonly deck = computed(
    () => this.deckStore.decks().find((d) => d.id === this.deckId()) ?? null,
  )

  protected readonly settings = computed(() =>
    resolveDeckSettings(this.deckStore.decks(), this.deckId(), DEFAULT_DECK_SETTINGS),
  )

  protected readonly cards = computed(() =>
    cardsInSubtree(this.deckStore.decks(), this.cardStore.cards(), this.deckId()),
  )

  protected back(): void {
    this.location.back()
  }

  protected overrideSettings(patch: Partial<DeckSettings>): void {
    const deck = this.deck()
    if (!deck) return
    void editDeck(this.deckStore, deck.id, { settings: { ...deck.settings, ...patch } })
  }

  protected openAppearance(): void {
    const deck = this.deck()
    if (!deck) return
    const ref = this.sheets.open<
      DeckAppearanceSheet,
      DeckAppearanceSheetData,
      DeckAppearanceChanges
    >(DeckAppearanceSheet, { data: { deck }, panelClass: 'ms-sheet-panel' })
    ref.afterDismissed().subscribe((changes) => {
      if (changes) void editDeck(this.deckStore, deck.id, changes)
    })
  }

  protected duplicate(): void {
    void duplicateDeck(this.deckStore, this.cardStore, this.deckId())
    this.toast.success(this.t('deckSettings.toast.duplicated'))
  }

  protected openExport(): void {
    const deck = this.deck()
    if (!deck) return
    const runExport = (run: () => void) => {
      run()
      this.toast.success(this.t('deckSettings.toast.exported'))
    }
    this.actionSheet.open({
      title: this.t('deckSettings.exportSheetTitle'),
      description: this.t('deckSettings.exportSheetDescription'),
      cancelLabel: this.t('common.cancel'),
      actions: [
        {
          id: 'csv',
          label: this.t('deckSettings.exportCsv'),
          icon: MapPin,
          onSelect: () => runExport(() => exportCardsCsv(deck.name, this.cards())),
        },
        {
          id: 'anki',
          label: this.t('deckSettings.exportAnki'),
          icon: FileText,
          onSelect: () => runExport(() => exportCardsAnki(deck.name, this.cards())),
        },
      ],
    })
  }

  protected async confirmReset(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: RotateCcw,
      title: this.t('deckSettings.resetConfirm.title'),
      description: this.t('deckSettings.resetConfirm.body'),
      confirmLabel: this.t('deckSettings.resetConfirm.confirm'),
      cancelLabel: this.t('common.cancel'),
    })
    if (!confirmed) return
    await resetDeckSrs(this.deckStore, this.cardStore, this.deckId())
    this.toast.success(this.t('deckSettings.toast.reset'))
  }

  protected toggleArchived(): void {
    const deck = this.deck()
    if (!deck) return
    const archiving = !deck.archived
    void setDeckArchived(this.deckStore, deck.id, archiving)
    this.toast.success(
      this.t(archiving ? 'deckSettings.toast.archived' : 'deckSettings.toast.unarchived'),
    )
  }

  protected async confirmDelete(): Promise<void> {
    const deck = this.deck()
    if (!deck) return
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.t('deckSettings.deleteConfirm.title', { name: deck.name }),
      description: this.t('deckSettings.deleteConfirm.body'),
      confirmLabel: this.t('deckSettings.deleteConfirm.confirm'),
      cancelLabel: this.t('common.cancel'),
      destructive: true,
    })
    if (!confirmed) return
    await deleteDeck(this.deckStore, this.cardStore, deck.id)
    await this.router.navigateByUrl(ROUTES.home)
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params)
  }
}

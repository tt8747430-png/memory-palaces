import { Component, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { MatButton, MatIconButton } from '@angular/material/button'
import {
  Archive,
  ChevronLeft,
  FolderPlus,
  Layers,
  LucideAngularModule,
  MoreVertical,
  Plus,
  Settings,
  SquareStack,
  Star,
  Trash2,
} from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import {
  canReparent,
  dayKey,
  dueCountsPerDeck,
  impact,
  nextDefaultName,
  subtreeDeckIds,
} from '@app/shared/domain'
import { ActionSheet } from '@app/shared/ui/action-sheet'
import type { SheetAction } from '@app/shared/ui/action-sheet'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import { EmptyState } from '@app/shared/ui/empty-state'
import { PromptSheet } from '@app/shared/ui/prompt-sheet'
import { SpeedDial } from '@app/shared/ui/speed-dial'
import type { SpeedDialAction } from '@app/shared/ui/speed-dial'
import { ToastService } from '@app/shared/ui/toast'
import { SessionStore, ProfileStore } from '@app/auth/data/stores'
import { NotificationStore } from '@app/notifications/data/notification-store'
import { PreferencesStore } from '@app/settings/data/preferences-store'
import { ProgressStore } from '@app/study/data/progress-store'
import { CardStore, DeckStore, FolderStore } from '../data/stores'
import { DECK_COLOR_OPTIONS } from '../model/deck-appearance'
import type { Deck } from '../model/deck'
import type { Folder } from '../model/folder'
import {
  createDeck,
  createSubdeck,
  deleteDeck,
  duplicateDeck,
  moveDeck,
  setDeckArchived,
  toggleDeckFavorite,
} from '../commands/deck-index'
import { createFolder, deleteFolder, editFolder } from '../commands/folder-index'
import { DeckTree } from '../ui/deck-tree'
import { FolderRow } from '../ui/folder-row'
import { HomeHeader } from '../ui/home-header'
import type { StreakSummary } from '../ui/home-header'
import { FolderSheet } from '../ui/folder-sheet'
import type { FolderChanges, FolderSheetData } from '../ui/folder-sheet'
import { MoveDeckSheet } from '../ui/move-deck-sheet'
import type { MoveDeckResult, MoveDeckSheetData, MoveDestination } from '../ui/move-deck-sheet'

/**
 * The library home: folders and the deck tree at the root, or one folder's decks
 * when opened. Rows tap to open and hold for their action sheet; creation runs
 * through the speed dial. Reads come straight off the entity stores; every write
 * goes through a deck/folder command (CQRS-lite, ADR-0004).
 */
@Component({
  selector: 'ms-deck-library-page',
  imports: [
    DeckTree,
    FolderRow,
    HomeHeader,
    EmptyState,
    SpeedDial,
    MatButton,
    MatIconButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  templateUrl: './deck-library-page.html',
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class DeckLibraryPage {
  private readonly router = inject(Router)
  private readonly transloco = inject(TranslocoService)
  private readonly sheets = inject(MatBottomSheet)
  private readonly actionSheet = inject(ActionSheet)
  private readonly confirmDialog = inject(ConfirmDialog)
  private readonly promptSheet = inject(PromptSheet)
  private readonly toast = inject(ToastService)

  private readonly deckStore = inject(DeckStore)
  private readonly folderStore = inject(FolderStore)
  private readonly cardStore = inject(CardStore)
  private readonly profileStore = inject(ProfileStore)
  private readonly progressStore = inject(ProgressStore)
  private readonly preferencesStore = inject(PreferencesStore)
  private readonly notificationStore = inject(NotificationStore)
  private readonly sessionStore = inject(SessionStore)

  protected readonly icons = {
    chevronLeft: ChevronLeft,
    moreVertical: MoreVertical,
    plus: Plus,
  }

  constructor() {
    this.deckStore.start()
    this.folderStore.start()
    this.cardStore.start()
    this.profileStore.start()
    this.progressStore.start()
    this.preferencesStore.start()
    this.notificationStore.start()
  }

  // ---- View state ----
  protected readonly openFolderId = signal<string | null>(null)
  protected readonly expanded = signal<ReadonlySet<string>>(new Set())
  protected readonly elevated = signal(false)

  // ---- Reads ----
  protected readonly decks = this.deckStore.decks
  protected readonly unreadCount = this.notificationStore.unreadCount

  protected readonly ready = computed(
    () => this.deckStore.status() === 'ready' && this.folderStore.status() === 'ready',
  )

  protected readonly sortedFolders = computed(() =>
    [...this.folderStore.folders()].sort((a, b) => a.order - b.order),
  )

  protected readonly openFolder = computed(
    () => this.sortedFolders().find((f) => f.id === this.openFolderId()) ?? null,
  )
  protected readonly inFolder = computed(() => this.openFolder() !== null)

  protected readonly displayName = computed(() => {
    const name = this.profileStore.effective().name.trim()
    return (
      name || this.sessionStore.session()?.displayName || this.transloco.translate('profile.guest')
    )
  })

  protected readonly avatar = computed(() => this.profileStore.effective().avatar)
  protected readonly xp = computed(() => this.progressStore.progress()?.xp ?? 0)

  protected readonly streak = computed<StreakSummary>(() => {
    const progress = this.progressStore.progress()
    const today = dayKey(Date.now())
    return {
      count: progress?.streakCount ?? 0,
      dayCount: progress?.activeDayKey === today ? progress.activeDayCount : 0,
      dailyGoal: this.preferencesStore.effective().dailyGoal,
    }
  })

  protected readonly dueCounts = computed(() =>
    dueCountsPerDeck(this.decks(), this.cardStore.cards(), Date.now()),
  )

  protected readonly folderDeckCounts = computed(() => {
    const counts = new Map<string, number>()
    for (const deck of this.decks()) {
      if (deck.parentId === null && deck.folderId && !deck.archived) {
        counts.set(deck.folderId, (counts.get(deck.folderId) ?? 0) + 1)
      }
    }
    return counts
  })

  protected readonly isEmpty = computed(() => {
    const folderId = this.openFolderId()
    const topLevel = this.decks().filter(
      (d) => d.parentId === null && (d.folderId ?? null) === folderId && !d.archived,
    )
    if (this.inFolder()) return topLevel.length === 0
    return this.sortedFolders().length === 0 && topLevel.length === 0
  })

  protected readonly dialActions = computed<SpeedDialAction[]>(() => {
    const inFolder = this.inFolder()
    const actions: SpeedDialAction[] = [
      {
        id: 'new-deck',
        label: this.transloco.translate(inFolder ? 'folder.addDeck' : 'deck.newDeck'),
        icon: Layers,
        onSelect: () => void this.promptCreateDeck(this.openFolderId()),
      },
    ]
    if (!inFolder) {
      actions.push({
        id: 'new-folder',
        label: this.transloco.translate('deck.newFolder'),
        icon: FolderPlus,
        onSelect: () => this.openFolderSheet(null),
      })
    }
    return actions
  })

  // ---- Navigation ----
  protected onScroll(scroller: HTMLElement): void {
    this.elevated.set(scroller.scrollTop > 4)
  }

  protected go(path: string): void {
    void this.router.navigateByUrl(path)
  }

  protected readonly routes = ROUTES

  protected openDeck(id: string): void {
    void this.router.navigateByUrl(ROUTES.deckDetail.replace(':deckId', id))
  }

  protected closeFolder(): void {
    this.openFolderId.set(null)
  }

  protected toggleExpanded(id: string): void {
    this.expanded.update((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  private expand(id: string): void {
    this.expanded.update((prev) => new Set(prev).add(id))
  }

  // ---- Deck actions ----
  protected deckActions(deck: Deck): void {
    impact()
    this.actionSheet.open({
      title: deck.name,
      cancelLabel: this.t('common.cancel'),
      actions: [
        {
          id: 'favorite',
          label: this.t(deck.favorite ? 'deck.unfavorite' : 'deck.favorite'),
          icon: Star,
          onSelect: () => void toggleDeckFavorite(this.deckStore, deck.id),
        },
        {
          id: 'move',
          label: this.t('deck.move'),
          icon: FolderPlus,
          onSelect: () => this.openMoveSheet(deck),
        },
        {
          id: 'add-subdeck',
          label: this.t('deck.addSubdeck'),
          icon: Plus,
          onSelect: () => void this.promptCreateSubdeck(deck),
        },
        {
          id: 'duplicate',
          label: this.t('deck.duplicate'),
          icon: SquareStack,
          onSelect: () => this.duplicate(deck),
        },
        {
          id: 'archive',
          label: this.t('deck.archive'),
          icon: Archive,
          onSelect: () => this.archive(deck),
        },
        {
          id: 'delete',
          label: this.t('common.delete'),
          icon: Trash2,
          destructive: true,
          onSelect: () => void this.confirmDeleteDeck(deck),
        },
      ],
    })
  }

  protected async promptCreateDeck(folderId: string | null): Promise<void> {
    const siblings = this.decks()
      .filter((d) => d.parentId === null && (d.folderId ?? null) === (folderId ?? null))
      .map((d) => d.name)
    const name = await this.promptSheet.prompt({
      title: this.t('deck.newDeck'),
      fieldLabel: this.t('deck.nameLabel'),
      placeholder: this.t('deck.namePlaceholder'),
      initialValue: nextDefaultName(this.t('deck.baseDeckName'), siblings),
      confirmLabel: this.t('deck.create'),
    })
    if (name) await createDeck(this.deckStore, { name, folderId })
  }

  private async promptCreateSubdeck(parent: Deck): Promise<void> {
    const siblings = this.decks()
      .filter((d) => d.parentId === parent.id)
      .map((d) => d.name)
    const name = await this.promptSheet.prompt({
      title: this.t('deck.newSubdeck'),
      description: this.t('deck.subdeckOf', { name: parent.name }),
      fieldLabel: this.t('deck.nameLabel'),
      placeholder: this.t('deck.namePlaceholder'),
      initialValue: nextDefaultName(this.t('deck.baseSubdeckName'), siblings),
      confirmLabel: this.t('deck.create'),
    })
    if (!name) return
    await createSubdeck(this.deckStore, parent.id, { name })
    this.expand(parent.id)
  }

  private archive(deck: Deck): void {
    void setDeckArchived(this.deckStore, deck.id, true)
    this.toast.undo(this.t('deck.archivedToast', { name: deck.name }), {
      label: this.t('common.undo'),
      run: () => void setDeckArchived(this.deckStore, deck.id, false),
    })
  }

  private duplicate(deck: Deck): void {
    void duplicateDeck(this.deckStore, this.cardStore, deck.id)
    this.toast.success(this.t('deck.duplicatedToast', { name: deck.name }))
  }

  private async confirmDeleteDeck(deck: Deck): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.t('deck.deleteTitle', { name: deck.name }),
      description: this.t('deck.deleteBody'),
      confirmLabel: this.t('deck.confirmDelete'),
      cancelLabel: this.t('common.cancel'),
      destructive: true,
    })
    if (confirmed) await deleteDeck(this.deckStore, this.cardStore, deck.id)
  }

  // ---- Move ----
  private openMoveSheet(deck: Deck): void {
    const data: MoveDeckSheetData = {
      subtitle: deck.name,
      decks: this.decks(),
      folders: this.sortedFolders(),
      excludeIds: new Set(subtreeDeckIds(this.decks(), deck.id)),
    }
    const ref = this.sheets.open<MoveDeckSheet, MoveDeckSheetData, MoveDeckResult>(MoveDeckSheet, {
      data,
      panelClass: 'ms-sheet-panel',
    })
    ref.afterDismissed().subscribe((result) => {
      if (result === undefined) return
      if (result === 'new-folder') {
        this.openFolderSheet(null)
        return
      }
      this.moveTo(deck, result)
    })
  }

  private moveTo(deck: Deck, dest: MoveDestination): void {
    if (dest.kind === 'archive') {
      this.archive(deck)
      return
    }
    const previous = { parentId: deck.parentId, folderId: deck.folderId ?? null }
    const undo = {
      label: this.t('common.undo'),
      run: () => void moveDeck(this.deckStore, deck.id, previous.parentId, previous.folderId),
    }
    if (dest.kind === 'deck') {
      if (!canReparent(this.decks(), deck.id, dest.deckId)) return
      void moveDeck(this.deckStore, deck.id, dest.deckId, null)
      this.expand(dest.deckId)
      const name = this.decks().find((d) => d.id === dest.deckId)?.name ?? ''
      this.toast.undo(this.t('deck.movedIntoToast', { name }), undo)
      return
    }
    const folderId = dest.kind === 'folder' ? dest.folderId : null
    void moveDeck(this.deckStore, deck.id, null, folderId)
    const folderName = folderId
      ? this.sortedFolders().find((f) => f.id === folderId)?.name
      : undefined
    this.toast.undo(
      folderName ? this.t('deck.movedToast', { folder: folderName }) : this.t('deck.unfiledToast'),
      undo,
    )
  }

  // ---- Folder actions ----
  protected folderActions(folder: Folder): void {
    impact()
    this.actionSheet.open({
      title: folder.name,
      cancelLabel: this.t('common.cancel'),
      actions: this.folderSheetActions(folder),
    })
  }

  protected openFolderMenu(): void {
    const folder = this.openFolder()
    if (!folder) return
    this.actionSheet.open({
      title: folder.name,
      cancelLabel: this.t('common.cancel'),
      actions: this.folderSheetActions(folder),
    })
  }

  private folderSheetActions(folder: Folder): SheetAction[] {
    return [
      {
        id: 'settings',
        label: this.t('folder.settings'),
        icon: Settings,
        onSelect: () => this.openFolderSheet(folder),
      },
      {
        id: 'add-deck',
        label: this.t('folder.addDeck'),
        icon: Plus,
        onSelect: () => void this.promptCreateDeck(folder.id),
      },
      {
        id: 'delete',
        label: this.t('common.delete'),
        icon: Trash2,
        destructive: true,
        onSelect: () => void this.confirmDeleteFolder(folder),
      },
    ]
  }

  protected openFolderSheet(folder: Folder | null): void {
    const folders = this.sortedFolders()
    const data: FolderSheetData = {
      folder,
      defaultName: nextDefaultName(
        this.t('folder.baseName'),
        folders.map((f) => f.name),
      ),
      defaultColor: DECK_COLOR_OPTIONS[folders.length % DECK_COLOR_OPTIONS.length]!.value,
    }
    const ref = this.sheets.open<FolderSheet, FolderSheetData, FolderChanges>(FolderSheet, {
      data,
      panelClass: 'ms-sheet-panel',
    })
    ref.afterDismissed().subscribe((changes) => {
      if (!changes) return
      if (folder) {
        void editFolder(this.folderStore, folder, changes)
      } else {
        void createFolder(this.folderStore, changes)
        this.openFolderId.set(null)
      }
    })
  }

  private async confirmDeleteFolder(folder: Folder): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.t('folder.deleteTitle', { name: folder.name }),
      description: this.t('folder.deleteBody'),
      confirmLabel: this.t('folder.confirmDelete'),
      cancelLabel: this.t('common.cancel'),
      destructive: true,
    })
    if (!confirmed) return
    await deleteFolder(this.folderStore, this.deckStore, folder.id)
    if (this.openFolderId() === folder.id) this.openFolderId.set(null)
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params)
  }
}

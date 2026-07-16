import { Component, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { MatButton, MatIconButton } from '@angular/material/button'
import {
  ChevronLeft,
  FolderPlus,
  Layers,
  LucideAngularModule,
  MoreVertical,
  Plus,
  Settings,
  Trash2,
} from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import type { SwipeActionId } from '@app/shared/config/swipe'
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
import type { SelectActionHandlers } from '@app/shared/ui/select-actions'
import { SelectToolbar } from '@app/shared/ui/select-toolbar'
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
import type { DeckSwipeEvent } from '../ui/deck-tree'
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
    SelectToolbar,
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

  protected readonly deckSwipe = computed(() => this.preferencesStore.effective().swipe.deck)
  protected readonly folderSwipe = computed(() => this.preferencesStore.effective().swipe.folder)

  // ---- Multi-select (long-press) ----
  protected readonly selectMode = signal(false)
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set())

  protected requestSelect(id: string): void {
    impact()
    this.selectMode.set(true)
    this.selectedIds.set(new Set([id]))
  }

  protected toggleSelect(id: string): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  protected exitSelect(): void {
    this.selectMode.set(false)
    this.selectedIds.set(new Set())
  }

  /** Every selectable id in the current view (folders at root + the whole deck tree). */
  private readonly selectableIds = computed(() => {
    const ids = new Set<string>()
    const folderId = this.openFolderId()
    if (!this.inFolder()) for (const f of this.sortedFolders()) ids.add(f.id)
    const decks = this.decks()
    const stack = decks
      .filter(
        (d) => d.parentId === null && (d.folderId ?? null) === (folderId ?? null) && !d.archived,
      )
      .map((d) => d.id)
    while (stack.length) {
      const id = stack.pop()!
      ids.add(id)
      for (const c of decks) if (c.parentId === id) stack.push(c.id)
    }
    return ids
  })

  protected readonly selectedCount = computed(() => this.selectedIds().size)

  protected readonly allSelected = computed(() => {
    const selectable = this.selectableIds()
    const selected = this.selectedIds()
    return selectable.size > 0 && [...selectable].every((id) => selected.has(id))
  })

  protected toggleSelectAll(): void {
    this.selectedIds.set(this.allSelected() ? new Set() : new Set(this.selectableIds()))
  }

  private readonly selectedDeckIds = computed(() =>
    [...this.selectedIds()].filter((id) => this.decks().some((d) => d.id === id)),
  )

  // Favorite is a set, not a flip: a mixed selection favorites everything, and
  // only an all-favorited selection clears — so the tap always has one meaning.
  private readonly selectedDecks = computed(() => {
    const byId = new Map(this.decks().map((d) => [d.id, d]))
    return this.selectedDeckIds().flatMap((id) => {
      const deck = byId.get(id)
      return deck ? [deck] : []
    })
  })

  private readonly allFavorited = computed(() => {
    const decks = this.selectedDecks()
    return decks.length > 0 && decks.every((d) => d.favorite)
  })

  // "Unfile" lifts decks back out to the top level — out of a folder, out of a
  // parent deck. Decks already sitting there have nothing to lift.
  private readonly filedDecks = computed(() =>
    this.selectedDecks().filter((d) => d.parentId !== null || (d.folderId ?? null) !== null),
  )

  protected readonly selectToolbarConfig = computed(
    () => this.preferencesStore.effective().selectToolbar.library,
  )

  // The bar the learner configured (Settings → Select toolbar), wired to what a
  // library selection can actually do. Folder-only selections keep the
  // deck-shaped actions visible but disabled, so the bar never rearranges.
  protected readonly selectHandlers = computed<SelectActionHandlers>(() => {
    const noDecks = this.selectedDeckIds().length === 0
    return {
      move: { onAction: () => this.openBulkMoveSheet(), disabled: noDecks },
      favorite: { onAction: () => this.bulkFavorite(), disabled: noDecks },
      duplicate: { onAction: () => this.bulkDuplicate(), disabled: noDecks },
      archive: { onAction: () => this.bulkArchive(), disabled: noDecks },
      unfile: { onAction: () => this.bulkUnfile(), disabled: this.filedDecks().length === 0 },
      delete: {
        onAction: () => void this.confirmBulkDelete(),
        disabled: this.selectedIds().size === 0,
      },
    }
  })

  private bulkArchive(): void {
    const ids = this.selectedDeckIds()
    ids.forEach((id) => void setDeckArchived(this.deckStore, id, true))
    this.toast.undo(this.t('library.select.archivedToast', { count: ids.length }), {
      label: this.t('common.undo'),
      run: () => ids.forEach((id) => void setDeckArchived(this.deckStore, id, false)),
    })
    this.exitSelect()
  }

  private bulkFavorite(): void {
    const decks = this.selectedDecks()
    const next = !this.allFavorited()
    decks
      .filter((d) => Boolean(d.favorite) !== next)
      .forEach((d) => void toggleDeckFavorite(this.deckStore, d.id))
    this.toast.success(
      this.t(next ? 'library.select.favoritedToast' : 'library.select.unfavoritedToast', {
        count: decks.length,
      }),
    )
    this.exitSelect()
  }

  private bulkDuplicate(): void {
    const ids = this.selectedDeckIds()
    ids.forEach((id) => void duplicateDeck(this.deckStore, this.cardStore, id))
    this.toast.success(this.t('library.select.duplicatedToast', { count: ids.length }))
    this.exitSelect()
  }

  private bulkUnfile(): void {
    const moved = this.filedDecks().map((d) => ({
      id: d.id,
      parentId: d.parentId,
      folderId: d.folderId ?? null,
    }))
    moved.forEach((d) => void moveDeck(this.deckStore, d.id, null, null))
    this.toast.undo(this.t('library.select.unfiledToast', { count: moved.length }), {
      label: this.t('common.undo'),
      run: () => moved.forEach((d) => void moveDeck(this.deckStore, d.id, d.parentId, d.folderId)),
    })
    this.exitSelect()
  }

  private openBulkMoveSheet(): void {
    const ids = this.selectedDeckIds()
    // A deck can't be moved into itself or any of its own descendants.
    const exclude = new Set<string>()
    for (const id of ids) for (const sub of subtreeDeckIds(this.decks(), id)) exclude.add(sub)
    const data: MoveDeckSheetData = {
      subtitle: this.t('library.select.count', { count: ids.length }),
      decks: this.decks(),
      folders: this.sortedFolders(),
      excludeIds: exclude,
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
      this.bulkMoveTo(result)
    })
  }

  private bulkMoveTo(dest: MoveDestination): void {
    const ids = this.selectedDeckIds()
    if (dest.kind === 'archive') {
      ids.forEach((id) => void setDeckArchived(this.deckStore, id, true))
      this.toast.success(this.t('library.select.archivedToast', { count: ids.length }))
      this.exitSelect()
      return
    }
    if (dest.kind === 'deck') {
      const valid = ids.filter((id) => canReparent(this.decks(), id, dest.deckId))
      valid.forEach((id) => void moveDeck(this.deckStore, id, dest.deckId, null))
      const name = this.decks().find((d) => d.id === dest.deckId)?.name ?? ''
      this.toast.success(this.t('library.select.movedIntoToast', { count: valid.length, name }))
      this.exitSelect()
      return
    }
    const folderId = dest.kind === 'folder' ? dest.folderId : null
    ids.forEach((id) => void moveDeck(this.deckStore, id, null, folderId))
    const folderName = folderId
      ? this.sortedFolders().find((f) => f.id === folderId)?.name
      : undefined
    this.toast.success(
      folderName
        ? this.t('library.select.movedToast', { count: ids.length, folder: folderName })
        : this.t('library.select.unfiledToast', { count: ids.length }),
    )
    this.exitSelect()
  }

  private async confirmBulkDelete(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.t('library.select.deleteTitle', { count: this.selectedIds().size }),
      description: this.t('library.select.deleteBody'),
      confirmLabel: this.t('deck.confirmDelete'),
      cancelLabel: this.t('common.cancel'),
      destructive: true,
    })
    if (!confirmed) return
    const selected = [...this.selectedIds()]
    const folderIds = selected.filter((id) => this.sortedFolders().some((f) => f.id === id))
    const deckIds = selected.filter((id) => this.decks().some((d) => d.id === id))
    folderIds.forEach((id) => void deleteFolder(this.folderStore, this.deckStore, id))
    deckIds.forEach((id) => void deleteDeck(this.deckStore, this.cardStore, id))
    const openId = this.openFolderId()
    if (openId && folderIds.includes(openId)) this.openFolderId.set(null)
    this.exitSelect()
  }

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
  protected onDeckSwipe({ id, deck }: DeckSwipeEvent): void {
    switch (id) {
      case 'favorite':
        void toggleDeckFavorite(this.deckStore, deck.id)
        break
      case 'move':
        this.openMoveSheet(deck)
        break
      case 'settings':
        void this.router.navigateByUrl(ROUTES.deckSettings.replace(':deckId', deck.id))
        break
      case 'addSubdeck':
        void this.promptCreateSubdeck(deck)
        break
      case 'duplicate':
        this.duplicate(deck)
        break
      case 'archive':
        this.archive(deck)
        break
      case 'delete':
        void this.confirmDeleteDeck(deck)
        break
    }
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
  protected onFolderSwipe(folder: Folder, id: SwipeActionId): void {
    switch (id) {
      case 'edit':
        this.openFolderSheet(folder)
        break
      case 'addDeck':
        void this.promptCreateDeck(folder.id)
        break
      case 'delete':
        void this.confirmDeleteFolder(folder)
        break
    }
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

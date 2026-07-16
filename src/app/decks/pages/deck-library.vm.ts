import { Injectable, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { SheetService } from '@app/shared/ui/sheet'
import { FolderPlus, Layers, Plus, Settings, Trash2 } from 'lucide-angular'
import { TranslocoService } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import type { SwipeActionId } from '@app/shared/config/swipe'
import {
  dayKey,
  dueCountsPerDeck,
  impact,
  nextDefaultName,
  subtreeDeckIds,
} from '@app/shared/domain'
import { ActionSheet } from '@app/shared/ui/action-sheet'
import type { SheetAction } from '@app/shared/ui/action-sheet'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import { PromptSheet } from '@app/shared/ui/prompt-sheet'
import type { SelectActionHandlers } from '@app/shared/ui/select-actions'
import type { SpeedDialAction } from '@app/shared/ui/speed-dial'
import { ToastService } from '@app/shared/ui/toast'
import { SessionStore, ProfileStore } from '@app/auth'
import { NotificationStore } from '@app/notifications'
import { PreferencesStore } from '@app/settings'
import { ProgressStore } from '@app/study'
import { CardStore, DeckStore, FolderStore } from '../data/stores'
import { DECK_COLOR_OPTIONS } from '../model/deck-appearance'
import type { Deck } from '../model/deck'
import type { Folder } from '../model/folder'
import {
  createDeck,
  createSubdeck,
  deleteDeck,
  deleteDecks,
  duplicateDeck,
  duplicateDecks,
  moveDeck,
  moveDecks,
  setDeckArchived,
  setDecksArchived,
  setDecksFavorite,
  toggleDeckFavorite,
} from '../commands/deck-index'
import { createFolder, deleteFolder, deleteFolders, editFolder } from '../commands/folder-index'
import type { DeckSwipeEvent } from '../ui/deck-tree'
import type { StreakSummary } from '../ui/home-header'
import { openFolderSheet } from '../ui/folder-sheet'
import type { FolderSheetData } from '../ui/folder-sheet'
import { openMoveDeckSheet } from '../ui/move-deck-sheet'
import type { MoveDeckSheetData, MoveDestination } from '../ui/move-deck-sheet'

/**
 * View model for the library home (ADR-0008).
 *
 * Owns the page's state, its derived read models, and the orchestration behind
 * every action — so the page component is only a template. Reads come straight
 * off the entity stores; every write goes through a deck/folder command
 * (CQRS-lite, ADR-0004). Provided by the page, so one instance per page.
 */
@Injectable()
export class DeckLibraryVm {
  private readonly router = inject(Router)
  private readonly transloco = inject(TranslocoService)
  private readonly sheets = inject(SheetService)
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

  // ---- View state ----
  readonly openFolderId = signal<string | null>(null)
  readonly expanded = signal<ReadonlySet<string>>(new Set())

  // ---- Reads ----
  readonly decks = this.deckStore.decks
  readonly unreadCount = this.notificationStore.unreadCount

  readonly ready = computed(
    () => this.deckStore.status() === 'ready' && this.folderStore.status() === 'ready',
  )

  readonly sortedFolders = computed(() =>
    [...this.folderStore.folders()].sort((a, b) => a.order - b.order),
  )

  readonly openFolder = computed(
    () => this.sortedFolders().find((f) => f.id === this.openFolderId()) ?? null,
  )
  readonly inFolder = computed(() => this.openFolder() !== null)

  readonly displayName = computed(() => {
    const name = this.profileStore.effective().name.trim()
    return (
      name || this.sessionStore.session()?.displayName || this.transloco.translate('profile.guest')
    )
  })

  readonly avatar = computed(() => this.profileStore.effective().avatar)
  readonly xp = computed(() => this.progressStore.progress()?.xp ?? 0)

  readonly streak = computed<StreakSummary>(() => {
    const progress = this.progressStore.progress()
    const today = dayKey(Date.now())
    return {
      count: progress?.streakCount ?? 0,
      dayCount: progress?.activeDayKey === today ? progress.activeDayCount : 0,
      dailyGoal: this.preferencesStore.effective().dailyGoal,
    }
  })

  readonly dueCounts = computed(() =>
    dueCountsPerDeck(this.decks(), this.cardStore.cards(), Date.now()),
  )

  readonly deckSwipe = computed(() => this.preferencesStore.effective().swipe.deck)
  readonly folderSwipe = computed(() => this.preferencesStore.effective().swipe.folder)

  readonly folderDeckCounts = computed(() => {
    const counts = new Map<string, number>()
    for (const deck of this.decks()) {
      if (deck.parentId === null && deck.folderId && !deck.archived) {
        counts.set(deck.folderId, (counts.get(deck.folderId) ?? 0) + 1)
      }
    }
    return counts
  })

  readonly isEmpty = computed(() => {
    const folderId = this.openFolderId()
    const topLevel = this.decks().filter(
      (d) => d.parentId === null && (d.folderId ?? null) === folderId && !d.archived,
    )
    if (this.inFolder()) return topLevel.length === 0
    return this.sortedFolders().length === 0 && topLevel.length === 0
  })

  readonly dialActions = computed<SpeedDialAction[]>(() => {
    const inFolder = this.inFolder()
    const actions: SpeedDialAction[] = [
      {
        id: 'new-deck',
        label: this.t(inFolder ? 'folder.addDeck' : 'deck.newDeck'),
        icon: Layers,
        onSelect: () => void this.createDeckHere(),
      },
    ]
    if (!inFolder) {
      actions.push({
        id: 'new-folder',
        label: this.t('deck.newFolder'),
        icon: FolderPlus,
        onSelect: () => void this.editOrCreateFolder(null),
      })
    }
    return actions
  })

  // ---- Multi-select (long-press) ----
  readonly selectMode = signal(false)
  readonly selectedIds = signal<ReadonlySet<string>>(new Set())

  requestSelect(id: string): void {
    impact()
    this.selectMode.set(true)
    this.selectedIds.set(new Set([id]))
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  exitSelect(): void {
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

  readonly selectedCount = computed(() => this.selectedIds().size)

  readonly allSelected = computed(() => {
    const selectable = this.selectableIds()
    const selected = this.selectedIds()
    return selectable.size > 0 && [...selectable].every((id) => selected.has(id))
  })

  toggleSelectAll(): void {
    this.selectedIds.set(this.allSelected() ? new Set() : new Set(this.selectableIds()))
  }

  private readonly selectedDeckIds = computed(() =>
    [...this.selectedIds()].filter((id) => this.decks().some((d) => d.id === id)),
  )

  private readonly selectedFolderIds = computed(() =>
    [...this.selectedIds()].filter((id) => this.sortedFolders().some((f) => f.id === id)),
  )

  // "Unfile" lifts decks back out to the top level — out of a folder, out of a
  // parent deck. Decks already sitting there have nothing to lift.
  private readonly filedDecks = computed(() => {
    const selected = new Set(this.selectedDeckIds())
    return this.decks().filter(
      (d) => selected.has(d.id) && (d.parentId !== null || (d.folderId ?? null) !== null),
    )
  })

  readonly selectToolbarConfig = computed(
    () => this.preferencesStore.effective().selectToolbar.library,
  )

  // The bar the learner configured (Settings → Select toolbar), wired to what a
  // library selection can actually do. Folder-only selections keep the
  // deck-shaped actions visible but disabled, so the bar never rearranges.
  readonly selectHandlers = computed<SelectActionHandlers>(() => {
    const noDecks = this.selectedDeckIds().length === 0
    return {
      move: { onAction: () => void this.openBulkMoveSheet(), disabled: noDecks },
      favorite: { onAction: () => void this.bulkFavorite(), disabled: noDecks },
      duplicate: { onAction: () => void this.bulkDuplicate(), disabled: noDecks },
      archive: { onAction: () => void this.bulkArchive(), disabled: noDecks },
      unfile: { onAction: () => void this.bulkUnfile(), disabled: this.filedDecks().length === 0 },
      delete: {
        onAction: () => void this.confirmBulkDelete(),
        disabled: this.selectedIds().size === 0,
      },
    }
  })

  private async bulkArchive(): Promise<void> {
    const ids = this.selectedDeckIds()
    await setDecksArchived(this.deckStore, ids, true)
    this.toast.undo(this.t('library.select.archivedToast', { count: ids.length }), {
      label: this.t('common.undo'),
      run: () => void setDecksArchived(this.deckStore, ids, false),
    })
    this.exitSelect()
  }

  private async bulkFavorite(): Promise<void> {
    const ids = this.selectedDeckIds()
    const favorited = await setDecksFavorite(this.deckStore, ids)
    this.toast.success(
      this.t(favorited ? 'library.select.favoritedToast' : 'library.select.unfavoritedToast', {
        count: ids.length,
      }),
    )
    this.exitSelect()
  }

  private async bulkDuplicate(): Promise<void> {
    const ids = this.selectedDeckIds()
    await duplicateDecks(this.deckStore, this.cardStore, ids)
    this.toast.success(this.t('library.select.duplicatedToast', { count: ids.length }))
    this.exitSelect()
  }

  private async bulkUnfile(): Promise<void> {
    // Snapshot where each deck was, so undo can put it back.
    const previous = this.filedDecks().map((d) => ({
      id: d.id,
      parentId: d.parentId,
      folderId: d.folderId ?? null,
    }))
    await moveDecks(
      this.deckStore,
      previous.map((d) => d.id),
      null,
      null,
    )
    this.toast.undo(this.t('library.select.unfiledToast', { count: previous.length }), {
      label: this.t('common.undo'),
      run: () =>
        previous.forEach((d) => void moveDeck(this.deckStore, d.id, d.parentId, d.folderId)),
    })
    this.exitSelect()
  }

  private async openBulkMoveSheet(): Promise<void> {
    const ids = this.selectedDeckIds()
    // A deck can't be moved into itself or any of its own descendants.
    const exclude = new Set<string>()
    for (const id of ids) for (const sub of subtreeDeckIds(this.decks(), id)) exclude.add(sub)
    const result = await openMoveDeckSheet(this.sheets, {
      subtitle: this.t('library.select.count', { count: ids.length }),
      decks: this.decks(),
      folders: this.sortedFolders(),
      excludeIds: exclude,
    } satisfies MoveDeckSheetData)
    if (result === undefined) return
    if (result === 'new-folder') {
      await this.editOrCreateFolder(null)
      return
    }
    await this.bulkMoveTo(result)
  }

  private async bulkMoveTo(dest: MoveDestination): Promise<void> {
    const ids = this.selectedDeckIds()
    if (dest.kind === 'archive') {
      await setDecksArchived(this.deckStore, ids, true)
      this.toast.success(this.t('library.select.archivedToast', { count: ids.length }))
      this.exitSelect()
      return
    }
    if (dest.kind === 'deck') {
      const moved = await moveDecks(this.deckStore, ids, dest.deckId, null)
      const name = this.decks().find((d) => d.id === dest.deckId)?.name ?? ''
      this.toast.success(this.t('library.select.movedIntoToast', { count: moved.length, name }))
      this.exitSelect()
      return
    }
    const folderId = dest.kind === 'folder' ? dest.folderId : null
    await moveDecks(this.deckStore, ids, null, folderId)
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
    const folderIds = this.selectedFolderIds()
    const deckIds = this.selectedDeckIds()
    await deleteFolders(this.folderStore, this.deckStore, folderIds)
    await deleteDecks(this.deckStore, this.cardStore, deckIds)
    const openId = this.openFolderId()
    if (openId && folderIds.includes(openId)) this.openFolderId.set(null)
    this.exitSelect()
  }

  // ---- Navigation ----
  openProfile(): void {
    void this.router.navigateByUrl(ROUTES.profile)
  }

  openNotifications(): void {
    void this.router.navigateByUrl(ROUTES.notifications)
  }

  openArchived(): void {
    void this.router.navigateByUrl(ROUTES.archived)
  }

  openStreak(): void {
    void this.router.navigateByUrl(ROUTES.streak)
  }

  openDeck(id: string): void {
    void this.router.navigateByUrl(ROUTES.deckDetail.replace(':deckId', id))
  }

  enterFolder(id: string): void {
    this.openFolderId.set(id)
  }

  closeFolder(): void {
    this.openFolderId.set(null)
  }

  toggleExpanded(id: string): void {
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
  onDeckSwipe({ id, deck }: DeckSwipeEvent): void {
    switch (id) {
      case 'favorite':
        void toggleDeckFavorite(this.deckStore, deck.id)
        break
      case 'move':
        void this.openMoveSheet(deck)
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

  /** Create a deck wherever the learner currently is — the root, or the open folder. */
  createDeckHere(): Promise<void> {
    return this.promptCreateDeck(this.openFolderId())
  }

  private async promptCreateDeck(folderId: string | null): Promise<void> {
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
  private async openMoveSheet(deck: Deck): Promise<void> {
    const result = await openMoveDeckSheet(this.sheets, {
      subtitle: deck.name,
      decks: this.decks(),
      folders: this.sortedFolders(),
      excludeIds: new Set(subtreeDeckIds(this.decks(), deck.id)),
    } satisfies MoveDeckSheetData)
    if (result === undefined) return
    if (result === 'new-folder') {
      await this.editOrCreateFolder(null)
      return
    }
    this.moveTo(deck, result)
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
      void moveDecks(this.deckStore, [deck.id], dest.deckId, null).then((moved) => {
        if (moved.length === 0) return
        this.expand(dest.deckId)
        const name = this.decks().find((d) => d.id === dest.deckId)?.name ?? ''
        this.toast.undo(this.t('deck.movedIntoToast', { name }), undo)
      })
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
  onFolderSwipe(folder: Folder, id: SwipeActionId): void {
    switch (id) {
      case 'edit':
        void this.editOrCreateFolder(folder)
        break
      case 'addDeck':
        void this.promptCreateDeck(folder.id)
        break
      case 'delete':
        void this.confirmDeleteFolder(folder)
        break
    }
  }

  openFolderMenu(): void {
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
        onSelect: () => void this.editOrCreateFolder(folder),
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

  /** Edit a folder, or create one when `folder` is null. */
  private async editOrCreateFolder(folder: Folder | null): Promise<void> {
    const folders = this.sortedFolders()
    const changes = await openFolderSheet(this.sheets, {
      folder,
      defaultName: nextDefaultName(
        this.t('folder.baseName'),
        folders.map((f) => f.name),
      ),
      defaultColor: DECK_COLOR_OPTIONS[folders.length % DECK_COLOR_OPTIONS.length]!.value,
    } satisfies FolderSheetData)
    if (!changes) return
    if (folder) {
      await editFolder(this.folderStore, folder, changes)
    } else {
      await createFolder(this.folderStore, changes)
      this.openFolderId.set(null)
    }
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

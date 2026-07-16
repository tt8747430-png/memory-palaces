import { describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideZonelessChangeDetection } from '@angular/core'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { MessageService } from 'primeng/api'
import { InMemoryRepository } from '@app/shared/data'
import { makeDeck } from '@app/decks/model/deck'
import type { Deck } from '@app/decks/model/deck'
import { makeFolder } from '@app/decks/model/folder'
import type { Folder } from '@app/decks/model/folder'
import type { Card } from '@app/decks/model/card'
import type { Progress } from '@app/study'
import type { Preferences } from '@app/settings'
import type { Profile, Session } from '@app/auth'
import type { AppNotification } from '@app/notifications'
import {
  CARD_REPOSITORY,
  DECK_REPOSITORY,
  FOLDER_REPOSITORY,
  QUESTION_REPOSITORY,
  DeckStore,
  FolderStore,
} from '@app/decks/data/stores'
import type { Question } from '@app/decks/model/question'
import { PROGRESS_REPOSITORY } from '@app/study'
import { PREFERENCES_REPOSITORY } from '@app/settings'
import { NOTIFICATION_REPOSITORY } from '@app/notifications'
import { PROFILE_REPOSITORY, SESSION_REPOSITORY } from '@app/auth'
import { DeckLibraryVm } from './deck-library.vm'

const at = (n: number) => new Date(n).toISOString()

const deck = (id: string, over: Partial<Deck> = {}): Deck => ({
  ...makeDeck({ id, createdAt: at(0), name: id }),
  ...over,
})

const folder = (id: string, order: number): Folder => ({
  ...makeFolder({ id, createdAt: at(0), name: id, color: 'from-sky-500 to-blue-600', icon: '📁' }),
  order,
})

/**
 * Builds the VM over in-memory repositories — the Liskov swap the ports exist
 * for. No component is rendered: the whole point of the extraction is that this
 * is reachable without one.
 */
function setup(seed: { decks?: Deck[]; folders?: Folder[] } = {}) {
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs: { en: {} },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
      }),
    ],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      MessageService,
      { provide: DECK_REPOSITORY, useValue: new InMemoryRepository<Deck>(seed.decks ?? []) },
      { provide: FOLDER_REPOSITORY, useValue: new InMemoryRepository<Folder>(seed.folders ?? []) },
      { provide: CARD_REPOSITORY, useValue: new InMemoryRepository<Card>() },
      { provide: QUESTION_REPOSITORY, useValue: new InMemoryRepository<Question>() },
      { provide: PROGRESS_REPOSITORY, useValue: new InMemoryRepository<Progress>() },
      { provide: PREFERENCES_REPOSITORY, useValue: new InMemoryRepository<Preferences>() },
      { provide: PROFILE_REPOSITORY, useValue: new InMemoryRepository<Profile>() },
      { provide: SESSION_REPOSITORY, useValue: new InMemoryRepository<Session>() },
      { provide: NOTIFICATION_REPOSITORY, useValue: new InMemoryRepository<AppNotification>() },
      DeckLibraryVm,
    ],
  })
  // The app starts stores at the composition root; a unit test arranges it.
  TestBed.inject(DeckStore).start()
  TestBed.inject(FolderStore).start()
  return TestBed.inject(DeckLibraryVm)
}

describe('DeckLibraryVm — folders', () => {
  it('sorts folders by order, not insertion', () => {
    const vm = setup({ folders: [folder('b', 2), folder('a', 1)] })

    expect(vm.sortedFolders().map((f) => f.id)).toEqual(['a', 'b'])
  })

  it('resolves the open folder and reports being inside one', () => {
    const vm = setup({ folders: [folder('a', 1)] })

    expect(vm.inFolder()).toBe(false)

    vm.enterFolder('a')

    expect(vm.inFolder()).toBe(true)
    expect(vm.openFolder()?.id).toBe('a')
  })

  it('counts only top-level, unarchived decks per folder', () => {
    const vm = setup({
      folders: [folder('f1', 1)],
      decks: [
        deck('a', { folderId: 'f1' }),
        deck('b', { folderId: 'f1', archived: true }),
        deck('sub', { folderId: 'f1', parentId: 'a' }),
      ],
    })

    expect(vm.folderDeckCounts().get('f1')).toBe(1)
  })
})

describe('DeckLibraryVm — emptiness', () => {
  it('is empty at the root with no folders and no decks', () => {
    expect(setup().isEmpty()).toBe(true)
  })

  it('is not empty at the root when a folder exists', () => {
    expect(setup({ folders: [folder('a', 1)] }).isEmpty()).toBe(false)
  })

  // Archived decks are in neither the library nor this count.
  it('ignores archived decks', () => {
    expect(setup({ decks: [deck('a', { archived: true })] }).isEmpty()).toBe(true)
  })

  it('inside a folder, only that folder’s decks count', () => {
    const vm = setup({ folders: [folder('f1', 1)], decks: [deck('a')] })
    vm.enterFolder('f1')

    expect(vm.isEmpty()).toBe(true)
  })
})

describe('DeckLibraryVm — selection', () => {
  it('entering select mode selects exactly the held row', () => {
    const vm = setup({ decks: [deck('a'), deck('b')] })

    vm.requestSelect('a')

    expect(vm.selectMode()).toBe(true)
    expect(vm.selectedCount()).toBe(1)
    expect(vm.selectedIds().has('a')).toBe(true)
  })

  it('toggling adds and removes', () => {
    const vm = setup({ decks: [deck('a'), deck('b')] })
    vm.requestSelect('a')

    vm.toggleSelect('b')
    expect(vm.selectedCount()).toBe(2)

    vm.toggleSelect('b')
    expect(vm.selectedCount()).toBe(1)
  })

  it('exiting clears the selection', () => {
    const vm = setup({ decks: [deck('a')] })
    vm.requestSelect('a')

    vm.exitSelect()

    expect(vm.selectMode()).toBe(false)
    expect(vm.selectedCount()).toBe(0)
  })

  // Select-all spans folders at the root plus the whole deck tree, including subdecks.
  it('select-all covers folders and the entire deck tree', () => {
    const vm = setup({
      folders: [folder('f1', 1)],
      decks: [deck('a'), deck('sub', { parentId: 'a' })],
    })

    vm.toggleSelectAll()

    expect(vm.allSelected()).toBe(true)
    expect(vm.selectedIds()).toEqual(new Set(['f1', 'a', 'sub']))
  })

  it('select-all toggles back to empty', () => {
    const vm = setup({ decks: [deck('a')] })
    vm.toggleSelectAll()

    vm.toggleSelectAll()

    expect(vm.selectedCount()).toBe(0)
    expect(vm.allSelected()).toBe(false)
  })

  it('allSelected is false when nothing is selectable', () => {
    expect(setup().allSelected()).toBe(false)
  })

  it('archived decks are not selectable', () => {
    const vm = setup({ decks: [deck('a'), deck('gone', { archived: true })] })

    vm.toggleSelectAll()

    expect(vm.selectedIds()).toEqual(new Set(['a']))
  })
})

describe('DeckLibraryVm — select toolbar handlers', () => {
  // Folder-only selections keep deck-shaped actions visible but disabled, so
  // the bar never rearranges under the thumb.
  it('disables deck-shaped actions when only folders are selected', () => {
    const vm = setup({ folders: [folder('f1', 1)], decks: [deck('a')] })
    vm.requestSelect('f1')

    const handlers = vm.selectHandlers()

    expect(handlers.move?.disabled).toBe(true)
    expect(handlers.favorite?.disabled).toBe(true)
    expect(handlers.duplicate?.disabled).toBe(true)
    expect(handlers.archive?.disabled).toBe(true)
    // Delete still applies — a folder can be deleted.
    expect(handlers.delete?.disabled).toBe(false)
  })

  it('enables deck-shaped actions once a deck is selected', () => {
    const vm = setup({ decks: [deck('a')] })
    vm.requestSelect('a')

    const handlers = vm.selectHandlers()

    expect(handlers.move?.disabled).toBe(false)
    expect(handlers.archive?.disabled).toBe(false)
  })

  // Unfile only means something for decks that are actually filed somewhere.
  it('disables unfile when every selected deck already sits at the root', () => {
    const vm = setup({ decks: [deck('a')] })
    vm.requestSelect('a')

    expect(vm.selectHandlers().unfile?.disabled).toBe(true)
  })

  it('enables unfile for a deck inside a folder', () => {
    const vm = setup({ folders: [folder('f1', 1)], decks: [deck('a', { folderId: 'f1' })] })
    vm.requestSelect('a')

    expect(vm.selectHandlers().unfile?.disabled).toBe(false)
  })

  it('enables unfile for a subdeck', () => {
    const vm = setup({ decks: [deck('parent'), deck('sub', { parentId: 'parent' })] })
    vm.requestSelect('sub')

    expect(vm.selectHandlers().unfile?.disabled).toBe(false)
  })
})

describe('DeckLibraryVm — tree expansion', () => {
  it('toggles a deck open and closed', () => {
    const vm = setup({ decks: [deck('a')] })

    vm.toggleExpanded('a')
    expect(vm.expanded().has('a')).toBe(true)

    vm.toggleExpanded('a')
    expect(vm.expanded().has('a')).toBe(false)
  })
})

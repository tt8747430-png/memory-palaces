import { Component, inject, signal } from '@angular/core'
import { MatButton, MatIconButton } from '@angular/material/button'
import { ChevronLeft, LucideAngularModule, MoreVertical, Plus } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { EmptyState } from '@app/shared/ui/empty-state'
import { SelectToolbar } from '@app/shared/ui/select-toolbar'
import { SpeedDial } from '@app/shared/ui/speed-dial'
import { DeckTree } from '../ui/deck-tree'
import { FolderRow } from '../ui/folder-row'
import { HomeHeader } from '../ui/home-header'
import { DeckLibraryVm } from './deck-library.vm'

/**
 * The library home: folders and the deck tree at the root, or one folder's decks
 * when opened. Rows tap to open and hold to enter select mode; creation runs
 * through the speed dial.
 *
 * The view. Everything reactive lives on DeckLibraryVm (ADR-0008); what stays
 * here is presentation only — the icon set, and the scroll position driving the
 * header's elevation, which never leaves this template.
 */
@Component({
  selector: 'ms-deck-library-page',
  providers: [DeckLibraryVm],
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
  protected readonly vm = inject(DeckLibraryVm)

  protected readonly icons = {
    chevronLeft: ChevronLeft,
    moreVertical: MoreVertical,
    plus: Plus,
  }

  protected readonly elevated = signal(false)

  protected onScroll(scroller: HTMLElement): void {
    this.elevated.set(scroller.scrollTop > 4)
  }
}

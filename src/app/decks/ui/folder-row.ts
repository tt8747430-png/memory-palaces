import { Component, input, output } from '@angular/core'
import { ChevronRight, Layers, LucideAngularModule } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { DeckCover } from '@app/shared/ui/deck-cover'
import { LongPress } from '@app/shared/ui/long-press'
import { PluralKeyPipe } from '@app/shared/ui/plural-key.pipe'
import { DEFAULT_FOLDER_ICON } from '../model/folder-appearance'
import type { Folder } from '../model/folder'

/** A folder in the library: the glyph carries pale "sheets" stacked behind it, so
 *  folders read as holding decks — not as another deck. Tap opens; hold for actions. */
@Component({
  selector: 'ms-folder-row',
  imports: [DeckCover, LongPress, LucideAngularModule, TranslocoPipe, PluralKeyPipe],
  template: `
    <button
      type="button"
      msLongPress
      (shortTap)="open.emit()"
      (longPress)="more.emit()"
      [attr.aria-label]="'folder.rowOpen' | transloco: { name: folder().name }"
      class="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]"
    ></button>

    <div class="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3.5">
      <span class="relative size-12 shrink-0">
        <span
          aria-hidden="true"
          class="absolute inset-0 translate-x-[5px] translate-y-[-4px] rounded-2xl bg-secondary/40 ring-1 ring-border/60 ring-inset"
        ></span>
        <span
          aria-hidden="true"
          class="absolute inset-0 translate-x-[2.5px] translate-y-[-2px] rounded-2xl bg-secondary/70 ring-1 ring-border/70 ring-inset"
        ></span>
        <ms-deck-cover
          [icon]="folder().icon || defaultIcon"
          [color]="folder().color"
          class="relative size-12 rounded-2xl ring-1 ring-black/10"
          iconClass="text-xl leading-none"
        />
      </span>

      <span class="min-w-0 flex-1">
        <span class="block truncate text-[length:var(--ms-text-title)] font-semibold text-heading">
          {{ folder().name }}
        </span>
        <span
          class="mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[length:var(--ms-text-tiny)] font-semibold"
          [class]="
            deckCount() > 0
              ? 'bg-primary/[0.07] text-primary/80'
              : 'bg-secondary/40 text-muted-foreground'
          "
        >
          <lucide-icon [img]="layers" class="size-3" aria-hidden="true" />
          @if (deckCount() > 0) {
            {{ 'folder.deckCount' | msPluralKey: deckCount() | transloco: { count: deckCount() } }}
          } @else {
            {{ 'folder.empty' | transloco }}
          }
        </span>
      </span>

      <lucide-icon
        [img]="chevronRight"
        class="size-5 shrink-0 text-muted-foreground/70"
        aria-hidden="true"
      />
    </div>
  `,
  host: {
    class:
      'relative flex w-full items-center gap-3.5 rounded-card bg-card py-2.5 pr-2 pl-2.5 shadow-card',
  },
})
export class FolderRow {
  readonly folder = input.required<Folder>()
  readonly deckCount = input.required<number>()
  readonly open = output<void>()
  /** Press-and-hold: the row's action sheet (interim affordance until swipe actions port). */
  readonly more = output<void>()

  protected readonly defaultIcon = DEFAULT_FOLDER_ICON
  protected readonly layers = Layers
  protected readonly chevronRight = ChevronRight
}

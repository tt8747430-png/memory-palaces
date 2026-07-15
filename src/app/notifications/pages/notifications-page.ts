import { Component, effect, inject, untracked } from '@angular/core'
import { Location } from '@angular/common'
import { MatIconButton } from '@angular/material/button'
import { CheckCheck, LucideAngularModule, MoreVertical, Trash2 } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ActionSheet } from '@app/shared/ui/action-sheet'
import { ScreenHeader } from '@app/shared/ui/screen-header'
import { NotificationStore } from '../data/notification-store'
import { markAllNotificationsRead } from '../commands/mark-all-read'
import { clearNotifications, removeNotification } from '../commands/remove-notification'
import { NotificationsPanel } from '../ui/notifications-panel'

/** The notification center. Opening it marks everything read; rows dismiss
 *  individually, and the header menu clears the lot. */
@Component({
  selector: 'ms-notifications-page',
  imports: [ScreenHeader, NotificationsPanel, MatIconButton, LucideAngularModule, TranslocoPipe],
  template: `
    <ms-screen-header
      [title]="'notifications.title' | transloco"
      [subtitle]="subtitle()"
      [backLabel]="'notifications.back' | transloco"
      (back)="back()"
    >
      @if (store.notifications().length > 0) {
        <button
          matIconButton
          type="button"
          class="bg-card-glass shadow-rest"
          [attr.aria-label]="'common.moreOptions' | transloco"
          (click)="openMenu()"
        >
          <lucide-icon [img]="moreVertical" class="size-5" aria-hidden="true" />
        </button>
      }
    </ms-screen-header>

    <main class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe overscroll-contain scrollbar-hide">
      <div class="mt-2 pb-28">
        <ms-notifications-panel [notifications]="store.notifications()" (remove)="remove($event)" />
      </div>
    </main>
  `,
  host: { class: 'mx-auto flex h-full w-full max-w-[430px] flex-col' },
})
export class NotificationsPage {
  private readonly location = inject(Location)
  private readonly transloco = inject(TranslocoService)
  private readonly actionSheet = inject(ActionSheet)
  protected readonly store = inject(NotificationStore)

  protected readonly moreVertical = MoreVertical

  constructor() {
    this.store.start()
    // Landing here reads everything: the badge clears as soon as the list is seen.
    effect(() => {
      if (this.store.unreadCount() > 0) {
        untracked(() => void markAllNotificationsRead(this.store))
      }
    })
  }

  protected subtitle(): string {
    const count = this.store.notifications().length
    if (count === 0) return ''
    return this.transloco.translate(
      count === 1 ? 'notifications.countOne' : 'notifications.countOther',
      { count },
    )
  }

  protected remove(id: string): void {
    void removeNotification(this.store, id)
  }

  protected openMenu(): void {
    this.actionSheet.open({
      title: this.transloco.translate('notifications.title'),
      cancelLabel: this.transloco.translate('common.cancel'),
      actions: [
        {
          id: 'read',
          label: this.transloco.translate('notifications.markAllRead'),
          icon: CheckCheck,
          onSelect: () => void markAllNotificationsRead(this.store),
        },
        {
          id: 'clear',
          label: this.transloco.translate('notifications.clearAll'),
          icon: Trash2,
          destructive: true,
          onSelect: () => void clearNotifications(this.store),
        },
      ],
    })
  }

  protected back(): void {
    this.location.back()
  }
}

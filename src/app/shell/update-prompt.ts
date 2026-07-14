import { Injectable, inject } from '@angular/core'
import { SwUpdate } from '@angular/service-worker'
import type { VersionReadyEvent } from '@angular/service-worker'
import { MessageService } from 'primeng/api'
import { TranslocoService } from '@jsverse/transloco'
import { filter } from 'rxjs'

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000

/**
 * Surfaces a new app version as a sticky toast with a reload action.
 * Checks hourly and whenever the app returns to the foreground.
 */
@Injectable({ providedIn: 'root' })
export class UpdatePrompt {
  private readonly updates = inject(SwUpdate)
  private readonly messages = inject(MessageService)
  private readonly transloco = inject(TranslocoService)
  private started = false

  init(): void {
    if (this.started || !this.updates.isEnabled) return
    this.started = true

    this.updates.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.messages.add({
          key: 'update',
          severity: 'info',
          sticky: true,
          summary: this.transloco.translate('update.available'),
          detail: this.transloco.translate('update.description'),
        })
      })

    const check = (): void => {
      if (!document.hidden) void this.updates.checkForUpdate()
    }
    window.setInterval(check, UPDATE_CHECK_INTERVAL)
    document.addEventListener('visibilitychange', check)
  }

  async reload(): Promise<void> {
    await this.updates.activateUpdate()
    location.reload()
  }
}

import { Component, inject, signal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Toast } from 'primeng/toast'
import type { ToastMessageOptions } from 'primeng/api'
import { MatButton } from '@angular/material/button'
import { ToastService } from '@app/shared/ui/toast'
import type { UndoAction } from '@app/shared/ui/toast'
import { TranslocoPipe } from '@jsverse/transloco'
import { AUTH_GATEWAY, SessionStore, restoreSession } from '@app/auth'
import { AppNav } from './shell/app-nav'
import { Splash } from './shell/splash'
import { PreferencesEffects } from './shell/preferences-effects'
import { NotificationBridge } from './shell/notification-bridge'
import { UpdatePrompt } from './shell/update-prompt'
import { KeyboardPin } from './shell/keyboard-pin'

@Component({
  selector: 'ms-root',
  imports: [RouterOutlet, AppNav, Splash, Toast, MatButton, TranslocoPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly updatePrompt = inject(UpdatePrompt)
  protected readonly showSplash = signal(true)
  private readonly toast = inject(ToastService)

  constructor() {
    // Constructing this wires its preference effects; it has no init().
    inject(PreferencesEffects)
    inject(NotificationBridge).init()
    inject(KeyboardPin).init()
    this.updatePrompt.init()

    const gateway = inject(AUTH_GATEWAY)
    const sessionStore = inject(SessionStore)
    void restoreSession({ gateway, sessionStore })
  }

  protected runUndo(message: ToastMessageOptions): void {
    const undo = message.data as UndoAction
    this.toast.dismissUndo()
    undo.run()
  }
}

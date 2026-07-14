import { Component, inject, signal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TuiRoot } from '@taiga-ui/core'
import { Toast } from 'primeng/toast'
import { MatButton } from '@angular/material/button'
import { TranslocoPipe } from '@jsverse/transloco'
import { AUTH_GATEWAY, SessionStore } from '@app/auth/data/stores'
import { restoreSession } from '@app/auth/commands/restore-session'
import { AppNav } from './shell/app-nav'
import { Splash } from './shell/splash'
import { PreferencesEffects } from './shell/preferences-effects'
import { NotificationBridge } from './shell/notification-bridge'
import { UpdatePrompt } from './shell/update-prompt'
import { KeyboardPin } from './shell/keyboard-pin'

@Component({
  selector: 'ms-root',
  imports: [RouterOutlet, TuiRoot, AppNav, Splash, Toast, MatButton, TranslocoPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly updatePrompt = inject(UpdatePrompt)
  protected readonly showSplash = signal(true)

  constructor() {
    inject(PreferencesEffects).init()
    inject(NotificationBridge).init()
    inject(KeyboardPin).init()
    this.updatePrompt.init()

    const gateway = inject(AUTH_GATEWAY)
    const sessionStore = inject(SessionStore)
    void restoreSession({ gateway, sessionStore })
  }
}

import { Component, computed, inject } from '@angular/core'
import { Router } from '@angular/router'
import { MatButton } from '@angular/material/button'
import { TranslocoPipe } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import { Threshold } from '@app/shared/ui/threshold'
import { WordReveal } from '../../shell/word-reveal'
import { SessionStore } from '../data/stores'

@Component({
  selector: 'ms-welcome-page',
  imports: [MatButton, Threshold, WordReveal, TranslocoPipe],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage {
  private readonly router = inject(Router)
  private readonly sessionStore = inject(SessionStore)

  protected readonly name = computed(
    () => this.sessionStore.session()?.displayName.trim() ?? '',
  )

  protected continue(): void {
    void this.router.navigateByUrl(ROUTES.home)
  }
}

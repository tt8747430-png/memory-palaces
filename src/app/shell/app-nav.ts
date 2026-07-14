import { Component, computed, inject } from '@angular/core'
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { filter, map } from 'rxjs'
import { TuiTabBar } from '@taiga-ui/addon-mobile'
import { TranslocoPipe } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'

const TAB_PATHS: readonly string[] = [ROUTES.home, ROUTES.profile]

/** Bottom navigation — shown only on the two top-level tab destinations. */
@Component({
  selector: 'ms-app-nav',
  imports: [TuiTabBar, RouterLink, RouterLinkActive, TranslocoPipe],
  template: `
    @if (visible()) {
      <nav tuiTabBar class="t-bar pb-safe" [attr.aria-label]="'nav.label' | transloco">
        <a
          tuiTabBarItem
          icon="@tui.house"
          [routerLink]="home"
          routerLinkActive
          [routerLinkActiveOptions]="{ exact: true }"
        >
          {{ 'nav.home' | transloco }}
        </a>
        <a tuiTabBarItem icon="@tui.user" [routerLink]="profile" routerLinkActive>
          {{ 'nav.profile' | transloco }}
        </a>
      </nav>
    }
  `,
  styles: `
    .t-bar {
      position: fixed;
      inset-inline: 0;
      bottom: 0;
      z-index: var(--ms-z-nav);
    }
  `,
})
export class AppNav {
  private readonly router = inject(Router)

  protected readonly home = ROUTES.home
  protected readonly profile = ROUTES.profile

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  )

  protected readonly visible = computed(() => TAB_PATHS.includes(this.url()))
}

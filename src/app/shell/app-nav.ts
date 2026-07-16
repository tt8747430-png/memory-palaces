import { Component, computed, inject } from '@angular/core'
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { filter, map } from 'rxjs'
import { House, LucideAngularModule, User } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'

interface NavTab {
  readonly path: string
  readonly icon: LucideIconData
  readonly labelKey: string
  /** Home matches exactly so it doesn't stay lit on every deeper route. */
  readonly exact: boolean
}

const TABS: readonly NavTab[] = [
  { path: ROUTES.home, icon: House, labelKey: 'nav.home', exact: true },
  { path: ROUTES.profile, icon: User, labelKey: 'nav.profile', exact: false },
]

const TAB_PATHS: readonly string[] = TABS.map((tab) => tab.path)

/**
 * Bottom navigation — shown only on the top-level tab destinations.
 *
 * Hand-rolled to the Material 3 navigation bar spec (ADR-0007): an 80px container,
 * a 64x32 corner-full indicator around the active icon, label-medium beneath. No
 * library ships this widget, so the spec is followed directly; the M3 colour roles
 * are the ones styles.scss already bridges to the app's semantic tokens, so dark
 * mode flips without a single per-component override.
 */
@Component({
  selector: 'ms-app-nav',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, TranslocoPipe],
  template: `
    @if (visible()) {
      <nav
        class="ms-nav pb-safe flex bg-(--mat-sys-surface-container)"
        [attr.aria-label]="'nav.label' | transloco"
      >
        @for (tab of tabs; track tab.path) {
          <a
            class="ms-nav-item flex h-20 flex-1 flex-col items-center justify-center gap-1 no-underline"
            [routerLink]="tab.path"
            routerLinkActive="is-active"
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: tab.exact }"
          >
            <span class="ms-nav-indicator grid h-8 w-16 place-items-center rounded-full">
              <lucide-icon [img]="tab.icon" class="size-6" />
            </span>
            <span class="ms-nav-label text-xs leading-4 font-medium">
              {{ tab.labelKey | transloco }}
            </span>
          </a>
        }
      </nav>
    }
  `,
  styles: `
    /* Fixed placement + the app's z-index token: not expressible as utilities. */
    .ms-nav {
      position: fixed;
      inset-inline: 0;
      bottom: 0;
      z-index: var(--ms-z-nav);
    }

    /* M3 colour roles, keyed off the class routerLinkActive applies. Kept here
       rather than as utilities because the active state is one contract: the
       indicator fills, its icon takes the container ink, the label promotes. */
    .ms-nav-indicator,
    .ms-nav-label {
      color: var(--mat-sys-on-surface-variant);
    }

    .ms-nav-indicator {
      transition: background-color var(--ms-dur-base) var(--ms-ease-standard);
    }

    .is-active .ms-nav-indicator {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .is-active .ms-nav-label {
      color: var(--mat-sys-on-surface);
    }
  `,
})
export class AppNav {
  private readonly router = inject(Router)

  protected readonly tabs = TABS

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  )

  protected readonly visible = computed(() => TAB_PATHS.includes(this.url()))
}

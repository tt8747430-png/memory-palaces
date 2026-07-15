import { Component } from '@angular/core'

/**
 * Full-height auth surface: daylight background, drifting aura + accent orbs,
 * and a scrollable 430px column. Motion collapses under the global
 * reduced-motion kill-switch.
 */
@Component({
  selector: 'ms-auth-screen',
  template: `
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <span class="t-aura absolute left-1/2 top-1/3 size-[140%] rounded-full blur-3xl"></span>
      <span class="t-orb absolute size-28 rounded-full blur-2xl" style="--i: 0; left: 14%; top: 20%; --dx: 50px; --dy: 38px"></span>
      <span class="t-orb absolute size-28 rounded-full blur-2xl" style="--i: 1; left: 80%; top: 16%; --dx: -44px; --dy: 52px"></span>
      <span class="t-orb absolute size-28 rounded-full blur-2xl" style="--i: 2; left: 68%; top: 74%; --dx: -38px; --dy: -46px"></span>
    </div>

    <div class="relative h-full overflow-y-auto overscroll-none scrollbar-hide">
      <div class="pt-safe pb-safe mx-auto flex min-h-full w-full max-w-[430px] flex-col px-6">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './auth-screen.css',
  host: { class: 'relative block h-full overflow-hidden bg-daylight', role: 'main' },
})
export class AuthScreen {}

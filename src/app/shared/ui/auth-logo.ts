import { Component } from '@angular/core'
import { Threshold } from './threshold'

/** The threshold mark on a softly pulsing glow — header art for auth pages. */
@Component({
  selector: 'ms-auth-logo',
  imports: [Threshold],
  template: `
    <span aria-hidden="true" class="t-glow absolute left-1/2 top-1/2 size-[150%] rounded-full blur-2xl"></span>
    <ms-threshold tone="light" [animated]="false" class="relative size-full" />
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      place-items: center;
    }

    .t-glow {
      background: radial-gradient(circle, oklch(var(--ms-tint-sky) / 0.6), transparent 70%);
      translate: -50% -50%;
      animation: ms-logo-glow 5s ease-in-out infinite;
    }

    @keyframes ms-logo-glow {
      0%,
      100% {
        opacity: 0.45;
        scale: 0.9;
      }
      50% {
        opacity: 0.75;
        scale: 1.06;
      }
    }
  `,
})
export class AuthLogo {}

import { Component, input } from '@angular/core'

/** Centered empty/zero state: emoji (or projected icon), title, description, and a
 *  projected action block. */
@Component({
  selector: 'ms-empty-state',
  template: `
    <div
      class="mb-5 grid size-16 place-items-center rounded-card-featured bg-info-surface text-accent"
    >
      @if (emoji()) {
        <span class="text-3xl" aria-hidden="true">{{ emoji() }}</span>
      }
      <ng-content select="[icon]" />
    </div>
    <h3 class="mb-2 text-balance text-[length:var(--ms-text-sub)] font-semibold text-heading">
      {{ title() }}
    </h3>
    <p class="mb-6 max-w-[34ch] text-pretty text-[length:var(--ms-text-body)]">
      {{ description() }}
    </p>
    <ng-content />
  `,
  host: {
    class: 'ms-enter flex flex-col items-center justify-center px-6 py-16 text-center',
  },
  styles: `
    @keyframes ms-empty-enter {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      :host(.ms-enter) {
        animation: ms-empty-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
    }
  `,
})
export class EmptyState {
  readonly emoji = input('')
  readonly title = input.required<string>()
  readonly description = input.required<string>()
}

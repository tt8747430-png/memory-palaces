import { Component, input } from '@angular/core'

/** A titled group of settings rows on one card surface, rows divided hairline-thin. */
@Component({
  selector: 'ms-settings-section',
  template: `
    @if (title()) {
      <h2
        class="mb-2 px-4 text-[length:var(--ms-text-label)] font-bold tracking-wide text-muted-foreground uppercase"
      >
        {{ title() }}
      </h2>
    }
    <div
      class="overflow-hidden rounded-card bg-card shadow-rest [&>*+*]:border-t [&>*+*]:border-border/60"
    >
      <ng-content />
    </div>
  `,
  host: { class: 'block' },
})
export class SettingsSection {
  readonly title = input('')
}

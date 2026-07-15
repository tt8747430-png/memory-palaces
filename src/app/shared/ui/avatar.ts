import { Component, computed, input } from '@angular/core'

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]
  if (!first) return '?'
  const last = words.length > 1 ? words[words.length - 1] : undefined
  return last ? (first[0]! + last[0]!).toUpperCase() : first[0]!.toUpperCase()
}

/** Profile avatar: the photo when there is one, initials on the brand gradient otherwise. */
@Component({
  selector: 'ms-avatar',
  template: `
    @if (src(); as source) {
      <img [src]="source" alt="" class="size-full rounded-full object-cover" />
    } @else {
      <span
        class="grid size-full place-items-center rounded-full font-semibold text-primary-foreground"
        style="background: linear-gradient(135deg, var(--primary), var(--accent))"
        >{{ monogram() }}</span
      >
    }
  `,
  host: { 'aria-hidden': 'true', class: 'block size-10 shrink-0 rounded-full' },
})
export class Avatar {
  readonly name = input.required<string>()
  readonly src = input<string | null>(null)

  protected readonly monogram = computed(() => initials(this.name()))
}

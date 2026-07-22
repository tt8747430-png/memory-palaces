import { cn } from '@/shared/lib'

export interface AvatarProps {
  name: string
  src?: string | null
  className?: string
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]![0]!.toUpperCase()
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}

/**
 * Identity glyph — the uploaded image when present, otherwise a gradient initials
 * fallback. Kept as a lightweight img/span rather than Base UI's `Avatar` because
 * our sources are local data/blob URLs that load synchronously; Base UI defers the
 * `<img>` until a load event that never fires under jsdom.
 */
export function Avatar({ name, src, className }: AvatarProps) {
  if (src) {
    return (
      <img
        data-slot="avatar"
        src={src}
        alt=""
        aria-hidden
        className={cn('size-10 rounded-full object-cover', className)}
      />
    )
  }
  return (
    <span
      data-slot="avatar"
      aria-hidden
      className={cn(
        'grid size-10 place-items-center rounded-full bg-primary font-semibold text-primary-foreground',
        className,
      )}
      style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
    >
      {initials(name)}
    </span>
  )
}

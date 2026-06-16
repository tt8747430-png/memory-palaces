import { cn } from '@/shared/lib'

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]![0]!.toUpperCase()
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}

/** Navy-gradient circle with initials, or the user's photo when `src` is set. The
 * image is decorative (`alt=""`) — the name is always shown as adjacent text. */
export function Avatar({
  name,
  src,
  className,
}: {
  name: string
  src?: string | null
  className?: string
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        className={cn('size-10 rounded-full object-cover', className)}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-10 place-items-center rounded-full bg-primary font-semibold text-primary-foreground',
        className,
      )}
      style={{
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
      }}
    >
      {initials(name)}
    </span>
  )
}

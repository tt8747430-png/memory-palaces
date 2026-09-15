import { cn, useImageSrc } from '@/shared/lib'

export interface AvatarProps {
  name: string
  /** The stored avatar: an object path in the private bucket, or an inline `data:` image. */
  src?: string | null
  className?: string
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]![0]!.toUpperCase()
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}

export function Avatar({ name, src, className }: AvatarProps) {
  // Read from the device's image cache, never fetched during render — the bucket is private and
  // `pending` falls through to the initials rather than to a broken image.
  const photo = useImageSrc('avatars', src)

  if (photo.state === 'inline' || photo.state === 'cached') {
    return (
      <img
        data-slot="avatar"
        src={photo.src}
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

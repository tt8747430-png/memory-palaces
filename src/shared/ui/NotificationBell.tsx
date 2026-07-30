import { Bell, BellRing } from 'lucide-react'
import { IconButton } from '@/shared/ui/primitives'

export interface NotificationBellProps {
  unreadCount: number
  label: string
  onClick: () => void
}

export function NotificationBell({ unreadCount, label, onClick }: NotificationBellProps) {
  const Icon = unreadCount > 0 ? BellRing : Bell
  return (
    <div className="relative shrink-0">
      <IconButton variant="glass" aria-label={label} onClick={onClick}>
        <Icon className="size-5" aria-hidden />
      </IconButton>
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-(--surface)">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </div>
  )
}

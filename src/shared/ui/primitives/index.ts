// shadcn-on-Base-UI primitives.
// Adapted recipes live here (one kebab file each); public ones are re-exported through
// `src/shared/ui/index.ts`. See `.scratch/shadcn-migration/assets/02-conventions.md`.
export { Button, buttonVariants } from './button'
export type { ButtonProps } from './button'
export { IconButton, iconButtonVariants } from './icon-button'
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from './icon-button'
export { Input } from './input'
export { Textarea } from './textarea'
export { Badge, badgeVariants } from './badge'
export type { BadgeProps } from './badge'
export { Switch, SwitchTrack } from './switch'
export type { SwitchProps } from './switch'
export { Field, FieldLabel, FieldControl, FieldDescription, FieldError } from './field'
export { Card, cardSurface } from './card'
export { Avatar } from './avatar'
export type { AvatarProps } from './avatar'
export { Progress } from './progress'
export type { ProgressProps } from './progress'
export { Empty } from './empty'
export type { EmptyProps } from './empty'

// Compound foundations (`toggle-group`, `dropdown-menu`, `alert-dialog`, `drawer`) are
// intentionally NOT re-exported here. They're internal to `shared/ui` — the domain wrappers
// that consume them (SegmentedControl, SortControl, ConfirmDialog, Sheet…, tickets 04/05/07)
// deep-import them same-slice (e.g. `./primitives/drawer`), which keeps their heavier Base UI
// modules out of the public barrel's eager-eval graph until something actually needs them.

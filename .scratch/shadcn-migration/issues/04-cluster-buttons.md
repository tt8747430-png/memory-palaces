# Cluster: Buttons & button-like actions

Type: grilling
Status: resolved
Blocked by: 02

## Question

Per-member verdict (migrate / rebuild-on-primitive / keep / delete) + shadcn mapping for:

- `button.tsx` (`Button`, variants primary/secondary/ghost/destructive, sizes sm/md/lg)
  → shadcn `Button`. Reconcile variant/size sets and `cva`-vs-current per ticket 02.
- `IconButton` → shadcn `Button` (icon/size variant) or kept thin wrapper?
- `GradeButtons` → domain composition over shadcn `Button` (thin wrapper earned — SRS grade
  is a repeated pattern) or rebuilt inline?
- `OverflowMenuButton` → trigger for a shadcn `DropdownMenu` (coordinate with Overlays 07).
- `SpeedDial` (127 lines, FAB + radial actions, motion) → keep as domain component on
  shadcn `Button`? No shadcn equivalent for the radial behavior.
- `SocialButtons` (OAuth provider buttons) → shadcn `Button` compositions.

For each: does it keep its current external API, adopt a compound idiom, or stay a thin
domain wrapper (per map's API-surface decision)? What added behavior (`active:scale`,
haptics) survives and how? Note test impact (`GradeButtons.test`, `SocialButtons.test`).

## Answer

Per conventions ([`02`](../assets/02-conventions.md)): cva, add-then-adapt, our tokens/sizes.

- `button.tsx` → **migrate.** `shadcn add button` → rewrite to cva in `primitives/button.tsx`.
  Adopt shadcn variant **names** (`default/secondary/ghost/destructive`, +`outline`/`link` if a
  call site needs them; map our `primary`→`default`, keep navy). **Keep our size scale**
  (`sm/md/lg` = h-9/11/12 — larger touch targets per `MOBILE_DESIGN`, override the recipe's h-8)
  and `active:scale-[0.97]` + `rounded-control`. Strip `dark:`/`focus-ring`. Barrel-exported.
- `IconButton` → **migrate → thin wrapper** over Button `size="icon"` (keep the 1-line alias for
  call-site ergonomics, or inline it).
- `GradeButtons` → **keep (domain)** over migrated Button — SRS grade is a repeated pattern
  (wrapper earned); keep haptics. Update `GradeButtons.test` to the Button compound.
- `OverflowMenuButton` → **rebuild** as the trigger for the migrated `DropdownMenu`
  (from `FlyoutMenu`, 07).
- `SpeedDial` → **keep (domain)** — radial FAB + motion, no shadcn equivalent; inner actions use
  migrated Button.
- `SocialButtons` → **keep (domain)** — thin provider-branded compositions over Button. Update
  `SocialButtons.test`.

Surviving added behavior: `active:scale` (keep on Button base), haptics (via the domain wrappers).

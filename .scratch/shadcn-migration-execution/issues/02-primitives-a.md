# 02 — Primitives batch A (controls & inputs)

Type: task
Blocked by: 01
Status: resolved

## Question

Add + adapt into `shared/ui/primitives/` (barrel-export public ones), per handoff spec §2.2 / §3
and conventions §7 adaptation checklist:

- `button` — rewrite to `cva` (shadcn variant **names**, but **our** sizes + `active:scale`).
- `IconButton` — thin wrapper over Button icon size (04).
- `Input`, `Textarea`, `Field`/`Label` — adopt the compound field pattern (05).
- `Switch` — migrate, **drop `SwitchTrack`** (06).
- `Badge` — migrate; `Chip` → Badge/Toggle (06).

Update colocated `*.test.tsx` (`GradeButtons`/`SocialButtons`/`Switch` etc consume Button; keep
their tests green). Verify gate green. Keep-domain consumers (`GradeButtons`/`SpeedDial`/
`SocialButtons`) re-point onto the new Button but keep their surface.

## Answer — resolved, gate green (typecheck clean, 0 lint errors, 538/538 tests)

**✅ `Button`**
- `src/shared/ui/primitives/button.tsx`: `cva` + `@base-ui/react/button` primitive + `data-slot="button"`.
  Adopted shadcn variant **names** — `primary→default` (kept navy); `secondary`/`ghost`/`destructive`
  keep **our** visuals/tokens; kept **our** sizes `sm/md/lg = h-9/11/12` + `active:scale-[0.97]` +
  `rounded-control`; stripped focus-ring (global `:focus-visible` box-shadow handles it). `className`
  narrowed to `string` (Base UI allows a fn form we never use) so the cva call stays type-safe.
  Base UI Button preserves the old `type ?? 'button'` default *and* forwards `type="submit"` (4 forms).
- Old `src/shared/ui/button.tsx` **deleted**; barrel re-exports `Button`/`buttonVariants` via
  `./primitives`; internal importers (`PromptSheet`/`ConfirmDialog`/`StudyOverviewCard`) repointed to
  `./primitives/button`. `ConfirmDialog` computed `'primary'→'default'`. Dropped unused
  `ButtonVariant`/`ButtonSize` type exports (no consumers).
- **eslint:** added a scoped `react-refresh/only-export-components: off` override for
  `src/shared/ui/primitives/**` (mirrors the existing `router.tsx` override) — primitives co-export
  their `cva` helpers by design.

**✅ `IconButton`** → `primitives/icon-button.tsx`: `cva` (5 domain variants ghost/tint/solid/glass/
danger, sizes sm/md=size-9/11, `active:scale-0.94`) over the **Base UI Button** primitive +
`data-slot`. Kept its own variant set (icon-domain-specific, doesn't belong in Button); re-exports
`IconButtonVariant`/`IconButtonSize` (consumed by `OverflowMenuButton`/`FlyoutMenu`). No refs flow in,
so the Base UI `HTMLElement` ref type is safe.

**✅ `Input`** (was `TextField` — literally just a styled input, no label/desc/error trio, so **renamed**
not wrapped, per zero-legacy) → `primitives/input.tsx`; 7 consumers repointed `TextField`→`Input`.
**✅ `Textarea`** → `primitives/textarea.tsx`. Both: `data-slot`, our tokens, +disabled/`aria-invalid`.

**✅ `Field`/`Label` compound** → `primitives/field.tsx` on **Base UI `@base-ui/react/field`**:
`Field`/`FieldLabel`/`FieldControl`/`FieldDescription`/`FieldError`, our token styling. (Consumed by
AuthField/PasswordField/folder-form rebuilds in ticket 04.)

**✅ `Switch`** → `primitives/switch.tsx` on **Base UI `@base-ui/react/switch`** (Root+Thumb),
identical visual, same public API `{checked,onCheckedChange,label,disabled}`. `onCheckedChange`
**adapted to drop Base UI's 2nd event-detail arg** (else `toHaveBeenCalledWith(true)` would fail).
`Switch.test` moved to `primitives/switch.test.tsx`, still green (API-level test survived the internal
swap). **`SwitchTrack` KEPT** (presentational) — a standalone usage exists (`SettingsRow`), so the
cluster-06 "drop unless standalone usage exists" conditional resolves to keep.

**✅ `Badge`** → `primitives/badge.tsx` (`cva`, variants default/info/outline). **`Chip`** reimplemented
as a thin domain wrapper over `Badge` (`info` variant + icon slot) — API + look unchanged, no interactive
Chip exists so no `Toggle` needed yet (YAGNI).

Old `IconButton.tsx`/`Switch.tsx`/`TextField.tsx`/`Textarea.tsx` deleted. Barrel + `primitives` barrel
updated. No captured recipes existed for these — hand-ported on Base UI against the installed type defs.

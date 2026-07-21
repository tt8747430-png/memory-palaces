# Cluster: Form fields & text input

Type: grilling
Status: resolved
Blocked by: 02

## Question

Per-member verdict + shadcn mapping for:

- `TextField` → shadcn `Input` (+ `Field`/`Label`).
- `Textarea` → shadcn `Textarea`.
- `PasswordField` → shadcn `Input` type=password + reveal toggle (keep the added reveal
  behavior; decide if it stays a wrapper).
- `EmojiField` → domain composition (no shadcn equivalent for the emoji picker) — keep,
  rebuilt on shadcn `Input`/`Popover`?
- `AuthField` → shadcn `Field`/`Input` composition, or thin wrapper over the above.
- `EditableTitle` (119 lines, inline-edit with commit/cancel) → rebuild on shadcn `Input`
  with our edit-behavior as a wrapper, or keep as domain component?

Decide the shared field pattern (label/description/error) once so all fields use it. Adopt
shadcn `Field` compound idiom at call sites vs current flat props. Note test impact
(`EmojiField.test`, `AuthField` used by `AuthScreen`).

## Answer

**Shared field pattern (decided once):** adopt shadcn `Field`/`FieldLabel`/`FieldDescription`
compound as the one label/description/error pattern (per shadcn forms rule); validation via
`data-invalid` on `Field` + `aria-invalid` on the control. `shadcn add input textarea field label`.

- `TextField` → **migrate** — Input inside the Field pattern; keep a thin `TextField` wrapper only
  if the label/desc/error trio genuinely repeats at call sites.
- `Textarea` → **migrate** to shadcn `Textarea`.
- `PasswordField` → **rebuild (wrapper)** — shadcn `Input type=password` + reveal toggle via
  `InputGroup`+`InputGroupAddon`; keep the reveal behavior.
- `EmojiField` → **keep (domain)** — no shadcn emoji picker; rebuild its trigger/affordance on
  shadcn `Input`/`Popover`. Update `EmojiField.test`.
- `AuthField` → **rebuild → thin wrapper** over `Field`+`Input` (used by `AuthScreen`).
- `EditableTitle` → **keep (domain)** — inline commit/cancel edit logic has no shadcn part;
  rebuild the underlying input on shadcn `Input`, keep the edit behavior.

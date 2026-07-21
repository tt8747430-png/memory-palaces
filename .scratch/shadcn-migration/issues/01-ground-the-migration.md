# Ground the migration — run shadcn init on Base UI

Type: prototype
Status: resolved
Blocked by: —

## Question

Before any convention is decided on paper, produce a concrete artifact to react to:
on a **throwaway branch** (or scratch worktree), run `shadcn init` with the Base UI
flavour and add ~2 representative components, then capture exactly what the CLI emits.

Resolve:
- What does `shadcn init --base base-ui` (or the current equivalent) actually generate —
  `components.json` shape, `baseColor`, CSS-var token block, `tw-animate-css`, and which
  deps it wants (`class-variance-authority`, `@base-ui/react`, `lucide-react`)?
- Add **Button** and **Dialog**. What do the generated files look like — `cva` usage,
  `data-slot` attributes, its own `cn`, import paths from `@base-ui/react/<kebab>`, the
  compound API shape?
- Where does the CLI want components to land, and how does that collide with FSD
  (`src/shared/ui` vs shadcn's default `components/ui`) and the lint boundaries?
- Does it play with Tailwind v4 (`@tailwindcss/vite`) and our existing `data-theme` dark
  mode, or does it assume `.dark` class + its own token names?

Deliverable: a findings markdown linked as an asset (paste the real generated
`components.json` + the two component files), so ticket 02 decides conventions against
reality. This is a throwaway — do **not** land shadcn on `main`; the branch is discarded
after the findings are captured.

## Answer

Grounded against the real registry + this repo's config. Full write-up:
[`assets/01-findings.md`](../assets/01-findings.md), with the real emitted Base-flavour source
captured verbatim as assets: [`base-button.tsx`](../assets/base-button.tsx),
[`base-dialog.tsx`](../assets/base-dialog.tsx), [`base-lib-utils.ts`](../assets/base-lib-utils.ts).

Headline facts (detail in the findings):

- **The real `add` output is inline-Tailwind + semantic-token driven — same model as this repo.**
  (The style-less `bases/base/ui/*` template uses `cn-*` placeholders, but with a style/preset the
  CLI resolves them to plain utilities: `bg-primary text-primary-foreground hover:bg-primary/80`,
  `text-muted-foreground`, `bg-popover`.) Every token it emits already exists in our `theme.css`,
  so a migrated Button/Dialog is styled by our branded palette for free. → **add-then-adapt is
  viable**, not just hand-port; the adaptation is stripping inline `dark:`/`focus-visible:ring`,
  repointing `cn`/aliases, and not importing shadcn's competing `@theme`/`.dark` blocks (02 decides).
- **Base primitives match what we already ship.** `@base-ui/react/dialog` with
  `Backdrop`/`Popup`/`render={…}` — identical API to our `ActionSheet.tsx`.
- **Our theme is already shadcn-shaped.** `theme.css` `@theme inline` already defines
  `--color-primary`, `--color-muted-foreground`, `--color-border`, `--color-ring`, etc., so
  `bg-primary`/`text-muted-foreground` already resolve. Two mismatches to bridge: dark mode is
  `[data-theme='dark']` (not `.dark`), and the `cn-*` CSS layer uses its own token names.
- **`cn` is byte-identical** to `src/shared/lib/cn.ts` → repoint + delete the duplicate.
- **New deps init+add pulled in (real `package.json`):** `class-variance-authority` (iff cva kept),
  `tw-animate-css` (dialog uses `data-open:animate-in`), `shadcn` (only for `shadcn/tailwind.css`),
  `@fontsource-variable/geist` (**drop** — repo uses Lexend). `radix-ui` not added.
- **Token block collides:** init writes its own `@theme`/`:root`/`.dark` with **neutral grayscale**
  + `.dark`-class dark mode — do **not** import it (keep our branded `theme.css` + `[data-theme]`).
- **FSD collision:** real aliases are `@/components/ui` + `@/lib/utils`, which don't exist here
  (`@/shared/ui` + `@/shared/lib`, lint-enforced) → `components.json` aliases must be repointed.
- **Init ran to completion** in a throwaway scratch project (Vite + Tailwind v4); real
  `components.json`, post-init CSS, and the emitted Button/Dialog are captured as assets. **Nothing
  shadcn landed on any repo branch** — only planning artifacts under `.scratch/`. No new fog
  surfaced — everything feeds the existing 02/03.

**Unblocks:** ticket 02 (Conventions) and ticket 03 (Catalog) are now the frontier.

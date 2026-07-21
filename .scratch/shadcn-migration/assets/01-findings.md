# Ticket 01 findings — shadcn-on-Base-UI ground truth

Concrete artifact to react to, so ticket **02 (Conventions)** decides against reality and
ticket **03 (Catalog)** maps against the real registry.

> **Correction (after the live init succeeded):** an early pass read the *style-less* base
> template (`bases/base/ui/*.tsx`, full of `cn-button-variant-default` placeholders) and
> concluded "base flavour is CSS-class-driven → hand-port likely." **The real `add` output with a
> style (`base-nova`) is inline-Tailwind + semantic-token driven** — the same model as this repo,
> and every token it emits already exists in our `theme.css`. See §2/§3/§5. This is exactly why
> the ticket demanded a real CLI run over trusting the registry template.

## How this was captured

- Real Base-flavour init **run to completion** in a throwaway scratch project (Vite + Tailwind v4
  + `@` alias), preset `nova`: `npm install` then `shadcn init -b base -p nova -y`, then
  `shadcn add button dialog -y`. Every artifact below is the real on-disk output:
  - [`real-components.json`](./real-components.json) — generated `components.json`
  - [`real-post-init-index.css`](./real-post-init-index.css) — what init did to the global CSS
  - [`real-add-button.tsx`](./real-add-button.tsx), [`real-add-dialog.tsx`](./real-add-dialog.tsx)
    — the emitted components (aliases rewritten, icon resolved to lucide)
  - [`real-lib-utils.ts`](./real-lib-utils.ts) — the `cn` it wrote
- For contrast, the style-less registry templates are kept too:
  [`base-button.tsx`](./base-button.tsx), [`base-dialog.tsx`](./base-dialog.tsx),
  [`base-lib-utils.ts`](./base-lib-utils.ts).
- Repo config read: `package.json`, `tsconfig.json`, `vite.config.ts`, `src/shared/lib/cn.ts`,
  `src/shared/ui/button.tsx`, `src/shared/ui/ActionSheet.tsx`, `src/styles/{index,theme,tokens}.css`.
- `npx shadcn@latest search @shadcn` for the registry catalog (feeds ticket 03).

---

## 1. Base UI flavour vs the radix default

`view @shadcn/button` (default `@shadcn` registry) returns the **radix** flavour (`radix-ui` dep,
`data-[state=*]`). We adopt the **Base UI** flavour: primitive = `@base-ui/react/*` (already our
dep; matches our 4 existing Base UI components), and Base's `render={…}` prop replaces radix
`asChild`. Confirmed default per the ADR.

## 2. Real emitted **Button** (base-nova) — [`real-add-button.tsx`](./real-add-button.tsx)

- `import { Button as ButtonPrimitive } from "@base-ui/react/button"`; `cn` from `@/lib/utils`.
- Uses **`cva`** — and with a style, the variants are **plain Tailwind utilities on our tokens**,
  not `cn-*` classes:
  - `default: "bg-primary text-primary-foreground hover:bg-primary/80"`
  - `secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]"`
  - `ghost: "hover:bg-muted hover:text-foreground … dark:hover:bg-muted/50"`
  - `destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 …"`
- `data-slot="button"`; props `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`.
- Variants: `default | outline | secondary | ghost | destructive | link` (repo today:
  `primary | secondary | ghost | destructive`). Sizes: `default | xs | sm | lg | icon |
  icon-xs | icon-sm | icon-lg` (repo: `sm | md | lg`). **Both differ** → reconcile in 04.
- **Two repo-rule frictions in the raw output:** inline `dark:` utilities (repo bans per-component
  `dark:`), and `focus-visible:ring-*` (repo uses a global `:focus-visible` box-shadow). Adoption
  must strip these.

## 3. Real emitted **Dialog** (base-nova) — [`real-add-dialog.tsx`](./real-add-dialog.tsx)

- `@base-ui/react/dialog` using `DialogPrimitive.Backdrop`/`.Popup`/`.Root.Props`/`.Title.Props`
  and `data-open`/`data-closed` state attrs — **the exact API our `ActionSheet.tsx` already uses.**
- Close button uses `render={<Button variant="ghost" size="icon-sm"/>}` + `lucide-react` `XIcon`
  (the CLI resolved `IconPlaceholder` → lucide, our icon lib).
- Styling is inline utilities on our tokens: `bg-popover text-popover-foreground ring-foreground/10`,
  `bg-muted/50`, `text-muted-foreground`, plus `data-open:animate-in data-open:fade-in-0`
  (needs `tw-animate-css`) and `supports-backdrop-filter:backdrop-blur-xs`.
- Compound API: `Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent,
  DialogHeader, DialogFooter, DialogTitle, DialogDescription`. `DialogTitle` uses `font-heading`.
- No `"use client"` in the emitted file (good for our Vite SPA).

## 4. `cn` reconciliation — clean, zero delta

The emitted [`real-lib-utils.ts`](./real-lib-utils.ts) is **byte-identical** to
`src/shared/lib/cn.ts` (`twMerge(clsx(inputs))`). 02 verdict is trivial: repoint generated
`@/lib/utils` → `@/shared/lib`, delete the dup. No behaviour change.

## 5. Token / CSS collision — the core decision for ticket 02

Real init output: [`real-post-init-index.css`](./real-post-init-index.css). It:

1. Adds imports: `@import "tw-animate-css";`, `@import "shadcn/tailwind.css";` (base utilities +
   `cn-*` helpers from the new `shadcn` pkg), `@import "@fontsource-variable/geist";`.
2. Adds `@custom-variant dark (&:is(.dark *));` → **`.dark`-class dark mode**.
3. Writes its **own `@theme inline`** redefining the SAME semantic names our `theme.css` owns
   (`--color-primary`, `--color-muted-foreground`, `--color-border`, `--color-ring`, `--color-card`,
   `--color-popover`, `--color-accent`, `--color-destructive`, …) plus new families
   `--color-sidebar-*`, `--color-chart-1..5`, and a `--radius-sm..4xl` scale.
4. Writes `:root` + `.dark` raw-var blocks with **neutral grayscale** values (`baseColor: neutral`).
5. Adds `@layer base` applying `border-border` / `bg-background text-foreground` / `font-sans`.

**Good news:** every token the *components* reference already resolves in our repo — our
`theme.css` `@theme inline` already defines `--color-primary(-foreground)`, `--color-secondary(-foreground)`,
`--color-muted(-foreground)`, `--color-accent(-foreground)`, `--color-destructive`, `--color-border`,
`--color-input`, `--color-ring`, `--color-card`, `--color-popover`, `--color-foreground`,
`--color-background`. So a migrated Button/Dialog is styled by **our branded palette** for free.

**What actually collides (ticket 02 decides the crosswalk):**
- **Don't take shadcn's `@theme`/`:root`/`.dark` blocks** — they'd overwrite our branded values with
  neutral gray and introduce a second, competing definition of the same names. Keep ours.
- **Dark mode selector:** components emit inline `dark:` utilities and shadcn wires `.dark`; we use
  `[data-theme='dark']` and **ban per-component `dark:`**. Either strip `dark:` on adoption
  (preferred, matches our rule) or teach the crosswalk to bridge `.dark` → `[data-theme]`.
- **New token families we may want:** `--radius-*` scale, `--color-chart-*` (only if charts land),
  `--color-sidebar-*` (no sidebar in this app → likely skip).
- **Font:** init forces Geist; we keep **Lexend** (`font-sans` already ours) → drop
  `@fontsource-variable/geist`, and either drop `--font-heading` or point it at Lexend.
- **`shadcn/tailwind.css` import:** the styled components use standard utilities, so this is likely
  only needed for a few base helpers/`font-heading`; 02 decides keep-thin vs drop.

## 6. FSD placement collision

Real `aliases`: `components @/components`, `ui @/components/ui`, `lib @/lib`, `utils @/lib/utils`,
`hooks @/hooks`. **None exist here** (repo is `@/shared/ui` + `@/shared/lib`, lint-enforced FSD
boundaries, barrel-only cross-slice imports). `components.json` `aliases` must be repointed at
`shared/ui` / `shared/lib`; exact subfolder (e.g. `shared/ui/primitives/`) + barrel exposure in
`shared/ui/index.ts` is 02's call. `tsx:true`, `rsc:false`, `tailwind.config:""` (v4) are all correct.

## 7. Dependencies the migration pulls in (real `package.json` after init+add)

| Dep | Status | Verdict hint |
|-----|--------|--------------|
| `class-variance-authority` ^0.7.1 | **NEW** | Needed iff `cva` kept (02: cva vs repo's `Record<Variant,string>`). |
| `tw-animate-css` ^1.4.0 | **NEW** | Real dialog uses `data-open:animate-in`/`fade-out`. Needed if we keep those; or swap to `motion` (repo std, §9). |
| `shadcn` ^4.13.1 | **NEW** | Only for `@import "shadcn/tailwind.css"`. Likely droppable if we don't use its base helpers. |
| `@fontsource-variable/geist` ^5.3.0 | **NEW — drop** | Repo uses Lexend. |
| `@base-ui/react` | ✓ (init bumped ^1.5.0→^1.6.0) | Minor bump; verify. |
| `clsx`, `tailwind-merge`, `lucide-react` | ✓ have | — |
| `radix-ui` | not added | Base flavour ✓. |

## 8. `components.json` (real) — [`real-components.json`](./real-components.json)

```json
{ "style": "base-nova", "rsc": false, "tsx": true,
  "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral",
                "cssVariables": true, "prefix": "" },
  "iconLibrary": "lucide", "rtl": false,
  "aliases": { "components": "@/components", "utils": "@/lib/utils",
               "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
  "menuColor": "default", "menuAccent": "subtle", "registries": {} }
```
For this repo: `css` → `src/styles/index.css`, aliases → `shared/*` (§6), `iconLibrary` lucide ✓.

---

## Handoff to the frontier

- **Ticket 02 (Conventions)** decides against §2–§8: cva-vs-`Record`; `data-slot` keep/drop;
  `cn` (delete dup, §4); the **token crosswalk** (keep our `@theme`, don't import shadcn's; strip
  inline `dark:`; `[data-theme]` vs `.dark`; which new token families to adopt; Lexend not Geist,
  §5); FSD placement/aliases (§6); **add-then-adapt vs hand-port** — now more viable as
  *add-then-adapt* since the styled output already uses our tokens (§2/§3); animation
  (`tw-animate-css` vs `motion`, §7); TS strict fix-ups.
- **Ticket 03 (Catalog)** maps every `shared/ui` item against the registry (§ catalog in that
  ticket's answer) using the base-vs-repo API deltas above.
- No new fog surfaced beyond what 02/03 already cover; no new tickets needed.

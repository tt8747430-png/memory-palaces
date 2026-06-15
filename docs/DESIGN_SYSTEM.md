# Mindscape — Design System (Phase 0)

> Canonical design system for the **new** `memory-palaces/` rewrite (React 19 + Vite + FSD/Clean PWA).
> Synthesized from the old app's `PRODUCT.md`, `DESIGN.md`, and the implemented `theme.css`/`fonts.css`,
> then resolved into one accessible, theme-ready, two-layer token system.
>
> **Status:** Phase 0 deliverable (T0.1 + T0.2). No app code. The token spec lives in
> [`tokens.css`](./tokens.css); this document is the human-readable reference and the source of truth
> for craft decisions during the rewrite. **Checkpoint 0 must approve this before any UI is built.**

---

## 0. How to use this system

**Two layers, one rule.**

1. **Primitives** — the raw scale values (color ramps, type sizes, radii, shadows, durations). Named `--p-*` in
   `tokens.css`. **No component ever references a primitive.**
2. **Semantic roles** — what components consume (`--bg`, `--surface`, `--text-primary`, `--primary`, `--success`…). Each
   role maps to a primitive.

> **The rule:** components reference **only semantic role tokens** — never a primitive, never a raw hex. This is what
> makes the dark theme (Phase 12) a value remap of the semantic layer with **zero component edits**, and what keeps WCAG
> verification a finite, auditable list of role pairings instead of an open-ended hunt.

This satisfies the architecture plan's color mandate: _"Components use only semantic CSS-variable tokens, never raw
hex (DRY single source of truth). Dark = a second semantic→primitive map."_

**Color space — OKLCH, identity-locked.** Primitives are authored in **OKLCH** (`tokens.css`), matching how Tailwind v4
and shadcn's own palettes are defined, with the source brand hex kept in each comment as the canonical anchor. Every
OKLCH value was generated to **round-trip exactly back to its source hex** (verified), so the brand identity is
preserved with zero perceptible drift — the navy still renders as `#091A7A`. We did not regenerate the palette from a
seed (impeccable rule: when committed brand colors exist, identity-preservation wins). OKLCH is the authoring choice
because it is perceptually uniform (consistent lightness for ramp steps), keeps hue locked while lightness/chroma vary,
makes the Phase 12 dark remap a predictable lightness flip rather than guesswork, and unlocks P3 wide-gamut headroom on
the P3 phone displays Mindscape targets. See §2.6 for the rationale in full.

---

## 1. Creative North Star — "The Lucid Atrium"

Mindscape feels like a calm, daylit architectural interior: blue sky meeting glass, clear depth, nothing crowding the
view. The method of loci is about moving through remembered space, so the interface itself reads as space. White
surfaces float on a soft blue→white gradient, glass catches light, one deep navy anchors every important action.
Unhurried and premium first, motivating second, credible underneath. **A coach, not a cheerleader.**

Density is deliberately low — phone-first, one ritual per screen, one primary action. Color carries hierarchy; delight
is rationed to genuine milestones. The system explicitly rejects the corporate-SaaS dashboard, the cluttered/busy UI,
the cheap/templated look, and childish gamification. **Craft is the brand.**

---

## 2. Color

A daylit blue palette: one deep navy anchor, a wash of sky and glass blues, a tightly rationed set of accents over
near-white surfaces.

### 2.1 Primitives

| Token                      | Hex                                           | OKLCH                   | Role intent                                                                                       |
| -------------------------- | --------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `--p-navy-900`             | `#091A7A`                                     | `oklch(29.4% .160 266)` | **Identity anchor.** Primary action, active state, headings of consequence, progress fill, links. |
| `--p-blue-500`             | `#4F8EFF`                                     | `oklch(66.1% .180 261)` | Action-blue. Gradient ends, ambient nav glow. Large/icon accent only.                             |
| `--p-blue-450`             | `#3D8FEF`                                     | `oklch(64.7% .164 254)` | Bright-blue. Icon/large meta only — **fails as small text on tint.**                              |
| `--p-blue-300`             | `#ADC8FF`                                     | `oklch(83.2% .083 264)` | Sky/light-blue. Atmosphere, gradient top, secondary buttons, glass tint.                          |
| `--p-sky-100`              | `#E8F2FF`                                     | `oklch(95.7% .021 255)` | Surface-sky. Light end of media gradients.                                                        |
| `--p-sky-50`               | `#EAF4FF`                                     | `oklch(96.3% .018 251)` | Chip-blue. Info-pill background.                                                                  |
| `--p-ink-900`              | `#2C2C2C`                                     | `oklch(29.3% 0 0)`      | Primary reading text (near-black, softer than pure black).                                        |
| `--p-gray-600`             | `#4B5563`                                     | `oklch(44.6% .026 257)` | Secondary text (AA body everywhere).                                                              |
| `--p-gray-500`             | `#6B7280`                                     | `oklch(55.1% .023 264)` | Muted text (AA body, lighter).                                                                    |
| `--p-gray-400`             | `#8C8C8C`                                     | `oklch(64.0% 0 0)`      | Decorative / disabled only. **Not body text.**                                                    |
| `--p-gray-300`             | `#AEAEAE`                                     | `oklch(75.1% 0 0)`      | Faint / decorative only. **Never carries information.**                                           |
| `--p-gray-100`             | `#F2F2F2`                                     | `oklch(96.1% 0 0)`      | Hairline divider, empty progress track.                                                           |
| `--p-white`                | `#FFFFFF`                                     | `oklch(100% 0 0)`       | Primary content surface.                                                                          |
| `--p-gold-400`             | `#FFC71E`                                     | `oklch(85.6% .170 87)`  | Rating star fill (reinforced by shape).                                                           |
| `--p-gold-700`             | `#B8860B`                                     | —                       | Gold for outlines / small marks (graphical AA).                                                   |
| `--p-coral-400`            | `#FF4C4C`                                     | `oklch(67.2% .216 25)`  | Favorite heart fill (distinct from error).                                                        |
| `--p-green-500/700/800/50` | `#10B981` / `#047857` / `#065F46` / `#ECFDF5` | —                       | Success: fill / text-on-white / text-on-tint / surface.                                           |
| `--p-amber-500/700/50`     | `#F59E0B` / `#B45309` / `#FFFBEB`             | —                       | Warning: fill (dark text) / text / surface.                                                       |
| `--p-red-500/600/700/50`   | `#EF4444` / `#DC2626` / `#B91C1C` / `#FEF2F2` | —                       | Danger: accent / solid / text-on-tint / surface.                                                  |

### 2.2 Semantic roles (light)

| Role                                     | → primitive                   | Used for                                                |
| ---------------------------------------- | ----------------------------- | ------------------------------------------------------- |
| `--bg` / `--bg-daylight`                 | navy→sky→white gradient       | The shared daylight ground (every page floats over it). |
| `--surface`                              | white                         | Cards, sheets, inputs.                                  |
| `--surface-sky`                          | sky-100                       | Media/image zones (paired with `--secondary`).          |
| `--surface-glass`                        | `white / .90`                 | `.bg-card-glass` panels.                                |
| `--surface-glass-sky`                    | `sky / .30`                   | `.bg-glass` frosted tint.                               |
| `--text-primary`                         | ink-900                       | Body emphasis, card titles.                             |
| `--text-heading`                         | navy-900                      | Headings of consequence.                                |
| `--text-secondary`                       | gray-600                      | AA body everywhere.                                     |
| `--text-muted`                           | gray-500                      | Short secondary copy (AA body).                         |
| `--text-faint`                           | gray-400                      | Decorative / disabled only.                             |
| `--text-on-primary`                      | white                         | Text on navy fills.                                     |
| `--text-on-accent`                       | navy-900                      | Text on light-blue / sky fills.                         |
| `--primary` / `--primary-foreground`     | navy / white                  | The one primary action per screen.                      |
| `--secondary` / `--secondary-foreground` | light-blue / navy             | Supporting actions.                                     |
| `--accent` / `--accent-foreground`       | action-blue / white           | Gradients, glow, large accents.                         |
| `--info-surface` / `--info-foreground`   | chip-blue / **navy**          | Info chips (time, counts, stats).                       |
| `--success*`                             | green ramp                    | Success fill / text / tinted surface.                   |
| `--warning*`                             | amber ramp                    | Warning fill (ink text) / text / tinted surface.        |
| `--danger*`                              | red ramp                      | Solid (white text) + tinted destructive.                |
| `--rating` / `--favorite`                | gold / coral                  | Star + heart fills (accent, **not** status).            |
| `--border` / `--divider` / `--ring`      | navy `/.08` / gray-100 / navy | Hairline / separator / focus ring.                      |

### 2.3 Verified WCAG 2.1 contrast (the audit list)

Computed from the sRGB anchors (script in commit history). AA = 4.5:1 normal text, 3:1 large/graphical.

| Pairing                                       | Ratio       | Verdict                                                                  |
| --------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| ink `#2C2C2C` on white                        | **13.97:1** | ✅ AAA                                                                   |
| ink on surface-sky `#E8F2FF`                  | **12.35:1** | ✅ AAA                                                                   |
| ink on light-blue `#ADC8FF`                   | **8.30:1**  | ✅ AAA                                                                   |
| navy `#091A7A` on white                       | **14.58:1** | ✅ AAA                                                                   |
| navy on chip-blue `#EAF4FF`                   | **13.11:1** | ✅ AAA                                                                   |
| navy on light-blue `#ADC8FF`                  | **8.67:1**  | ✅ AAA                                                                   |
| secondary gray-600 on white                   | **7.56:1**  | ✅ AAA                                                                   |
| muted gray-500 on white                       | **4.83:1**  | ✅ AA                                                                    |
| white on navy (primary button)                | **14.58:1** | ✅ AAA                                                                   |
| navy on light-blue (secondary button)         | **8.67:1**  | ✅ AAA                                                                   |
| **info: navy on chip-blue**                   | **13.11:1** | ✅ (replaces the failing bright-blue)                                    |
| success text `#047857` on white               | **5.48:1**  | ✅ AA                                                                    |
| success text `#065F46` on tint                | **7.29:1**  | ✅ AAA                                                                   |
| warning ink `#2C2C2C` on amber fill           | **6.50:1**  | ✅ AA                                                                    |
| warning text `#B45309` on tint                | **4.84:1**  | ✅ AA                                                                    |
| danger solid: white on `#DC2626`              | **4.83:1**  | ✅ AA                                                                    |
| danger text `#B91C1C` on tint                 | **5.91:1**  | ✅ AA                                                                    |
| **gold star on white**                        | 1.56:1      | ⚠️ graphical only — reinforce with star shape + `--rating-edge` hairline |
| **bright-blue `#3D8FEF` on chip-blue**        | 2.96:1      | ❌ banned for text — use `--info-foreground` (navy)                      |
| **action/bright-blue on white**               | ~3.2:1      | ⚠️ large/icon only — never small text                                    |
| **muted `#8C8C8C` / faint `#AEAEAE` as body** | 3.36 / 2.22 | ❌ demoted to decorative-only                                            |

### 2.4 Named rules

- **The One Navy Rule.** Atrium Navy is the only saturated dark, and it appears on a minority of any screen: the primary
  action, the active state, the numbers that matter. Its rarity against the light blue is the point. **Never tint large
  light-mode surfaces navy** — navy is ink and action, not background.
- **The Daylight Rule.** Backgrounds run light blue at top to white below, like a lit room. The ground is **never flat
  gray and never a warm cream/sand neutral.** Atmosphere comes from blue light, carried by accent + motion, not by
  tinting neutrals warm.
- **The Navy-Tint Rule.** Every shadow is tinted navy (`rgba ~9,26,122` / `19,44,74`), never neutral black. A black
  shadow on this blue ground reads as a dated app — if a card looks stamped-out rather than lit, the tint or blur is
  wrong.

### 2.5 Dark theme (Phase 12)

`tokens.css` ships `[data-theme="dark"]` **placeholder** values (provisional, flagged `TODO`, **not yet WCAG-verified
**). Strategy: navy becomes the ground, near-white becomes ink, light-blue stays the accent, status hues re-tune against
the dark ground. Real values + a full AA re-audit happen in Phase 12 with **no component edits** (semantic-layer remap
only).

### 2.6 Why OKLCH over hex (authoring format)

Hex/`rgb` describe a color by its sRGB _channels_; they say nothing about how light or saturated it looks, so
manipulating them is guesswork and equal numeric steps are perceptually uneven. OKLCH describes a color by **L**
ightness, **C**hroma, **H**ue — the axes a designer actually reasons in. For this project specifically:

| Concern                    | Why OKLCH wins here                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dark theme (Phase 12)**  | Re-theming becomes "hold hue, flip lightness." In hex it's eyeball-and-retry. This is the single biggest payoff for a theme-ready system.                                                       |
| **Ramp generation**        | If we later need `navy-50…900` or tints/shades, perceptually-even steps come from stepping `L` — hex ramps drift in hue and bunch up in the midtones.                                           |
| **The blue-heavy palette** | Every blue can share one hue and vary only L/C, so the family reads as deliberate, not assorted.                                                                                                |
| **Wide gamut**             | OKLCH addresses the full Display-P3 gamut Apple phones render; hex caps you at sRGB. Headroom for richer blues later with no format change.                                                     |
| **Tooling alignment**      | Tailwind v4's default palette and shadcn's newer registries are authored in OKLCH (verified against current Tailwind docs). Matching them removes an impedance mismatch in the `@theme` bridge. |
| **Browser support**        | Universal in every modern engine since 2023; the rewrite targets modern runtimes only (zero-legacy), so support is a non-issue.                                                                 |

**The one caveat, handled:** designers and brand guidelines still think in hex, and a naive hex→OKLCH conversion can
drift by a hair due to rounding. Both are solved here — every primitive's OKLCH was generated to **round-trip exactly to
its source hex**, and that hex stays in the comment as the canonical cross-reference. So we get the modern authoring
ergonomics with none of the identity risk.

---

## 3. Typography

**One family: Lexend** (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), weights 300–700, loaded
once. Lexend was designed for reading proficiency — legible, calm, friendly without being cute. No second display face.

**The One Family Rule.** Lexend does every job; weight and size create hierarchy. If a screen needs more emphasis, go
heavier or larger — never reach for another font.

A **fixed px scale** (no fluid `clamp()` — product UI viewed at consistent phone DPI), ~1.25 ratio, leaning on weight
over size.

| Style      | Size | Weight | Line height | Use                                                                          |
| ---------- | ---- | ------ | ----------- | ---------------------------------------------------------------------------- |
| Headline   | 20px | 600    | 1.4         | Screen titles, featured card names. The ceiling — no oversized display type. |
| Title      | 16px | 600    | 1.4         | Section headers within a screen.                                             |
| Subheading | 14px | 500    | 1.4         | Card titles, grouped-list headers, emphasized labels.                        |
| Body       | 14px | 400    | 1.5         | Descriptions, reading copy. Cap prose at 65–75ch.                            |
| Label      | 12px | 400    | 1.4         | Form labels, chip text, secondary meta.                                      |
| Tiny       | 10px | 500    | 1.4         | Nav labels, smallest meta. **Never** required reading.                       |

> **Anti-gotcha (carried from the old app):** do **not** ship named text utilities that hard-code a `color` (
> `.text-body`/`.text-small`/`.text-tiny` baked `#4B5563` and overrode Tailwind text classes). In the new system, type
> tokens set **size/weight/leading only**; color comes from a separate `--text-*` role so it stays overridable and
> theme-able.

---

## 4. Spacing, layout & structure

- **Space scale** (4px base): `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`. Named anchors from DESIGN.md:
  `sm 8 · md 16 · lg 24 · xl 40`. Card padding = `16` standard, `20` featured.
- **App column:** phone-first, single column, `--p-container-app: 430px`. On tablet/desktop the column **centers**;
  layout does not sprawl into a dashboard.
- **Breakpoints** (mobile-first, structural only — never fluid type): `sm 640 · md 768 · lg 1024`. Responsiveness is
  structural (centering, safe-area), not clamp-scaled headings.
- **Safe area:** `viewport-fit=cover` + `env(safe-area-inset-*)` helpers (`pt-safe`, `pb-safe`, `h-safe-top`) for the
  iOS notch / home indicator inside the installed PWA.
- **Z-index scale** (semantic, never arbitrary `9999`):
  `base 0 · sticky 100 · nav 200 · overlay 300 · backdrop 400 · modal 500 · toast 600 · tooltip 700`.

---

## 5. Radius

| Token                    | Value  | Use                                                |
| ------------------------ | ------ | -------------------------------------------------- |
| `--radius-control`       | 12px   | Buttons, inputs, chips.                            |
| `--radius-card`          | 16px   | Standard card.                                     |
| `--p-radius-lg`          | 20px   | Legacy "standard" token (kept for parity).         |
| `--radius-card-featured` | 24px   | Featured/hero card — **band ceiling for content**. |
| `--radius-nav`           | 40px   | Glass bottom nav **only**.                         |
| `--radius-pill`          | 9999px | Tags / pills.                                      |

**Don't over-round.** Content cards top out near 24px. The 40/50px radii are reserved for the glass nav and pills, never
content cards (a codex tell).

---

## 6. Elevation

Depth is **soft ambient navy glow**, not hard shadow and not flat. White cards lift off the gradient on low, wide,
navy-tinted shadows — lit from above in a bright room. Refined values (softer than the old `theme.css`, which
over-weighted card shadows at `0.15`):

| Role                   | Value                             | Use                                            |
| ---------------------- | --------------------------------- | ---------------------------------------------- |
| `--shadow-rest`        | `0 6px 16px rgba(19,44,74,0.06)`  | Default lift for white cards. Barely-there.    |
| `--shadow-featured`    | `0 10px 28px rgba(19,44,74,0.08)` | Hero/featured cards.                           |
| `--shadow-interactive` | `0 8px 25px rgba(9,26,122,0.20)`  | Pressed/active, floating interactive surfaces. |
| `--shadow-elevated`    | `0 20px 40px rgba(9,26,122,0.25)` | Modals, sheets, the glass nav's ambient field. |

Never pair a 1px border with a wide soft drop shadow on the same element (ghost-card tell). Cards separate by shadow +
white-on-blue contrast; dividers use the `#F2F2F2` hairline.

---

## 7. Materials — glass & the daylight ground

- **Daylight ground** (`--bg-daylight`): three soft radial sky overlays + a `to bottom right`
  `#ADC8FF → #E8F2FF → #FFFFFF` linear, `background-attachment: fixed`. The `body` is a fixed full-height frame; inner
  panels scroll, so light stays anchored from above. Pages render transparent over it; opaque surfaces float on top.
  Full-screen overlays repaint the same recipe via `--bg-daylight`.
- **Sky glass** (`--surface-glass-sky`): `rgba(173,200,255,0.30)` + `backdrop-filter: blur(12px)`.
- **Card glass** (`--surface-glass`): `rgba(255,255,255,0.90)` + `blur(20px)`.
- Glass is **purposeful, not default** decoration — reserved for the nav, hero/stat cards, and floating controls.

---

## 8. Motion

- **Duration:** 150–250ms on most transitions (`--p-dur-fast/base/slow`). Users are in flow — no orchestrated page-load
  choreography. Motion conveys **state**, not decoration.
- **Easing:** ease-out only — `--p-ease-out-quart`, `--p-ease-out-expo`, `--p-ease-standard`. No bounce, no elastic.
- **Tap scales** (mobile-first press feedback over hover): `tap 0.97` (default) · `tapSmall 0.94` (icons/chips) ·
  `tapCard 0.98` (large surfaces) · `tapNav 0.92` (nav).
- **Springs:** `springSnappy` (interactions), `springGentle` (entrances).
- **Earn the delight:** animate genuine milestones (review done, streak kept, palace finished), not every tap.
- **Reduced motion is not optional:** `prefers-reduced-motion: reduce` collapses CSS animation/transition to ~0; JS
  motion uses `<MotionConfig reducedMotion="user">`. Every bespoke animation needs a crossfade/instant fallback.

---

## 9. Components (state vocabulary)

Every interactive component ships the full set: **default · hover · focus-visible · active · disabled · loading · error
** (product register requirement). Min touch target **44×44px**. Focus-visible = navy ring at `/50`, 3px, soft (never a
harsh outline). State is **never color-alone** — pair with icon/shape/label.

### Buttons

- **Shape:** `--radius-control` (12px). Pills reserved for chips/tags.
- **Primary:** `--primary` (navy) bg, `--primary-foreground` (white), medium weight. One per screen.
- **Secondary:** `--secondary` (light-blue) bg, `--secondary-foreground` (navy).
- **Ghost/Outline:** white/transparent, navy text, hairline `--border`.
- **Destructive:** **tinted, not solid** — `--danger-surface` bg + `--danger-on-surface` text. (Solid danger only where
  `--danger`/white is needed; it passes at 4.83:1.)
- **Press/Focus:** `whileTap={{ scale: 0.95 }}`; navy focus ring. **Loading:** in-button spinner + disabled, label
  preserved. **Disabled:** ~50% opacity, no shadow.

### Chips

- **Info (default):** `--info-surface` (chip-blue) bg, **`--info-foreground` (navy)** text/icon, 12px radius. (Never
  bright-blue text — fails at 2.96:1.)
- **Selectable/filter:** invert to navy fill + white text when active; carry an active marker beyond color.
- **Status chips:** `SrsStatusChip` maps SRS state → tone; each tone (info/neutral/navy/amber/emerald/gold) is
  pre-checked to clear AA at 11–12px.

### Cards

- **Radius:** 16px standard, 24px featured (12–24px band). **Surface:** white; media zones use
  `--secondary → --surface-sky` (`#ADC8FF → #E8F2FF`). **Shadow:** `--shadow-rest`, `--shadow-featured` for heroes. \*
  \*Border:** generally none. **Padding:** 16px / 20px featured. **Press:\*\* `whileTap={{ scale: 0.98 }}`; progress fills
  navy→action-blue with ease-out width.
- **States:** **loading** = skeleton (not a center spinner). **Empty** = teaches the next action, not "nothing here."

### Inputs

- White/transparent bg, hairline `--border`, 12px radius, 14–16px text, ≥44px tap height.
- **Focus:** navy ring + 3px soft ring. **Error:** red border + red ring at low opacity, message below. **Disabled:** ~
  50% opacity, faint fill. **Placeholder** must hit 4.5:1 (never left at faint gray).

### Navigation — Liquid Glass Bottom Nav (signature)

Fixed, floating, `--radius-nav` (40px) glass bar, three tabs (Home / Palaces / Profile). Frosted navy-gradient body (
`backdrop-blur`) over an ambient navy/action-blue glow. Active tab = spring-animated white pill (24px radius) sliding
between items; active icon/label flips to navy, inactive white at ~70%. Active state reinforced by a navy dot (**never
color-alone**). Press `whileTap={{ scale: 0.92 }}`. Sits at `--p-z-nav`.

### Shared primitives to carry forward (`shared/ui`)

`ScreenHeader` (frosted back+title bar, static or collapse-on-scroll) · `IconButton` (glass/tint/solid/ghost; md+ clears
44px; requires `aria-label`) · `GlassCard` (`tone="sky" | "card"`) · `Chip` + `SrsStatusChip` · `Avatar` (navy-gradient
initials fallback) · `GradeButtons` (Again/Hard/Good/Easy with interval previews). Reach for these before hand-rolling.

---

## 10. Token coverage checklist (T0.1 AC — every category)

- [x] **Color** — primitives + semantic roles (surface, text, brand, info, status, accent, lines) + verified WCAG + dark
      stubs.
- [x] **Typography** — family, fixed px scale (6 styles), weights, leading, One Family Rule, color-decoupling fix.
- [x] **Spacing** — 4px scale + named anchors + card padding.
- [x] **Layout** — app column width, mobile-first breakpoints, safe-area, z-index scale.
- [x] **Radius** — control/card/featured/nav/pill.
- [x] **Elevation** — 4 navy-tinted shadow roles.
- [x] **Materials** — daylight ground recipe, sky/card glass tints + blur.
- [x] **Motion** — durations, easings, springs, tap scales, reduced-motion.
- [x] **Components** — buttons/chips/cards/inputs/nav with full state vocabulary + shared primitives.

---

## 11. Resolved discrepancies (old → new)

| #   | Conflict (old app)                                                                                                   | Resolution                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Info chip text** used bright-blue `#3D8FEF` on chip-blue `#EAF4FF` — **2.96:1, fails.**                            | Chip text role `--info-foreground` = **navy** (13.11:1). Bright-blue demoted to icon/large-only.                                                                      |
| 2   | **Muted/faint grays** (`#8C8C8C`, `#AEAEAE`) used for body text; `.text-*` utilities baked failing grays.            | Body text roles darkened: secondary = gray-600 (7.56:1), muted = gray-500 (4.83:1, AA). `#8C8C8C`/`#AEAEAE` → decorative-only. Type tokens no longer bake color.      |
| 3   | **`neutral`** declared as both `#4B5563` (theme.css) and `#6B7280` (DESIGN.md).                                      | Split by role: `--text-secondary` = `#4B5563`, `--text-muted` = `#6B7280`. Both AA; no ambiguity.                                                                     |
| 4   | **Card shadows** heavier in `theme.css` (`rgba(9,26,122,0.15)`) than DESIGN.md's refined `rgba(19,44,74,0.06–0.08)`. | Adopt DESIGN.md's softer refined values as canonical (calmer, more "lit").                                                                                            |
| 5   | **Status colors as white-on-fill** mostly fail (success 2.54, warning 2.15).                                         | Each status gets accessible text + tint shades; amber **requires ink text**; destructive is **tinted by default**; solid danger uses `#DC2626` (white passes 4.83:1). |
| 6   | **Leftover Geist Variable** in `tailwind.css` (`--font-sans`) competed with live Lexend.                             | One Family Rule enforced from day one — Lexend only; no Geist in the new repo.                                                                                        |
| 7   | **Gold star** `#FFC71E` on white = 1.56:1.                                                                           | Accepted as graphical accent reinforced by star **shape**; `--rating-edge` (`#B8860B`) hairline when it must read on white.                                           |

---

## 12. Hand-off to Phase 1

When the design system is approved (Checkpoint 0), Phase 1 (T1.2) will:

1. Copy `tokens.css` into the new repo's `app/` (or `shared/`) theme entry.
2. Add the **Tailwind v4 `@theme inline` bridge** (sketched at the foot of `tokens.css`) mapping semantic roles →
   shadcn/Tailwind vars.
3. Wire a `ThemeProvider` toggling `[data-theme]` (light now; dark values land in Phase 12).
4. Stand up `shared/ui` (shadcn pattern + Base UI) consuming **only** semantic tokens — verified by a "sample screen
   styled only with semantic tokens" acceptance check, and (Phase 1 CI) an FSD-boundary + no-raw-hex lint.

---
name: Mindscape
description: A calm, daylight-lit memory-palace trainer for the phone.
colors:
  navy: '#091A7A'
  action-blue: '#4F8EFF'
  light-blue: '#ADC8FF'
  surface-sky: '#E8F2FF'
  chip-blue: '#EAF4FF'
  ink: '#2C2C2C'
  text-secondary: '#4B5563'
  text-muted: '#6B7280'
  text-faint: '#8C8C8C'
  divider: '#F2F2F2'
  white: '#FFFFFF'
  rating-gold: '#FFC71E'
  favorite-coral: '#FF4C4C'
  success: '#10B981'
  success-text: '#047857'
  success-surface: '#ECFDF5'
  warning: '#F59E0B'
  warning-text: '#B45309'
  warning-surface: '#FFFBEB'
  danger: '#DC2626'
  danger-text: '#B91C1C'
  danger-surface: '#FEF2F2'
typography:
  headline:
    fontFamily: "Lexend, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '20px'
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 'normal'
  title:
    fontFamily: "Lexend, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '16px'
    fontWeight: 600
    lineHeight: 1.4
  sub:
    fontFamily: "Lexend, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '14px'
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Lexend, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Lexend, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1.4
  tiny:
    fontFamily: "Lexend, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: '10px'
    fontWeight: 500
    lineHeight: 1.4
rounded:
  control: '12px'
  card: '16px'
  card-featured: '24px'
  nav: '40px'
  pill: '9999px'
spacing:
  space-1: '4px'
  space-2: '8px'
  space-3: '12px'
  space-4: '16px'
  space-6: '24px'
  space-10: '40px'
components:
  button-primary:
    backgroundColor: '{colors.navy}'
    textColor: '{colors.white}'
    rounded: '{rounded.control}'
    padding: '0 20px'
    height: '44px'
  button-secondary:
    backgroundColor: '{colors.light-blue}'
    textColor: '{colors.navy}'
    rounded: '{rounded.control}'
    height: '44px'
  button-ghost:
    backgroundColor: '{colors.white}'
    textColor: '{colors.navy}'
    rounded: '{rounded.control}'
    height: '44px'
  button-destructive:
    backgroundColor: '{colors.danger-surface}'
    textColor: '{colors.danger-text}'
    rounded: '{rounded.control}'
    height: '44px'
  card:
    backgroundColor: '{colors.white}'
    rounded: '{rounded.card}'
    padding: '16px'
  card-glass:
    backgroundColor: '{colors.white}'
    rounded: '{rounded.card-featured}'
    padding: '20px'
  chip-info:
    backgroundColor: '{colors.chip-blue}'
    textColor: '{colors.navy}'
    rounded: '{rounded.control}'
    padding: '4px 10px'
  input:
    backgroundColor: '{colors.white}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    height: '44px'
    padding: '0 14px'
---

# Design System: Mindscape

## 1. Overview

**Creative North Star: "The Lucid Atrium"**

Mindscape is a phone-held room flooded with morning light. An atrium is the calm, sunlit
hall a building grows outward from, and that is the resting state of every screen here: a
soft daylight gradient (light-blue → sky → white) that the whole app shares, with white
cards and chrome lifted gently off it by soft, navy-tinted shadows. Nothing shouts. The
surface gives you room to think, which is the entire point of a memory trainer.

The identity is a single deep navy (#091A7A), used with discipline as the anchor of brand,
primary action, and heading type. Everything blue radiates from it: a bright action-blue for
glow and gradients, a pale light-blue for atmosphere and secondary fills. Color is carried by
this cool, daylight-blue family plus a warm-free ink ramp; warmth never enters through a
beige background, only through the gold of a rating star or the coral of a favorited heart.
Glass is rare and deliberate, reserved for floating chrome (the bottom nav, hero surfaces),
never the default card.

This system explicitly rejects three things, carried straight from the product strategy: the
**dense enterprise dashboard** (no data-dense panels, tiny rows, or desktop-first tables),
the **clinical, sterile flashcard tool** (retention is the engine, but the surface must feel
crafted and humane, never bare-Anki joyless), and the **generic SaaS template** (no
cream/beige body background, no identical icon-card grids, no tiny tracked uppercase
eyebrows). Playfulness is welcome, but it arrives as earned celebration and spring motion,
never as ambient noise.

**Key Characteristics:**

- One shared daylight gradient ground under every screen.
- A single navy identity anchor; all other blues radiate from it.
- Soft, low, wide, navy-tinted elevation; never a hard neutral-black shadow.
- Phone-only, one primary task per screen, ≥44px touch targets.
- Glass as a rare signature material, not decoration.
- Calm at rest, with spring-loaded delight on interaction.
- Self-evident surfaces: color roles, icons, and placement explain the screen; supporting
  copy stays to one line.

## 2. Colors

A cool, daylight-blue palette anchored by one navy, set against a warm-free ink ramp; status
and accent hues stay quiet until a state genuinely calls for them. All values are authored in
OKLCH (the project doctrine); the hex below is the verified, exact round-trip and the
canonical designer anchor.

### Primary

- **Atrium Navy** (#091A7A / `oklch(29.4% 0.16 266.1)`): The single identity anchor. Brand
  mark, primary buttons, headings of consequence, the focus ring, and the tint behind every
  shadow and glass surface. Deep enough to carry white text at 13:1.
- **Action Blue** (#4F8EFF / `oklch(66.1% 0.18 261.1)`): The radiant accent. Gradients, the
  bottom-nav glow, and large or icon-scale accents. Used for light, not for small text.

### Secondary

- **Light Blue** (#ADC8FF / `oklch(83.2% 0.083 264.3)`): Atmosphere and secondary fills
  (secondary buttons, glass tint, the top of the daylight gradient). Pairs with navy text.
- **Bright Blue** (#3D8FEF / `oklch(64.7% 0.164 254.5)`): Icon and large-element accent only;
  it fails as small text on a tint, so it never carries copy.

### Tertiary (atmosphere surfaces)

- **Surface Sky** (#E8F2FF / `oklch(95.7% 0.021 254.9)`): Media zones and the mid-stop of the
  daylight ground.
- **Chip Blue** (#EAF4FF / `oklch(96.3% 0.018 250.6)`): The info/meta chip background. Always
  pairs with navy text (bright-blue on this tint fails at 2.96:1).

### Neutral

- **Ink** (#2C2C2C / `oklch(29.3% 0 0)`): Primary reading text and card titles (13.97:1 on
  white). A warm-free near-black, never pure #000.
- **Slate** (#4B5563 / `oklch(44.6% 0.026 256.8)`): Secondary text everywhere (7.56:1).
- **Muted Gray** (#6B7280 / `oklch(55.1% 0.023 264.4)`): Lighter secondary copy and
  placeholders (4.83:1, still AA body).
- **Faint Gray** (#8C8C8C / `oklch(64% 0 0)`): Decorative and disabled only (3.36:1). Never
  carries information.
- **Hairline** (#F2F2F2 / `oklch(96.1% 0 0)`): Dividers and empty tracks.
- **White** (#FFFFFF): Card and sheet surfaces, the base of the daylight ground.

### Accent (non-status)

- **Rating Gold** (#FFC71E / `oklch(85.6% 0.17 87.3)`): Star fill; always reinforced by the
  star shape, hairlined when it sits on white.
- **Favorite Coral** (#FF4C4C / `oklch(67.2% 0.216 25.1)`): Heart fill. Deliberately distinct
  from danger red so "favorite" never reads as "error".

### Status

- **Success** (#10B981 fill / #047857 text on white / #ECFDF5 surface).
- **Warning** (#F59E0B fill / #B45309 text). The amber fill requires _dark_ text (ink on
  amber is 6.50:1; white on amber fails).
- **Danger** (#DC2626 solid, white text passes at 4.83:1 / #B91C1C text on the #FEF2F2 tint).

### Named Rules

**The One Navy Rule.** There is exactly one identity navy (#091A7A). Every other blue is a
deliberate sibling that radiates from it; do not introduce a second "brand blue."

**The Cool-Daylight Rule.** Warmth enters only through accents (gold, coral), never through the
background. The body is never cream, beige, sand, or any warm-tinted near-white. Tinted
neutrals lean toward the navy hue, never toward warm.

**The Navy-Text-On-Tint Rule.** On any blue tint (chip-blue, sky, light-blue), text is navy,
never bright-blue. Bright-blue on tint fails contrast.

**The One-Meaning Rule.** Every saturated hue owns exactly one job, app-wide: navy is brand
and "this acts", green is success, amber is warning, red is danger, gold is rating, coral is
favorite. Pale sky tints are atmosphere, never signals. A hue never moonlights — a color
that always means the same thing replaces a sentence of UI copy, and that replacement is the
point. Color is still never the sole carrier: pair it with icon, shape, or label.

## 3. Typography

**Display / Body / Label Font:** Lexend (with `-apple-system, BlinkMacSystemFont, 'Segoe UI',
Roboto, sans-serif` fallback). One family does all the work.

**Character:** Lexend is a humanist sans engineered for reading proficiency, with open
counters and even rhythm. Hierarchy comes entirely from size and weight contrast (400 / 500 /
600), not from a second typeface. The result reads as quiet and legible at phone DPI, exactly
right for a tool whose job is recall, not display.

### Hierarchy

- **Headline** (600, 20px, 1.4): Screen titles. This is the ceiling.
- **Title** (600, 16px, 1.4): Section headers within a screen.
- **Sub** (500, 14px, 1.4): Card titles and emphasized labels.
- **Body** (400, 14px, 1.5): Reading copy. Default text color is Slate (#4B5563), not ink, so
  blocks of copy sit one step softer than titles.
- **Label** (400, 12px, 1.4): Form labels, chips, and meta.
- **Tiny** (500, 10px, 1.4): Nav labels and the smallest meta. Never required reading.

### Named Rules

**The 20px Ceiling Rule.** Headline type tops out at 20px. This is a phone product viewed at
arm's length, not a marketing page; oversized display type is forbidden. Emphasis comes from
weight and color, not from scale.

**The One Family Rule.** Lexend carries every role. Do not pair a second typeface; reach for a
heavier weight instead.

**The 12px Floor Rule.** Nothing the user must read sits below the 12px Label size. Tiny
(10px) exists only for redundant text — nav labels under icons, decorative meta — that
repeats what an icon or shape already says. (Apple's HIG floors legible text at 11pt; the
required-reading floor here is 12px.)

**The Weight-Before-Size Rule.** Emphasis climbs through weight (400 → 500 → 600) and color
(slate → ink → navy) before it ever climbs in pixels. The scale is deliberately narrow —
12px floor to 20px ceiling — so weight and color do the talking; heavier weights also hold
up better at phone sizes than bigger type.

**The Scale-Survives Rule.** Type respects the reader's OS text-size setting: no fixed-height
text containers, and every screen tolerates one text-size step up without clipping or
truncating required reading.

## 4. Elevation

Depth is built from soft, low, wide, **always navy-tinted** shadows. Surfaces are never
outlined to fake elevation and shadows are never neutral black, which would read grey and
cheap against the daylight ground. Four elevation roles cover the whole app, climbing with
intent: resting cards barely lift, interactive and modal chrome lift hard.

### Shadow Vocabulary

- **Rest** (`0 6px 16px oklch(29% 0.063 254.3 / 0.06)`): The default card lift off the
  daylight ground. Steel-navy tint, barely there.
- **Featured** (`0 10px 28px oklch(29% 0.063 254.3 / 0.08)`): Hero and glass surfaces.
- **Interactive** (`0 8px 25px oklch(29.4% 0.16 266.1 / 0.2)`): Primary buttons and pressable
  navy chrome; a real navy glow signals "this acts."
- **Elevated** (`0 20px 40px oklch(29.4% 0.16 266.1 / 0.25)`): The floating bottom nav and
  modal-level chrome.

### Named Rules

**The Navy-Tint Rule.** Every shadow, glow, and glass tint is built from the navy hue with
inline alpha, never from neutral black or grey. Elevation belongs to the same light as the
ground.

**The Glass-Is-Purposeful Rule.** Frosted glass (backdrop-blur) is reserved for hero,
featured, and floating chrome (the bottom nav, hero cards). The default content surface is a
plain white card with a rest shadow. Glass is a signature, never a decoration.

## 5. Components

Every interactive control clears a 44px touch target and answers a press with a spring or a
quick `active:scale` compression, never a color-only state change.

### Buttons

- **Shape:** 12px radius (`rounded-control`); never pill-shaped except for tags.
- **Primary:** Navy fill (#091A7A), white text, the Interactive navy-glow shadow. Padding
  `0 20px` at a 44px height (`md`); `sm` is 36px, `lg` is 48px.
- **Secondary:** Light-blue fill (#ADC8FF) with navy text, no shadow.
- **Ghost:** White surface, navy/heading text, a hairline border, and the Rest shadow.
- **Destructive:** Tinted, not loud: danger-surface fill (#FEF2F2) with danger text (#B91C1C).
- **Press / Focus:** `active:scale-[0.97]`, 200ms ease-out; focus shows the global navy ring
  (3px at 50% alpha). Disabled drops to 50% opacity and ignores pointer events.

### Chips

- **Info chip:** Chip-blue surface (#EAF4FF) with navy text (13:1), 12px radius, `4px 10px`
  padding, optional leading icon. For counts, meta, and small stats.

### Cards / Containers

- **Corner Style:** 16px (`rounded-card`) for the default card; 24px (`rounded-card-featured`)
  for hero/glass surfaces. Cards never exceed 24px.
- **Default card:** White surface, Rest shadow, 16px internal padding, no border.
- **Glass card:** White-at-90% or sky-tint surface with a 12–20px backdrop blur, Featured
  shadow, 20px padding. Hero/floating only.
- **The forbidden combination:** never a 1px border _and_ a wide soft shadow on the same
  element. Pick one.

### Inputs / Fields

- **Style:** White surface, hairline navy-tinted border, 12px radius, 44px tall, `0 14px`
  padding, ink text, muted (#6B7280) placeholder that still clears 4.5:1.
- **Focus:** The global navy `:focus-visible` ring (3px box-shadow at 50% alpha); no harsh
  browser outline.

### Navigation (signature)

- **Liquid Glass bottom nav:** A frosted navy bar (135° navy gradient + backdrop-blur)
  floating above an ambient navy/action-blue glow, 40px (`rounded-nav`) corners, the Elevated
  shadow. Three top-level tabs (Home, Palaces, Profile). The active tab is a white pill that
  springs between items via shared-layout animation; active icon/label turn navy, inactive
  stay white at 75%. Self-hides on detail routes that own a back control.

### The Daylight Ground (signature surface)

Not a component but the canvas: one fixed radial-plus-linear gradient
(`light-blue → surface-sky → white`, with soft sky glows) shared by every screen via the
`body` background. Screens are transparent and float their cards over it; they never paint
their own opaque background.

## 6. Self-Evidence & UX Copy

The interface explains itself; words are the fallback, not the plan. These rules follow
Apple's Human Interface Guidelines on writing and color: use fewer words, put the important
thing first, and let one consistent color signal interactivity.

**The Show-Before-Tell Rule.** Meaning arrives through the system — a consistent color role,
an icon, placement, a motion cue — before any words. A paragraph of instructions on a
working screen is a design bug: redesign the element until it explains itself, then delete
the paragraph.

**The One-Line Rule.** Supporting copy is one short line, placed at the point of action.
Anything longer gets absorbed into the interface itself: an empty state, a label, a
progressive-disclosure sheet. Titles name the object ("Kitchen", "Cards for today"), not the
concept.

**The Verb-First Rule.** Buttons and actions lead with the verb and stop: "Study",
"Add room", "Move to folder". Never clever or chatty ("Let's do this!"), never a description
of consequences where a verb would do.

**The Empty-State-Teaches Rule.** First-run guidance lives in the empty state: one
encouraging line plus the primary action, in place. No onboarding tours, coach marks, or
persistent hints — the second visit must never re-read the first visit's help.

**The Disclosure Rule.** One primary action per screen; secondary actions retreat into the
kebab (⋮), sheets, swipe actions, and long-press. Detail is one tap away, never stacked on
the resting surface.

## 7. Do's and Don'ts

### Do:

- **Do** keep one shared daylight gradient ground under every screen; let screens float white
  cards over it rather than painting their own backgrounds.
- **Do** anchor identity, primary action, and headings to the one Atrium Navy (#091A7A).
- **Do** build every shadow, glow, and glass tint from the navy hue with inline alpha (The
  Navy-Tint Rule).
- **Do** use navy text on every blue tint; reserve bright-blue for icons and large elements.
- **Do** keep cards at 16px radius (24px for hero/glass), and clear 44px on every touch
  target.
- **Do** answer presses with a spring or `active:scale` compression, and give every animation
  a `prefers-reduced-motion` fallback.
- **Do** let celebration be earned and spring-loaded (a completed session, an extended
  streak), then return to calm.
- **Do** let color roles, icons, and placement explain the screen; keep any supporting copy
  to one verb-first line at the point of action.
- **Do** emphasize with weight and color before size, and keep required reading at 12px or
  above (Tiny is for redundant labels only).

### Don't:

- **Don't** ship the **dense enterprise dashboard**: no data-dense panels, tiny rows, or
  desktop-first tables. This is phone-only, one task per screen.
- **Don't** ship the **clinical, sterile flashcard tool**: retention is the engine, but the
  surface must feel crafted and humane, never bare-Anki joyless.
- **Don't** ship the **generic SaaS template**: no cream/beige/sand body background, no
  identical icon-card grids, no tiny tracked uppercase eyebrows.
- **Don't** introduce a second "brand blue" or let warmth enter through the background (The
  One Navy Rule, The Cool-Daylight Rule).
- **Don't** pair a 1px border with a wide soft drop shadow on the same card or button.
- **Don't** round cards past 24px, and don't pill-shape anything but tags and buttons by
  intent.
- **Don't** use glass as decoration; it is reserved for hero and floating chrome.
- **Don't** let color be the only signal of a state; pair it with shape, icon, or label.
- **Don't** ship explanatory paragraphs, onboarding tours, or hints that restate what the
  interface already shows; if a screen needs a manual, redesign the screen.
- **Don't** reuse a status hue decoratively or give one hue two meanings (The One-Meaning
  Rule).

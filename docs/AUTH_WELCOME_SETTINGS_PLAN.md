# Auth · Welcome · Splash · Settings — Implementation Plan

Status: **draft, awaiting confirmation**. Derived from a grill-me design interview + impeccable `shape`.
Target repo: `web/memory-palaces` (new FSD app). Design source: `web/memory-palaces-app-ui` (old SPA, "The Lucid Atrium").

---

## 1. Feature summary

Bring a full entry experience into the guest-first new app: a redesigned **splash**, a faithful
visual port of **login / signup / forgot-password** (adapted to the app's design tokens + i18n),
a **"Continue as guest"** escape hatch, a redesigned post-signup **welcome**, and **settings**
updates (sign-out / guest CTA, plus mock Change-Password and Phone screens). Auth is **mocked in
localStorage with no validation**, structured behind a port so Phase 9 can drop in Supabase.

## 2. Primary user action

Get into the app — by signing in, creating an account, or continuing as a guest — in one tap from
a calm first screen, with the app never hard-blocked behind auth for a returning user.

## 3. Design direction

- **Register:** product (design serves the task). Color strategy: **Restrained** for the auth/settings
  forms; **Committed** (drenched navy→sky) for the splash + welcome moments only.
- **Scene sentence:** a focused learner opens the app on their phone in a quiet moment, and the
  screen feels like stepping through a daylit threshold into their own remembered space.
- **Anchors:** Apple "Fitness/Health" first-run polish; Duolingo's *restraint-mode* (motivating, not
  cartoonish); architectural blueprint line-draw.
- DESIGN.md is the source of truth: deep navy `#091A7A` identity, sky-blue + glass atmosphere,
  one ritual per screen, 44px+ targets, `whileTap`, 60fps transform motion, `prefers-reduced-motion`
  fallbacks. **Use semantic token utilities only** (`bg-primary`, `text-heading`, `bg-card`,
  `rounded-card`, `--bg-daylight`), never raw hex (fixes the old `.text-small/.text-tiny` contrast).

## 4. Scope

Production-ready, multi-screen flow, shipped-quality + tested. Splash/welcome get a creative redesign;
login/signup/forgot are faithful adapted ports. No backend, no Playwright/CI.

## 5. Auth model (mock, backend-ready)

- `AuthGateway` **port** is the source of truth for the persisted session (account or guest).
  `LocalAuthGateway` writes to `localStorage` with **no credential validation**; stores **email + name
  only** (never a raw password). Phase 9 = swap the adapter for `SupabaseAuthGateway`, features untouched.
- `Session.kind: 'guest' | 'account'` already exists. Add `makeAccountSession`.
- On boot, `restoreSession` rehydrates the in-memory session store from the gateway; if nothing is
  persisted, session stays `null` and the route guard sends the user to `/login`.

## 6. Entry flow

```
FIRST LAUNCH (no persisted session)
  /  splash (await restoreSession + animation) → redirect /login
  /login   ├ Sign in ........... mock → /
           ├ Create account .... → /signup → /welcome → /
           ├ Forgot password ... → /forgot → (simulated) → /login
           └ Continue as guest . → /
RETURNING (gateway has account or guest) → / (skip auth)
LOGOUT (account only) → confirm → signOut → /login   (local data kept)
```

Welcome/success shows **only** after account signup. Splash is skippable (tap / auto-advance ~1.5–2s
or until session resolves), reduced-motion renders the final frame statically.

## 7. Visual states (every screen)

default · focused-field · invalid (shape-only: email format, password length) · submitting · success ·
reduced-motion · guest vs account (settings). No skeletons needed (no network); use the existing
`Button` loading affordance for the simulated submit delay.

---

## Phased, file-by-file plan

Conventions: each `pages/*` slice = `ui/<Page>.tsx` + `ui/<Page>.test.tsx` + `index.ts`; each route is a
thin wrapper in `app/router.tsx` supplying nav callbacks (pages stay router-free); every string is an
i18n key; FSD import direction respected (`app → pages → widgets → features → entities → shared`).

### Phase 0 — Foundations (ports, config, i18n, factory)
- **`src/shared/api/auth-gateway.ts`** (new) — `AuthGateway` port:
  `signUp({email,name})`, `signIn({email})`, `signOut()`, `requestPasswordReset(email)`,
  `getPersisted(): PersistedAuth | null`, `persistGuest()`. Returns a plain `{kind,email?,name?}` identity.
- **`src/shared/api/index.ts`** (edit) — export `AuthGateway`, `PersistedAuth`.
- **`src/app/persistence/local-auth-gateway.ts`** (new) + **`.test.ts`** — localStorage adapter under a
  single `mindscape:auth` key; no validation; stores email+name only.
- **`src/app/composition-root.ts`** (edit) — add `authGateway: AuthGateway` to `Services`, wire
  `new LocalAuthGateway()`.
- **`src/shared/config/routes.ts`** (edit) — add `login`, `signup`, `forgot`, `welcome`,
  `settingsChangePassword` (`/settings/change-password`), `settingsPhone` (`/settings/phone`).
- **`src/entities/session/model/types.ts`** (edit) + **`index.ts`** — add
  `makeAccountSession(id, {email,name}, createdAt)` returning `kind:'account'`.
- **`src/shared/i18n/locales/en.ts`** (edit) — add `auth` namespace (login/signup/forgot/welcome/splash,
  social "coming soon", guest CTA) and extend `settings` (logout, signIn, createAccount, changePassword
  screen, phone screen). Update **`src/shared/i18n/i18next.d.ts`** if resource typing requires.
- **Acceptance:** `tsc --noEmit` clean; gateway unit test green.

### Phase 1 — Session/auth domain + bootstrap
- **`src/features/session/sign-up-with-email.ts`** — gateway.signUp → `makeAccountSession` → store.set;
  also write name+email to profile via existing `features/profile`.
- **`src/features/session/sign-in-with-email.ts`** — gateway.signIn (no check) → account session.
- **`src/features/session/sign-out.ts`** — gateway.signOut → store.clear (local data untouched).
- **`src/features/session/continue-as-guest.ts`** — gateway.persistGuest → guest session
  (supersedes/extends `create-guest-session.ts`; keep idempotent load).
- **`src/features/session/restore-session.ts`** — read `gateway.getPersisted()`, set the matching
  session or leave null. The single boot path.
- **`src/features/session/request-password-reset.ts`** — simulated; returns void/cooldown.
- **`src/features/session/index.ts`** (edit) — export the new commands.
- **`src/app/providers/AuthProvider.tsx`** (edit) — replace auto-create-guest with `restoreSession`
  (StrictMode ref-guard kept).
- **Tests:** one `.test.ts` per command (InMemoryRepository + a fake gateway).
- **Acceptance:** features green; AuthProvider no longer force-creates a guest.

### Phase 2 — Routing + guard
- **`src/app/router.tsx`** (edit) — add routes: index `/` = **SplashRoute** (awaits restore, then
  `redirect`), `/login`, `/signup`, `/forgot`, `/welcome`, `/settings/change-password`, `/settings/phone`.
  Move the current home to its own gated route; add a **root `beforeLoad`** (or splash-driven redirect)
  that routes by session: none→`/login`, exists→home. Thin wrappers wire feature commands + nav.
- **Acceptance:** deep-linking `/login` etc. works; returning session lands on home; no session →
  `/login`.

### Phase 3 — Auth UI kit (shared, token-ified ports)
- **`src/shared/ui/AuthScreen.tsx`** (new) — atmospheric auth shell (gradient/glass over `--bg-daylight`),
  replaces old `AuthBackground`.
- **`src/shared/ui/AuthField.tsx`** (new) — labeled field with focus animation + valid checkmark,
  wrapping/extending existing `TextField`; replaces old `AuthInput` + `ValidCheckmark`.
- **`src/shared/ui/SocialButtons.tsx`** (new) — Google + Apple buttons → `toast('coming soon')` (sonner
  already mounted).
- **`src/shared/ui/index.ts`** (edit) — export the three. Tests for `AuthField` (valid/invalid) +
  `SocialButtons` (toast).
- **Acceptance:** kit renders with tokens only; contrast ≥ AA.

### Phase 4 — Auth screens (faithful adapted ports)
- **`src/pages/login/`** — email/password, show/hide, remember-me, Forgot link, "Create account" link,
  **"Continue as guest"**, `SocialButtons`. Calls `signInWithEmail` / `continueAsGuest`.
- **`src/pages/signup/`** — name/email/password, terms checkbox, → `signUpWithEmail` → `/welcome`.
- **`src/pages/forgot-password/`** — email → "check inbox" + rate-limited resend (`request-password-reset`).
- Each: `ui/*Page.tsx` + `*.test.tsx` + `index.ts`; wired in `router.tsx`.
- **Acceptance:** full flow navigable; mock persists; render tests green.

### Phase 5 — Splash + Welcome (creative redesign: "palace materializing / threshold")
- **`src/widgets/palace-threshold/ui/PalaceThreshold.tsx`** (new) + `index.ts` — reusable `motion` +
  SVG `pathLength` line-draw that sketches a doorway/room and ignites the mark; props for
  `phase`/`onDone`; reduced-motion renders final frame.
- **`src/pages/splash/`** — hosts `PalaceThreshold`, masks `restoreSession`, skippable, then redirects.
- **`src/pages/welcome/`** — post-signup arrival: threshold "opens," greeting with name (`makeAccountSession`
  data), single **Continue** → home.
- **Acceptance:** 60fps transform/SVG; reduced-motion static; no fixed dead-wait beyond ~2s.

### Phase 6 — Settings updates
- **`src/pages/settings/ui/SettingsPage.tsx`** (edit) — account section: when `account`, show email +
  **Log out** row (danger) with confirm (existing `ActionSheet`/`Sheet`) → `signOut` → `/login`; when
  `guest`, show **"Sign in · Create account"** CTA → `/login`. Hero reflects real name/email. Replace the
  Change-Password & Phone "coming soon" rows with nav to the new sub-screens.
- **`src/pages/settings-change-password/`** (new) — port old `ChangePasswordScreen` as mock (success toast,
  no real change), token+i18n.
- **`src/pages/settings-phone/`** (new) — port old `PhoneConnectScreen` as mock (no verification).
- **`src/app/router.tsx`** + **`routes.ts`** — wire the two sub-routes.
- **Acceptance:** guest vs account affordances correct; logout returns to `/login` with data intact.

### Phase 7 — Verification
- `npm run typecheck` (`tsc --noEmit`), `npm run test` (vitest: gateway + features + page render tests),
  `npm run build`. **No Playwright/CI** unless requested.

---

## Open questions (assert + proceed unless overridden)
- Splash on **every** cold start or only when unauthenticated? **Decision: every cold start**, but short
  and it doubles as the session-restore mask.
- Confirm-logout UI: **`ActionSheet`** (existing) rather than a bespoke dialog.
- "Continue as guest" placement on signup too, not just login? **Decision: both**, secondary affordance.

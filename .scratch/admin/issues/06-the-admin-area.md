# 06 — The Admin area, and the developer tools behind it

Status: ready-for-agent
Type: task

- `/admin` as its own lazy chunk (piano-trainer's `admin-screens.ts`, `admin-search.ts` for the tab in the URL),
  guarded: a learner who opens it gets the not-found screen.
- Settings shows an **Admin** row for admins only.
- Tabs: Overview (accounts, errors this week, switches on), Accounts (02), Groups and Switches (03), Errors (04), Bug
  reports (05), Activity (`admin_log`), Components.
- **Components** is today's `/dev/kitchen-sink`, moved in. Settings → Developer (dev mode, the probe overlay) moves
  under the Admin area too. Nothing developer-facing renders for a learner; delete the old route and section once
  moved. Amend ADR 0002 and CLAUDE.md ("ship in every build until 1.0" ends).
- Every tab handles loading, error, empty and offline. Strings in `shared/i18n/locales/en/admin.ts`.
- Tests: piano-trainer's `AdminPage.test.tsx` shape, with the fake `AdminPort`; a learner sees no Admin row and no
  Developer section.

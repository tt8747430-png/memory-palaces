# Release 1.0

Status: needs-triage

What has to be true before a first public version. Gathered from the owner's list (2026-09) and the old phase plan's
"Hardening & launch". One issue per item under `issues/`.

## Done when

- No developer surface is reachable from a first-run install (ADR 0002 says how).
- The app has a version a learner can see, releases are tagged, and commit messages follow one convention.
- An admin can see the accounts and roll an update out to a group before everyone.
- Accessibility (WCAG AA) and Lighthouse PWA and performance pass; a bundle budget is enforced.
- The server side is hardened: deployment checked 2026-10; the advisor's two warnings fixed (issue 05).
- A short README says what the app is and how to run it.

## Issues

- `01-guard-the-developer-surface.md`
- `02-versions-tags-and-commits.md`
- `03-accounts-and-groups-for-admins.md`
- `04-accessibility-and-performance.md`
- `05-server-deployed-and-checked.md`
- `06-import-from-the-old-app.md`

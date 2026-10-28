# 03 — Accounts and groups for admins

Status: ready-for-human
Type: grilling

The owner asked for an overview of every account in Settings for developers and admins, a way to add an account to a
group, and rolling an update out to one group before the rest.

Nothing like it exists: there is no admin role in the app (the only server-side list is `private.corpus_publishers`,
ADR 0009). Decide what an admin is and where the role lives, what the overview shows, what a group is, and what
"roll out an update" means for a PWA (a feature flag per group, or a separate deployment).

## Proposed answers

- **Admin:** an account whose `app_metadata.role` is `admin`. Only the service role can set `app_metadata`, so a
  learner can't grant it. RLS policies and Edge Functions read it from the JWT; the app reads it from the session to
  show the developer surface (issue 01) and the overview.
- **Overview:** a Settings → Developer page listing accounts (email, created, last Sync, group) from an Edge Function
  that checks the role. Never a client query on `auth.users`.
- **Group:** a row in a server table (`private.rollout_groups`, `private.group_members`), edited only through that Edge
  Function.
- **Rolling an update out:** one origin serves one service worker, so a PWA can't give two groups two builds from the
  same URL. Ship every build to everyone and gate new features by group with a flag read at sign-in (one deployment,
  nothing to install twice). A separate beta deployment on its own domain is the alternative, at the cost of a second
  install and separate local data.

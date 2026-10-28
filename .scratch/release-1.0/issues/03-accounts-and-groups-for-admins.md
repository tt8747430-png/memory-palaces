# 03 — Accounts and groups for admins

Status: needs-triage
Type: grilling

The owner asked for an overview of every account in Settings for developers and admins, a way to add an account to a
group, and rolling an update out to one group before the rest.

Nothing like it exists: there is no admin role in the app (the only server-side list is `private.corpus_publishers`,
ADR 0009). Decide what an admin is and where the role lives, what the overview shows, what a group is, and what
"roll out an update" means for a PWA (a feature flag per group, or a separate deployment).

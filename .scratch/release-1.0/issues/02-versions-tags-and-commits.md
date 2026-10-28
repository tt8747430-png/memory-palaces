# 02 — Versions, release tags and commit messages

Status: needs-triage
Type: task

`package.json` is at `0.0.0` and nothing tags a release. The owner asked for release versions kept apart, tags made
automatically, and Conventional Commits.

Open questions: where releases are cut (Vercel production deploys?), whether the version shows on Settings → About,
whether commits are checked locally (commitlint hook) or in CI.

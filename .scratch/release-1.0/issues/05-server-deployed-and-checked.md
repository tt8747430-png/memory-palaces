# 05 — Server deployed and checked

Status: needs-info
Type: task

The account purge needs, on the hosted project: every migration applied, `request-account-deletion` and
`purge-account` deployed, `pg_cron` and `pg_net` enabled, and `project_url` and `secret_key` stored in Vault. Without
the Vault secrets the purge job only logs a notice. The last record (2026-09) said everything but the Vault secrets was
in place.

Needs the owner: confirm the Vault secrets are stored, and that the `purge-accounts` job ran.

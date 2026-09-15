-- "Delete account" deletes an account.
--
-- It used to wipe the local stores and blank the profile, and those writes *replicated* — so the
-- server row was blanked and the content tombstoned, while the `auth.users` row survived, the email
-- stayed taken, and the user stayed signed in. That is not a deletion; it is data loss with the
-- account still standing.
--
-- Requesting deletion now schedules an irreversible purge 30 days out, cancellable by signing in.
-- The row is the whole record of that: owned by the user, readable and cancellable by them, and
-- insertable only by the `request-account-deletion` Edge Function running with a secret key.

create table if not exists public.account_deletions (
  user_id      uuid primary key references auth.users on delete cascade,
  requested_at timestamptz not null default now(),
  purge_after  timestamptz not null
);

create index if not exists account_deletions_due_idx on public.account_deletions (purge_after);

alter table public.account_deletions enable row level security;

-- Select and delete only: a client may see that its account is scheduled, and may cancel. It may
-- not schedule one — that has to sign the user out globally, which needs a secret key.
grant select, delete on public.account_deletions to authenticated;
revoke all on public.account_deletions from anon;

drop policy if exists own_select on public.account_deletions;
create policy own_select on public.account_deletions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists own_delete on public.account_deletions;
create policy own_delete on public.account_deletions for delete to authenticated
  using (user_id = (select auth.uid()));

-- The daily sweep. `pg_cron` was enabled by the history migration; this must not re-add it.
-- `pg_net` is new here: `net.http_post` is how a cron job reaches an Edge Function.
--
-- Into `extensions`, not `public`: an extension in the exposed API schema is a lint of its own
-- ("Extension in Public"), and every object it installs would sit behind PostgREST. The functions
-- still live in the `net` schema the extension creates for itself, so callers are unaffected.
create extension if not exists pg_net with schema extensions;

-- The secret key is read from Vault rather than written here, so this migration carries no
-- secret. On hosted Supabase, `project_url` and `secret_key` (an `sb_secret_…` key from
-- Settings → API Keys) must be stored in Vault before the job does anything — without them
-- `invoke_purge_account` logs a notice and returns.
--
-- The key goes on the `apikey` header, not `Authorization`: a secret key is not a JWT, and the
-- function checks it itself (`purge-account` runs with `verify_jwt = false`).
create or replace function public.invoke_purge_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  secret_key text;
begin
  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into secret_key from vault.decrypted_secrets where name = 'secret_key';
  if project_url is null or secret_key is null then
    raise notice 'invoke_purge_account: project_url / secret_key not in Vault; skipping';
    return;
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/purge-account',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', secret_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function public.invoke_purge_account() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('purge-accounts');
exception when others then
  null;
end $$;

select cron.schedule('purge-accounts', '41 3 * * *', $$select public.invoke_purge_account();$$);

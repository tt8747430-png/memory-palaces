-- Phase 9 — per-user RLS for every mirror table.
--
-- Policies target `authenticated` explicitly (never `auth.role()`, and never a role check alone)
-- and compare against `(select auth.uid())` so the function is evaluated once per statement
-- instead of once per row. `anon` is granted nothing: a signed-out client has no rows at all.
--
-- Deletes are soft (`deleted = true` travels as an ordinary update), so the delete policy is
-- defensive rather than part of the sync path.

do $$
declare t text;
begin
  foreach t in array array['decks','cards','folders','questions','progress','preferences','profiles']
  loop
    execute format('alter table public.%I enable row level security;', t);

    -- Tables created after 2026-10-30 are no longer auto-exposed to the Data API, so the grant
    -- is explicit. Replication runs entirely as `authenticated`.
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);

    execute format('drop policy if exists own_select on public.%I;', t);
    execute format(
      $p$create policy own_select on public.%I for select to authenticated
         using (user_id = (select auth.uid()));$p$, t);

    execute format('drop policy if exists own_insert on public.%I;', t);
    execute format(
      $p$create policy own_insert on public.%I for insert to authenticated
         with check (user_id = (select auth.uid()));$p$, t);

    execute format('drop policy if exists own_update on public.%I;', t);
    execute format(
      $p$create policy own_update on public.%I for update to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()));$p$, t);

    execute format('drop policy if exists own_delete on public.%I;', t);
    execute format(
      $p$create policy own_delete on public.%I for delete to authenticated
         using (user_id = (select auth.uid()));$p$, t);
  end loop;
end $$;

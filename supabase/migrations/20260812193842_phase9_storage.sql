-- Phase 9 — buckets for deck covers and avatars.
--
-- Objects live at `${userId}/${entityId}`, so the first path segment is the owner. Reads are
-- public (the URL is already in a synced document); writes, replacements and deletes are scoped to
-- the caller's own prefix.
--
-- Upsert needs INSERT *and* SELECT *and* UPDATE — with only INSERT, replacing an image fails
-- silently instead of overwriting.

insert into storage.buckets (id, name, public)
values ('deck-images', 'deck-images', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['deck-images','avatars']
  loop
    execute format('drop policy if exists "%1$s_read" on storage.objects;', b);
    execute format(
      $p$create policy "%1$s_read" on storage.objects for select
         using (bucket_id = %1$L);$p$, b);

    execute format('drop policy if exists "%1$s_insert" on storage.objects;', b);
    execute format(
      $p$create policy "%1$s_insert" on storage.objects for insert to authenticated
         with check (
           bucket_id = %1$L and (storage.foldername(name))[1] = (select auth.uid())::text
         );$p$, b);

    execute format('drop policy if exists "%1$s_update" on storage.objects;', b);
    execute format(
      $p$create policy "%1$s_update" on storage.objects for update to authenticated
         using (
           bucket_id = %1$L and (storage.foldername(name))[1] = (select auth.uid())::text
         )
         with check (
           bucket_id = %1$L and (storage.foldername(name))[1] = (select auth.uid())::text
         );$p$, b);

    execute format('drop policy if exists "%1$s_delete" on storage.objects;', b);
    execute format(
      $p$create policy "%1$s_delete" on storage.objects for delete to authenticated
         using (
           bucket_id = %1$L and (storage.foldername(name))[1] = (select auth.uid())::text
         );$p$, b);
  end loop;
end $$;

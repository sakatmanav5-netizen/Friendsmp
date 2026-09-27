-- FriendSMP: new modules only (Visual Builder, Media Manager, Social Links,
-- Live Server Status). Purely additive — nothing existing is dropped or
-- redefined. Safe to re-run.

-- 1. Storage bucket for owner-uploaded media (hero banner, logo, product
--    card images). Public read so the storefront can render them; writes
--    are restricted to signed-in staff via the existing is_staff() helper.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

drop policy if exists "site-media public read" on storage.objects;
create policy "site-media public read"
  on storage.objects for select
  using (bucket_id = 'site-media');

drop policy if exists "site-media staff write" on storage.objects;
create policy "site-media staff write"
  on storage.objects for insert
  with check (bucket_id = 'site-media' and public.is_staff(auth.uid()));

drop policy if exists "site-media staff update" on storage.objects;
create policy "site-media staff update"
  on storage.objects for update
  using (bucket_id = 'site-media' and public.is_staff(auth.uid()));

drop policy if exists "site-media staff delete" on storage.objects;
create policy "site-media staff delete"
  on storage.objects for delete
  using (bucket_id = 'site-media' and public.is_staff(auth.uid()));

-- 2. Public read for the three new site_settings keys. Your existing
--    migration already locked site_settings down to key = 'content' only
--    for anon/authenticated — these are additional, separate policies for
--    the new keys, so that lockdown is untouched for every other key
--    (razorpay, bridge, etc. stay admin-only).
drop policy if exists "settings public read design" on public.site_settings;
create policy "settings public read design"
  on public.site_settings for select
  to anon, authenticated
  using (key = 'design');

drop policy if exists "settings public read social" on public.site_settings;
create policy "settings public read social"
  on public.site_settings for select
  to anon, authenticated
  using (key = 'social');

drop policy if exists "settings public read server_status" on public.site_settings;
create policy "settings public read server_status"
  on public.site_settings for select
  to anon, authenticated
  using (key = 'server_status');

drop policy if exists "settings public read media" on public.site_settings;
create policy "settings public read media"
  on public.site_settings for select
  to anon, authenticated
  using (key = 'media');

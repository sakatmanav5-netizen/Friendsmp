-- site-media bucket policies: read allowed for everyone (signed URLs), writes staff only
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

-- Public read for the new public-facing settings keys only (razorpay/bridge stay private)
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read"
  on public.site_settings for select
  to anon
  using (key in ('content', 'design', 'social', 'server_status', 'media'));

drop policy if exists "settings staff read" on public.site_settings;
create policy "settings staff read"
  on public.site_settings for select
  to authenticated
  using (key in ('content', 'design', 'social', 'server_status', 'media') or public.is_staff(auth.uid()));

-- Ticket / Support system
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  minecraft_username text not null,
  email text,
  subject text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender text not null,
  staff_email text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists tickets_reference_idx on public.tickets (reference);
create index if not exists ticket_replies_ticket_id_idx on public.ticket_replies (ticket_id);

grant all on public.tickets to service_role;
grant all on public.ticket_replies to service_role;

alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;
-- Intentionally no permissive policies: all access goes through server functions.
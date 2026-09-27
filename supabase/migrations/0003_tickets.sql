-- FriendSMP: Ticket / Support system. New tables only — nothing existing
-- is touched. RLS is enabled with NO permissive policies: every read/write
-- goes through the server functions in src/lib/support.functions.ts and
-- src/lib/admin.functions.ts (service role), so a player can only ever see
-- a ticket if they already hold its long random reference code.

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  minecraft_username text not null,
  email text,
  subject text not null,
  message text not null,
  status text not null default 'open', -- open | in_progress | closed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender text not null, -- 'player' | 'staff'
  staff_email text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists tickets_reference_idx on public.tickets (reference);
create index if not exists ticket_replies_ticket_id_idx on public.ticket_replies (ticket_id);

alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;
-- Intentionally no policies here — locked to the service role only.

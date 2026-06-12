# Migrations

Rules:
- Never edit a migration that has already been applied. Only add new ones.
- Each migration is numbered sequentially: M001, M002, ...
- Status is updated manually after running in Supabase SQL Editor.
- All SQL is safe to paste into Supabase SQL Editor and run in one click.

---

## M001 — 2026-06-06 — initial schema

**Status:** ✅ applied 2026-06-06

---

## M003 — 2026-06-07 — user_wallets table

**Status:** ✅ applied 2026-06-07

```sql
-- ============================================================
-- M003 — user_wallets table
-- DefiLords Podcast — 2026-06-07
-- Paste into Supabase SQL Editor and run in one click.
-- ============================================================

create table public.user_wallets (
  id             uuid  primary key default gen_random_uuid(),
  user_id        uuid  not null references public.users(id) on delete cascade,
  wallet_address text  not null,
  created_at     timestamptz not null default now(),
  constraint unique_user_wallet unique (user_id, wallet_address)
);

alter table public.user_wallets enable row level security;

create policy "user_wallets: select own rows"
  on public.user_wallets for select
  using (auth.uid() = user_id);

create index idx_user_wallets_user_id
  on public.user_wallets (user_id);

create index idx_user_wallets_address
  on public.user_wallets (wallet_address);

-- ============================================================
```

---

## M002 — 2026-06-07 — otp_codes table

**Status:** ✅ applied 2026-06-07

```sql
-- ============================================================
-- M002 — otp_codes table
-- DefiLords Podcast — 2026-06-07
-- Paste into Supabase SQL Editor and run in one click.
-- ============================================================

create table public.otp_codes (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  code       text not null,
  expires_at timestamptz not null,
  used       boolean not null default false,
  attempts   int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.otp_codes enable row level security;

-- no user policies — service role only

create index idx_otp_codes_email_used_expires
  on public.otp_codes (email, used, expires_at);

-- ============================================================
```

---

## M001 — 2026-06-06 — initial schema

```sql
-- ============================================================
-- M001 — Initial schema
-- DefiLords Podcast — 2026-06-06
-- Paste into Supabase SQL Editor and run in one click.
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

-- pgcrypto provides gen_random_uuid() on older Postgres versions.
-- On Supabase (Postgres 15+) it is built-in, but this is safe to run.
create extension if not exists "pgcrypto";


-- ============================================================
-- 2. TABLES
-- ============================================================

create table public.users (
  id             uuid          primary key default gen_random_uuid(),
  email          text          not null unique,
  name           text          not null,
  wallet_address text          unique,
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);

create table public.session_access (
  id           uuid          primary key default gen_random_uuid(),
  user_id      uuid          not null references public.users(id) on delete cascade,
  session_id   int           not null check (session_id in (2, 3)),
  tx_hash      text          not null unique,
  chain_id     int           not null default 8453,
  amount_usdc  numeric(20,6) not null,
  granted_at   timestamptz   not null default now(),

  unique (user_id, session_id)
);

create table public.user_roles (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  role       text        not null check (role = 'owner'),
  created_at timestamptz not null default now()
);


-- ============================================================
-- 3. INDEXES
-- ============================================================

-- users
create index on public.users (email);
create index on public.users (wallet_address) where wallet_address is not null;

-- session_access
create index on public.session_access (user_id);
create index on public.session_access (tx_hash);

-- user_roles
create index on public.user_roles (email);


-- ============================================================
-- 4. UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.users          enable row level security;
alter table public.session_access enable row level security;
alter table public.user_roles     enable row level security;


-- ============================================================
-- 6. RLS POLICIES — users
-- ============================================================

-- Authenticated users can read their own row
create policy "users: select own row"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

-- Only service role can insert (via API routes)
-- No INSERT policy = client cannot insert. Service role bypasses RLS.

-- Authenticated users can update their own row
create policy "users: update own row"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No DELETE policy = nobody can delete


-- ============================================================
-- 7. RLS POLICIES — session_access
-- ============================================================

-- Authenticated users can read their own access rows
create policy "session_access: select own rows"
  on public.session_access
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT policy = only service role can insert (via /api/payment/verify)
-- No UPDATE policy = nobody can update
-- No DELETE policy = nobody can delete


-- ============================================================
-- 8. RLS POLICIES — user_roles
-- ============================================================

-- No SELECT policy = only service role can read (server-side owner checks)
-- No INSERT policy = only service role can insert
-- No UPDATE policy = nobody can update
-- No DELETE policy = nobody can delete


-- ============================================================
-- DONE — M001
-- After running this migration, manually insert the owner row:
--
--   insert into public.user_roles (email, role)
--   values ('your-email@example.com', 'owner');
--
-- Replace with your real email address.
-- ============================================================
```

# Database Schema

All tables live in Supabase (PostgreSQL). RLS is enabled on every table from day one. The app never writes directly from the client — all writes go through API routes using the service role key.

---

## Tables

### `users`

Stores every registered user. Created via the `/api/signup` route after email verification.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `email` | `text` | Unique, not null |
| `name` | `text` | Not null |
| `wallet_address` | `text` | Unique, nullable — set when user connects wallet |
| `created_at` | `timestamptz` | Default `now()`, not null |
| `updated_at` | `timestamptz` | Default `now()`, not null — auto-updated via trigger |

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Unique index on `wallet_address` (partial — excludes nulls)

**RLS policies:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated user | `auth.uid() = id` (own row only) |
| INSERT | Service role only | Via API route — client never inserts directly |
| UPDATE | Authenticated user | `auth.uid() = id` (own row only) |
| DELETE | Nobody | Denied for all |

**Trigger:** `updated_at` is automatically set to `now()` on every UPDATE via a `set_updated_at` trigger function.

---

### `session_access`

Records which paid sessions a user has unlocked. A row is inserted only after server-side on-chain verification. Session 1 is free — no row is needed.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `user_id` | `uuid` | FK → `users.id`, on delete cascade, not null |
| `session_id` | `int` | Not null, check: `session_id IN (2, 3)` |
| `tx_hash` | `text` | Unique, not null — prevents replay attacks |
| `chain_id` | `int` | Default `8453` (Base mainnet), not null |
| `amount_usdc` | `numeric(20, 6)` | Not null — actual amount paid, stored for audit |
| `granted_at` | `timestamptz` | Default `now()`, not null |

**Constraints:**
- Unique on `(user_id, session_id)` — one access record per user per session
- Unique on `tx_hash` — a transaction can only unlock access once

**Indexes:**
- Primary key on `id`
- Unique index on `tx_hash`
- Unique index on `(user_id, session_id)`
- Index on `user_id` — for fast lookups of all sessions a user has access to

**RLS policies:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated user | `auth.uid() = user_id` (own rows only) |
| INSERT | Service role only | Via `/api/payment/verify` after on-chain verification |
| UPDATE | Nobody | Denied for all |
| DELETE | Nobody | Denied for all |

---

### `user_roles`

Tracks privileged roles. Currently only `owner` is a valid role. Used to gate admin actions (developer/investor section, content management).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `email` | `text` | Unique, not null |
| `role` | `text` | Not null, check: `role = 'owner'` |
| `created_at` | `timestamptz` | Default `now()`, not null |

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**RLS policies:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Service role only | Used server-side to check owner status |
| INSERT | Service role only | Owner row inserted manually after M001 |
| UPDATE | Nobody | Denied for all |
| DELETE | Nobody | Denied for all |

---

### `otp_codes`

Stores one-time verification codes for the OTP auth flow. A new row is created on every `send-otp` request. Rows are marked used after successful verification and cleaned up automatically.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `email` | `text` | Not null — the recipient email |
| `code` | `text` | Not null — 6-digit numeric string |
| `expires_at` | `timestamptz` | Not null — 10 minutes from creation |
| `used` | `boolean` | Not null, default `false` |
| `attempts` | `int` | Not null, default `0` — failed verify attempts |
| `created_at` | `timestamptz` | Not null, default `now()` |

**Indexes:**
- Primary key on `id`
- Composite index on `(email, used, expires_at)` for fast lookup

**RLS policies:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Service role only | No user policies |
| INSERT | Service role only | Via `/api/auth/send-otp` |
| UPDATE | Service role only | Mark used, increment attempts |
| DELETE | Service role only | Cleanup of expired/used rows |

---

### `user_wallets`

Links wallet addresses to users. A user can have multiple wallets. Used to record which wallet was used for payment and to pre-fill wallet info for the admin dashboard.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `user_id` | `uuid` | FK → `users.id`, on delete cascade, not null |
| `wallet_address` | `text` | Not null |
| `created_at` | `timestamptz` | Not null, default `now()` |

**Constraints:**
- Unique on `(user_id, wallet_address)` — prevents duplicate entries for the same wallet on the same account

**Indexes:**
- Primary key on `id`
- Index on `user_id` — for fast lookup of all wallets for a user
- Index on `wallet_address` — for reverse lookup (which user owns a given address)

**RLS policies:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated user | `auth.uid() = user_id` (own rows only) |
| INSERT | Service role only | Via `/api/wallet/save` |
| UPDATE | Nobody | Denied for all |
| DELETE | Nobody | Denied for all |

---

## Supabase clients

Two clients are used throughout the project. They are never interchangeable.

### `lib/supabase/client.ts` — browser client

```ts
import { createBrowserClient } from '@supabase/ssr'
```

- Uses the **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Runs in the browser only — safe to import in Client Components
- Subject to **RLS** — can only access rows the logged-in user is allowed to see
- Used for: reading own user data, reading own session access

### `lib/supabase/server.ts` — server client

```ts
import { createClient } from '@supabase/supabase-js'
// initialised with SUPABASE_SERVICE_ROLE_KEY
```

- Uses the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`)
- Runs on the server only — **never import in a Client Component**
- **Bypasses RLS** — can read and write any row in any table
- Used for: inserting new users, inserting session_access after payment verification, checking user_roles

---

## TypeScript types

These types map directly to the database schema. They live in `lib/supabase/types.ts`.

```typescript
export interface UserRow {
  id: string
  email: string
  name: string
  wallet_address: string | null
  created_at: string
  updated_at: string
}

export interface UserInsert {
  email: string
  name: string
  wallet_address?: string | null
}

export interface UserUpdate {
  name?: string
  wallet_address?: string | null
  updated_at?: string
}

export interface SessionAccessRow {
  id: string
  user_id: string
  session_id: 2 | 3
  tx_hash: string
  chain_id: number
  amount_usdc: string
  granted_at: string
}

export interface SessionAccessInsert {
  user_id: string
  session_id: 2 | 3
  tx_hash: string
  chain_id?: number
  amount_usdc: string
}

export interface UserRoleRow {
  id: string
  email: string
  role: 'owner'
  created_at: string
}
```

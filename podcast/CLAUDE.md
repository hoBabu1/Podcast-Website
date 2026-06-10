# CLAUDE.md — DefiLords Podcast Website

Read this file before doing anything. Follow every rule here for the entire project.

---

## Golden rule — never assume, always ask

If anything is unclear, missing, or requires a decision — stop and ask before writing code.
This includes: unclear requirements, missing env vars, ambiguous component behaviour, DB design choices, third-party config, and anything not explicitly covered in this file.
Do not guess. Do not fill blanks with assumptions. Ask first, build after.

---

## First task — run this once at project start

⚠️ Before doing anything: check if `PROGRESS.md` already exists in the repo.
If it does — skip this entire section. The structure is already created.
Only run this on a brand new empty repo.

```
defilords/
├── CLAUDE.md
├── PROGRESS.md
├── LEARNING.md
│
├── database/
│   ├── SCHEMA.md
│   └── MIGRATIONS.md
│
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── onboarding/page.tsx        # name collection for new users after OTP
│   ├── (dashboard)/
│   │   └── sessions/
│   │       ├── [id]/page.tsx
│   │       └── layout.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── users/page.tsx
│   │       ├── payments/page.tsx
│   │       └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── send-otp/route.ts      # generates + sends OTP via Brevo
│   │   │   ├── verify-otp/route.ts    # verifies OTP, returns is_new_user
│   │   │   └── complete-signup/route.ts # saves name, creates user, sends welcome email
│   │   ├── payment/verify/route.ts
│   │   ├── session/access/route.ts
│   │   └── admin/
│   │       ├── stats/route.ts
│   │       ├── users/route.ts
│   │       └── payments/route.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── layout/                        # Navbar, Footer
│   ├── sessions/                      # SessionCard, SessionGate, SessionContent
│   ├── wallet/                        # WalletButton, PaymentModal, WalletStatus
│   ├── auth/                          # EmailStep, OtpStep, NameStep
│   └── admin/                         # AdminStatsCard, UserTable, PaymentTable, SessionBreakdown
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── auth/
│   │   ├── otp.ts                     # generate, store, verify OTP logic
│   │   └── session.ts                 # session helpers
│   ├── brevo/
│   │   ├── client.ts
│   │   └── templates.ts
│   ├── web3/
│   │   ├── config.ts
│   │   ├── contracts.ts
│   │   └── verify.ts
│   ├── sessions/
│   │   └── access.ts
│   ├── admin/
│   │   └── queries.ts
│   └── env.ts
│
├── hooks/
│   ├── useSessionAccess.ts
│   ├── useWalletPayment.ts
│   └── useAuth.ts
│
├── types/
│   ├── session.ts
│   ├── user.ts
│   ├── payment.ts
│   └── admin.ts
│
├── constants/
│   └── sessions.ts
│
└── middleware.ts
```

After creating the structure confirm: "Folder structure created. Ready for chunk 1."

---

## Learning log — after every chunk

After completing every chunk, open `LEARNING.md` and add a new section explaining:
- What was built in plain English
- What each new technology or concept does and why it was used
- How the pieces connect behind the scenes
- Any jargon — explained simply, no assumptions

Write it for someone who is vibe coding and wants to understand what's happening behind the scenes.

---

## Project overview

DefiLords is a Web3-gated multi-session learning platform built on Next.js.
Users sign up with email OTP, connect a crypto wallet, and pay in USDC on Base to unlock paid sessions.
Session content links to Twitter/X posts. Developers can contribute and invest.
Owners access a protected dashboard to see all users, payments, revenue, and session stats.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · wagmi + viem + RainbowKit · Brevo · Vercel

Note: NextAuth is NOT used. Authentication is custom OTP-based using Brevo for email delivery and Supabase for session storage.

---

## Authentication flow — OTP based

This is the single sign-up AND sign-in flow. No separate sign-up form anywhere.

```
Step 1 — Email screen
User enters email → clicks "Send OTP"
→ POST /api/auth/send-otp
→ generates 6-digit OTP
→ stores OTP + expiry in Supabase `otp_codes` table
→ sends OTP email via Brevo
→ frontend moves to Step 2

Step 2 — OTP screen
User enters 6-digit code → clicks "Verify"
→ POST /api/auth/verify-otp
→ checks OTP is valid + not expired + not used
→ marks OTP as used
→ checks if email exists in `users` table
→ if NEW user: returns { verified: true, isNewUser: true }
→ if EXISTING user: creates server session → returns { verified: true, isNewUser: false }
→ NEW USER → frontend moves to Step 3
→ EXISTING USER → frontend redirects to homepage, logged in

Step 3 — Name screen (new users only)
User enters their name → clicks "Continue"
→ POST /api/auth/complete-signup
→ inserts user into Supabase `users` table
→ adds contact to Brevo list
→ sends welcome email via Brevo
→ creates server session
→ redirects to homepage, logged in
```

**OTP rules:**
- 6 digits, numeric only
- Expires after 10 minutes
- One-time use — marked used immediately after verification
- Max 3 attempts per OTP before it's invalidated
- Rate limit: max 3 send-otp requests per email per 15 minutes

---

## Design principles

- Simple and intuitive — every page immediately understood by a first-time visitor
- No clutter. Each screen has one primary action.
- Mobile-first. Most users will be on their phone.
- Dark theme — charcoal + amber
- Wallet connect and payment flows must feel frictionless
- Error states and loading states always handled — never leave user staring at nothing
- No design decisions inside components — all from Tailwind config and `components/ui/`

### Charcoal + Amber colour palette (tailwind.config.ts under `brand`)
```js
brand: {
  bg: '#141410',
  surface: '#1a1a15',
  border: '#242420',
  amber: '#EF9F27',
  amberDark: '#BA7517',
  amberDeep: '#1e1808',
  green: '#97C459',
  greenDeep: '#1a2010',
  greenBorder: '#3B6D11',
  heading: '#F0E6C8',
  body: '#a89878',
  muted: '#555555',
}
```
Never use white or light backgrounds on the public site.

---

## Non-negotiable principles

### Security first
- Never trust client-side data for access control. Session verification always server-side.
- Never expose secret keys to the client. Public env vars prefixed `NEXT_PUBLIC_` only.
- OTP verification always server-side — never expose OTP codes to the client.
- Validate and sanitise every input — name, email, OTP code, wallet address.
- All API routes check authentication before doing anything else.
- All `/admin/*` and `/api/admin/*` routes check owner role before doing anything.
- Rate-limit all public API endpoints.
- CSP headers in `next.config.ts` from day one.
- No `dangerouslySetInnerHTML` anywhere.

### Modularity first
- One file = one responsibility.
- No business logic inside page components. Pages are layouts only.
- No direct Supabase calls inside components. All DB access through `lib/`.
- No raw `fetch` inside components. All API calls through typed client functions.
- Every reusable UI element is a component. No copy-pasted JSX.

---

## Database (Supabase)

Four tables: `users`, `session_access`, `user_roles`, `otp_codes`

RLS enabled on all tables from day one.
All schema changes go into `database/SCHEMA.md` before any code is written.
All migrations go into `database/MIGRATIONS.md` — never edit existing migrations.

### `otp_codes` table
```sql
create table public.otp_codes (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  code       text not null,
  expires_at timestamptz not null,
  used       boolean not null default false,
  attempts   int not null default 0,
  created_at timestamptz not null default now()
);
```

RLS: service role only. No user policies.
Index on `(email, used, expires_at)` for fast lookup.
Expired/used codes cleaned up automatically — delete rows older than 1 hour in `send-otp` route before inserting new one.

### RLS policy intent

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | Own row only | Service role only | Own row only | Nobody |
| `session_access` | Own rows only | Service role only | Nobody | Nobody |
| `user_roles` | Service role only | Service role only | Nobody | Nobody |
| `otp_codes` | Service role only | Service role only | Service role only | Nobody |

Two Supabase clients:
- `lib/supabase/client.ts` — anon key, browser only
- `lib/supabase/server.ts` — service role key, server only. Never import in client component.

---

## Owner dashboard

### Access control
- Only emails in `user_roles` with `role = 'owner'` can access `/admin/*`
- Checked server-side in `app/(admin)/admin/layout.tsx` and every `/api/admin/*` route
- Non-owner hitting `/admin` → redirect to homepage silently

### What the dashboard shows
**1. Stats cards** — total users, total revenue (USDC), session 2 purchases, session 3 purchases
**2. Session breakdown** — how many users on each session
**3. User table `/admin/users`** — name, email, wallet, signup date, sessions unlocked. Paginated 20/page, searchable
**4. Payment history `/admin/payments`** — email, session, amount, tx hash (links to basescan), date

All admin queries in `lib/admin/queries.ts` only.

---

## Service prerequisites by chunk

| Chunk | Must be ready before starting |
|-------|-------------------------------|
| 1 | GitHub repo · Node.js 18+ |
| 2 | Chunk 1 complete |
| 3 | Supabase project · M001 + M002 migrations run · Brevo API key + List ID + sender email |
| 4 | Chunk 3 complete — no new services |
| 5 | WalletConnect Project ID from cloud.walletconnect.com |
| 6 | Alchemy RPC URL for Base · Payment wallet address confirmed |
| 7 | Chunk 6 complete |
| 8 | Chunk 7 complete |
| 9 | GitHub repo URL · AI Vaults deposit page URL |
| 10 | Hotjar Site ID |

---

## Testing expectations

Every chunk with business logic must include tests. No exceptions.

**Minimum:**
- Unit tests — OTP generation/validation, session access logic, Zod schemas
- Integration tests — all API routes

**Framework:** Jest + React Testing Library

**Rules:**
- Test files next to source: `lib/auth/otp.ts` → `lib/auth/otp.test.ts`
- Mock Supabase and Brevo in all tests — never hit real services
- OTP tests must cover: valid code, expired code, already used, too many attempts, rate limit
- Admin routes must have tests confirming non-owners get 403
- Do not move to next chunk with failing tests

---

## Session config — never hardcode

```typescript
// constants/sessions.ts
export const SESSIONS = [
  {
    id: 1,
    title: 'Introduction to Blockchain and DefiLords',
    price: 0,
    isFree: true,
    description: 'The hook — real value before you pay.',
    twitterUrl: 'https://twitter.com/...',
  },
  {
    id: 2,
    title: 'DefiLords in depth',
    price: 50,
    isFree: false,
    description: 'Liquidity pools, staking, Pendle, and low-risk investments.',
    twitterUrl: 'https://twitter.com/...',
    priceUSDC: '50000000',
  },
  {
    id: 3,
    title: 'DefiLords strategies in depth',
    price: 100,
    isFree: false,
    description: 'Advanced yield, vault selection, AI Vaults.',
    twitterUrl: 'https://twitter.com/...',
    priceUSDC: '100000000',
  },
] as const
```

---

## Payment flow

1. User connects wallet via RainbowKit
2. Clicks "Pay $50 USDC" on Session 2 (or $100 for Session 3)
3. Client sends USDC transfer to `NEXT_PUBLIC_PAYMENT_ADDRESS` on Base
4. Client gets `txHash`
5. Client calls `POST /api/payment/verify` with `{ txHash, sessionId, userEmail }`
6. Server verifies on-chain via Alchemy: correct address, correct amount, tx confirmed, txHash not reused
7. Server inserts row into `session_access`
8. Returns `{ success: true }`
9. Client redirects to session content

Never unlock based on client-side tx status alone.

---

## API route pattern

```typescript
// 1. Check session
const session = await getSession(req)
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 2. Admin routes only — check owner role
const isOwner = await checkOwnerRole(session.email)
if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

// 3. Validate input with Zod
const body = RequestSchema.safeParse(await req.json())
if (!body.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

// 4. Server Supabase client
const supabase = createServerSupabaseClient()

// 5. Return typed response
return NextResponse.json({ success: true })
```

Never return raw error details to client. Log to console, return generic message.

---

## Environment variables

### Server-only
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BREVO_API_KEY=
BREVO_LIST_ID=
BREVO_SENDER_EMAIL=
ALCHEMY_RPC_URL=
SESSION_SECRET=           # for signing custom session cookies
```

### Public
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WC_PROJECT_ID=
NEXT_PUBLIC_PAYMENT_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_HOTJAR_ID=
```

---

## File naming conventions

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase.tsx | `SessionCard.tsx`, `OtpStep.tsx` |
| Hooks | camelCase.ts prefixed `use` | `useWalletPayment.ts` |
| Lib / utilities | camelCase.ts | `otp.ts`, `verify.ts` |
| Types | camelCase.ts | `session.ts`, `admin.ts` |
| Constants | camelCase.ts | `sessions.ts` |
| Tests | same + `.test.ts/tsx` | `otp.test.ts` |
| Pages | Next.js convention | `page.tsx`, `route.ts` |
| Folders | kebab-case | `send-otp/` |

One component per file. Never export multiple components from one file.

---

## Code style

- TypeScript strict mode — no `any`, no `!` without a comment
- Zod for all runtime validation
- `async/await` only
- Named exports everywhere except Next.js page components
- `lib/env.ts` validates all env vars at startup — crashes immediately if missing

---

## USDC contract address on Base

```
Testnet (Base Sepolia): 0x036CbD53842c5426634e7929541eC2318f3dCF7e  ← current
Mainnet (Base):         0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  ← switch before launch
```

Defined in `lib/web3/contracts.ts`. Never hardcoded inline.

---

## Git rules

Claude Code never commits. Developer commits manually.

```
chunk-{n}: description
chunk-3: otp auth flow with brevo and supabase
```

Trunk-based. All on `main`. One chunk = one commit.

---

## Progress tracking

`PROGRESS.md` updated at end of every chunk:
- What was completed
- Files created or changed
- Decisions made
- New env vars introduced
- What next chunk starts with

---

## Build chunks

| # | What gets built |
|---|----------------|
| 1 | Next.js scaffold, folder structure, env setup, CSP headers |
| 2 | Homepage UI — hero + 3 session cards, charcoal + amber |
| 3 | OTP auth — send OTP, verify OTP, name collection, Supabase user creation, Brevo welcome email |
| 4 | Session management — middleware route protection, navbar auth state, owner role check |
| 5 | Wallet connect (wagmi + RainbowKit) |
| 6 | USDC payment flow + server-side tx verification |
| 7 | Session access control — DB gating |
| 8 | Session content pages |
| 9 | Owner dashboard — stats, user table, payment history, session breakdown |
| 10 | Developer / investor section + Hotjar + QA |

---

## Hard rules — never break these

- No secrets in `NEXT_PUBLIC_` variables
- No Supabase queries inside components
- No `any` types
- No unauthenticated API routes
- No admin routes without owner role check
- No client-side-only payment verification
- No hardcoded session data — always `constants/sessions.ts`
- No skipping Zod validation on any API input
- No editing past migrations — only add new ones
- No moving to next chunk with failing tests
- No white or light backgrounds on public site
- No assumptions — ask first
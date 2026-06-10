# Project Summary — DefiLords Podcast

Read this file to get full context on what has been built, what decisions were made, and what comes next.

---

## What this project is

DefiLords is a Web3-gated learning platform. Users sign up with email, connect a crypto wallet, and pay in USDC on Base blockchain to unlock paid sessions. Session content links to Twitter/X posts.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Supabase · NextAuth · wagmi + RainbowKit · Brevo · Vercel

---

## Current state — what is done

### Chunk 1 — Foundation ✅
- Next.js 14 scaffolded with TypeScript, Tailwind, App Router
- `lib/env.ts` — validates all env vars at startup with Zod. App crashes immediately with a clear error if anything is missing
- `next.config.mjs` — CSP headers + security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- `lib/logger.ts` — pino logger, debug in dev, info in prod
- `.env.local` — all env vars filled in (see below)
- `jest.config.ts` — Jest + ts-jest set up for unit testing
- 9 unit tests for `lib/env.ts` — all passing
- `.gitignore` — excludes `.env.local`, `node_modules`, `.next`

**Note:** `next.config.ts` is NOT supported in Next.js 14 — we use `next.config.mjs` instead.

### Chunk 2 — Homepage UI ✅
- `tailwind.config.ts` — full brand colour palette under `brand.*` tokens
- `constants/sessions.ts` — single source of truth for all 3 sessions
- `components/layout/Navbar.tsx` — logo + nav links + auth-aware CTA
- `components/layout/Footer.tsx` — Twitter, GitHub, Invest links
- `components/sessions/SessionCard.tsx` — handles free (green) and paid (amber) states
- `app/page.tsx` — hero section + signup form + 3 session cards grid
- `app/layout.tsx` — dark background, metadata
- `app/globals.css` — stripped to just Tailwind directives

**Design correction made:** Original token names used hyphens (`amber-dark`, `free-text`) which Tailwind silently fails to resolve. All tokens renamed to camelCase (`amberDark`, `amberDeep`, `greenBorder`, etc.).

### Chunk 3 — Sign-up form + Brevo integration ✅
- `lib/supabase/client.ts` — browser Supabase client (anon key, subject to RLS)
- `lib/supabase/server.ts` — server Supabase client (service role key, bypasses RLS)
- `lib/supabase/types.ts` — TypeScript interfaces for all 3 DB tables
- `lib/brevo/templates.ts` — email content constants (welcome email + magic link email)
- `lib/brevo/client.ts` — `addContact`, `sendWelcomeEmail`, `sendMagicLinkEmail` via Brevo REST API
- `app/api/signup/route.ts` — POST endpoint: Zod validation, duplicate check, DB insert, Brevo calls, rate limiting (5 req/IP/min)
- `components/forms/SignupForm.tsx` — client component: name + email fields, loading/success/error states
- `app/page.tsx` — SignupForm added between hero and session cards
- 8 tests across 2 test files — all passing

**Brevo debugging note:** The 401 errors were caused by Brevo's IP allowlisting security feature blocking the dev machine's IP. Fix: go to Brevo → Settings → Security → Authorised IPs and add your current IP. For Vercel (production), disable IP allowlisting entirely since serverless functions use dynamic IPs.

### Database — Schema + Migrations ✅
- `database/SCHEMA.md` — full documentation of all tables, RLS policies, indexes
- M001 — applied: `users`, `session_access`, `user_roles` tables + RLS + updated_at trigger
- M002 — **not yet applied**: `verification_tokens` table (required for NextAuth magic links — paste M002 SQL into Supabase SQL Editor before testing sign-in)

### Chunk 4 — NextAuth magic-link sign-in ✅
- `lib/auth/config.ts` — NextAuth config: JWT session strategy, minimal custom Supabase adapter (verification tokens only), Email provider with custom Brevo sender, session/jwt callbacks that attach userId + role
- `app/api/auth/[...nextauth]/route.ts` — standard NextAuth GET/POST handler
- `middleware.ts` — protects `/sessions/*` (redirect to /login if not authenticated) and `/admin/*` (redirect to / if not owner role)
- `app/(auth)/login/page.tsx` — async Server Component: redirects to / if already signed in, renders LoginForm
- `components/forms/LoginForm.tsx` — Client Component: email input, send magic link, loading/success/error states
- `app/(auth)/verify/page.tsx` — Server Component: "Check your email" (no error param) or "Link expired" (error param)
- `components/layout/SignOutButton.tsx` — Client Component: calls `signOut()`
- `components/layout/Navbar.tsx` — async Server Component: shows email + Sign out when authenticated; Dashboard link for owner; Get started → /login when not authenticated
- `types/next-auth.d.ts` — module augmentation: adds `id` and `role` to session and JWT types
- 10 tests across 2 test files — all passing
- `scripts/test-brevo.mjs` — standalone Brevo diagnostic script

**Total tests passing: 27 across 5 suites**

---

## Architecture decisions — permanent

| Decision | Reason |
|----------|--------|
| `next.config.mjs` not `.ts` | Next.js 14 does not support TS config |
| Tailwind tokens are camelCase | Hyphens in nested keys silently fail in Tailwind JIT |
| JWT sessions, not database sessions | NextAuth's Supabase adapter conflicts with our custom `users` table schema. JWT stores session in a signed httpOnly cookie — no `sessions` table needed |
| Minimal custom adapter | Only `createVerificationToken` + `useVerificationToken` implemented. Everything else is typed no-ops never called at runtime |
| `getToken` in middleware, not `withAuth` | Simpler, gives full redirect control, unit-testable by mocking one function |
| Navbar is async Server Component | `getServerSession` runs server-side — no SessionProvider or client state needed. Only SignOutButton is a Client Component |
| No direct DB writes from client | All writes go through API routes using the service role key |
| Duplicate signup returns 200 silently | Prevents email enumeration attacks |
| Rate limiting is in-memory Map | No Redis needed at this scale. Resets on server restart |
| `tx_hash` unique constraint | Prevents replay attacks on payment verification |

---

## Colour palette (Tailwind tokens under `brand.*`)

| Token | Hex | Used for |
|-------|-----|---------|
| `brand-bg` | `#141410` | Page background |
| `brand-surface` | `#1a1a15` | Card backgrounds |
| `brand-border` | `#242420` | Default borders |
| `brand-amber` | `#EF9F27` | Primary accent, CTAs |
| `brand-amberDark` | `#BA7517` | Hover states, logo square |
| `brand-amberDeep` | `#1e1808` | Paid badge background |
| `brand-green` | `#97C459` | Free session text/badge |
| `brand-greenDeep` | `#1a2010` | Free badge background |
| `brand-greenBorder` | `#3B6D11` | Free card border |
| `brand-heading` | `#F0E6C8` | All headings |
| `brand-body` | `#a89878` | Body text |
| `brand-muted` | `#555555` | Muted/secondary text |

---

## Database tables

### `users`
`id`, `email`, `name`, `wallet_address` (nullable), `created_at`, `updated_at`
- Users can SELECT/UPDATE their own row only
- Only service role can INSERT (via `/api/signup`)

### `session_access`
`user_id` (FK), `session_id` (2 or 3 only), `tx_hash` (unique), `chain_id` (8453), `amount_usdc`
- Users can SELECT their own rows only
- Only service role can INSERT (after on-chain tx verification)
- Unique on `(user_id, session_id)` — one row per session per user

### `user_roles`
`email`, `role` ('owner' only)
- Service role only — no client access at all
- Owner row inserted manually: `insert into public.user_roles (email, role) values ('dhanyosmiresearcher@gmail.com', 'owner');`

### `verification_tokens` (M002 — apply before testing auth)
`identifier` (email), `token`, `expires`
- Service role only
- Created when magic link is sent, deleted immediately after use

---

## Supabase clients

| Client | File | Key | Runs on | Respects RLS? |
|--------|------|-----|---------|---------------|
| Browser | `lib/supabase/client.ts` | anon key | Browser | Yes |
| Server | `lib/supabase/server.ts` | service role key | Server only | No (bypasses) |

**Never import the server client in a Client Component.**

---

## Environment variables — current status

| Variable | Status |
|----------|--------|
| `NEXTAUTH_SECRET` | ✅ Real value set |
| `NEXTAUTH_URL` | ✅ `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Real value set |
| `SUPABASE_URL` | ✅ `https://cfjuoocjuibhlhnmivkj.supabase.co` |
| `BREVO_API_KEY` | ✅ Real value set |
| `BREVO_LIST_ID` | ✅ `5` |
| `BREVO_SENDER_EMAIL` | ✅ `defilords007@gmail.com` |
| `ALCHEMY_RPC_URL` | ⏳ Placeholder — needs real Alchemy key (chunk 6) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Real value set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Real value set |
| `NEXT_PUBLIC_WC_PROJECT_ID` | ⏳ Placeholder — needs WalletConnect project ID (chunk 5) |
| `NEXT_PUBLIC_PAYMENT_ADDRESS` | ✅ USDC contract on Base |
| `NEXT_PUBLIC_CHAIN_ID` | ✅ `8453` |
| `NEXT_PUBLIC_HOTJAR_ID` | ⏳ Empty — chunk 10 |

---

## Before next session — things to do manually

1. **Apply M002 in Supabase SQL Editor** — the `verification_tokens` table must exist before magic-link sign-in works. SQL is in `database/MIGRATIONS.md`.
2. **Fix Brevo IP allowlisting** — go to Brevo → Settings → Security → Authorised IPs → add your dev machine IP (or disable IP allowlisting entirely for Vercel compatibility).
3. **Insert owner row** (if not done): `insert into public.user_roles (email, role) values ('dhanyosmiresearcher@gmail.com', 'owner');`
4. **Run `node scripts/test-brevo.mjs`** after fixing IP allowlisting to confirm Brevo API + contacts + email all work end to end.

---

## Build chunks — status

| # | What | Status |
|---|------|--------|
| 1 | Next.js scaffold, env, CSP, logger | ✅ Done |
| 2 | Homepage UI — hero + session cards | ✅ Done |
| 3 | Sign-up form + Brevo email integration | ✅ Done |
| 4 | NextAuth magic-link sign-in | ✅ Done |
| 5 | Wallet connect (wagmi + RainbowKit) | ⬜ Next |
| 6 | USDC payment flow + server-side tx verification | ⬜ |
| 7 | Session access control — DB gating | ⬜ |
| 8 | Session content pages | ⬜ |
| 9 | Owner dashboard | ⬜ |
| 10 | Hotjar, QA, launch | ⬜ |

---

## What chunk 5 needs

Before starting chunk 5:
- ✅ Chunks 1–4 complete
- ⬜ WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com) — set in `NEXT_PUBLIC_WC_PROJECT_ID`
- ⬜ M002 applied in Supabase (verification_tokens table)
- ⬜ Brevo IP issue resolved and tested with `node scripts/test-brevo.mjs`

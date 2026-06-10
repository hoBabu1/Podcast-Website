# PROGRESS

---

## Perf & UX — skeletons, client singleton, OTP round trip, progress bar

**Status:** Complete

### What was completed
- **`components/ui/Skeleton.tsx`** (new) — reusable `animate-pulse` placeholder block.
- **`loading.tsx` files** (new, 5) — Next.js route-level loading fallbacks, shown automatically while a server component awaits data:
  - `app/loading.tsx` — skeleton hero + 3 skeleton session cards (matching card dimensions).
  - `app/(dashboard)/sessions/[id]/loading.tsx` — skeleton title / description / Twitter button.
  - `app/(admin)/admin/loading.tsx` — 4 skeleton stat cards + breakdown.
  - `app/(admin)/admin/users/loading.tsx` — skeleton table, 5 rows.
  - `app/(admin)/admin/payments/loading.tsx` — skeleton table, 5 rows.
- **`components/sessions/SessionCard.tsx`** — paid-card action area shows a button-sized `Skeleton` while client auth/access is still resolving (`authLoading`), instead of briefly flashing the wrong CTA.
- **`lib/supabase/server.ts`** — service-role client is now a **singleton**, reused across calls instead of re-constructed on every API route / query. Type inferred from the build function so existing typed inserts keep compiling.
- **`lib/auth/otp.ts`** — `verifyOtp` now marks `used` + bumps `attempts` in **one** update on the success path (was two), cutting the happy path from 3 DB round trips to 2. Reason granularity and the 3-attempt limit are unchanged.
- **`components/layout/ProgressBar.tsx`** (new, client) — wraps `next-nprogress-bar`'s `AppProgressBar` (thin 2px amber bar, no spinner). Rendered in `app/layout.tsx` after `<Providers>`.
- **`next-nprogress-bar`** added to `package.json` (v2.4.7).

### Decisions made
- **Did NOT implement the literal single-`UPDATE`-returning-rows version of `verifyOtp`.** That approach would (a) collapse the distinct `expired` / `used` / `invalid` / `too_many_attempts` reasons the route + UI depend on into a single "no rows" result, (b) only `WHERE code = $2`, so wrong codes would never increment `attempts` — defeating the brute-force limit (a security regression), and (c) break the 7 existing `verifyOtp` tests. Instead applied a behaviour-preserving optimization that still removes a round trip. Flagged for the developer.
- **Supabase singleton is a real but small win.** `@supabase/supabase-js` talks to PostgREST over HTTP — it does not hold a pooled TCP DB connection, so the singleton avoids re-allocating the client object per call but does not change network/connection latency. The dominant OTP latency is the Brevo email send + Supabase HTTP round trips, not client construction.
- **Progress bar wrapped in a Client Component** — `AppProgressBar` hooks into the router and needs `'use client'`; the root layout is an async Server Component, so it can't host it directly.
- **`loading.tsx` is the idiomatic skeleton mechanism** — admin/session pages are Server Components that `await` data, so they suspend and Next renders the sibling `loading.tsx` automatically; no in-component loading branch is possible (or needed) for them.

### New env vars introduced
None.

### Verification
- `npm test` — **101/101** passing (19 suites; behaviour-preserving OTP change, no test edits needed).
- `npm run build` — green (only the harmless `viem`/`ox` critical-dependency warning).

---

## Chunk 9 — Owner dashboard

**Status:** Complete

### What was completed
- **`types/admin.ts`** (new) — `AdminStats`, `AdminUser`, `AdminPayment`, `SessionBreakdown` types (exactly as specified in the chunk brief).
- **`lib/admin/queries.ts`** (new) — the single source of all admin DB access (no raw Supabase anywhere else in admin code). Exports `ADMIN_PAGE_SIZE = 20` plus:
  - `getStats()` — total users (head count), summed `amount_usdc` revenue, and session 2 / 3 unlock counts.
  - `getSessionBreakdown()` — reuses `getStats()`; `free` = total users (everyone has free session 1), `session2`/`session3` = paid unlocks.
  - `getUsers(page, search)` — 20/page, `created_at` desc, optional case-insensitive `name`/`email` search via `.or(...ilike...)`. Enriches each user with `wallet_addresses` (from `user_wallets`) and `sessions_unlocked` (session 1 always included + paid). Avoids N+1 by batch-fetching wallets/access with `.in('user_id', ids)`.
  - `getPayments(page)` — 20/page, `granted_at` desc, joins payer email by batch-fetching `users` for the page's `user_id`s.
  - `checkOwnerRole(email)` — looks up `user_roles` (email normalized `trim().toLowerCase()`).
- **`app/api/admin/stats/route.ts`**, **`users/route.ts`**, **`payments/route.ts`** (new) — GET routes following the CLAUDE.md API pattern: session check (401) → `checkOwnerRole` (403) → Zod-validate query params → call the query → return JSON.
- **`app/(admin)/admin/layout.tsx`** (rewritten) — owner gate via `getServerSession`; adds admin navbar ("DefiLords Admin" left, owner email + "Back to site" right) on a slightly lighter `bg-brand-surface`, wraps children in a centered `<main>`.
- **`app/(admin)/admin/page.tsx`** (rewritten) — dashboard: 4 stat cards, session breakdown, "View Users →" / "View Payments →" links.
- **`app/(admin)/admin/users/page.tsx`** (new) — reads `?page`/`?search`, calls `getUsers`, renders `UserTable`, back-to-dashboard link.
- **`app/(admin)/admin/payments/page.tsx`** (new) — reads `?page`, calls `getPayments`, renders `PaymentTable`, back link.
- **`components/admin/`** (new) — `AdminStatsCard`, `SessionBreakdown`, `UserTable`, `PaymentTable`, plus two supporting pieces: `Pagination` (shared prev/next pager, preserves `search`) and `WalletPill` (the only client component — click-to-copy shortened address).

### Tests added
- **`lib/admin/queries.test.ts`** — 6 tests: stats counts + summed revenue; `getUsers` pagination + enrichment + `range(0,19)` + no `.or` when search empty; `getUsers` search builds the `ilike` filter + `range(20,39)`; `getPayments` sorted `granted_at` desc + email join; `checkOwnerRole` true/false. Uses a chainable, awaitable Supabase builder mock.
- **`app/api/admin/stats/route.test.ts`** — 3 tests: 401 unauthenticated, 403 non-owner, 200 + stats for owner.
- **`app/api/admin/users/route.test.ts`** — 3 tests: 401, 403, 200 + passes `(page, search)` through.

### Decisions made
- **API routes gate with `checkOwnerRole` (DB-truth), pages/layout gate with `session.role`** (the token, already verified). The layout guards the whole `/admin` tree; pages re-check as defence-in-depth without an extra DB call per render. API routes hit the DB so a stale token can't grant access.
- **`getSessionBreakdown` reuses `getStats`** — one query path, no duplicated counting logic.
- **Batch enrichment over N+1** — `getUsers`/`getPayments` fetch related rows for the whole page in one `.in(...)` query each.
- **`WalletPill` is the lone client component** — copy-to-clipboard needs browser interactivity; everything else stays a Server Component so the owner check runs before any HTML is sent and the service-role client never reaches the browser.
- **Tx links point at `sepolia.basescan.org`** (matches the current Base Sepolia testnet); swap to `basescan.org` at mainnet launch alongside the other testnet→mainnet switches already noted.
- **Revenue summed as `Number(amount_usdc)`** — Postgres `numeric` returns strings; converted before summing, displayed with `toLocaleString()`.

### New env vars introduced
None.

### Verification
- `npm test` — **101/101** passing (19 suites; +12 new).
- `npm run build` — green (only the harmless `viem`/`ox` critical-dependency warning). All admin routes/pages compiled.

### Next chunk starts with
Chunk 10 — Developer / investor section + Hotjar + QA. Prereqs: Hotjar Site ID; GitHub repo URL + AI Vaults deposit page URL (to replace the session-3 placeholder links).

---

## Chunk 8 — Session content pages polish

**Status:** Complete

### What was completed
- **`constants/sessions.ts`** — Twitter/X URLs set to the placeholder `https://twitter.com/DefiLords` for all three sessions (developer confirmed placeholder is fine; real per-post URLs to drop in later).
- **`components/sessions/SessionContent.tsx`** — polished, mobile-first layout: amber "Session N" eyebrow, large title, description, a prominent full-width-on-mobile amber **"Watch on Twitter →"** button (opens in a new tab). Session 1 shows a gentle upsell nudge ("Enjoying this? Unlock Session 2 →" → `/#sessions`). Session 3 shows "Contribute on GitHub →" + "Invest in AI Vaults →" (placeholder URLs, chunk 9). Paid sessions show a small green **"✓ You have lifetime access"** reassurance at the bottom.
- **`components/sessions/SessionBreadcrumb.tsx`** (new, client) — breadcrumb `DefiLords → Sessions → Session N`, each part a link. Derives the session number from the pathname (the session layout sits above the `[id]` segment, so it can't read the id from params).
- **`app/(dashboard)/sessions/layout.tsx`** — renders the breadcrumb between Navbar and content.
- **`components/sessions/SessionCard.tsx`** — final "has access" polish: green **"✓ Access granted"** pill badge, amber "View Session →" link below, and a subtle green border glow on the whole card (`shadow-[0_0_22px_-6px_rgba(151,196,89,0.45)]`).
- **`app/(dashboard)/sessions/[id]/page.tsx`** — unchanged; the server-side access gate from chunk 7 already renders `SessionContent`, and the Navbar/breadcrumb come from the layout, so the page stays a minimal gate (no business logic added).

### Tests added
- **`components/sessions/SessionContent.test.tsx`** (jsdom + React Testing Library, next/link mocked) — correct title per session; Twitter button has the right URL + `target="_blank"` + `rel` noopener; session 1 shows the upsell nudge (absent on paid); session 3 shows GitHub + AI Vaults links (absent on session 2); lifetime-access reassurance on paid sessions only. 7 tests.

### Decisions made
- **Twitter URLs:** asked the developer first (per CLAUDE.md). Confirmed placeholder `https://twitter.com/DefiLords` for now.
- **Breadcrumb is a client component using `usePathname`** — the `sessions/layout.tsx` is a parent of the `[id]` segment so Next doesn't pass it the `id` param; deriving from the path keeps the breadcrumb in the layout as specified.
- **"Lifetime access" shown only on paid sessions (2 & 3)**, the upsell nudge only on free session 1 — paid users get reassurance, free users get a path to upgrade.
- **All visual content lives in `SessionContent`/layout, not the page** — keeps the page a thin server-side gate (modularity rule).

### Verification
- `npm test` — **86/86** passing (16 suites; +7 new).
- `npm run build` — green (only the harmless `viem`/`ox` warning).

### Next chunk starts with
Chunk 9 — Owner dashboard (stats, user table, payment history, session breakdown). Prereqs: GitHub repo URL + AI Vaults deposit page URL (to replace the session-3 placeholder links).

---

## Chunk 7 — Session access control & gating

**Status:** Complete

### What was completed
- **`lib/sessions/access.ts`** (new) — `getUserSessionAccess(userId)` returns the array of paid session IDs; `hasSessionAccess(userId, sessionId)` returns a boolean, short-circuiting `true` for session 1 (free) without touching the DB. Server-only (service-role client).
- **`app/(dashboard)/sessions/[id]/page.tsx`** — replaced the placeholder with a real **server-side access gate**: reads the session cookie → not logged in redirects to `/login`; unknown session id redirects to `/`; no access (sessions 2/3) redirects to `/?locked=<id>`; otherwise renders `SessionContent`. Session 1 always allowed via `hasSessionAccess`.
- **`components/sessions/SessionContent.tsx`** (new) — shows title + description from `constants/sessions.ts` and a prominent amber "Watch on Twitter →" button. Session 3 also shows "Contribute on GitHub" + "Invest in AI Vaults" (placeholder URLs, finalised in chunk 9).
- **`components/sessions/LockedScroller.tsx`** (new) — behaviour-only client component that smooth-scrolls to the `#sessions` section when the homepage opens with `?locked=`.
- **`app/(dashboard)/sessions/layout.tsx`** — now wraps session pages with Navbar + Footer (auth still handled in middleware + page).
- **`app/page.tsx`** — reads `searchParams.locked`; passes `isLocked` to the matching `SessionCard` and renders `LockedScroller`.
- **`components/sessions/SessionCard.tsx`** — new `isLocked` prop: shows a subtle "You need to pay to access this session" message and briefly pulses an amber border/ring (4s).
- **`lib/auth/serverAuth.ts`** — added `getServerSession()` (cookie → `getSession`) and refactored `getServerAuthState()` to reuse `getUserSessionAccess` (single source of truth for "what does this user have").
- **`middleware.ts`** — already protected `/sessions/*` (redirect to `/login` when logged out, pass through when logged in); left unchanged as it already meets the requirement.

### Tests added
- **`lib/sessions/access.test.ts`** — session 1 always true (no DB hit), true when row exists, false when none, `getUserSessionAccess` returns correct array / empty on null.
- **`app/(dashboard)/sessions/[id]/page.test.tsx`** — unauthenticated → `/login`, authenticated + no access → `/?locked=2`, has access → renders `SessionContent`, unknown id → `/`. (`redirect` mocked to throw like real Next.js.)

### Decisions made
- **Access logic lives in `lib/sessions/access.ts`, gating in the page (server component).** Keeps the DB rule reusable/testable and the gate server-side so unauthorized users never receive the content HTML at all.
- **Session 1 free is handled in `hasSessionAccess` (returns true before any query)** — one rule, one place; the page doesn't special-case it.
- **`getServerAuthState` now reuses `getUserSessionAccess`** so the homepage cards and the session gate read access the exact same way.

### Verification
- `npm test` — **79/79** passing (15 suites; +11 new).
- `npm run build` — green (only the harmless `viem`/`ox` warning).
- Live (forged cookies): has-access → 200 + content; no-access → 307 `/?locked=2`; logged out → 307 `/login`; unknown id → 307 `/`.

### Next chunk starts with
Chunk 8 — Session content pages (fill in real content beyond the Twitter link).

---

## Fix — server-rendered auth/access (stale access after sign-out / email switch)

**Status:** Complete

### Problems
- Access state "loaded too late" — it was fetched on the client *after* first paint, so cards flashed a pay/connect prompt before correcting.
- After **sign-out** the cards still showed "You have access"; after logging into a **different email** they still showed the previous account's access. Only a hard refresh fixed it. Cause: the client `AuthProvider` fetched `/api/auth/me` once on mount and never re-synced with cookie changes from client-side navigation.

### Fixes
- **`lib/auth/serverAuth.ts`** (new) — `getServerAuthState()` reads the session cookie + `session_access` on the server in one place.
- **`app/layout.tsx`** — now `async`; resolves auth on the server and passes `initialAuth` into `Providers`. State is correct on the **first paint** — no client fetch, no flash.
- **`components/auth/AuthProvider.tsx`** — initialises from `initialAuth` (so `isLoading` is always `false`) and **re-syncs whenever `initialAuth` changes**. Sign-out / login already call `router.refresh()`, which re-runs the layout and pushes fresh state down — so stale access can no longer stick. `refresh()` retained for the post-payment update.
- **`components/layout/Providers.tsx`** — threads the `initialAuth` prop through.
- **Email normalization** — `send-otp`, `verify-otp`, `complete-signup` now `trim().toLowerCase()` the email, so access keys to one account regardless of casing/whitespace (prevents accidental duplicate accounts with no access).

### Verification (live dev server, forged cookies)
- `amanksah123@gmail.com` (paid 2 & 3) → SSR HTML shows "You have access" + "View Session" ×2, no wallet/pay prompt.
- `loginintolife@gmail.com` (no access) → "Connect Wallet".
- Logged out → "Get started to unlock".
- `npm test` 68/68, `npm run build` green.

### Note
The original "asking me to re-pay" was the app correctly reflecting whichever email was logged in — access lives under `amanksah123@gmail.com`. With server rendering + re-sync, switching accounts now updates instantly (no manual refresh needed).

---

## Perf — session access + payment verification

**Status:** Complete

### Problem
- **Access check slow:** the homepage renders 3 `SessionCard`s, each unconditionally calling `useAuth()` (`/api/auth/me`) *and* `useSessionAccess()` (`/api/session/access`) — **6 round trips** per homepage load, each re-verifying the HMAC session cookie + hitting Supabase.
- **Payment verify slow:** `verifyUsdcPayment` polled the RPC on a fixed 3s loop, and the route did an extra `users` lookup by email.

### Fixes
- **`components/auth/AuthProvider.tsx`** (new) — React context that fetches `/api/auth/me` **once** at the app root and shares `{ user, isOwner, isLoading, accessibleSessions, refresh }`. Wired into `Providers`.
- **`/api/auth/me`** — now also returns `accessibleSessions: number[]` from a single `session_access` query, so per-card access needs no extra request.
- **`hooks/useAuth.ts` + `hooks/useSessionAccess.ts`** — rewritten as thin consumers of the context. `useSessionAccess` derives access from `accessibleSessions` (session 1 always free). **Net: 6 requests → 1.**
- **`hooks/useWalletPayment.ts`** — uses context `user` instead of an extra `/api/auth/me` fetch in `pay()`; calls `refresh()` after a successful payment so cards update without a reload.
- **`lib/web3/verify.ts`** — replaced the manual 30×3s poll with viem `waitForTransactionReceipt({ pollingInterval: 1000, timeout: 60s, confirmations: 1 })` — resolves the moment the tx is mined (~2s blocks) instead of waiting out a 3s tick.
- **`app/api/payment/verify/route.ts`** — dropped the redundant `users` lookup; uses `session.userId` directly (one fewer DB round trip).
- Updated `lib/web3/verify.test.ts` to mock `waitForTransactionReceipt`.

### Verification
- `npm test` — 68/68 passing.
- `npm run build` — green.

---

## Hotfix — login refresh / dead client JS (broken webpack externals)

**Status:** Complete

### Symptom
Login form just refreshed and cleared the email on submit; no wallet "Connect Wallet" button appeared anywhere.

### Root cause
The previous "silence webpack warnings" change in `next.config.mjs` pushed raw strings into `config.externals`:
```js
config.externals.push('pino-pretty', '@react-native-async-storage/async-storage')
```
With this Next version that emits invalid module code (`module.exports = @react-native-async-storage/async-storage`), which **broke webpack compilation entirely** — in `next dev` too. With no valid client bundle, React never hydrated, so the login `<form>` fell back to a native HTML submit (the page "refresh" that wiped the email), and the RainbowKit connect button (client-only) never rendered.

### Fixes
- `next.config.mjs` — replaced the broken `externals.push(...strings)` with `config.resolve.alias` mapping the two optional deps to `false` (empty module). Compiles cleanly *and* silences the warnings.
- `next.config.mjs` — widened CSP so wallet traffic isn't blocked: `connect-src 'self' https: wss:` (RPC + WalletConnect relay) and `frame-src` now allows `verify.walletconnect.com/.org`.
- `app/(dashboard)/sessions/layout.tsx` — was 0 bytes ("not a module" type error); added a passthrough layout (route protection stays in middleware).
- `app/page.tsx` — escaped apostrophe in hero copy (`you&apos;re`) — was a build-blocking lint error.
- `.eslintrc.json` — added `@typescript-eslint/no-unused-vars` with `ignoreRestSiblings` + `^_` ignore patterns (the destructure-to-omit pattern in tests was failing the build).
- `lib/auth/otp.test.ts` — removed dead unused mock declarations / `callCount`.

### Verification
- `npm run build` — green (only a harmless `viem`/`ox` critical-dependency warning).
- `npm test` — 68/68 passing.
- `next dev` — `/login`, `/`, `/api/auth/me` all return 200 with valid client chunks.

---

## Post-chunk 6 fixes — session page, already-paid state, webpack warnings

**Status:** Complete

### What was completed
- `app/(dashboard)/sessions/[id]/page.tsx` — basic placeholder page added (was empty, causing runtime error on redirect after payment)
- `app/api/session/access/route.ts` — GET `/api/session/access?sessionId=N`; checks `session_access` table for the logged-in user; returns `{ hasAccess: boolean }`; session 1 always returns `true` (free)
- `hooks/useSessionAccess.ts` — client hook that calls the access endpoint on mount; returns `{ hasAccess, isLoading }`
- `components/sessions/SessionCard.tsx` — paid cards now check access on load; shows skeleton while loading, "✓ You have access" + amber "View Session →" link when already paid, pay button otherwise
- `next.config.mjs` — webpack externals added for `pino-pretty` and `@react-native-async-storage/async-storage` to silence build warnings from wagmi/RainbowKit deps

### Files created or modified
- `app/(dashboard)/sessions/[id]/page.tsx` — implemented
- `app/api/session/access/route.ts` — implemented (was empty stub)
- `hooks/useSessionAccess.ts` — created
- `components/sessions/SessionCard.tsx` — updated
- `next.config.mjs` — webpack externals added

### Test results
68 tests passing. No new tests added (UI-only changes + placeholder page).

---

## Chunk 6 — USDC payment flow + server-side verification

**Status:** Complete

### What was completed
- M003 migration added to `database/MIGRATIONS.md` — `user_wallets` table, RLS enabled, service-role-only insert
- `database/SCHEMA.md` updated with `user_wallets` table documentation
- `lib/supabase/types.ts` — added `UserWalletRow` and `UserWalletInsert` interfaces
- `lib/web3/verify.ts` — `verifyUsdcPayment(txHash, sessionId)` — creates a viem public client for Base Sepolia, fetches receipt, checks status + contract address + Transfer log recipient + Transfer log amount. Returns `{ valid, reason? }`
- `app/api/wallet/save/route.ts` — POST; auth check, Zod validation (Ethereum address format), idempotent upsert into `user_wallets`
- `app/api/payment/verify/route.ts` — POST; auth check, Zod validation, duplicate txHash guard, calls `verifyUsdcPayment`, inserts into `session_access` on success. Most security-critical route in the app.
- `hooks/useWalletPayment.ts` — full implementation replacing chunk 5 stub. State machine: `idle → saving-wallet → sending-payment → confirming → verifying → success | error`. Uses wagmi `useWriteContract` + `waitForTransactionReceipt` from `@wagmi/core`.
- `components/sessions/SessionCard.tsx` — three-state UI: "Get started to unlock" link (not logged in) → disabled pay button (logged in, no wallet) → active pay button (logged in + connected). Shows live status labels during payment. Shows error message on failure.
- `lib/web3/verify.test.ts` — 7 tests: valid session-2, valid session-3, tx failed, wrong contract, wrong recipient, wrong amount, receipt not found
- `app/api/payment/verify/route.test.ts` — 5 tests: 401, invalid sessionId, bad txHash, duplicate txHash, valid payment inserts row
- `app/api/wallet/save/route.test.ts` — 4 tests: 401, invalid address, new wallet saved, duplicate returns 200 silently

### Files created or modified
- `database/MIGRATIONS.md` — added M003
- `database/SCHEMA.md` — added user_wallets table
- `lib/supabase/types.ts` — UserWalletRow, UserWalletInsert
- `lib/web3/verify.ts` — created
- `lib/web3/verify.test.ts` — created
- `app/api/wallet/save/route.ts` — created
- `app/api/wallet/save/route.test.ts` — created
- `app/api/payment/verify/route.ts` — implemented (was empty stub)
- `app/api/payment/verify/route.test.ts` — created
- `hooks/useWalletPayment.ts` — implemented (was stub)
- `components/sessions/SessionCard.tsx` — updated (payment flow + auth states)

### Decisions made
- **`verifyUsdcPayment` extracted to `lib/web3/verify.ts`** — keeps the API route thin and testable in isolation; the route only handles HTTP concerns
- **`waitForTransactionReceipt` from `@wagmi/core`** — used imperatively inside `useWalletPayment` rather than the hook variant (`useWaitForTransactionReceipt`), so the entire payment flow is one sequential async function instead of multiple effects reacting to state changes
- **Chain ID hardcoded as `84532`** in `payment/verify/route.ts` — this is the Base Sepolia chain ID; needs to change to `8453` when switching to mainnet (alongside `lib/web3/config.ts` and `.env.local`)
- **Idempotent wallet save** — if the same (user_id, wallet_address) pair already exists, return `{ success: true }` silently; no unique-constraint errors reach the client
- **`amount_usdc` stored as `'50'` / `'100'`** in `session_access` — the DB column is `numeric(20,6)` so Supabase will store this as `50.000000`. The raw on-chain unit (50000000) is used only for verification, not stored.

### New env vars introduced
None — `ALCHEMY_RPC_URL` and `NEXT_PUBLIC_PAYMENT_ADDRESS` were already placeholders.

⚠️ `NEXT_PUBLIC_PAYMENT_ADDRESS` must be your real payment wallet address before testing — it was previously pointing at the USDC contract address.

### Test results
68 tests passing across 13 suites. No failures.

### Next chunk starts with
Chunk 7 — Session access control: DB gating, `useSessionAccess` hook, session page guarding.
Prerequisites: M003 applied in Supabase (done), `NEXT_PUBLIC_PAYMENT_ADDRESS` set to real wallet.

---

## Testnet switch — Base Sepolia (between chunks 5 and 6)

**Status:** Complete

### What was changed
- `lib/web3/config.ts` — chain changed from `base` to `baseSepolia`; import updated
- `lib/web3/contracts.ts` — USDC address changed to Base Sepolia testnet address (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`); comment added noting the mainnet address to swap back to at launch
- `.env.local` — `NEXT_PUBLIC_CHAIN_ID` changed from `8453` to `84532`; `NEXT_PUBLIC_ALCHEMY_RPC_URL` updated to real Base Sepolia Alchemy endpoint
- `CLAUDE.md` — USDC contract section updated with both addresses (testnet current, mainnet for launch)
- `lib/web3/contracts.test.ts` — updated address assertion to match testnet address
- Dev server confirmed responding 200 after the switch

### Reminder before launch
Switch these back to mainnet values:
- `lib/web3/config.ts`: `baseSepolia` → `base`
- `lib/web3/contracts.ts`: testnet USDC → `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- `.env.local` + Vercel: `NEXT_PUBLIC_CHAIN_ID` → `8453`, `NEXT_PUBLIC_ALCHEMY_RPC_URL` → mainnet endpoint
- `NEXT_PUBLIC_PAYMENT_ADDRESS` → correct payment wallet (not the USDC contract address)

---

## Chunk 1 — Foundation

**Status:** Complete

### What was completed
- Initialised Next.js 14 with TypeScript, Tailwind CSS, and App Router
- Set up `lib/env.ts` — validates all env vars at startup with Zod; throws on missing/invalid values
- Set up `next.config.ts` — CSP headers + X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Set up `lib/logger.ts` — pino instance; debug level in dev, info in prod
- Added `.env.local` with all env vars as empty placeholders
- Added `.gitignore` — excludes `.env.local`, `node_modules`, `.next`
- Configured Jest + ts-jest for unit testing
- Wrote 9 unit tests for `lib/env.ts` — missing vars, invalid URLs/emails/addresses, optional vars, multiple missing vars

### Files created or modified
- `package.json` — name, test script, added zod + pino + jest + ts-jest
- `next.config.mjs` — CSP and security headers (Next.js 14 does not support `.ts` config)
- `tsconfig.json` — generated by create-next-app
- `tailwind.config.ts` — generated by create-next-app
- `postcss.config.mjs` — generated by create-next-app
- `.eslintrc.json` — generated by create-next-app
- `.gitignore` — created manually
- `.env.local` — all env var placeholders
- `jest.config.ts` — Jest config with ts-jest
- `lib/env.ts` — Zod env validation
- `lib/env.test.ts` — 9 unit tests
- `lib/logger.ts` — pino logger
- `app/layout.tsx` — generated by create-next-app
- `app/page.tsx` — generated by create-next-app
- `app/globals.css` — generated by create-next-app

### Decisions made
- `next.config.ts` used instead of `.mjs` (per CLAUDE.md and user confirmation)
- `env = {}` during `NODE_ENV=test` to prevent auto-validation from crashing test imports
- CSP `script-src` is relaxed in dev only (HMR requires `unsafe-eval`); tightened in prod

### New env vars introduced
All vars are placeholders — fill these in Vercel dashboard and locally in `.env.local`:
```
NEXTAUTH_SECRET
NEXTAUTH_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
BREVO_API_KEY
BREVO_LIST_ID
BREVO_SENDER_EMAIL
ALCHEMY_RPC_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_WC_PROJECT_ID
NEXT_PUBLIC_PAYMENT_ADDRESS
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_HOTJAR_ID (optional)
```

### Next chunk starts with
Chunk 2 — Homepage UI: hero section + 3 session cards, fully static, no data fetching.

---

## Chunk 2 — Homepage UI

**Status:** Complete

### What was completed
- Updated `tailwind.config.ts` with full brand colour palette under `brand.*` namespace
- Created `constants/sessions.ts` with all 3 sessions and a `Session` type
- Created `components/layout/Navbar.tsx` — logo, nav links, "Get started" CTA
- Created `components/layout/Footer.tsx` — Twitter, GitHub, Invest links
- Created `components/sessions/SessionCard.tsx` — handles both free and paid states
- Updated `app/page.tsx` — hero + session grid + full page layout
- Updated `app/layout.tsx` — metadata, dark background, brand font classes
- Cleaned `app/globals.css` — removed default light/dark vars that conflicted with brand theme

### Files created or modified
- `tailwind.config.ts`
- `constants/sessions.ts`
- `components/layout/Navbar.tsx`
- `components/layout/Footer.tsx`
- `components/sessions/SessionCard.tsx`
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`

### Decisions made
- All colours referenced via `brand.*` Tailwind tokens — no hex values in components
- Free session card uses green tint border; paid cards use amber tint border
- "Connect wallet to pay" button is `disabled` — wallet logic added in chunk 5
- CSP `connect-src 'self'` is intentionally narrow — will expand in chunk 5 for WalletConnect

### New env vars introduced
None.

### Design correction (post-chunk-2)
The original token names (`amber-dark`, `free-text`, `free-bg`, `paid-bg`) used hyphens which Tailwind silently failed to resolve, causing fallback to light/default colours. Tokens renamed to camelCase to match Tailwind's arbitrary value handling: `amberDark`, `amberDeep`, `green`, `greenDeep`, `greenBorder`. All component class names updated to match. No logic or structure changed.

### Next chunk starts with
Chunk 3 — Sign-up form + Brevo integration.

---

## Chunk 3 — Sign-up form, Supabase user creation, Brevo integration

**Status:** Complete

### What was completed
- `lib/supabase/client.ts` — browser-safe Supabase client using anon key + `@supabase/ssr`
- `lib/supabase/server.ts` — server-only Supabase client using service role key + `@supabase/supabase-js`
- `lib/supabase/types.ts` — TypeScript interfaces for all three tables: `UserRow`, `UserInsert`, `UserUpdate`, `SessionAccessRow`, `SessionAccessInsert`, `UserRoleRow`
- `lib/brevo/templates.ts` — welcome email subject and HTML body as exported constants
- `lib/brevo/client.ts` — `addContact` and `sendWelcomeEmail` functions calling Brevo REST API via `fetch`
- `app/api/signup/route.ts` — POST route with Zod validation, duplicate-email silent success, Supabase insert, Brevo calls, in-memory rate limiting (5 req/IP/min), no raw error exposure
- `components/forms/SignupForm.tsx` — client component with name + email fields, client-side validation, loading spinner, success and error states
- `app/page.tsx` — `SignupForm` added between hero section and session cards
- `lib/brevo/client.test.ts` — 3 tests: addContact payload, addContact error handling, sendWelcomeEmail payload
- `app/api/signup/route.test.ts` — 5 tests: valid signup, missing email, missing name, invalid email format, duplicate email silent success

### Files created or modified
- `lib/supabase/client.ts` — created
- `lib/supabase/server.ts` — created
- `lib/supabase/types.ts` — created
- `lib/brevo/templates.ts` — created
- `lib/brevo/client.ts` — created
- `lib/brevo/client.test.ts` — created
- `app/api/signup/route.ts` — created
- `app/api/signup/route.test.ts` — created
- `components/forms/SignupForm.tsx` — created
- `app/page.tsx` — modified (added SignupForm section)
- `package.json` — modified (added `@supabase/supabase-js`, `@supabase/ssr`)

### Decisions made
- Rate limiting uses an in-memory Map — no Redis or external service needed at this stage. Resets per 60s window per IP. Sufficient for this scale.
- Duplicate email returns `{ success: true }` silently — prevents email enumeration attacks where an attacker could discover which emails are registered
- Brevo API called directly via `fetch` — no SDK installed, keeps dependencies minimal
- `sendWelcomeEmail` is called after `addContact` — both are fire-and-forget after the DB insert; a Brevo failure does not block the signup from succeeding from the DB perspective, but the error is logged and returns 500 to the client so the user knows to retry
- `@supabase/ssr` used for the browser client (correct package for App Router); plain `@supabase/supabase-js` for server client (no cookie handling needed server-side for service role)

### New env vars introduced
None — all Brevo and Supabase env vars were already placeholders from chunk 1. They now need real values to function.

Required and confirmed set in `.env.local`:
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `BREVO_API_KEY` ✅
- `BREVO_LIST_ID` ✅ (value: `5`)
- `BREVO_SENDER_EMAIL` ✅

### Test results
17 tests passing across 3 test suites. No failures.

### Next chunk starts with
Chunk 4 — NextAuth magic-link sign-in + owner role check.
Prerequisites: `NEXTAUTH_SECRET` must be set to a real value before auth works.

---

## Chunk 4 — Route protection, admin layout, sign-out, useAuth hook (rebuilt)

**Status:** Complete

### What was completed
- `app/(admin)/admin/layout.tsx` — Server Component; reads session cookie, redirects to `/` if no session or role !== 'owner'; renders children if owner
- `app/(admin)/admin/page.tsx` — Placeholder page with charcoal + amber design: "Owner Dashboard — coming in chunk 9"
- `app/api/auth/me/route.ts` — GET endpoint that returns `{ user: { email, userId }, isOwner }` from the signed session cookie; used by client-side hooks
- `hooks/useAuth.ts` — Client-side hook; calls `/api/auth/me` on mount; returns `{ user, isOwner, isLoading }`
- `middleware.test.ts` — 5 tests: unauthenticated /sessions redirect, unauthenticated /admin redirect, non-owner /admin redirect, owner /admin passes, public route passes
- `app/api/auth/sign-out/route.test.ts` — 2 tests: returns 200 + `{ success: true }`, clears session cookie

All previously-completed files verified correct with no changes needed:
- `middleware.ts` — correct (uses `getSession`, protects `/sessions/*` and `/admin/*`)
- `components/layout/Navbar.tsx` — correct (server component, shows login state + owner link)
- `app/api/auth/sign-out/route.ts` — correct (clears cookie via `Max-Age=0`)

### Files created or modified
- `app/(admin)/admin/layout.tsx` — created
- `app/(admin)/admin/page.tsx` — created
- `app/api/auth/me/route.ts` — created
- `hooks/useAuth.ts` — implemented (was empty placeholder)
- `middleware.test.ts` — created
- `app/api/auth/sign-out/route.test.ts` — created

### Decisions made
- `app/api/auth/me` endpoint created to support `useAuth` — the session cookie is `HttpOnly` so client-side JS cannot read it directly; a server endpoint is the only way to expose session state to client components
- `app/(admin)/admin/layout.tsx` mirrors the Navbar pattern (constructing a synthetic `Request` with the cookie header) rather than importing `getSession` with a different signature — keeps the session API consistent
- Admin layout does a server-side redirect: the middleware already protects `/admin/*`, but the layout adds a second check at the React tree level. Defence in depth.

### New env vars introduced
None.

### Test results
43 tests passing across 8 suites. No failures.

### Next chunk starts with
Chunk 5 — Wallet connect (wagmi + RainbowKit).
Prerequisites: `NEXT_PUBLIC_WC_PROJECT_ID` from cloud.walletconnect.com set in `.env.local`.

---

---

## Chunk 5 — Wallet connect (wagmi + RainbowKit)

**Status:** Complete

### What was completed
- Installed `@rainbow-me/rainbowkit`, `wagmi`, `viem`, `@tanstack/react-query`
- Installed dev deps: `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom`
- Updated `jest.config.ts` — added `jsx: 'react-jsx'` to ts-jest tsconfig override (required for JSX in component tests)
- `lib/web3/config.ts` — wagmi config via `getDefaultConfig`: Base mainnet, RainbowKit connectors, Alchemy HTTP transport, SSR enabled
- `lib/web3/contracts.ts` — `USDC_ADDRESS` (Base mainnet) and `USDC_ABI` (transfer function only)
- `lib/env.ts` — added `NEXT_PUBLIC_ALCHEMY_RPC_URL` to client env schema
- `lib/env.test.ts` — added `NEXT_PUBLIC_ALCHEMY_RPC_URL` to validEnv fixture
- `.env.local` — added `NEXT_PUBLIC_ALCHEMY_RPC_URL` placeholder (update with real Alchemy key before testing on-chain)
- `components/layout/Providers.tsx` — Client Component wrapping WagmiProvider → QueryClientProvider → RainbowKitProvider (dark theme, amber accent)
- `app/layout.tsx` — wrapped `children` with `<Providers>`
- `components/wallet/WalletButton.tsx` — shows RainbowKit ConnectButton when not connected; shows shortened address + Disconnect button when connected
- `components/wallet/WalletStatus.tsx` — shows abbreviated address in amber when connected; "Connect wallet to pay" in muted when not
- `components/sessions/SessionCard.tsx` — converted to Client Component; paid sessions now show `WalletStatus`, then either `WalletButton` (not connected), "Connecting..." disabled button (connecting), or "Pay $X USDC" button (connected, no payment logic yet)
- `hooks/useWalletPayment.ts` — stub: `{ pay: () => {}, isPaying: false }`
- `lib/web3/contracts.test.ts` — 3 tests: USDC address, ABI has transfer function, correct inputs
- `components/wallet/WalletButton.test.tsx` — 3 tests: renders ConnectButton when not connected, renders shortened address when connected, renders disconnect button

### Files created or modified
- `lib/web3/config.ts` — created
- `lib/web3/contracts.ts` — created
- `lib/web3/contracts.test.ts` — created
- `hooks/useWalletPayment.ts` — implemented (was empty)
- `components/layout/Providers.tsx` — created
- `components/wallet/WalletButton.tsx` — created
- `components/wallet/WalletButton.test.tsx` — created
- `components/wallet/WalletStatus.tsx` — created
- `components/sessions/SessionCard.tsx` — updated (client component + wallet UI)
- `app/layout.tsx` — updated (Providers wrapper)
- `lib/env.ts` — updated (NEXT_PUBLIC_ALCHEMY_RPC_URL)
- `lib/env.test.ts` — updated (added to validEnv)
- `.env.local` — updated (NEXT_PUBLIC_ALCHEMY_RPC_URL placeholder)
- `jest.config.ts` — updated (jsx: react-jsx for component tests)
- `package.json` — updated (new dependencies)

### Decisions made
- **`NEXT_PUBLIC_ALCHEMY_RPC_URL` added** — wagmi's transport runs client-side and can only read `NEXT_PUBLIC_` vars. The server-only `ALCHEMY_RPC_URL` is kept for chunk 6 server-side tx verification. The client key should be domain-restricted in the Alchemy dashboard.
- **`getDefaultConfig` from RainbowKit** — handles both wagmi config and RainbowKit connector setup in one call; simpler than configuring them separately
- **`Providers.tsx` as a Client Component** — `app/layout.tsx` is a Server Component; wagmi/RainbowKit context providers require client-side React context, so they must live in a `'use client'` boundary. `Providers.tsx` is that boundary.
- **Amber accent in RainbowKit dark theme** — `darkTheme({ accentColor: '#EF9F27' })` matches brand without needing a fully custom ConnectButton
- **`jsx: 'react-jsx'` in jest.config.ts** — tsconfig.json uses `"jsx": "preserve"` (required by Next.js); ts-jest needs `react-jsx` to process JSX in test files. Added as a ts-jest override, not a global tsconfig change.
- **`ssr: true` in wagmiConfig** — prevents hydration mismatches in Next.js SSR; wagmi generates a consistent initial state for the server render

### New env vars introduced
```
NEXT_PUBLIC_ALCHEMY_RPC_URL=   # same value as ALCHEMY_RPC_URL — restrict by domain in Alchemy dashboard
```
⚠️ `NEXT_PUBLIC_PAYMENT_ADDRESS` is currently set to the USDC contract address (0x833589...) — this needs to be changed to your actual payment recipient wallet before chunk 6.

### Test results
49 tests passing across 10 suites. No failures.

### Next chunk starts with
Chunk 6 — USDC payment flow + server-side tx verification.
Prerequisites: `NEXT_PUBLIC_ALCHEMY_RPC_URL` set to a real Alchemy key, `NEXT_PUBLIC_PAYMENT_ADDRESS` updated to your payment wallet address.

---

## Chunk 4 — NextAuth magic-link sign-in + owner role check (superseded — replaced by custom OTP auth)

**Status:** Superseded

### What was completed
- `database/MIGRATIONS.md` — M002 added: `verification_tokens` table for NextAuth magic link token storage
- `database/SCHEMA.md` — `verification_tokens` table documented
- `lib/brevo/templates.ts` — added `MAGIC_LINK_SUBJECT` and `MAGIC_LINK_EMAIL(url)` constants
- `lib/brevo/client.ts` — added `sendMagicLinkEmail(email, url)` function
- `types/next-auth.d.ts` — module augmentation adding `id`, `role` to `Session.user` and `userId`, `role` to `JWT`
- `lib/auth/config.ts` — full NextAuth config: JWT session strategy, minimal custom Supabase adapter (verification tokens only), Email provider with custom Brevo sender, `jwt` callback (looks up role + userId on first sign-in), `session` callback (copies to session object), pages config
- `app/api/auth/[...nextauth]/route.ts` — standard NextAuth GET/POST route handler
- `middleware.ts` — rewrote to use `getToken` from `next-auth/jwt`; protects `/sessions/*` (redirect to /login if unauthenticated) and `/admin/*` (redirect to / if not owner)
- `app/(auth)/login/page.tsx` — async Server Component: redirects to `/` if already signed in, renders `LoginForm`
- `components/forms/LoginForm.tsx` — Client Component: email input, calls `signIn('email', { redirect: false })`, handles loading/success/error states; shows specific message for `Verification` error
- `app/(auth)/verify/page.tsx` — Server Component: reads `searchParams.error`; no error → "Check your email"; error → "Link expired or invalid" with link back to /login
- `components/layout/SignOutButton.tsx` — Client Component: calls `signOut({ callbackUrl: '/' })`
- `components/layout/Navbar.tsx` — updated to async Server Component: uses `getServerSession` to render sign-in state; shows email + "Sign out" when authenticated; shows "Dashboard" link if `role === 'owner'`; shows "Get started" → /login when not authenticated
- `middleware.test.ts` — 5 tests: unauthenticated /sessions redirect, unauthenticated /admin redirect, non-owner /admin redirect, owner /admin passes, authenticated /sessions passes
- `lib/auth/config.test.ts` — 5 tests: jwt callback attaches owner role, jwt callback attaches null role, jwt callback skips Supabase on repeat requests, session callback copies userId+role, session callback sets null for new users

### Files created or modified
- `database/SCHEMA.md` — modified (added verification_tokens)
- `database/MIGRATIONS.md` — modified (added M002)
- `lib/brevo/templates.ts` — modified (added MAGIC_LINK_*)
- `lib/brevo/client.ts` — modified (added sendMagicLinkEmail)
- `lib/auth/config.ts` — created
- `lib/auth/config.test.ts` — created
- `app/api/auth/[...nextauth]/route.ts` — created
- `middleware.ts` — rewritten
- `middleware.test.ts` — created
- `app/(auth)/login/page.tsx` — created
- `app/(auth)/verify/page.tsx` — created
- `components/forms/LoginForm.tsx` — created
- `components/layout/SignOutButton.tsx` — created
- `components/layout/Navbar.tsx` — rewritten
- `types/next-auth.d.ts` — created
- `app/api/signup/route.ts` — fixed logger import (named export)
- `package.json` — added `next-auth`, `nodemailer`, `@types/nodemailer`

### Decisions made
- **JWT strategy, not database sessions** — NextAuth's full Supabase adapter expects its own `users` table with `email_verified`, `image` columns that conflict with our custom schema. JWT strategy stores sessions in signed httpOnly cookies and needs only a `verification_tokens` table in Supabase, which we created in M002.
- **Minimal custom adapter** — Only `createVerificationToken` and `useVerificationToken` are real implementations. All other adapter methods are typed stubs that return null/undefined. They are never called at runtime with JWT strategy + Email provider.
- **`getToken` in middleware, not `withAuth`** — Using `getToken` from `next-auth/jwt` directly is simpler, gives full control over redirect logic, and is far easier to unit test (mock one function vs. wrapping the middleware function).
- **Navbar is async Server Component** — No `SessionProvider` or client-side `useSession` needed. `getServerSession(authOptions)` runs on the server at request time. Only the `SignOutButton` is a Client Component (it calls `signOut()`).
- **Error routing** — `pages.error = '/verify'` so NextAuth sends all auth errors to the verify page. Expired token errors land at `/verify?error=Verification`. The verify page reads `searchParams.error` as a Server Component (no useSearchParams needed).
- **`nodemailer` installed** — next-auth's Email provider imports it at module level regardless of whether a custom `sendVerificationRequest` is provided. Required for Jest to resolve the module.

### New env vars introduced
None — `NEXTAUTH_SECRET` and `NEXTAUTH_URL` were already placeholders from chunk 1.

Before testing magic-link sign-in:
- `NEXTAUTH_SECRET` must be a real value (`openssl rand -base64 32`)
- `NEXTAUTH_URL` must be `http://localhost:3000` (already set)
- M002 migration must be applied in Supabase SQL Editor

### Test results
27 tests passing across 5 suites. No failures.

### Next chunk starts with
Chunk 5 — Wallet connect (wagmi + RainbowKit).
Prerequisites: WalletConnect Project ID from cloud.walletconnect.com set in `NEXT_PUBLIC_WC_PROJECT_ID`.

---

## Chunk 3 — OTP auth flow (rebuilt)

**Status:** Complete

### What was completed
- Removed: `components/forms/SignupForm.tsx`, `app/api/signup/route.ts`, `app/(auth)/verify/page.tsx`, `lib/auth/config.ts`, `app/api/auth/[...nextauth]/route.ts`, `components/forms/LoginForm.tsx`, old `components/layout/SignOutButton.tsx`, `types/next-auth.d.ts`, `middleware.test.ts`
- Removed `next-auth`, `nodemailer`, `@types/nodemailer` from `package.json`
- Added M002 migration (`otp_codes` table) to `database/MIGRATIONS.md`
- Updated `database/SCHEMA.md` with `otp_codes` table documentation
- `lib/auth/otp.ts` — `generateOtp`, `storeOtp` (with rate limit), `verifyOtp` (with attempt tracking), `cleanupExpiredOtps`
- `lib/auth/session.ts` — `createSession`, `getSession`, `makeSessionCookie` using HMAC-SHA256 signed cookies (Web Crypto API — works in Edge Runtime and Node.js 18+); role embedded in token
- `app/api/auth/send-otp/route.ts` — Zod validation, cleanup, rate-limit-aware OTP generation and email send
- `app/api/auth/verify-otp/route.ts` — Zod validation, OTP check, new vs existing user detection, session creation
- `app/api/auth/complete-signup/route.ts` — Zod validation, user insert, Brevo contact + welcome email, session creation
- `app/api/auth/sign-out/route.ts` — clears session cookie
- `components/auth/EmailStep.tsx`, `OtpStep.tsx`, `NameStep.tsx` — three-step client components
- `app/(auth)/login/page.tsx` — rewritten as Client Component 3-step state machine (`'email' | 'otp' | 'name'`)
- `components/layout/Navbar.tsx` — rewritten to use `getSession()` from custom session (no next-auth)
- `components/layout/SignOutButton.tsx` — rewritten to call `POST /api/auth/sign-out`
- `middleware.ts` — rewritten to use `getSession()` from custom session; role embedded in token means no DB call on every request
- `lib/brevo/templates.ts` — removed `MAGIC_LINK_*`, added `OTP_EMAIL`
- `lib/brevo/client.ts` — removed `sendMagicLinkEmail`, added `sendOtpEmail`
- `lib/env.ts` — replaced `NEXTAUTH_SECRET` / `NEXTAUTH_URL` with `SESSION_SECRET` (min 32 chars)
- `app/page.tsx` — removed `SignupForm` section
- `lib/auth/otp.test.ts` — 7 tests
- `app/api/auth/send-otp/route.test.ts` — 4 tests
- `app/api/auth/verify-otp/route.test.ts` — 5 tests
- `app/api/auth/complete-signup/route.test.ts` — 4 tests
- All pre-existing tests updated to match new env schema

### Decisions made
- **Custom session over next-auth** — no third-party auth library; HMAC-SHA256 cookie signed with `SESSION_SECRET`; no session table in DB needed
- **Web Crypto API** — `crypto.subtle` is used for signing/verifying (not Node.js `crypto`), so the session module works in both the Edge Runtime (middleware) and Node.js (API routes) without any runtime config
- **Role embedded in session token** — owner role is looked up once at sign-in time and stored in the signed token; middleware checks role without any DB call
- **OTP delivery via Brevo plain text** — OTP email uses `textContent` (plain text), not `htmlContent`, for maximum deliverability and simplicity

### New env vars introduced
```
SESSION_SECRET=    # generate with: openssl rand -base64 32
```
Add to `.env.local` before testing. Remove `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.

### Test results
36 tests passing across 6 test suites. No failures.

### Next chunk starts with
Chunk 5 — Wallet connect (wagmi + RainbowKit).
Prerequisites: `SESSION_SECRET` set in `.env.local`, M002 applied in Supabase, `NEXT_PUBLIC_WC_PROJECT_ID` from cloud.walletconnect.com.

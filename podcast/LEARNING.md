# LEARNING LOG

This file explains what was built in each chunk in plain English.
If you are new to the backend or just vibe-coding along, this is your guide to understanding what is actually happening under the hood.

---

## USDT as a Second Payment Option (Multi-Token Support)

### What was built

We added USDT as a second payment token alongside USDC. Users can now choose which token they want to use when unlocking a paid session. A new payment modal pops up when they click the unlock button, shows a token selector, and guides them through the payment. The admin dashboard now shows separate USDC and USDT columns in the payment history table.

---

### What ERC20 tokens are, and why USDC and USDT share the same ABI

An ERC20 token is a smart contract on Ethereum (or a compatible chain like Base) that follows a standard interface. "ERC20" is just the name of the standard — it defines a set of functions every compliant token must have: `transfer`, `approve`, `balanceOf`, `decimals`, and a few others.

USDC and USDT are both ERC20 tokens. That means they have the same function names and the same signatures. When you call `token.transfer(to, amount)` it works exactly the same way on both — you just point it at a different contract address. This is why a single `ERC20_ABI` (the ABI describes the function signatures) works for both. We don't need separate ABIs.

The ABI is just the recipe book. The contract address is the specific kitchen. Same recipe, different kitchen.

---

### What token decimals are, and why they are in env vars

On-chain, token amounts are always stored as whole integers — there are no decimals in Solidity. So "50 USDC" is not stored as `50` — it is stored as `50 × 10^decimals`. For a token with 18 decimals (like the testnet USDC we use), "50 USDC" is stored as `50000000000000000000` (50 followed by 18 zeros).

Why env vars? Because the number of decimals is a property of a specific token contract deployment, not something baked into the application logic. If we ever switch to a different USDC deployment (or if a USDT contract uses 6 decimals instead of 18), we can change `USDC_DECIMALS` or `USDT_DECIMALS` in the env without touching any code. The verification route reads the decimals from the env at runtime and passes them into the verification function, which uses them to calculate the expected on-chain amount.

Both the client (to build the transaction) and the server (to verify it) use the same decimals. If they disagree, the transfer amount won't match and verification fails — which is exactly what you want as a security check.

---

### What a payment modal is, and why it is better UX than an inline button

An **inline button** (the old "Pay $50 USDC" button on the session card) has no room to show extra choices or explain what is about to happen. You click it, MetaMask opens immediately, and if you are confused about which token to use or what address you are sending to — you have nowhere to check.

A **payment modal** is a focused overlay that appears over the page when the user clicks "Unlock Session N →". It has enough space to:

1. Let the user choose their token (USDC or USDT) without leaving the page.
2. Show exactly how much they will pay and to which wallet address.
3. Guide them through each step with a status message ("Confirm in MetaMask...", "Verifying payment...").
4. Show a friendly error if something goes wrong, with a "Retry verification" button if the transaction went through but the server had a hiccup.
5. Close automatically after a success message — so the user sees confirmation before the modal disappears.

This pattern (a confirmation step before an irreversible action) is standard in any financial app. It reduces accidental payments and makes the user feel in control.

---

## YouTube Video Embedding with Watermark Protection

### What was built

We added embedded YouTube videos to each session content page. Instead of just linking users to Twitter/X, they now watch the video directly on the site. A faint watermark with their email address covers the video area so that even if someone screenshots or records their screen, the content is traceable to them. The video ID is kept secret on the server so it can't be copied from the browser's DevTools.

---

### What "YouTube unlisted" means and why it's used

A YouTube video can be **public** (anyone can find it via search), **private** (only the owner can see it), or **unlisted** (anyone with the direct link can watch it, but it doesn't appear in search results or on the channel page).

Unlisted is the right choice here because:
- You don't want random people finding the paid session videos on YouTube
- You still need YouTube to host the video (free, global CDN, great mobile playback)
- Access control happens on your site — only logged-in, paid users get the embed URL

The raw video ID is kept server-side and never exposed to the browser. Even if a user opens DevTools and looks at network requests, they only see the embed URL (which includes the ID) — and they already have access to that session anyway.

---

### What an iframe embed is vs a redirect link

A **redirect link** sends the user away from your site to YouTube's website. The user leaves, sees YouTube's UI, can share the URL freely, and you have no control over what happens next.

An **iframe embed** keeps the user on your site. The `<iframe>` is a rectangular "window" that loads YouTube's player inside your page. From the user's perspective they're watching a video on your site. From YouTube's perspective they're playing a video on an external site. The embed URL uses `youtube-nocookie.com` (YouTube's privacy-enhanced domain) which doesn't set tracking cookies unless the user hits play.

The key difference: with an embed, you can overlay things on top of the video (like the watermark canvas), disable right-click, and control the UI around it. You can't do any of that with a redirect link.

---

### Why the video ID is served from the server, not the frontend

If you put `YOUTUBE_SESSION_2_ID=abc123xyz` in a `NEXT_PUBLIC_` environment variable, that value gets bundled into the JavaScript that ships to every user's browser. Anyone can open DevTools → Sources and find it. They could then go directly to `youtube.com/watch?v=abc123xyz` without ever paying.

By keeping the ID in a server-only environment variable (no `NEXT_PUBLIC_` prefix), it only exists on the server. The API route reads it, builds the embed URL, and returns just the URL. The raw ID never travels to the browser — users only see the final embed URL, which already requires them to be logged in and paid to access.

---

### What the canvas watermark does and why it regenerates

The watermark is a `<canvas>` element (an HTML drawing surface) that sits on top of the video using `position: absolute; inset: 0`. It draws the user's email address + "DefiLords" in a diagonal tiled pattern across the entire video area at 15% amber opacity — faint enough to watch through, visible enough to read on a screenshot.

Why canvas instead of a regular HTML element? Because a `<div>` overlay can be removed in one click in DevTools: right-click → Inspect → Delete. Done. A canvas element is harder — even if someone removes it, the code redraws it every 30 seconds (via `setInterval`). So even if a user deletes the canvas in DevTools, it comes back 30 seconds later without a page reload. It also redraws on window resize so the tiles always cover the full area.

This isn't unbreakable security — a determined person with screen recording software can always capture what's on screen. It's a deterrent: it makes screenshots and recordings instantly traceable to the specific account that shared them.

---

### What `aspect-ratio: 16/9` means and why it's better than fixed heights on mobile

16:9 is the standard widescreen aspect ratio (16 units wide, 9 units tall). Every modern YouTube video is filmed in this ratio. If you set a fixed height like `height: 400px`, the video looks fine on a 1280px desktop but way too tall on a 375px phone — it might take up the entire visible screen before the user even reads the title.

`style={{ aspectRatio: '16/9' }}` combined with `width: 100%` means: "make the element full width, and automatically calculate the height so the ratio stays 16:9." On a 375px wide phone, the video becomes 375 × 211px. On a 1280px desktop, it becomes 672 × 378px (constrained by the `max-w-2xl` container). The height scales automatically for any screen size — no media queries, no JavaScript, no fixed numbers.

---

### What `playsinline` does on iOS

By default, when a video starts playing on iOS Safari, it immediately fullscreens — the phone takes over the entire screen and the video plays in the system video player, outside your app entirely. The user loses the watermark, the site UI, everything.

Adding `playsinline=1` to the YouTube embed URL tells iOS to play the video inside the iframe, in the page, where it belongs. The watermark stays visible, the user stays on your site, and the experience is the same as on desktop.

---

## Chunk 1 — The Foundation

### What was built

We set up the bare skeleton of the project: the framework, the tooling, and some core safety systems. No visible UI yet — this is all the invisible plumbing that every other feature will rely on.

---

### Next.js App Router — what is it and why does it matter?

Next.js is the framework this whole project is built on. It lets you write both the front-end (what users see) and the back-end (API routes, server logic) in one codebase using React and TypeScript.

The **App Router** (introduced in Next.js 13, standard in 14) is the modern way of building Next.js apps. Here's how it works:

- Every folder inside `app/` that contains a `page.tsx` file becomes a URL in your app. So `app/sessions/[id]/page.tsx` becomes the URL `/sessions/1`, `/sessions/2`, etc.
- There are two types of components: **Server Components** (run on the server, can read databases directly) and **Client Components** (run in the browser, can handle user interactions). You get Server Components by default.
- `layout.tsx` files wrap pages — so `app/layout.tsx` is the shell that surrounds every page on the site (header, fonts, etc.).

Why App Router over the old Pages Router? Because Server Components let you fetch data without writing separate API calls from the browser, which is faster and more secure.

---

### Zod — what is it and why do we use it?

Zod is a library for **validating data at runtime**. TypeScript checks your types at *build time* (while you're coding), but at *runtime* (when the app is actually running), TypeScript types disappear — they don't exist in the final JavaScript. So if an environment variable is missing or has a typo, TypeScript won't catch it; the app will just crash in a confusing way.

Zod lets you define a "schema" — a description of what data is supposed to look like — and then check real data against it while the app is running.

In `lib/env.ts`, we define schemas for all our environment variables and check them at startup. If anything is missing or wrong, the app throws an error immediately with a clear message like:

```
Missing or invalid server env vars: NEXTAUTH_SECRET, SUPABASE_URL
```

This is far better than the app crashing 10 steps later with a cryptic error because a database connection failed silently.

---

### Environment variables — why do they matter?

Environment variables are configuration values that live *outside* your code. Things like database passwords, API keys, and secret tokens should never be hardcoded in your source files (which go into Git and could be seen by others).

Instead, you put them in a `.env.local` file locally, and in your hosting provider's settings panel (Vercel, in this case) for production.

We split ours into two groups:

- **Server-only vars** (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`) — these are secrets. They must *never* appear in the browser. They are validated only on the server.
- **Public vars** (prefixed `NEXT_PUBLIC_`) — these are safe to send to the browser. Things like the chain ID or the WalletConnect project ID. Next.js automatically includes any `NEXT_PUBLIC_` var in the client-side bundle.

The `.env.local` file you have is just a placeholder — you fill in the real values before deploying.

---

### CSP headers — what are they?

CSP stands for **Content Security Policy**. It's a security feature built into browsers. You set it by adding a special HTTP header to every response your server sends.

It tells the browser: "Only trust scripts/styles/images from these specific sources. If anything else tries to load, block it."

This protects against **XSS attacks** (Cross-Site Scripting) — where a malicious script gets injected into your page and runs in the user's browser, potentially stealing session cookies or funds.

For example, our CSP includes:
- `script-src 'self'` — only run JavaScript from our own domain (loosened in dev to allow Next.js hot-reloading)
- `frame-src 'none'` — don't allow this site to be embedded in an iframe (prevents clickjacking)
- `object-src 'none'` — no Flash or plugins

We also added related headers:
- `X-Frame-Options: DENY` — older version of the iframe protection, for compatibility
- `X-Content-Type-Options: nosniff` — prevents browsers from guessing file types (a common attack vector)
- `Referrer-Policy` — controls how much URL info is sent when clicking links

---

### Pino — what is it?

Pino is a logging library. Instead of sprinkling `console.log` everywhere (which produces noisy, unstructured output), pino writes structured JSON logs that are easy to search and filter in production monitoring tools.

In our `lib/logger.ts`:
- In **development**, it logs at `debug` level — you see everything, including verbose details useful for debugging
- In **production**, it logs at `info` level — you only see important events, not debug noise

Usage throughout the codebase will look like:
```ts
import { logger } from '@/lib/logger'
logger.info({ userId: '123' }, 'User signed in')
```

---

### Jest — what is it?

Jest is a test runner. It finds files ending in `.test.ts`, runs the functions inside them, and tells you whether your code does what you expect.

We set it up with **ts-jest**, which lets Jest understand TypeScript directly without needing a separate compilation step.

Our `lib/env.test.ts` tests 9 scenarios:
- All vars present and valid → passes
- A server var is missing → throws with the var name in the error
- A public var is missing → throws with the var name in the error
- Invalid URL format → throws
- Invalid email format → throws
- Invalid Ethereum address format → throws
- Optional var missing → passes (HOTJAR_ID is optional)
- Multiple vars missing → lists all of them in one error

The rule in CLAUDE.md is: **never move to the next chunk if tests are failing.** This chunk's tests all pass.

---

### How these pieces connect

1. When the app starts, Node.js loads `lib/env.ts`. Zod validates all environment variables immediately.
2. If anything is missing, the app crashes with a clear error *before* any user request is served.
3. If everything is fine, the `env` object is exported and used everywhere else — no more `process.env.WHATEVER` scattered through the codebase.
4. Every HTTP response includes CSP and security headers from `next.config.ts` automatically.
5. Any server-side code that needs logging imports `logger` from `lib/logger.ts`.

---

*Next: Chunk 2 — Homepage UI with hero section and 3 session cards.*

---

## Chunk 2 — Homepage UI

### What was built

The visible face of the site. A navbar, a hero section, three session cards, and a footer — all static HTML and CSS. No data fetching, no APIs, no logic. Just the shell that users will land on.

---

### Tailwind config — why do colours live there and not in components?

Tailwind is a CSS utility framework. Instead of writing CSS files, you apply small class names directly in your HTML/JSX — things like `text-sm`, `px-4`, `rounded-lg`.

By default, Tailwind gives you a set of built-in colours (`gray-500`, `blue-600`, etc.). But you can extend it with your own in `tailwind.config.ts`:

```ts
colors: {
  brand: {
    bg: '#141410',
    amber: '#EF9F27',
    // ...
  }
}
```

Now you can use `bg-brand-bg` or `text-brand-amber` anywhere in the codebase. This is important because:

1. **Consistency** — the amber colour is defined once. If you want to change it, you change it in one place and every component updates automatically.
2. **No hardcoded hex values in components** — components say *what* colour something is (`brand-amber`) not *which* colour (`#EF9F27`). This separation makes redesigns easy.
3. **Readable code** — `text-brand-heading` tells you the intent; `text-[#F0E6C8]` tells you nothing.

---

### What is a reusable component?

A React component is just a function that returns HTML (JSX). A *reusable* component is one that accepts parameters (called **props**) so it can render different data each time it's used.

`SessionCard.tsx` is a good example. It accepts one `session` object and one `index` number. When the homepage renders three session cards, it calls the same component three times with different data:

```tsx
{SESSIONS.map((session, index) => (
  <SessionCard key={session.id} session={session} index={index} />
))}
```

The `SessionCard` component decides internally whether to render a free card (green, "Watch now") or a paid card (amber, lock icon, "Connect wallet to pay") based on `session.isFree`. The homepage doesn't need to know any of this — it just passes data down.

**Why this matters:** if you want to change how a session card looks, you change one file (`SessionCard.tsx`), not three places across the codebase.

---

### What does constants/sessions.ts do and why does it exist?

This file is the single source of truth for session data: titles, prices, USDC amounts, Twitter URLs.

The rule in CLAUDE.md is: **never hardcode session data in components**. Why? Because data scattered across multiple files is a maintenance nightmare. If session 2's price changes from $50 to $75, you'd have to hunt through every file that mentions "$50". With `constants/sessions.ts`, you change it in one place.

The `as const` at the end of the array is a TypeScript trick that makes the data deeply read-only. This means TypeScript knows the exact literal values (e.g. `price` is exactly `0 | 50 | 100`, not just `number`), which allows stricter type checking.

---

### What does app/page.tsx do in the App Router?

In Next.js App Router, any file named `page.tsx` inside the `app/` folder becomes a route. `app/page.tsx` is the root route — i.e. the homepage at `/`.

The page component is a Server Component by default. That means it runs on the server, not in the browser. No JavaScript for this component is shipped to the user's device — the server renders it to HTML and sends that HTML down. This makes the page fast to load.

Pages are layout-only — they import components and arrange them. Business logic, data fetching, and API calls happen elsewhere (in `lib/` or API routes).

---

### How these pieces connect

1. User visits `/` → Next.js runs `app/page.tsx` on the server
2. `page.tsx` imports `SESSIONS` from `constants/sessions.ts` and maps over them
3. For each session, it renders a `<SessionCard>` component with the session data
4. `SessionCard` checks `session.isFree` and renders the appropriate UI
5. All colours come from `tailwind.config.ts` brand tokens — no hex values in JSX
6. `app/layout.tsx` wraps everything with the dark background and font classes
7. `globals.css` is stripped down to just the Tailwind directives — no conflicting styles

---

*Next: Chunk 3 — Sign-up form and Brevo email integration.*

---

## Chunk 3 — OTP auth flow (rebuilt)

### What was built

The complete authentication system from scratch, replacing the old sign-up form and NextAuth magic links. Users now sign in with a 6-digit one-time code sent to their email. New users also enter their name in a third step. Route protection and the owner dashboard check are wired in.

---

### What is OTP auth and why is it better than magic links for mobile users?

OTP stands for **One-Time Password**. Instead of clicking a link in an email, the user:

1. Enters their email
2. Receives a 6-digit code (e.g. `837 291`)
3. Types the code into the app

**Why this beats magic links on mobile:**

Magic links require you to open a different app (your email client), find the email, tap the link, get redirected — and if your email app opens the link in its own in-app browser (which most do), you're now in a different browser context than the one you started in. This breaks the session cookie flow.

OTPs sidestep this entirely: you read the code in your email app, switch back to the browser, type it in. One browser, one session, no redirects across apps. This is why SMS-based auth (another OTP delivery mechanism) has become dominant on mobile — same UX pattern, just via email here.

---

### How the 3-step flow works behind the scenes

The `/login` page has three steps managed by a **state machine** — a variable called `step` that can be `'email'`, `'otp'`, or `'name'`.

**Step 1 — Email**

The user types their email and clicks "Send OTP".

What happens on the server (`POST /api/auth/send-otp`):
1. Validate the email with Zod
2. Delete old expired/used OTP rows for this email (cleanup)
3. Rate limit check: if 3+ OTP rows created for this email in the last 15 minutes, return 429
4. Generate a 6-digit random code (`Math.random()` zero-padded to 6 digits)
5. Store the code in the `otp_codes` table with a 10-minute expiry
6. Send the code via Brevo

**Step 2 — OTP verification**

The user types the 6-digit code and clicks "Verify".

What happens on the server (`POST /api/auth/verify-otp`):
1. Validate: email must be valid format, code must be exactly 6 digits
2. Look up the most recent OTP row for this email
3. Check: not already used, not expired, attempts < 3
4. Increment the `attempts` counter (prevents brute force)
5. If the code matches: mark as used
6. Check if this email exists in the `users` table
   - **New user** → return `{ verified: true, isNewUser: true }` (no session yet)
   - **Existing user** → look up their role, create session cookie, return `{ verified: true, isNewUser: false }`

**Step 3 — Name (new users only)**

The user types their name and clicks "Continue".

What happens on the server (`POST /api/auth/complete-signup`):
1. Validate: email must be valid, name must be at least 2 characters
2. Double-check the email doesn't already exist (guard against double-submission)
3. Insert user into `users` table
4. Add contact to Brevo list
5. Send welcome email
6. Create session cookie, return `{ success: true }`

After step 2 (existing user) or step 3 (new user), the browser is redirected to the homepage with a session cookie set.

---

### What is a session cookie and why do we sign it?

A cookie is a small piece of data the server tells the browser to store and send back on every subsequent request. Think of it as a wristband at an event: the venue gives it to you once and you show it every time you come back in.

Our session cookie stores:
```
{ email, userId, role, exp }
```

`exp` is an expiry timestamp — the session is valid for 30 days, then the user must sign in again.

**Why do we sign it?** Because cookies can be modified by the user. If the cookie just stored `{ role: "user" }`, a malicious user could change it to `{ role: "owner" }` in their browser's DevTools and suddenly have admin access.

Signing the cookie with `SESSION_SECRET` prevents this. We use **HMAC-SHA256** (a cryptographic algorithm): the server computes a fingerprint of the cookie's content using the secret key, and appends it to the cookie. When the server reads the cookie later, it recomputes the fingerprint and checks it matches. If someone modifies the cookie's content, the fingerprint no longer matches and the session is rejected.

The signed token format is: `{base64url(payload)}.{base64url(hmac_signature)}`

We use the **Web Crypto API** (`crypto.subtle`) — built into both Node.js 18+ and the browser — so no external libraries are needed for signing. This also means the session code works in Next.js middleware (which runs in the Edge Runtime) without any modifications.

**`httpOnly` cookie**: the `HttpOnly` flag tells the browser "do not let JavaScript read this cookie". Even if an attacker somehow injects malicious JavaScript into the page (XSS attack), they cannot steal the session cookie. It's invisible to `document.cookie`.

---

### What is rate limiting and why does OTP need it especially?

Rate limiting means: "only allow X requests per time window, then block". We block an email address if 3 OTPs are sent within 15 minutes, returning a `429 Too Many Requests`.

OTP needs this more than most flows because:

1. **Cost amplification.** Each OTP request sends a real email. If there's no limit, an attacker could trigger thousands of emails from our Brevo account, exhausting our email quota and potentially costing money.

2. **User harassment.** Without a limit, anyone could spam another person's inbox with OTP codes.

3. **Brute force prevention.** Even with per-code attempt limits (3 tries per code), an attacker could request infinite new codes and try again. Rate limiting the send step closes this loop.

We also limit per-code attempts: after 3 wrong guesses, the code is permanently blocked. This prevents brute-forcing the 6-digit space (1 in 1,000,000 per guess, but attempts add up fast without this guard).

---

### What is Supabase and why two clients?

Supabase is a hosted PostgreSQL database with a REST API and built-in security rules called **RLS** (Row Level Security). Think of it as a database that lives in the cloud.

We have two clients because they need different levels of trust:

- **`lib/supabase/client.ts`** — uses the **anon (public) key**. Safe to include in browser code. Subject to RLS — users can only see their own rows.
- **`lib/supabase/server.ts`** — uses the **service role key**. Bypasses RLS entirely. Can read/write any row. **Never imported in browser code.** Only used in API routes.

All the OTP and user creation code uses the server client. The browser never writes to the database directly.

---

### What is Brevo?

Brevo (formerly Sendinblue) is a transactional email and marketing platform. We use it to:

1. Send OTP codes — a plain text email with the 6-digit code and a 10-minute expiry notice
2. Add new users to a mailing list — so we can send newsletters later
3. Send a welcome email after signup

We call Brevo's REST API directly using `fetch`. No special SDK is installed — just HTTP requests with our API key in the header.

---

### How middleware protects routes

Middleware is code that runs before a request reaches any page. It's the first thing that runs on every request matching our patterns.

Our `middleware.ts`:
1. Reads the session cookie from the request headers
2. Verifies the HMAC signature using `SESSION_SECRET`
3. Checks the expiry timestamp
4. If no valid session → redirect to `/login`
5. If valid session but not owner and trying to access `/admin/*` → redirect to `/`

The role is embedded in the session token (looked up once at sign-in from `user_roles` table), so the middleware makes its decision **without any database call** on every request. Fast and cheap.

---

### How these pieces connect

```
Step 1 — Email
User types email → EmailStep.tsx (client)
    ↓  POST /api/auth/send-otp
    ↓  cleanupExpiredOtps(email)
    ↓  rate limit check (otp_codes table, last 15 min)
    ↓  generateOtp() → "837291"
    ↓  storeOtp(email, code) → insert into otp_codes, expires in 10 min
    ↓  sendOtpEmail(email, code) → Brevo SMTP
    ↓  return { success: true }
LoginPage state: 'email' → 'otp'

Step 2 — OTP
User types "837291" → OtpStep.tsx (client)
    ↓  POST /api/auth/verify-otp
    ↓  verifyOtp(email, code) — checks otp_codes table
    ↓  if valid: check users table for email
    ↓  NEW USER: return { verified: true, isNewUser: true }
    ↓  EXISTING USER: createSession() → signed cookie → return { verified: true, isNewUser: false }
New user: state 'otp' → 'name'
Existing user: router.push('/') — logged in

Step 3 — Name (new users only)
User types "Satoshi" → NameStep.tsx (client)
    ↓  POST /api/auth/complete-signup
    ↓  insert into users table
    ↓  addContact(name, email) → Brevo contacts list
    ↓  sendWelcomeEmail(name, email) → Brevo SMTP
    ↓  createSession() → signed cookie → return { success: true }
router.push('/') — logged in

Every subsequent request to /sessions/* or /admin/*:
middleware.ts reads cookie → verifies HMAC → checks exp + role → allows or redirects
```

---

### What about the tests?

36 tests, 6 suites, all passing.

**`lib/auth/otp.test.ts`** — tests `generateOtp` (6-digit numeric, zero-padded) and `verifyOtp` for all 7 scenarios: valid code, already used, expired, too many attempts, wrong code, wrong code hitting the attempt limit. Supabase is mocked with fake return values.

**`app/api/auth/send-otp/route.test.ts`** — 4 tests: valid email returns 200, invalid email returns 400, missing email returns 400, rate-limited email returns 429.

**`app/api/auth/verify-otp/route.test.ts`** — 5 tests: new user flow, existing user flow (checks Set-Cookie header), invalid code, missing fields, non-numeric code.

**`app/api/auth/complete-signup/route.test.ts`** — 4 tests: happy path (creates user, calls Brevo, sets cookie), duplicate email returns 400, missing name returns 400, single-character name returns 400.

---

*Next: Chunk 5 — Wallet connect (wagmi + RainbowKit).*

---

## Chunk 5 — Wallet connect (wagmi + RainbowKit)

### What was built

Everything needed to connect a crypto wallet to the app. Users can now click "Connect Wallet", choose their wallet (MetaMask, Coinbase Wallet, WalletConnect, etc.), and the app knows their wallet address. The session cards for paid content now show the wallet connection state and a "Pay" button appears once connected.

---

### What is a crypto wallet and what is a wallet address?

A crypto wallet is software that manages your private key — a secret number that gives you ownership over funds on a blockchain. Popular wallets include MetaMask (a browser extension), Coinbase Wallet (a mobile app), and hardware wallets like Ledger.

A **wallet address** is a public identifier derived from your private key — think of it like your IBAN or bank account number, but for a blockchain. It looks like:
```
0xABCDEF1234567890abcdef1234567890ABCDEF12
```
It's 42 characters: `0x` followed by 40 hex characters. Your address is public — anyone can see how much money it holds or send funds to it. Only you can spend from it (because only you have the private key).

When our app "connects" to your wallet, it receives your wallet address. It does NOT get your private key — you remain in full control of your funds at all times. To spend anything, the wallet asks you to explicitly sign/approve the transaction.

---

### What is Base mainnet and why are we using it?

Base is a blockchain network created by Coinbase. It's an Ethereum **Layer 2** (L2) network, which means:

1. Transactions are processed on Base's own infrastructure (fast, cheap)
2. Periodically, Base batches its transactions and posts them to Ethereum for security (inheriting Ethereum's trust)

**Why Base instead of Ethereum mainnet?**
- Transactions on Ethereum mainnet cost $5–$50+ in gas fees
- On Base, the same transaction costs cents
- Coinbase users can move funds to Base easily from their Coinbase account

**Chain ID 8453** is Base's unique identifier. Every blockchain network has one — it prevents you from accidentally sending a transaction meant for Ethereum to Base, or vice versa.

---

### What is wagmi?

wagmi (pronounced like "we're all gonna make it", a crypto phrase) is a React library that makes it easy to interact with Ethereum-compatible blockchains from a web app. Without it, you'd have to write raw JSON-RPC calls and manage wallet state yourself — dozens of edge cases and hundreds of lines of boilerplate.

wagmi gives you React hooks like:
- `useAccount()` — is a wallet connected? What's the address?
- `useBalance()` — what's the token balance?
- `useWriteContract()` — send a transaction
- `useWaitForTransactionReceipt()` — wait for a tx to be confirmed

It runs in the browser because it needs to communicate with the user's wallet (which is in their browser or on their phone). This is why the config in `lib/web3/config.ts` becomes part of the client-side bundle.

---

### What is RainbowKit?

RainbowKit is a UI library built on top of wagmi. It handles the visual part of wallet connection — the modal that opens when you click "Connect Wallet", the list of supported wallets, the connection status, and the disconnect flow.

Without RainbowKit, you'd need to build all of this yourself:
- Detect which wallets the user has installed
- Show a modal with wallet options
- Handle each wallet's connection protocol differently
- Show the right address format and avatar
- Handle switching networks, disconnecting, errors

RainbowKit does all of this. You just render `<ConnectButton />` and it works. This saves weeks of work and handles dozens of edge cases you'd never think of until they bite you in production.

---

### What is an ABI?

ABI stands for **Application Binary Interface**. On a blockchain, smart contracts are compiled to bytecode — raw machine instructions the blockchain can execute. The ABI is a JSON description of the contract's public functions: what they're called, what parameters they take, what they return.

Your JavaScript code can't call a smart contract directly. Instead, libraries like viem (which wagmi uses internally) take the ABI + function name + parameters, encode them into the correct byte format, and send that to the blockchain.

For USDC, we only need the `transfer` function:
```ts
{
  name: 'transfer',
  inputs: [
    { name: 'to', type: 'address' },    // recipient
    { name: 'amount', type: 'uint256' }, // amount in atomic units (6 decimals)
  ],
}
```

The `amount` is in atomic units, not dollars. USDC has 6 decimal places, so $50 USDC = `50_000_000` (50 followed by 6 zeros). The `priceUSDC` field in `constants/sessions.ts` is already in this format.

---

### Why do providers need their own Client Component?

`app/layout.tsx` is a Server Component — it runs on the server and produces HTML. Server Components cannot use React context (which is a browser concept: a shared piece of state that all child components can subscribe to).

wagmi, react-query, and RainbowKit all use React context under the hood. They need to wrap the app in `<WagmiProvider>`, `<QueryClientProvider>`, and `<RainbowKitProvider>` — each of which is a context provider.

So we create `components/layout/Providers.tsx` with `'use client'` at the top. This file is the **client boundary**: everything inside it runs in the browser. The server renders a shell, and the browser takes over from this component downward.

The order matters:
```tsx
<WagmiProvider config={wagmiConfig}>        // must be outermost
  <QueryClientProvider client={queryClient}> // needed by wagmi for data fetching
    <RainbowKitProvider theme={...}>         // uses wagmi hooks internally
      {children}
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

wagmi uses react-query internally to cache RPC responses. RainbowKit uses wagmi hooks. So the nesting order follows the dependency chain.

---

### What is the Alchemy RPC URL and why is it public?

RPC (Remote Procedure Call) is how your browser communicates with the blockchain. Instead of running a full blockchain node yourself (which takes hundreds of GB of storage), you use a service like Alchemy that runs nodes and exposes an HTTPS endpoint.

The Alchemy URL looks like:
```
https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

Since wagmi runs in the browser, this URL goes into the client bundle as `NEXT_PUBLIC_ALCHEMY_RPC_URL`. Your API key is technically visible in the browser's network tab or by inspecting the bundle — but this is normal practice for frontend apps. Alchemy lets you restrict the key to specific domains (e.g. only allow requests from `defilords.com`), which prevents abuse.

The server-side `ALCHEMY_RPC_URL` (without `NEXT_PUBLIC_`) is kept for chunk 6 — that's where we verify payment transactions on the server, and that's where you don't want the key exposed.

---

### Why `ssr: true` in the wagmi config?

Next.js renders pages on the server first (SSR) and then the browser "hydrates" them into interactive React. If the wallet connection state on the server is different from the browser (which it always is — servers don't have wallets), React throws a hydration error.

`ssr: true` tells wagmi to be aware of this: generate a consistent initial state for the server render so the browser's first render matches, then update once the browser has checked for a connected wallet.

---

### How these pieces connect

```
User visits the homepage:
  app/layout.tsx (Server Component)
    → renders <Providers> (client boundary)
      → <WagmiProvider> stores wallet config
        → <QueryClientProvider> caches RPC responses
          → <RainbowKitProvider> dark theme with amber accent
            → page content renders

User sees Session 2 card (paid):
  SessionCard.tsx (Client Component)
    → useAccount() returns { isConnected: false }
    → renders WalletStatus: "Connect wallet to pay"
    → renders WalletButton → <ConnectButton /> from RainbowKit

User clicks "Connect Wallet":
  RainbowKit shows wallet selection modal
  User picks MetaMask, approves connection
  useAccount() now returns { isConnected: true, address: '0x...' }
  SessionCard re-renders:
    → WalletStatus: shows "0xABCD...EF12" in amber
    → Shows "Pay $50 USDC" button (does nothing yet — chunk 6)
```

---

### What about the tests?

49 tests, 10 suites, all passing.

**`lib/web3/contracts.test.ts`** — 3 tests: verifies the USDC address matches the known Base mainnet address, the ABI contains a `transfer` function, and the function's inputs have the right names and Solidity types.

**`components/wallet/WalletButton.test.tsx`** — 3 tests: wagmi's `useAccount` and RainbowKit's `ConnectButton` are mocked. Tests verify: not-connected state shows the ConnectButton, connected state shows the shortened address (`0xABCD...EF12`), and the Disconnect button is present when connected.

A note on test setup: the existing `tsconfig.json` uses `"jsx": "preserve"` (required by Next.js), which tells TypeScript to leave JSX as-is for the framework to process. But ts-jest (our test runner) needs `"jsx": "react-jsx"` to transform JSX itself. Rather than change the global tsconfig (which would break the Next.js build), we override it inside `jest.config.ts` for the test transform only.

---

*Next: Chunk 6 — USDC payment flow + server-side tx verification.*

---

## Chunk 4 — Route protection, admin layout, sign-out, useAuth hook

### What was built

The security layer that decides who can go where. Middleware that runs before every request, a server-side owner check in the admin layout, a sign-out endpoint, and a client-side hook for components that need to know if you're logged in.

---

### What is middleware and how does it run before every request?

In a normal web server, a request comes in, hits your handler, and you respond. **Middleware** sits in between: it intercepts every request before it reaches your page or API route and can inspect it, modify it, or redirect it before anything else runs.

In Next.js, `middleware.ts` at the root of the project is a special file. Next.js runs it automatically on every request that matches the `config.matcher` pattern. Our matcher is:

```ts
matcher: ['/sessions/:path*', '/admin/:path*']
```

This means middleware only runs for paths starting with `/sessions/` or `/admin/`. Requests to the homepage, login page, or API routes are not intercepted — they're public.

The middleware runs in the **Edge Runtime** — a lightweight JavaScript environment that runs close to the user (in a CDN edge node), not on a full Node.js server. This is why our session code uses the Web Crypto API (`crypto.subtle`) instead of Node's `crypto` module: the Edge Runtime doesn't have Node built-ins.

**What happens on a protected request:**

1. Next.js intercepts the request before any page code runs
2. `middleware.ts` reads the `defilords_session` cookie from the request headers
3. It calls `getSession(req)` which verifies the HMAC signature and checks the expiry
4. If invalid or missing: redirect to `/login?callbackUrl=...` (the original URL is preserved so the user can be sent back after signing in)
5. If valid but trying to access `/admin/*` with `role !== 'owner'`: redirect silently to `/`
6. If valid and authorised: `return NextResponse.next()` — the request continues normally

The redirect happens *before* any React component renders. The user's browser never receives the protected page HTML.

---

### What does "route protection" mean in practice?

Route protection means making it impossible for unauthorised users to access certain pages — not just hiding the link in the UI, but preventing the server from even sending the page's content.

**Hiding a link in the navbar is not security.** A user could type `/sessions/2` directly into the address bar, or use a browser extension, or simply look at the page source. If you only "hide" things in the UI, a determined user can still reach the page.

**Real protection happens server-side**, before the page is rendered. That's what middleware does.

We have three layers:

1. **UI layer** — the Navbar only shows "Dashboard" link to owners. This is for convenience, not security.
2. **Middleware** — every request to `/sessions/*` and `/admin/*` is checked before the page renders. This is the primary defence.
3. **Admin layout** — `app/(admin)/admin/layout.tsx` does a second server-side check. Even if middleware had a bug or was misconfigured, the layout would still block non-owners.

Multiple layers of defence is called **defence in depth** — a security principle borrowed from military strategy. If one layer fails, another catches it.

---

### What is the difference between authentication and authorisation?

These words are often confused but they mean different things:

- **Authentication** = proving who you are. "I am user@example.com and I have the OTP to prove it."
- **Authorisation** = deciding what you're allowed to do. "You are authenticated as user@example.com. Are you allowed to access `/admin`? No — you don't have the owner role."

Our OTP flow (chunk 3) handles **authentication** — verifying identity, creating the session.

This chunk handles **authorisation** — checking the role embedded in the session and deciding which routes are accessible.

---

### How does the admin layout work and why is it needed?

`app/(admin)/admin/layout.tsx` is a **Server Component** that wraps every page under `/admin/*`.

It does the exact same check as middleware — reads the session cookie, verifies it, checks the role — but at the React tree level. It redirects to `/` before rendering any children.

Why have both middleware *and* the layout check?

- **Middleware is faster** — it runs at the edge before any React code. In the normal case, non-owners are rejected here.
- **Layout is a safety net** — if middleware is ever misconfigured (e.g. the matcher is edited by accident), the layout still blocks access. No admin page can accidentally render for a non-owner.

The layout calls Next.js's `redirect('/')` function, which is a server-side redirect. The browser receives a 307 response and is sent to the homepage before any admin HTML is transmitted.

---

### How does sign-out work?

The sign-out endpoint (`POST /api/auth/sign-out`) clears the session cookie by setting it with `Max-Age=0`:

```
Set-Cookie: defilords_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax
```

`Max-Age=0` tells the browser: "this cookie expires immediately — delete it". The browser discards the cookie and the next request to any page will have no session.

The `SignOutButton` component (a Client Component in the Navbar) calls this endpoint and then redirects to `/`. From the user's perspective: click sign out → redirected to homepage → logged out.

---

### What is useAuth.ts and why does it need an API endpoint?

`useAuth` is a **client-side React hook** that gives client components access to the current user's session state — whether they're logged in, their email, and whether they're an owner.

The challenge: the session cookie is marked `HttpOnly`. This means JavaScript in the browser **cannot read it** via `document.cookie`. This is a security feature — if a malicious script gets injected into the page, it can't steal the session.

So how does a client component know who is logged in? It asks the server. The hook calls `GET /api/auth/me`, a server endpoint that reads the cookie (servers *can* read HttpOnly cookies — only browser JavaScript can't), verifies it, and returns the session data as JSON.

```ts
// hooks/useAuth.ts — simplified
useEffect(() => {
  fetch('/api/auth/me')
    .then(res => res.json())
    .then(data => setState({ user: data.user, isOwner: data.isOwner, isLoading: false }))
}, [])
```

The `isLoading: true` initial state is important — before the fetch completes, the component doesn't know the auth state yet. Client components that depend on `useAuth` should show a loading state while `isLoading` is true, rather than flashing as "logged out" for a moment before the data arrives.

**Note:** The Navbar doesn't use `useAuth` — it's a **Server Component** and reads the session directly via `getSession()`. `useAuth` is for client components that need this information (e.g. a wallet connection component that should only show for logged-in users).

---

### How these pieces connect

```
Request to /sessions/1 or /admin:
  → middleware.ts runs FIRST (Edge Runtime)
  → reads defilords_session cookie
  → getSession() verifies HMAC signature
  → no session? → redirect /login?callbackUrl=...
  → non-owner on /admin? → redirect /
  → valid? → NextResponse.next() → page renders

Request to /admin (valid owner):
  → middleware passes
  → Next.js renders app/(admin)/admin/layout.tsx (Server Component)
  → layout reads cookie, verifies session again (defence in depth)
  → role !== 'owner'? → redirect('/')
  → owner? → renders children (the admin page)

Sign out:
  → SignOutButton onClick → POST /api/auth/sign-out
  → server sets Set-Cookie: defilords_session=; Max-Age=0
  → browser deletes cookie
  → client redirects to /

Client component needing auth state:
  → useAuth() hook mounts
  → fetch('/api/auth/me') → server reads HttpOnly cookie
  → returns { user: { email, userId }, isOwner }
  → hook sets state, isLoading: false
  → component re-renders with auth data
```

---

### What about the tests?

43 tests, 8 suites, all passing.

**`middleware.test.ts`** — 5 tests cover the four main cases: unauthenticated request to `/sessions/1` redirects to `/login`, unauthenticated request to `/admin` redirects to `/login`, authenticated non-owner to `/admin` redirects to `/`, authenticated owner to `/admin` passes through, and public routes (like `/`) always pass through without calling `getSession` at all. `getSession` is mocked so the test doesn't need a real `SESSION_SECRET` or real crypto operations.

**`app/api/auth/sign-out/route.test.ts`** — 2 tests: POST returns 200 with `{ success: true }`, and the `Set-Cookie` header contains `Max-Age=0` to confirm the cookie is cleared.

---

*Next: Chunk 5 — Wallet connect (wagmi + RainbowKit).*

---

## Chunk 6 — USDC payment flow + server-side verification

### What was built

In this chunk users can actually pay. They click "Pay $50 USDC", approve a transaction in their wallet, and the server verifies the payment happened on-chain before unlocking the session.

Five main things were built:
1. A route to save the wallet address to the database
2. A function that reads the blockchain to check if a payment really happened
3. A route that receives a transaction hash from the client and verifies it server-side
4. A hook that manages the full payment flow step by step
5. Session card UI that shows the right button depending on whether you are logged in and have a wallet connected

---

### What is a transaction hash?

When you send money on a blockchain, the network gives you a receipt. That receipt is identified by a **transaction hash** — a unique 64-character hex string like `0xabc123...`. You can look up any transaction by its hash on a block explorer like Basescan.

Think of it like a cheque number. Once the cheque clears, you can look it up and see exactly who sent money to whom, how much, and whether it went through.

---

### What does on-chain verification mean and why is it done server-side?

When a user pays, their browser sends the transaction hash to our server. The server then asks the blockchain directly: "Did this transaction actually happen? Was it to the right address? Was it the right amount?"

This is called **on-chain verification** — we are checking the public blockchain ledger, not just trusting the client.

Why server-side? Because the client could lie. A malicious user could make up a fake transaction hash, or use a real hash from a different transaction for a different amount. The server checks the actual blockchain data using Alchemy (a service that gives us a reliable connection to the Base network) via a library called **viem**.

If we only trusted the client's word, anyone could unlock sessions for free.

---

### What does a USDC transfer look like on the blockchain?

USDC is an ERC-20 token — a smart contract on the blockchain that keeps a ledger of who owns how much. When you "send" USDC, you are not moving actual coins — you are calling a function on the USDC smart contract called `transfer(address to, uint256 amount)` that tells the contract to subtract from your balance and add to the recipient's balance.

Every call to `transfer` emits an **event** called `Transfer(from, to, value)`. This event is recorded permanently in the transaction's logs.

To verify a payment, we:
1. Fetch the transaction receipt (was it successful?)
2. Check that the transaction was sent *to* the USDC contract (not some random address)
3. Find the `Transfer` log in the receipt
4. Decode the `to` address and `value` from the log and check they match what we expect

---

### Why do we check amount AND recipient AND status?

Each check catches a different attack:

- **Status check** — rejects transactions that were sent but failed (e.g. the user ran out of gas)
- **Contract check** — rejects transactions sent to a random address instead of USDC
- **Recipient check** — rejects transfers to the wrong wallet (e.g. someone paying themselves)
- **Amount check** — rejects transfers for the wrong amount (e.g. $1 instead of $50)

All four must pass. Failing any one of them means the payment cannot unlock the session.

---

### What is a replay attack and how does txHash uniqueness prevent it?

A **replay attack** is when someone submits the same valid transaction proof twice to get the benefit twice. Imagine you paid $50 once and then tried to call our verify endpoint 100 times with the same transaction hash — you would get 100 session unlocks for the price of one.

We prevent this by storing the `tx_hash` in the `session_access` table with a **unique constraint**. Before verifying a transaction on-chain, we check if that hash already exists in our database. If it does, we reject it immediately with "Payment already processed". One transaction hash = one session unlock, forever.

---

### How the payment state machine works

The `useWalletPayment` hook walks through these states in order:

```
idle → saving-wallet → sending-payment → confirming → verifying → success
                                                                 ↘ error (at any step)
```

- **saving-wallet** — calls `POST /api/wallet/save` to record the wallet address in the database before attempting any on-chain action
- **sending-payment** — calls wagmi's `writeContractAsync` which opens the wallet (e.g. MetaMask) and asks the user to approve the transaction. Returns the tx hash once the user approves.
- **confirming** — waits for the transaction to be included in a block and confirmed on-chain. This can take 1–30 seconds.
- **verifying** — sends the tx hash to `POST /api/payment/verify`. The server checks the blockchain and inserts the access row if everything is valid.
- **success** — redirects to the session page

The UI in `SessionCard` shows a different label for each state so the user always knows what is happening.

---

### What is viem?

**viem** is a TypeScript library for interacting with Ethereum-compatible blockchains. Think of it like a well-typed fetch client, but for reading from and writing to the blockchain instead of HTTP APIs.

In this chunk we use three viem features:
- `createPublicClient` — creates a read-only connection to Base Sepolia via Alchemy
- `getTransactionReceipt` — fetches the full receipt for a given transaction hash
- `decodeEventLog` — decodes raw log data from the receipt into typed JavaScript objects (so we can read the `to` address and `value` from the Transfer event)

---

### What are the tests checking?

**`lib/web3/verify.test.ts`** — 7 tests. `createPublicClient` from viem is mocked so no real network calls are made. Tests build fake receipts and logs with specific properties (wrong recipient, wrong amount, reverted status) and confirm `verifyUsdcPayment` returns the correct `{ valid, reason }` response for each case.

**`app/api/payment/verify/route.test.ts`** — 5 tests. `getSession`, `createServerSupabaseClient`, and `verifyUsdcPayment` are all mocked. Tests confirm: unauthenticated request gets 401, invalid input gets 400, duplicate tx hash gets 400 with the right error message, and a valid payment returns 200 and writes the correct row to `session_access`.

**`app/api/wallet/save/route.test.ts`** — 4 tests. Confirms unauthenticated gets 401, invalid address gets 400, a new wallet is inserted and returns 200, and a duplicate wallet silently returns 200 without inserting again.

68 tests total, all passing.

---

*Next: Chunk 7 — Session access control: DB gating, middleware + session pages.*

---

## Post-chunk 6 fixes — session page, already-paid state, webpack warnings

### What was built

Three small things that needed fixing after the payment flow went live.

**1. Session page placeholder**

After a successful payment, the app redirects to `/sessions/2` or `/sessions/3`. But that page file was empty — Next.js threw a runtime error because there was no default export. A placeholder page was added so the redirect lands somewhere sensible. Full content comes in chunk 8.

**2. Already-paid state**

Without this, a user who already paid would see the pay button again every time they visited the homepage. That's confusing and could cause them to accidentally pay twice.

Now when the session cards load, each paid card immediately checks the database: "does this user already have access to this session?" If yes, the pay button is replaced with a green "✓ You have access" indicator and an amber "View Session →" link. If not, the normal pay flow shows.

The check goes through a new API route (`GET /api/session/access?sessionId=2`) and a new hook (`useSessionAccess`). The hook runs once on mount and returns `{ hasAccess, isLoading }`. While loading, a grey animated skeleton replaces the button so the card doesn't jump around.

**3. Webpack warnings silenced**

wagmi and RainbowKit depend on packages (`pino-pretty`, `@react-native-async-storage/async-storage`) that are not available in a browser/Next.js environment. They show up as webpack warnings at build time. Adding them to `config.externals` in `next.config.mjs` tells webpack "don't try to bundle these — they won't be used" and the warnings go away.

### What is a webpack external?

Webpack normally tries to bundle every imported module into your JavaScript output. An **external** tells webpack: "skip this one — it either isn't available in this environment or we don't need it". It's a common fix for packages that are designed for a different runtime (like React Native or a terminal environment) but get pulled in as transitive dependencies of other packages you're using.

---

## Bug-fix round — login broke, slow loading, and stale access

This wasn't a planned chunk — it's a set of fixes after real-world testing turned up three separate problems. Each one teaches something useful about how the web app actually works under the hood.

### Problem 1 — "I type my email and the page just refreshes"

**Symptom:** entering an email and hitting *Send OTP* reloaded the page and wiped the field. No wallet "Connect" button appeared anywhere either.

**The cause — a broken build, which killed all the browser JavaScript.** The previous attempt to silence those webpack warnings (the externals trick above) was done the wrong way for this version of Next.js. Instead of `config.externals.push(...)`, it needed a different approach — the old code made webpack generate invalid JavaScript (`module.exports = @react-native-async-storage/async-storage`), and that **broke compilation entirely.**

Here's the chain of dominoes, and the key concept inside it — **hydration**:

- A Next.js page is first rendered to plain HTML on the server and sent to the browser. That's why you see content instantly.
- Then the browser downloads the React JavaScript and "wakes up" that HTML — attaching click handlers, form handlers, state, etc. This waking-up step is called **hydration**.
- Until hydration happens, the page is just a static document. A `<form>` with no live JavaScript falls back to its **native HTML behaviour**: submitting it reloads the whole page (and clears the inputs).

So when the build broke, no JavaScript loaded → no hydration → the login form behaved like a plain 1995 HTML form (reload + wipe), and the wallet button (which only exists once React runs) never showed. **The "refresh" was the symptom; dead JavaScript was the disease.**

**The fix:** silence the warnings a safe way instead — `config.resolve.alias` pointing those two optional packages at `false` (an empty module). Warnings gone, build healthy, JavaScript loads, hydration works, login works.

**Takeaway:** if a form mysteriously reloads the page instead of doing its JavaScript thing, suspect that the client-side JavaScript crashed or never loaded. Check the build first.

### Problem 2 — checking "do I have access?" was slow

**The cause — too many network requests.** The homepage shows 3 session cards. Each card was independently asking the server two questions: "who am I logged in as?" (`/api/auth/me`) and "do I have access to this session?" (`/api/session/access`). 3 cards × 2 questions = **6 separate round trips** to the server on every single page load, each one re-checking your login cookie and hitting the database.

**The fix — ask once, share the answer.** We introduced a **React Context** called `AuthProvider`.

> **What's a React Context?** Normally data flows down from parent to child component one level at a time ("prop drilling"). A Context is like a shared bulletin board: one component posts the data once, and *any* component anywhere below it can read it directly — no passing it hand-to-hand. Perfect for things many components need, like "who is logged in."

Now the login state (including the list of sessions you've paid for) is fetched **one time** and every card reads it from the shared context. **6 requests became 1.**

### Problem 3 — payment verification took a while

Two small wins:

1. **Smarter waiting for the blockchain.** After you send a USDC payment, the server has to wait for the transaction to be "mined" (confirmed on Base). The old code checked every 3 seconds in a fixed loop. We swapped it for viem's `waitForTransactionReceipt`, which checks every ~1 second and returns *the instant* the transaction lands. On Base (≈2-second blocks) that shaves off several seconds of dead waiting.
2. **One fewer database lookup.** The verify step was looking up your user record by email to get your ID — but your ID is already stored inside your login cookie. We just read it from there. One less round trip to the database.

### Problem 4 — signed out, but it still said "You have access"

This is the subtle one, and it was a side effect of the Context fix above.

**The cause — the shared data was fetched once and never refreshed.** The `AuthProvider` asked "who am I?" a single time when the app first loaded, and then held onto that answer. So if you signed out, or logged in as a *different* email, the bulletin board still showed the *old* answer. Only a full hard-refresh (which restarts the whole app) corrected it.

**The fix — render the auth state on the server, and re-sync on every navigation.** Two ideas working together:

- **Server-side rendering of auth.** The root `layout.tsx` now reads your login cookie and your access list **on the server**, before the page is even sent. So the very first HTML the browser receives already knows the correct answer — no "loading…" flash, no late correction.

  > **Server Component vs Client Component, again:** the layout is a *Server Component*, so it can read cookies and query the database directly and safely. It hands the result down to the *Client Component* (`AuthProvider`) as a normal prop.

- **Re-syncing.** When you sign out or log in, those screens call `router.refresh()`. That tells Next.js to re-run the server parts of the page — which re-reads the cookie and produces a fresh answer. The `AuthProvider` now watches for that fresh answer arriving and updates itself. So stale "you have access" can't linger anymore.

### Bonus — access is now truly tied to your email, safely

Emails are case-insensitive in real life (`Bob@gmail.com` and `bob@gmail.com` are the same inbox), but a database treats them as different text. If you signed up as `bob@...` and later logged in as `Bob@...`, the app would think you were a brand-new person — new account, no access.

**The fix:** every place that handles an email (`send-otp`, `verify-otp`, `complete-signup`) now `trim()`s spaces and `toLowerCase()`s it first. One person = one account = one consistent access record, no matter how they type their email.

### A note on what "I have to pay again" really meant

During testing it looked like access was lost. It wasn't — the access lived under one email account, and the browser was simply logged in as a *different* email at the time (which genuinely had not paid). The fixes above make this obvious and instant: the moment you switch accounts, the cards now show the correct state for *that* account without any manual refresh.

---

## ⭐ THE BIG LESSON — why it suddenly feels instant (read this one)

> **TL;DR:** If data is needed *the moment the page appears*, fetch it on the **server** before the page is sent. Only fetch in the **browser** for things that change *after* the page is already on screen (a click, a poll, a live update). This single rule is the difference between "loads with a flash" and "instant."

This is the most important idea in the whole project, so here it is slowly.

### The two ways a page can get its data

Imagine the session cards needing to know "has this user paid?".

**The slow way (client-side fetching) — what we had:**

```
1. Server sends a blank-ish page  →  browser paints it immediately
2. Browser downloads & runs React
3. React calls /api/...            →  travels to server
4. Server queries the database     →  travels back
5. Cards finally update            →  you SEE them change
```

Steps 2–5 all happen *after* you're already staring at the screen. That visible gap between step 1 and step 5 is **the flash.** It's not that the database is slow — it's that we asked it *too late*, after the page was already drawn.

**The fast way (server-side rendering) — what we changed to:**

```
1. Server reads the cookie + queries the database  (happens here, first)
2. Server renders the FINAL HTML with the answer baked in
3. Browser receives it  →  paints the correct result instantly
```

The answer arrives *welded into* the page. There is no "fetch then update" step for you to watch, because by the time the page exists, it's already right. **Zero flash, because there's nothing to correct.**

### Why this is possible at all: Server Components

The thing that unlocks the fast way is that in the Next.js App Router, a component like `app/layout.tsx` runs **on the server**. A Server Component can:

- read your login cookie directly,
- talk to the database directly (safely — the secret keys never touch the browser),
- and finish all of that *before sending you a single byte of HTML*.

A browser `useEffect` (the slow way) can do none of that early — it only runs *after* the page has been delivered and React has woken up. So moving the work from `useEffect` (browser) into the layout (server) is literally moving it earlier in time. **Same query, earlier moment, no flash.**

### The three moves, in order of impact

1. **Read at first-paint data on the server, not in `useEffect`.** This is 90% of the speed-up.
2. **Fetch shared data once and put it in a Context** instead of every component fetching its own copy. (Our 6 requests → 1.)
3. **Hand the server's answer to the client as initial state**, so the browser *starts* correct instead of starting empty and racing to catch up.

### The mental checklist for "should this be fast?"

Ask one question about any piece of data: **"Does the user need to see this the instant the page appears?"**

- **Yes** → fetch it on the **server** (Server Component / the page or layout). Examples: am I logged in, what have I paid for, my profile, the list of posts.
- **No, it happens after a user action or over time** → fetch it in the **browser**. Examples: results after clicking "Search", a live price ticker, "is my transaction mined yet" polling.

That's the entire rule. Most "why is my app slow / flashy" problems are just data being fetched in the browser that should have been fetched on the server.

---

## 🗣️ How to PROMPT for this (spend fewer tokens, get it right first try)

You do **not** need to know the solution to get the solution. Describe the **symptom** and the **goal** — let the diagnosis happen in the code, not in your head (guessing wrong is what wastes tokens, because wrong patches have to be undone).

**Prompts that work well:**

- *"This loads with a flash — make it correct on first paint / server-rendered."*
- *"Move this data fetch from the client to the server."*
- *"These components each fetch the same thing — fetch it once and share it."*
- *"Why is X slow? Find the root cause and fix it."* ← let it investigate; don't pre-diagnose.

**Habits that save the most tokens (and water):**

1. **Symptoms, not solutions.** "It's slow / it flashes / it asks me to re-pay" beats guessing the cause. The wrong guess sends the work in the wrong direction.
2. **Trust the diagnosis step.** "Find the root cause first" is cheaper than three confident wrong patches. The most expensive mistakes are patches built on a guess.
3. **One clear observable behavior per point.** Batching several is fine — just keep each one a thing you actually *saw* happen.
4. **Say "just fix it, no writeup" when you don't want the explanation.** The teaching costs tokens too; ask for it only when you want to learn.

**The whole multi-message debugging session above, compressed into the one prompt that would've gotten here directly:**

> *"Login refreshes and clears the email; access loads slowly with a flash; after signing out it still shows access. Find the root causes and fix them."*

One sentence. Three symptoms, zero guesses, one instruction to diagnose. That's the target.

---

## Chunk 7 — Session access control & gating

### What was built

The "bouncer" for paid content. Before this, anyone who knew the URL `/sessions/2` could just type it in and see the page. Now the app **checks on the server, before sending any HTML**, whether you're allowed in — and quietly sends you somewhere else if you're not.

Three outcomes when you open `/sessions/2`:
- **Not logged in** → bounced to `/login`.
- **Logged in but haven't paid** → bounced back to the homepage, with a little flag in the URL so the right card lights up and says "you need to pay".
- **Logged in and paid (or it's free session 1)** → you see the content.

New pieces:
- `lib/sessions/access.ts` — the *rule* ("does this user have access?"), reusable and testable on its own.
- `app/(dashboard)/sessions/[id]/page.tsx` — the *gate* that uses the rule and decides where you go.
- `components/sessions/SessionContent.tsx` — the actual unlocked content (title, description, the big amber "Watch on Twitter" button; session 3 also gets GitHub + AI Vaults links).
- `components/sessions/LockedScroller.tsx` — tiny helper that scrolls you to the cards when you get bounced home.

---

### What is a Server Component, and why check access there (not in the browser)?

This is the heart of the chunk, so let's go slow.

In the Next.js App Router there are two kinds of components:

- **Server Components** run *on the server*. They execute before the page is sent to your browser. They can read cookies, query the database with secret keys, and do private logic — none of which ever reaches the browser. The user receives only the finished HTML.
- **Client Components** (the ones marked `'use client'`) run *in the browser*. They handle clicks, typing, wallet popups — anything interactive. But everything they do is visible and editable by the user, because it's running on the user's own machine.

The session gate (`page.tsx`) is a **Server Component**. Here's why that matters for security:

> **The golden rule: never trust the browser for access control.** Anything that runs in the browser can be inspected, paused, and edited by the user with free built-in dev tools. If the "do you have access?" check ran in the browser, a determined user could simply skip it — flip a variable from `false` to `true`, or block the redirect — and read paid content for free.

When the check runs on the **server**, the user never gets the chance. The server decides *before* sending anything. If you're not allowed, the content HTML is **never generated and never sent** — there's literally nothing in the browser to hack, because the paid text never left the server.

Think of it like a nightclub:
- **Client-side check** = handing everyone the keys and a sign that says "please don't go in the VIP room." Polite, useless.
- **Server-side check** = a bouncer at the door who simply doesn't let you walk in. The VIP room's contents never even come into view.

(There's *also* a check in the homepage cards using a Client Component — but that's just for a nice UX, deciding whether to show "Pay" vs "View Session". The *real* security is the server gate. We let the browser handle appearance; we never let it handle permission.)

---

### What does "redirecting with a query param" mean?

A **redirect** is the server saying "don't stay here — go to this other URL instead." The browser obeys and loads the new address. In our gate, `redirect('/login')` sends an un-logged-in visitor to the login page.

A **query param** (also called a query string) is the extra bit after a `?` in a URL:

```
https://defilords.com/?locked=2
                       └────────┘
                       query param: locked = 2
```

It's a way to pass a small piece of information *through* a navigation. When a logged-in user without access tries to open session 2, we don't just dump them on a blank homepage — we redirect them to `/?locked=2`. That `locked=2` is a note that travels with them, telling the homepage: *"this person just got turned away from session 2."*

The homepage reads that note (`searchParams.locked`) and reacts:
- scrolls down to the session cards,
- shows "You need to pay to access this session" on **card 2 specifically**,
- briefly pulses that card's border amber so the eye lands on it.

Without the query param, the homepage would have no idea *which* session to highlight. The param is how one page hands context to the next through a plain URL — no database, no hidden state, and it even survives a page refresh or being shared as a link.

---

### Why is session 1 always free, and how is that handled in code?

Session 1 is the hook — real value before anyone pays, to build trust. So it must be open to everyone, always.

The clever bit is **how** that's expressed. Paid access lives in the `session_access` database table: one row per (user, paid session). Session 1 simply **has no rows there, ever** — it isn't a paid product, so there's nothing to record.

If we naively asked the database "is there an access row for session 1?", the answer would always be "no" — and we'd accidentally lock everyone out of the free session. So the free rule is handled *before* the database is ever consulted, right at the top of `hasSessionAccess`:

```ts
export async function hasSessionAccess(userId: string, sessionId: number): Promise<boolean> {
  if (sessionId === 1) return true   // free — short-circuit, never query the DB
  const accessible = await getUserSessionAccess(userId)
  return accessible.includes(sessionId)
}
```

Two benefits of putting it here:

1. **One rule, one place.** Every part of the app — the gate, the homepage cards, future features — asks this same function. The "session 1 is free" truth lives in exactly one line, so it can never drift out of sync between different screens.
2. **It's faster and cheaper.** That `return true` short-circuits *before* any database call. Opening the free session costs zero queries. (Our test even asserts the database client is never created when you ask about session 1.)

So "session 1 is free" isn't scattered as `if (id === 1)` checks all over the codebase — it's a single early-return in the one function that owns the access question.

---

## Chunk 8 — Session content pages polish

### What was built

This chunk was all about making the unlocked session pages *feel* finished, and adding a few small touches that quietly do real work (reassuring paid users, nudging free users to upgrade). New/changed pieces:

- `SessionContent.tsx` — the polished page body: session number, title, description, a big amber "Watch on Twitter" button, plus conditional extras (an upsell on session 1, GitHub/AI-Vaults links on session 3, a "lifetime access" note on paid sessions).
- `SessionBreadcrumb.tsx` — a `DefiLords → Sessions → Session N` trail at the top.
- `SessionCard.tsx` — the homepage card now shows a green "✓ Access granted" badge and a green glow once you own a session.

Three concepts are worth understanding behind the scenes.

---

### What "lifetime access" actually means (it's just a database row)

We show paid users a reassuring line: **"✓ You have lifetime access."** That's a promise — but where does the promise *live*? It's not a timer, not a subscription, not an expiry date. It's the simple fact that **access is a permanent row in the `session_access` table.**

Recall how access works:
- When you pay and the payment is verified on-chain, the server inserts one row: `{ user_id, session_id, tx_hash, ... }`.
- To check access, the app asks "is there a row for this user + this session?" (`hasSessionAccess`).

There is **no expiry column** in that table. Nothing ever deletes the row (the database rules even forbid `DELETE` on `session_access`). So once the row exists, the answer to "do you have access?" is `true` forever. That *is* "lifetime access" — not a marketing feature we had to build, but a direct consequence of how the data is shaped:

- A **subscription** would mean storing an `expires_at` and checking `now() < expires_at` — access that lapses.
- Our model stores **only the fact that you paid**, with no end date — so it simply never lapses.

So the green text isn't a separate feature with its own logic; it's just *honestly describing what the database already guarantees*. The reassurance and the reality are the same thing. (This also means it's safe to promise — there's no code path that could quietly take access away.)

---

### Why Twitter links open in a new tab (`target="_blank"`)

The "Watch on Twitter" button has `target="_blank"`, which tells the browser **open this in a new tab** instead of navigating away from our site.

Why that matters here:
- The session content lives on Twitter/X, but the **session page is the user's home base** — it has the breadcrumb, the "lifetime access" note, the session-3 links, the upsell. If clicking "Watch" *replaced* our page with Twitter, the user would have to hit the back button to return, and on mobile that's clunky and easy to lose.
- Opening a new tab means our page **stays open underneath**. They watch on Twitter, close that tab, and they're right back where they were — no navigation, no reload, no lost place.

The rule of thumb: **internal links** (to other pages on our own site, like "View Session" or the breadcrumb) navigate in the **same tab** — that's the normal flow of moving around an app. **External links** (to a different website, like Twitter or GitHub) open in a **new tab** so the user doesn't get bounced off our site.

One always-pair-it detail: external `target="_blank"` links also get `rel="noopener noreferrer"`. Without `noopener`, the new tab gets a back-reference to our page (`window.opener`) and could, in theory, script-redirect our tab somewhere malicious — a small but real security hole called *tabnabbing*. `noopener` severs that link; `noreferrer` also stops us leaking the referring URL. It's a one-line safety habit on every external new-tab link.

---

### How the "session nudge" helps with upselling

On the **free** session 1 page we added a small line: *"Enjoying this? Unlock Session 2 →"*. That's an **upsell** — gently pointing a free user toward a paid product *at the exact moment they're most receptive*.

The timing is the whole point. Session 1 is "the hook": real, useful content given away to build trust. A user who just finished it is, right then, the warmest possible lead — they've experienced the value and have momentum. Showing the next step *there*, in that moment, converts far better than hoping they wander back to the homepage and notice the paid cards on their own.

Why it's designed the way it is:
- **It's contextual, not nagging.** It only appears on the free session (paid sessions show "lifetime access" instead). We don't pester people who've already bought.
- **It's one clear next action.** It doesn't dump both paid sessions on them — it points at the *immediate* next step (Session 2), matching our "one primary action per screen" design rule. Lower friction, clearer decision.
- **It rides existing momentum.** The link goes back to `/#sessions` (the cards), so the user lands exactly where they can act, scrolled to the right place.

In product terms this is a tiny **conversion funnel**: free value → reassurance it was worth their time → a single, well-timed pointer to the paid step. The code is three lines of JSX, but the intent is "turn a satisfied free user into a paying one without being pushy."

---

## Chunk 9 — Owner dashboard

### What got built, in plain English

The owner (you) now has a private dashboard at `/admin`. It shows the headline numbers (total users, total revenue, how many people bought Session 2 vs Session 3), a session breakdown, a searchable list of every user, and a full payment history with links to the blockchain explorer. Nobody but an owner can see any of it — the check happens on the server, before a single byte of dashboard HTML is sent.

New pieces:
- **`lib/admin/queries.ts`** — every database read the dashboard needs, in one file.
- **`types/admin.ts`** — the shapes of the data (`AdminStats`, `AdminUser`, `AdminPayment`, `SessionBreakdown`).
- **`app/api/admin/{stats,users,payments}`** — owner-gated API endpoints.
- **`app/(admin)/admin/...`** — the dashboard, users, and payments pages, plus a shared admin layout/navbar.
- **`components/admin/`** — the reusable visual pieces (stat card, tables, session breakdown, pagination, copyable wallet pill).

### What a Server Component is — and why every admin page is one

Next.js has two kinds of components. A **Client Component** (marked `'use client'`) ships its JavaScript to the browser and runs there — needed for anything interactive (clicks, hooks like `useState`). A **Server Component** (the default) runs **only on the server**: it can read the database directly, and the browser only ever receives the finished HTML, never the code or the data-fetching logic.

The admin pages are all Server Components, on purpose, for two reasons:
1. **Security.** The owner check (`session.role !== 'owner' → redirect('/')`) runs on the server *before rendering*. A non-owner literally never receives the dashboard markup. If this were a Client Component, the page would have to ship to the browser first and then check — meaning the data would already be on the user's machine. Server-side gating means "no access" = "nothing sent."
2. **Direct DB access.** A Server Component can `await getStats()` (which talks to Supabase with the secret service-role key) right inside the component. No API round-trip, no exposing keys to the browser. The secret key stays on the server where it belongs.

The only Client Component in the whole feature is the tiny `WalletPill` — because "copy to clipboard on click" *requires* browser interactivity. Everything else stays server-side.

### What pagination is and why it matters

**Pagination** means: instead of loading *all* the data at once, you load it in fixed-size pages — here, 20 rows at a time. The user table shows users 1–20, then a "Next →" link loads 21–40, and so on.

Why it matters:
- **Performance.** If you had 10,000 users and tried to render them all in one table, the database query would be huge, the HTML would be enormous, and the page would crawl. Fetching 20 keeps every request small and fast no matter how big the dataset grows.
- **How it works here.** Each page request carries a `?page=2` in the URL. The query turns that into a database `range(20, 39)` — "give me rows 20 through 39." The DB also returns a `total` count, so we can compute how many pages exist (`Math.ceil(total / 20)`) and disable "Next" on the last page.
- **Why it's in the URL, not just memory.** Because page state lives in the URL (`?page=2&search=ali`), the owner can bookmark or refresh a specific page and land exactly where they were. The search box is a plain HTML `<form method="get">`, so it works the same way — submitting it just sets `?search=...` in the URL and the server re-queries. No client-side JavaScript needed for either.

### Why all admin queries live in one file

`lib/admin/queries.ts` is the *only* place in the admin feature that talks to Supabase. Pages and components import functions like `getStats()` and `getUsers()` — they never write a database query themselves.

This is a deliberate rule (it's in CLAUDE.md: "No direct Supabase calls inside components"). The payoff:
- **One place to reason about data.** If a query is slow, wrong, or needs a new column, you fix it in exactly one file. You never have to hunt through five page components for a stray query.
- **Testability.** Because the queries are plain functions, the tests mock Supabase once and check the *logic* (does search build the right filter? does it sum revenue correctly?) without ever touching a real database.
- **Security boundary.** All these functions use the service-role client, which bypasses Row-Level Security. Keeping them in one server-only file makes it obvious and easy to guarantee none of this powerful client ever leaks into browser code.

### USDC revenue: what the number looks like in the DB vs. on screen

When someone pays, we store the amount in the `session_access.amount_usdc` column, which is a `numeric(20,6)` — a precise decimal type. So a $50 payment is stored as `50.000000`. We use `numeric` (not a floating-point type) deliberately: money should never suffer floating-point rounding errors, and `numeric` keeps exact decimal values.

Two subtleties the dashboard handles:
1. **It comes back as a string.** Postgres `numeric` values arrive in JavaScript as **strings** (`"50.000000"`), not numbers — again to preserve precision. So in `getStats` and `getPayments` we explicitly `Number(amount_usdc)` to turn `"50.000000"` into `50` before adding them up. Summing strings would just glue them together (`"50" + "100"` = `"50100"`), so this conversion matters.
2. **Raw on-chain units are a different thing entirely.** On the blockchain, USDC has 6 decimals and amounts are integers: $50 is `50000000` (50 million base units). That raw form is used *only* during payment verification (`constants/sessions.ts` `priceUSDC: '50000000'`). What we *store* and *display* is the human number, `50`. So: on-chain `50000000` → stored `50.000000` → displayed `$50`. The dashboard never shows the raw unit; `toLocaleString()` just adds thousands separators so `4350` reads as `$4,350`.

---

## Perf & UX pass — skeletons, client singleton, OTP round trip, progress bar

This wasn't a feature chunk — it was three quality-of-life improvements that make the app *feel* and *be* a bit faster.

### What skeleton loaders are and why they feel faster

A **skeleton loader** is a grey, pulsing placeholder shaped like the content that's about to appear — empty card outlines where session cards will load, blank rows where the user table will fill in. We added a tiny reusable `Skeleton` component and a `loading.tsx` file next to each page.

Here's the key Next.js mechanism: when a page is a **Server Component that `await`s data** (like the admin dashboard awaiting `getStats()`), Next automatically shows the `loading.tsx` in that folder *while the data is being fetched*, then swaps in the real page when it's ready. You don't wire it up — just having the file there is enough.

Why it "feels faster" even when it isn't:
- **It's about perceived performance, not actual speed.** The data still takes the same time to load. But a blank white screen (or a frozen old page) makes the wait feel *broken* — the user doesn't know if anything is happening. A skeleton says "I heard you, content is coming, here's roughly what it'll look like." That instant feedback makes the same wait feel dramatically shorter.
- **It prevents layout shift.** Because the skeleton is the same shape and size as the real content, the page doesn't jump around when data arrives — the boxes just fill in. That smoothness reads as "fast and polished."
- **On the homepage cards**, there's a related trick: the paid card shows a button-sized skeleton while it figures out whether you're logged in / have access, instead of flashing "Get started" for a split second and then changing to "View Session." Flashing the *wrong* state and correcting it looks buggy; a brief skeleton looks intentional.

### What connection pooling / a client singleton is and why it matters

Every time our server code talked to the database, it called `createServerSupabaseClient()`, which built a brand-new Supabase client object. After chunks 6–9 added a lot more DB calls (payment checks, session access, admin queries), that meant constructing that object over and over.

We changed it to a **singleton**: build the client once, store it in a module-level variable, and hand back that same instance on every later call.

```
let client = null
export function createServerSupabaseClient() {
  if (!client) client = buildClient()   // build once
  return client                          // reuse forever after
}
```

An honest caveat on the "connection pooling" framing: the Supabase JS client talks to the database over **HTTP** (via a service called PostgREST), not a long-lived database socket. So it isn't holding a "connection" in the classic database-pool sense. The singleton saves the cost of *re-creating the client object* on every call — a real but modest win. The bigger contributors to OTP slowness are the **network round trips** themselves (each DB read/write is an HTTP request) and the **email send to Brevo**, which is a separate external API call. Worth knowing so we don't expect the singleton alone to make login feel instant.

What true connection pooling *is*, for context: in systems that use raw database connections (each one is expensive to open), a "pool" keeps a set of open connections ready and lends them out to requests, so nobody pays the open/close cost per query. Supabase offers a pooler (PgBouncer) for that style of access — but our HTTP client doesn't use it directly.

### Reducing OTP round trips (and why we didn't take the shortcut)

`verifyOtp` used to make up to **three** database calls on a successful login: fetch the code row, update its attempt counter, then a separate update to mark it "used." We merged the last two into **one** update (bump attempts *and* mark used together) — so the success path is now two round trips instead of three. Each round trip is a network hop, so removing one shaves real time off every successful verification.

There was a tempting shortcut: do the *whole thing* in a single clever SQL `UPDATE ... WHERE code matches AND not used AND not expired ... RETURNING *`, and treat "zero rows changed" as failure. We deliberately **didn't** do that, because it would have quietly broken two important things:
- **It loses the reason.** Today the code can tell the user *why* verification failed — expired, already used, wrong code, or too many attempts. A single "did any row update?" check can't distinguish those, so the UI would only ever say a generic "invalid."
- **It weakens the brute-force limit.** That query would only match the *correct* code, so **wrong** guesses would never increment the attempt counter — meaning an attacker could try unlimited codes. The whole point of the 3-attempt cap is to stop exactly that.

This is a good example of a real engineering trade-off: the "faster" version was faster because it did *less* — and the things it skipped were security and clarity we want to keep. We took the safe speed-up and left the risky one alone.

### What a progress bar adds to UX

We added `next-nprogress-bar` — a thin (2px) amber bar that slides across the top of the screen during page navigation, GitHub-style.

Why it helps: when you click a link to another page, there's a short moment where the server is preparing the next page and *nothing visibly changes yet*. Without feedback, users often click again, thinking it didn't register. The progress bar fills that gap — the instant you click, the bar starts moving, confirming "your click worked, the next page is loading." It's the same psychology as the skeletons: a small, immediate signal that the app is responsive turns dead air into reassurance. It lives in a Client Component (`ProgressBar.tsx`) because it has to listen to the router, and the root layout is server-rendered.

---

## Chunk 10 — The finishing line: developer section, analytics, cleanup & QA

### What was built

The last chunk is less about new machinery and more about **getting the project ready for real people to use it**. Three things:

1. A **"Build with DefiLords" section** at the bottom of the homepage — a small block inviting developers to contribute (GitHub) and investors to join (AI Vaults). Two buttons, both open in a new tab. Visually it sits on a *slightly* lighter charcoal (`#1a1a15`) than the rest of the page, so your eye registers it as a distinct "footer-ish" zone without any harsh divider.
2. **Analytics tracking** wired into every page.
3. A round of **pre-launch cleanup** and a **QA pass**.

---

### What analytics tracking actually does

We added a tiny script (Contentsquare, the company that now owns Hotjar) that loads on every page. You give it a **Site ID** (ours is `872924`) and from then on it quietly records *how people use the site* — which pages they visit, where they click, how far they scroll, where they hesitate or drop off. Some tools also build **heatmaps** (a colour overlay showing where clicks cluster) and **session recordings** (an anonymised replay of a visitor's mouse movements).

Why bother? Because you can't improve what you can't see. The owner might *think* the "Pay $50" button is obvious — analytics shows whether people actually find it, or whether they scroll past and leave. It turns guesses about user behaviour into data.

Three details about *how* we added it, each one deliberate:

- **`next/script` with `strategy="afterInteractive"`.** A normal `<script>` tag in the page can *block* the browser — the page can't finish drawing until the script downloads and runs. `afterInteractive` tells Next.js: "load this *after* the page is already usable." Analytics is never urgent enough to make a visitor wait, so it loads last. The page feels fast; the tracking still happens.
- **The Site ID comes from an environment variable** (`NEXT_PUBLIC_HOTJAR_ID`), not typed into the code. Same principle as every other config value in this project: settings live in `.env`, not hardcoded. A bonus: if that variable is empty (say, in a local dev setup), the script simply doesn't render — no tracking noise during development.
- **It carries the CSP "nonce."** This site has a strict **Content-Security-Policy** — a browser-enforced rule that says "only run scripts I explicitly trust," which is what stops an attacker from injecting malicious JavaScript. In production the policy uses a per-request random token called a **nonce**: every script the server trusts is stamped with that turn's token, and the browser refuses to run any script without it. So our analytics script has to carry the nonce too, or the browser would (correctly) block it. We read the nonce the middleware generated and pass it to the script. Security stays strict *and* the analytics still loads.

(Note: we never used `dangerouslySetInnerHTML` — React's "I promise this raw HTML is safe" escape hatch — which the project bans. `next/script` accepts the loader code as normal children instead, which is the safe, idiomatic way.)

---

### What a QA checklist is, and why it matters

**QA** stands for **Quality Assurance**. A QA checklist is simply a written list of *every* thing the app is supposed to do, which you walk through one by one and tick off — "does this actually work?" — before you ship.

Ours had 25 items: homepage loads, each session card shows the right price and state, login works, wallet connects, payment unlocks the right session, the admin dashboard shows real numbers, non-owners get bounced out, the site works on a narrow phone screen, and so on.

Why it matters: software has a lot of *paths* through it, and it's very easy to fix one thing and accidentally break another you weren't looking at. Without a checklist you test the thing you just changed, declare victory, and miss that login now redirects to the wrong place. The checklist forces you to verify the **whole** experience, not just your latest edit. It's the difference between "it worked on my machine when I tried it once" and "I confirmed every flow a real user will touch."

An honest part of QA is being clear about **what you could and couldn't verify**. Some of our checks ran automatically (the page returns the right content, protected pages redirect logged-out visitors, the build compiles, 101 automated tests pass). Others — a real OTP email landing in a real inbox, a real wallet popping up, a real testnet payment going through — need a human with a phone and a wallet. We marked those clearly as "needs a manual pass" rather than pretending they were tested. A QA report you can trust is one that's honest about its own gaps.

---

### What "pre-launch cleanup" means

While building, developers leave little messes behind — and that's normal. The most common is **debug logging**: temporary `console.log` lines that print things to the server console so you can see what's happening while you build ("is the API key the right length? what did Brevo reply?"). They're invaluable mid-development and **embarrassing or risky in production** — they clutter the logs and can leak details about keys or internal behaviour. Pre-launch cleanup means going back and **removing all of them**. We pulled three debug logs out of the Brevo email code, while *keeping* the deliberate `console.error` lines — those aren't debug noise, they're proper error logging that helps diagnose real failures later.

Cleanup also covered:

- **Error handling sweep.** We checked every API route handles failure gracefully — meaning if something goes wrong (the blockchain node is unreachable, the database hiccups), the user gets a calm generic "something went wrong" message and the *real* error is logged on the server, never dumped onto the user's screen. (Leaking raw error details to users is both confusing and a security risk — it can reveal how the system is built.) We added explicit "catch any unexpected problem" wrappers to the routes most likely to hit external systems that can throw — the payment verifier (which talks to the blockchain) and the admin database queries.
- **Config check.** Confirmed every environment variable the app needs actually has a value filled in.
- **Documentation truth.** Updated the database migration notes so their status (`applied` vs `not yet applied`) matches reality — earlier chunks had applied them but never flipped the label. Docs that lie are worse than no docs.

Finally, the project is "done" but deliberately running on **testnet** — a practice version of the Base blockchain that uses fake money. That's exactly what you want for building and testing payments: you can run real transactions end-to-end without spending a cent. Before a true public launch, a handful of values get switched from testnet to **mainnet** (the real blockchain, real USDC), and the placeholder GitHub/Twitter links get swapped for the real ones. Those switches are listed explicitly at the top of `PROGRESS.md` under "Launch ready" so nothing gets forgotten on the day. Building on testnet first, then flipping one well-documented set of switches, is the safe way to ship anything that touches real money.

---

### Making the site work on a phone — mobile-first, touch targets, and horizontal scroll

This pass had one rule: change how the site *looks and lays out* on small screens, without touching a single line of payment logic, auth logic, or API code. Almost everything here is just CSS class names. Three ideas are worth understanding because they're the whole reason "works on my laptop" and "works on a phone" are different problems.

#### What "mobile-first" actually means

Mobile-first is a way of writing your styles where **the phone layout is the default, and bigger screens are the exception you opt into** — not the other way around.

In this project we use **Tailwind**, where you add styling by stacking small class names like `flex`, `gap-6`, `px-4`. Tailwind has special prefixes — `sm:`, `md:`, `lg:` — that mean "only apply this *at this screen width or wider*." `sm:` kicks in at 640px, `md:` at 768px, `lg:` at 1024px. Crucially, a class with **no prefix applies everywhere**, including the smallest phone.

So when you write:

```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

you're saying: "**one column by default** (phone), two columns once the screen is ≥640px, three columns once it's ≥1024px." The phone gets the simplest layout for free, and wider screens *add* complexity. That's mobile-first: start from the most constrained device and layer on richness as space allows.

The opposite approach — designing for desktop and then trying to cram it down — is how you end up with the broken navbar we started with: everything assumes there's plenty of horizontal room, and on a 375px-wide phone it all collides.

A practical consequence showed up all over this change. To make the navbar work on phones *without* disturbing the desktop, we wrapped the old desktop row in `hidden sm:flex` ("hidden by default, become a flex row at ≥640px") and added a separate hamburger menu marked `sm:hidden` ("visible by default, disappear at ≥640px"). The two never show at the same time — the breakpoint is a switch. The desktop at 1280px renders the *exact same markup it always did*, because every mobile-specific change is locked behind a prefix and never changes the unprefixed (= all-screens) styles in a way desktop would see. That's the discipline: **mobile changes add `sm:`/`md:`/`lg:` rules; they don't rewrite the base styles desktop depends on.**

#### What a "touch target" is, and why 44px is the magic number

A **touch target** is the area you can tap to trigger something — a button, a link, a menu item. On a desktop you have a mouse pointer that's one pixel wide and pixel-perfect. On a phone you have a fingertip, which is soft, wide, and *can't see what it's covering*.

Both Apple and Google publish the same guidance: **make tap targets at least ~44×44 pixels** (Apple says 44pt, Google's Material guidance says 48dp — we used 48px to satisfy both). Below that, people miss. They tap "Pay" and hit "Cancel," or they jab at a link three times before it registers. It feels broken even when the code is perfect — the problem is purely physical.

That's why throughout this change you'll see `min-h-[48px]` (and `min-h-[44px]` on a couple of admin inputs) added to buttons, links, and form fields. `min-h-[48px]` means "this element is *at least* 48 pixels tall, no matter how little text is inside it." A button reading "Pay" is only as tall as the word "Pay" by default — maybe 32px — which is a frustrating target. Forcing a minimum height gives the finger room to land. We pair it with `flex items-center justify-center` so the label stays vertically centred inside that taller box instead of sticking to the top.

The same logic is why the mobile menu rows are tall and generously spaced: when links are stacked close together, a slightly-off tap hits the *wrong* link. Spacing them out so "fat fingers don't miss" isn't decoration — it's the difference between a menu that works and one that fights you.

#### What "horizontal scroll" is, and why it quietly ruins a mobile page

**Horizontal scroll** is when a page is *wider than the screen*, so you can swipe left-and-right, not just up-and-down. On desktop you barely notice — there's a scrollbar and a big window. On a phone it's a disaster:

- The page jiggles sideways as you try to scroll vertically.
- Content hides off the right edge where you can't see it.
- Tapping becomes unreliable because the layout shifts under your finger.
- It just *feels* broken and cheap, even if every individual piece is fine.

It almost always comes from **one element that refuses to shrink** — a fixed-width button, a long unbreakable string (like a wallet address or transaction hash), an image with a hardcoded width, or a row of items that assumes desktop spacing. That single too-wide element stretches the whole page wider than the viewport, and now the *entire* site scrolls sideways because of it.

The original navbar was exactly this: the wallet "Connect" button plus the links plus the user menu added up to more than 375px of width, so the homepage could be dragged sideways. Replacing that row with a hamburger on phones removed the overflow at its source — the single best fix is always to find the element that's too wide and make it stack, wrap, or collapse.

As a backstop we also added `overflow-x-clip` to the page's `<body>`. This tells the browser "never allow sideways scrolling here — if something pokes past the edge, just clip it off." We deliberately chose `overflow-x-clip` over the more common `overflow-x-hidden`: `hidden` secretly turns the body into a scroll container, which **breaks `position: sticky`** — and our navbar relies on sticky to stay pinned at the top as you scroll. `clip` does the same visual job (no sideways scroll) *without* that side effect. It's a small but real example of how two CSS values that look interchangeable have different consequences, and why it's worth knowing the difference. The backstop is a safety net, not the fix — the real work is making each piece fit; the clip just guarantees a stray pixel somewhere can never hand the user a janky sideways-sliding page.

Other small wrapping fixes followed the same spirit: the breadcrumb (`DefiLords → Sessions → Session 2`) got `flex-wrap` so it drops onto a second line instead of pushing off-screen, and the admin tables were left with `overflow-x-auto` — which lets *just the table* scroll sideways inside its own little box while the rest of the page stays put. That last one is the key distinction: a table with lots of columns genuinely needs horizontal room, so you give *it* a private scroll area rather than squishing the columns unreadably or letting it break the whole page. Horizontal scroll isn't always wrong — it's wrong when it's the *whole page*; it's a perfectly good tool when it's deliberately scoped to one wide component.

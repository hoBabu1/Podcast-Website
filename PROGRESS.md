# PROGRESS.md

## UI fixes — 2026-06-14

### What was completed
- **AI Vaults navbar link** — changed from internal anchor scroll (`#invest`) to direct external link (`https://aivaults.defilords.finance/`) in both Navbar.tsx and MobileNav.tsx. Opens in new tab.
- **Footer social links** — replaced old Twitter/GitHub/AI Vaults links with correct social links: 𝕏 (`https://x.com/defilordsss?s=21`), Telegram (`https://t.me/defilordss`), Discord (`https://discord.gg/2GHZ4F93tb`). Copyright updated to 2026. Desktop: single row. Mobile: stacks vertically.
- **DevSection anchor removed** — removed `id="invest"` from the section element in DevSection.tsx so the navbar no longer scrolls to it. Section content unchanged.

### Files changed
- `podcast/components/layout/Navbar.tsx` — AI Vaults href + target/rel
- `podcast/components/layout/MobileNav.tsx` — AI Vaults href + target/rel
- `podcast/components/layout/Footer.tsx` — new social links, copyright 2026
- `podcast/components/layout/DevSection.tsx` — removed `id="invest"`

### Decisions made
- Used Next.js `Link` with `target="_blank"` for all external links (passes through to `<a>`)
- Footer uses `flex-col sm:flex-row` for mobile-first stacking
- No business logic, API routes, or payment code touched

### What next
No pending items from this batch of fixes.

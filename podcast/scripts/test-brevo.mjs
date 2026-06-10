// One-shot Brevo diagnostic script — run with: node scripts/test-brevo.mjs
// Tests: API key auth → add contact → send email

const API_KEY = process.env.BREVO_API_KEY
const LIST_ID = Number(process.env.BREVO_LIST_ID ?? 5)
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL ?? 'defilords007@gmail.com'
const TEST_EMAIL = process.env.BREVO_TEST_EMAIL ?? SENDER_EMAIL // send to yourself

if (!API_KEY) {
  console.error('Missing BREVO_API_KEY env var. Run with: BREVO_API_KEY=xxx node scripts/test-brevo.mjs')
  process.exit(1)
}

const BASE = 'https://api.brevo.com/v3'

const headers = {
  'api-key': API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

async function step(label, fn) {
  process.stdout.write(`\n▶ ${label} ... `)
  try {
    const result = await fn()
    console.log('✅ OK', result ? JSON.stringify(result) : '')
    return result
  } catch (err) {
    console.log('❌ FAILED:', err.message)
    return null
  }
}

// ── 1. Verify API key ────────────────────────────────────────────────────────
await step('GET /account (verify API key)', async () => {
  const res = await fetch(`${BASE}/account`, { headers: { 'api-key': API_KEY, Accept: 'application/json' } })
  const body = await res.json()
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body)}`)
  return { email: body.email, plan: body.plan?.[0]?.type }
})

// ── 2. Check list exists ─────────────────────────────────────────────────────
await step(`GET /contacts/lists/${LIST_ID} (confirm list exists)`, async () => {
  const res = await fetch(`${BASE}/contacts/lists/${LIST_ID}`, { headers: { 'api-key': API_KEY, Accept: 'application/json' } })
  const body = await res.json()
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body)}`)
  return { name: body.name, totalSubscribers: body.totalSubscribers }
})

// ── 3. Add contact ───────────────────────────────────────────────────────────
await step('POST /contacts (add test contact)', async () => {
  const res = await fetch(`${BASE}/contacts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: TEST_EMAIL,
      attributes: { FIRSTNAME: 'Test' },
      listIds: [LIST_ID],
      updateEnabled: true,
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status}: ${text}`)
  return text || '(no body — contact created)'
})

// ── 4. Send transactional email ──────────────────────────────────────────────
await step('POST /smtp/email (send test email)', async () => {
  const res = await fetch(`${BASE}/smtp/email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sender: { name: 'DefiLords', email: SENDER_EMAIL },
      to: [{ email: TEST_EMAIL }],
      subject: 'DefiLords Brevo test',
      htmlContent: '<p>If you see this, Brevo is working correctly.</p>',
    }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body)}`)
  return { messageId: body.messageId }
})

console.log('\n── Done ──')

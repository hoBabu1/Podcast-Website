export const OTP_EMAIL = {
  subject: 'Your DefiLords login code',
  body: (code: string) =>
    `Your DefiLords verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
}

export const WELCOME_EMAIL_SUBJECT = 'Welcome to DefiLords — your DeFi journey starts now'

export const WELCOME_EMAIL_BODY = (name: string) => `
<p>Hey ${name},</p>

<p>Welcome to DefiLords. You're in.</p>

<p>Session 1 is free and ready for you right now — no wallet, no payment, no friction. Just real DeFi strategy explained clearly.</p>

<p>When you're ready to go deeper, Sessions 2 and 3 unlock advanced liquidity, staking, yield strategies, and AI Vaults — all paid in USDC on Base.</p>

<p>Start here: <a href="https://defilords.xyz">defilords.xyz</a></p>

<p>— The DefiLords Team</p>
`.trim()

export const OTP_EMAIL = {
  subject: 'Your DefiLords login code',
  body: (code: string) =>
    `Your DefiLords verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
}

export const WELCOME_EMAIL_SUBJECT = 'Welcome to DefiLords — your DeFi journey starts now'

export const WELCOME_EMAIL_BODY = (name: string) => `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#141410; padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="100%" style="max-width:560px; background-color:#1a1a15; border:1px solid #242420; border-radius:12px; padding:32px;" cellpadding="0" cellspacing="0">

        <tr>
          <td style="font-size:13px; color:#EF9F27; letter-spacing:1px; text-transform:uppercase; padding-bottom:16px;">
            Web3 Learning Platform
          </td>
        </tr>

        <tr>
          <td style="font-size:24px; font-weight:600; color:#F0E6C8; padding-bottom:8px;">
            Welcome to DefiLords Academy! 🎉
          </td>
        </tr>

        <tr>
          <td style="font-size:14px; color:#a89878; line-height:1.6; padding-bottom:24px;">
            Hi ${name}, whether you're completely new to crypto or looking to improve your DeFi skills, we've designed a simple, step-by-step learning journey to help you understand decentralized finance and confidently put your assets to work.
          </td>
        </tr>

        <!-- Session 1 card -->
        <tr>
          <td style="background-color:#0e1812; border:1px solid #1a3325; border-radius:8px; padding:20px; padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px; color:#555555;">Session 1</td>
                <td align="right">
                  <span style="background-color:#1a2010; color:#97C459; font-size:11px; padding:3px 10px; border-radius:12px; border:1px solid #3B6D11;">FREE</span>
                </td>
              </tr>
            </table>
            <p style="font-size:16px; font-weight:600; color:#F0E6C8; margin:12px 0 8px;">DeFi Foundations</p>
            <p style="font-size:13px; color:#a89878; line-height:1.6; margin:0 0 12px;">The foundation of everything — before any wallet, payment, or strategy:</p>
            <p style="font-size:13px; color:#EF9F27; font-weight:500; margin:0 0 6px;">The DefiLords Recursive Yield Strategy:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0; padding-left:18px;">
              <li>Deposit ETH → borrow USDC → deploy into DefiLords AI Vaults</li>
              <li>Recursive yield generation explained simply</li>
              <li>Health factors, liquidation avoidance, risk management</li>
            </ul>
            <p style="font-size:12px; color:#555555; margin:12px 0 0;">No wallet, payment, or previous experience required.</p>
            <p style="font-size:12px; color:#EF9F27; margin:10px 0 0;">📅 A link to the live session will be shared via email before the scheduled day.</p>
          </td>
        </tr>

        <tr><td style="height:16px;"></td></tr>

        <!-- Session 2 card -->
        <tr>
          <td style="background-color:#111114; border:1px solid #1e1e22; border-radius:8px; padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px; color:#555555;">Session 2</td>
                <td align="right">
                  <span style="background-color:#1e1808; color:#EF9F27; font-size:11px; padding:3px 10px; border-radius:12px; border:1px solid #854F0B;">$50 USDC / USDT</span>
                </td>
              </tr>
            </table>
            <p style="font-size:16px; font-weight:600; color:#F0E6C8; margin:12px 0 8px;">How to Earn Yield Safely in DeFi</p>
            <p style="font-size:13px; color:#EF9F27; font-weight:500; margin:0 0 6px;">What you will learn:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0 0 12px; padding-left:18px;">
              <li>How to earn yield on stablecoins safely</li>
              <li>Liquidity pools — how they work and how to profit</li>
              <li>Staking strategies that compound automatically</li>
              <li>Real portfolio examples with live numbers</li>
              <li>How DefiLords vets every protocol before recommending it</li>
            </ul>
            <p style="font-size:13px; color:#EF9F27; font-weight:500; margin:0 0 6px;">The DefiLords Recursive Yield Strategy:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0; padding-left:18px;">
              <li>Deposit ETH → borrow USDC → deploy into DefiLords AI Vaults</li>
              <li>Recursive yield generation explained simply</li>
              <li>Health factors, liquidation avoidance, risk management</li>
            </ul>
          </td>
        </tr>

        <tr><td style="height:16px;"></td></tr>

        <!-- Session 3 card -->
        <tr>
          <td style="background-color:#111114; border:1px solid #1e1e22; border-radius:8px; padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px; color:#555555;">Session 3</td>
                <td align="right">
                  <span style="background-color:#1e1808; color:#EF9F27; font-size:11px; padding:3px 10px; border-radius:12px; border:1px solid #854F0B;">$100 USDC / USDT</span>
                </td>
              </tr>
            </table>
            <p style="font-size:16px; font-weight:600; color:#F0E6C8; margin:12px 0 8px;">Advanced Yield Strategies &amp; AI Vaults</p>
            <p style="font-size:13px; color:#EF9F27; font-weight:500; margin:0 0 6px;">Part 1 — Borrow Without Selling:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0 0 12px; padding-left:18px;">
              <li>Use Aave to borrow USDC against your ETH</li>
              <li>Morpho — peer-to-peer lending for better rates</li>
              <li>Kamino — capital-efficient borrowing on Solana</li>
            </ul>
            <p style="font-size:13px; color:#EF9F27; font-weight:500; margin:0 0 6px;">The DefiLords Recursive Yield Strategy:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0 0 12px; padding-left:18px;">
              <li>Deposit ETH → borrow USDC → deploy into DefiLords AI Vaults</li>
              <li>Recursive yield generation explained simply</li>
              <li>Health factors, liquidation avoidance, risk management</li>
            </ul>
            <p style="font-size:13px; color:#EF9F27; font-weight:500; margin:0 0 6px;">Part 2 — DefiLords AI Alpha Hunter:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0; padding-left:18px;">
              <li>Live demo of autonomous on-chain trading agent</li>
              <li>AI scoring: Momentum (35%), Volume (20%), Trend (20%), Risk (25%)</li>
              <li>Fear &amp; Greed analysis, regime detection, portfolio allocation</li>
              <li>24-token universe with real-time AI scoring</li>
              <li>How to read the dashboard — token scoring, trade history, metrics</li>
              <li>Future: live autonomous execution, multi-chain, vault integration</li>
            </ul>
          </td>
        </tr>

        <tr><td style="height:28px;"></td></tr>

        <tr>
          <td style="font-size:14px; color:#a89878; line-height:1.6; padding-bottom:24px;">
            By the end of the Academy, you'll understand not just how DeFi works, but how to use it responsibly to build long-term wealth on-chain.
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-bottom:28px;">
            <a href="https://defilords-podcast.vercel.app/" style="display:inline-block; background-color:#EF9F27; color:#141410; font-size:14px; font-weight:600; padding:14px 28px; border-radius:8px; text-decoration:none;">
              Start Your Free Journey →
            </a>
          </td>
        </tr>

        <tr>
          <td style="border-top:1px solid #242420; padding-top:20px;">
            <p style="font-size:12px; color:#555555; margin:0 0 8px;">Stay Connected</p>
            <a href="https://x.com/defilordsss?s=21" style="color:#a89878; font-size:13px; text-decoration:none; margin-right:16px;">𝕏 Twitter</a>
            <a href="https://t.me/defilordss" style="color:#a89878; font-size:13px; text-decoration:none; margin-right:16px;">Telegram</a>
            <a href="https://discord.gg/defilords" style="color:#a89878; font-size:13px; text-decoration:none;">Discord</a>
          </td>
        </tr>

        <tr>
          <td style="font-size:12px; color:#555555; padding-top:20px;">
            The DefiLords Team
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`

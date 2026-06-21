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
            <p style="font-size:13px; color:#a89878; line-height:1.6; margin:0 0 12px;">Start in just 30 minutes and learn:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0; padding-left:18px;">
              <li>What blockchain and DeFi really are</li>
              <li>How wallets and smart contracts work</li>
              <li>The 5 most popular strategies used to generate passive income in DeFi</li>
              <li>The benefits and risks of each strategy</li>
              <li>How to avoid common beginner mistakes</li>
            </ul>
            <p style="font-size:12px; color:#555555; margin:12px 0 0;">No wallet, payment, or previous experience required.</p>
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
            <p style="font-size:13px; color:#a89878; line-height:1.6; margin:0 0 12px;">Move beyond the basics and learn how experienced investors generate yield using real DeFi protocols:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0; padding-left:18px;">
              <li>DefiLords AI Vaults</li>
              <li>Pendle Finance</li>
              <li>Kamino Finance</li>
              <li>Stablecoin lending</li>
              <li>Liquidity pools</li>
              <li>Automated staking strategies</li>
              <li>Real portfolio examples and how DefiLords evaluates protocols before recommending them</li>
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
            <p style="font-size:13px; color:#a89878; line-height:1.6; margin:0 0 12px;">Take your knowledge to a professional level:</p>
            <ul style="font-size:13px; color:#a89878; line-height:1.7; margin:0; padding-left:18px;">
              <li>Borrowing against your crypto using Aave, Morpho, and Kamino</li>
              <li>The DefiLords Recursive Yield Strategy</li>
              <li>Risk management, health factors, and liquidation avoidance</li>
              <li>An exclusive behind-the-scenes look at the DefiLords AI Alpha Hunter — our autonomous on-chain trading agent</li>
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
            <a href="https://x.com/defilordsss" style="color:#a89878; font-size:13px; text-decoration:none; margin-right:16px;">𝕏 Twitter</a>
            <a href="https://t.me/defilords" style="color:#a89878; font-size:13px; text-decoration:none; margin-right:16px;">Telegram</a>
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

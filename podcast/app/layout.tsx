import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import { headers } from 'next/headers'
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Providers } from '@/components/layout/Providers'
import { ProgressBar } from '@/components/layout/ProgressBar'
import { getServerAuthState } from '@/lib/auth/serverAuth'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'DefiLords — Learn DeFi from zero to advanced',
  description: 'Web3-gated learning platform. Master DeFi strategies from liquidity pools to AI vaults.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialAuth = await getServerAuthState()

  // Nonce from middleware's per-request CSP — the tracking script must carry it
  // so `strict-dynamic` lets it load in production.
  const nonce = headers().get('x-nonce') ?? undefined
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brand-bg text-brand-body`}
      >
        {hotjarId && (
          <Script id="contentsquare" strategy="afterInteractive" nonce={nonce}>
            {`(function(c,s,q,u,a,r,e){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};c[a].l=1*new Date();r=s.createElement(q);e=s.getElementsByTagName(q)[0];r.async=1;r.src=u;e.parentNode.insertBefore(r,e);})(window,document,'script','https://o2.contentsquare.net/uxa/${hotjarId}.js','cs');cs('send','pageview');`}
          </Script>
        )}
        <Providers initialAuth={initialAuth}>{children}</Providers>
        <ProgressBar />
      </body>
    </html>
  )
}

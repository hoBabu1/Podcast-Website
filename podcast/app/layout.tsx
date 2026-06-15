import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
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

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brand-bg text-brand-body overflow-x-clip`}
      >
        <Script
          id="contentsquare"
          src="https://t.contentsquare.net/uxa/7895fa4b6fde7.js"
          strategy="afterInteractive"
          defer
        />
        <Providers initialAuth={initialAuth}>{children}</Providers>
        <ProgressBar />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { headers } from 'next/headers'
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
  const nonce = headers().get('x-nonce') ?? undefined

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brand-bg text-brand-body overflow-x-clip`}
      >
        <Script
          id="contentsquare"
          src="https://t.contentsquare.net/uxa/7895fa4b6fde7.js"
          strategy="afterInteractive"
          nonce={nonce}
        />
        <Script id="x-pixel" strategy="afterInteractive" nonce={nonce}>
          {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${process.env.NEXT_PUBLIC_X_PIXEL_ID}');if(typeof window.twq==='function'){window.twq('event','tw-rbp50-rd89g',{value:null,currency:null,contents:[{content_type:null,content_id:null,content_name:null,content_price:null,num_items:null,content_group_id:null}],status:null,conversion_id:null,email_address:null});}`}
        </Script>
        <Providers initialAuth={initialAuth}>{children}</Providers>
        <ProgressBar />
      </body>
    </html>
  )
}

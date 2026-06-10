const isDev = process.env.NODE_ENV === 'development'

// Tighten these per-service as integrations are added (chunk 3+)
const cspDirectives = [
  "default-src 'self'",
  // Next.js needs inline scripts in dev for HMR
  isDev ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  // wagmi/RainbowKit/WalletConnect need to reach RPC + relay endpoints
  "connect-src 'self' https: wss:",
  // WalletConnect's verify iframe + RainbowKit modal assets
  "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // These are optional peer deps of wagmi/WalletConnect that we don't use.
    // Aliasing them to `false` resolves them to an empty module — this silences
    // the "Module not found" warnings without breaking the build the way pushing
    // raw strings into `externals` does (that emits invalid `module.exports = name`).
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspDirectives },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig

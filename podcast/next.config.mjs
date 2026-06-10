// NOTE: Content-Security-Policy is NOT set here. It is built per-request in
// middleware.ts so each response gets a unique script nonce. Setting a static
// CSP here too would emit a second, conflicting header that re-blocks scripts.

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

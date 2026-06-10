'use client'

import { AppProgressBar } from 'next-nprogress-bar'

/**
 * Thin amber progress bar shown at the top during client-side navigation
 * (GitHub-style). Must be a Client Component — it hooks into the router — so it
 * lives here rather than directly in the server-rendered root layout.
 */
export function ProgressBar() {
  return (
    <AppProgressBar
      height="2px"
      color="#EF9F27"
      options={{ showSpinner: false }}
      shallowRouting
    />
  )
}

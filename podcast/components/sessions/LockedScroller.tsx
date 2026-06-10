'use client'

import { useEffect } from 'react'

/**
 * Scrolls the session cards section into view when the homepage is opened with a
 * `?locked=` param (i.e. the user was redirected here from a session they can't
 * access yet). Renders nothing — it's a behaviour-only helper.
 */
export function LockedScroller({ targetId }: { targetId: string }) {
  useEffect(() => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
  }, [targetId])

  return null
}

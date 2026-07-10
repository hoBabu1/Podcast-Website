/**
 * Minimal in-memory sliding-window rate limiter for public API routes that
 * don't already have a DB-backed limiter (unlike OTP send, which counts rows
 * in `otp_codes`). Per-instance only — acceptable for low-value public reads
 * where the goal is basic abuse mitigation, not hard guarantees.
 */
const hits = new Map<string, number[]>()

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= limit) {
    hits.set(key, timestamps)
    return true
  }

  timestamps.push(now)
  hits.set(key, timestamps)
  return false
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() ?? 'unknown'
}

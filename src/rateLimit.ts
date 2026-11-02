export interface RateLimit {
  limit: number
  windowMs: number
}

export type RateDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number }

/**
 * A fixed window per key. The window starts at the key's first request. Callers pass known
 * customer IDs only, so the map stays as small as the customer list.
 */
export function createRateLimiter({ limit, windowMs }: RateLimit, now: () => number) {
  const windows = new Map<string, { startedAt: number; count: number }>()
  return {
    check(key: string): RateDecision {
      const at = now()
      const current = windows.get(key)
      if (!current || at - current.startedAt >= windowMs) {
        windows.set(key, { startedAt: at, count: 1 })
        return { allowed: true }
      }
      if (current.count < limit) {
        current.count++
        return { allowed: true }
      }
      return { allowed: false, retryAfterSeconds: Math.ceil((current.startedAt + windowMs - at) / 1000) }
    },
  }
}

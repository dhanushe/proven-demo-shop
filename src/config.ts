export interface Config {
  port: number
  billingHost: string
  supportEmail: string
  orderRateLimit: number
  orderRateWindowSeconds: number
}

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  return {
    port: Number(env.PORT ?? 8080),
    billingHost: env.BILLING_HOST ?? 'billing.brightwave.internal',
    supportEmail: env.SUPPORT_EMAIL ?? 'support@brightwave-supply.com',
    orderRateLimit: positiveInt(env.ORDER_RATE_LIMIT, 60),
    orderRateWindowSeconds: positiveInt(env.ORDER_RATE_WINDOW_SECONDS, 60),
  }
}

export interface Config {
  port: number
  billingHost: string
  supportEmail: string
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  return {
    port: Number(env.PORT ?? 8080),
    billingHost: env.BILLING_HOST ?? 'billing.brightwave.internal',
    supportEmail: env.SUPPORT_EMAIL ?? 'support@brightwave-supply.com',
  }
}

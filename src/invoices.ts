import type { Order } from './orders.ts'

export interface Invoice {
  id: string
  orderId: string
  customerId: string
  amountCents: number
  issuedOn: string
  dueOn: string
  paymentUrl: string
  supportEmail: string
}

/** The due date of an invoice. Terms are whole calendar months (BW-142). Dates are YYYY-MM-DD in UTC. */
export function dueDate(issuedOn: string, termMonths: number): string {
  const due = new Date(`${issuedOn}T00:00:00Z`)
  due.setUTCMonth(due.getUTCMonth() + termMonths)
  return due.toISOString().slice(0, 10)
}

export function buildInvoice(input: { id: string; order: Order; issuedOn: string; termMonths: number; billingHost: string; supportEmail: string }): Invoice {
  const { id, order, issuedOn, termMonths, billingHost, supportEmail } = input
  return {
    id,
    orderId: order.id,
    customerId: order.customerId,
    amountCents: order.totalCents,
    issuedOn,
    dueOn: dueDate(issuedOn, termMonths),
    paymentUrl: `https://${billingHost}/pay/${id}`,
    supportEmail,
  }
}

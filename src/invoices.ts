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
  const issued = new Date(`${issuedOn}T00:00:00Z`)
  // Day 0 of the following month is the last day of the month the term ends in.
  const due = new Date(Date.UTC(issued.getUTCFullYear(), issued.getUTCMonth() + termMonths + 1, 0))
  // A short month ends the term on its last day. It must not spill into the next month.
  due.setUTCDate(Math.min(issued.getUTCDate(), due.getUTCDate()))
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

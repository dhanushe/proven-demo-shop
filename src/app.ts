import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadConfig, type Config } from './config.ts'
import { loadCustomers, type Customer } from './customers.ts'
import { buildInvoice, type Invoice } from './invoices.ts'
import { itemsError, orderTotal, type Order, type OrderItem } from './orders.ts'

const STATUS_PAGE = join(import.meta.dirname, '..', 'public', 'index.html')

export interface AppOptions {
  config?: Config
  customers?: Map<string, Customer>
  now?: () => number
}

export interface App {
  fetch(request: Request): Promise<Response>
}

function json(status: number, body: unknown): Response {
  return Response.json(body, { status })
}

function fail(status: number, error: string, message: string): Response {
  return json(status, { error, message })
}

export function createApp(options: AppOptions = {}): App {
  const config = options.config ?? loadConfig()
  const customers = options.customers ?? loadCustomers()
  const now = options.now ?? Date.now
  const orders = new Map<string, Order>()
  const invoices = new Map<string, Invoice>()
  const invoiceByOrder = new Map<string, Invoice>()

  async function createOrder(request: Request): Promise<Response> {
    const body = (await request.json().catch(() => null)) as { customerId?: unknown; items?: unknown } | null
    if (body === null || typeof body.customerId !== 'string') return fail(400, 'invalid_order', 'customerId is required')
    if (!customers.has(body.customerId)) return fail(404, 'unknown_customer', `No customer ${body.customerId}`)
    const problem = itemsError(body.items)
    if (problem) return fail(400, 'invalid_order', problem)
    const items = body.items as OrderItem[]
    const order: Order = {
      id: `ORD-${1000 + orders.size + 1}`,
      customerId: body.customerId,
      items,
      totalCents: orderTotal(items),
      createdAt: new Date(now()).toISOString(),
    }
    orders.set(order.id, order)
    return json(201, order)
  }

  function createInvoice(orderId: string): Response {
    const order = orders.get(orderId)
    if (!order) return fail(404, 'unknown_order', `No order ${orderId}`)
    if (invoiceByOrder.has(orderId)) return fail(409, 'already_invoiced', `Order ${orderId} already has an invoice`)
    const invoice = buildInvoice({
      id: `INV-${1000 + invoices.size + 1}`,
      order,
      issuedOn: new Date(now()).toISOString().slice(0, 10),
      termMonths: customers.get(order.customerId)!.payment_terms_months,
      billingHost: config.billingHost,
      supportEmail: config.supportEmail,
    })
    invoices.set(invoice.id, invoice)
    invoiceByOrder.set(orderId, invoice)
    return json(201, invoice)
  }

  return {
    async fetch(request) {
      const { pathname } = new URL(request.url)
      const parts = pathname.split('/').filter(Boolean)
      const route = `${request.method} /${parts[0] ?? ''}`
      if (route === 'GET /health') return json(200, { ok: true })
      if (route === 'GET /status') return new Response(await readFile(STATUS_PAGE), { headers: { 'content-type': 'text/html; charset=utf-8' } })
      if (route === 'POST /orders' && parts.length === 1) return createOrder(request)
      if (route === 'GET /orders' && parts.length === 2) {
        const order = orders.get(parts[1]!)
        return order ? json(200, order) : fail(404, 'unknown_order', `No order ${parts[1]}`)
      }
      if (route === 'POST /orders' && parts.length === 3 && parts[2] === 'invoice') return createInvoice(parts[1]!)
      if (route === 'GET /invoices' && parts.length === 2) {
        const invoice = invoices.get(parts[1]!)
        return invoice ? json(200, invoice) : fail(404, 'unknown_invoice', `No invoice ${parts[1]}`)
      }
      return fail(404, 'not_found', `No route for ${request.method} ${pathname}`)
    },
  }
}

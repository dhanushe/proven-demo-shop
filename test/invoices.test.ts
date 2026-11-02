import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createApp } from '../src/app.ts'
import { dueDate } from '../src/invoices.ts'

const ITEMS = [{ sku: 'BOX-40', quantity: 2, unitPriceCents: 1250 }]

async function placeOrder(app: ReturnType<typeof createApp>, customerId: string): Promise<string> {
  const res = await app.fetch(new Request('http://test/orders', { method: 'POST', body: JSON.stringify({ customerId, items: ITEMS }) }))
  return (await res.json()).id
}

function invoice(app: ReturnType<typeof createApp>, orderId: string): Promise<Response> {
  return app.fetch(new Request(`http://test/orders/${orderId}/invoice`, { method: 'POST' }))
}

test('the due date adds whole months', () => {
  assert.equal(dueDate('2026-03-15', 1), '2026-04-15')
  assert.equal(dueDate('2026-03-15', 2), '2026-05-15')
})

test('the due date crosses a year', () => {
  assert.equal(dueDate('2026-12-15', 1), '2027-01-15')
})

test('an invoice uses the terms of its customer', async () => {
  const app = createApp({ now: () => Date.UTC(2026, 2, 15) })
  const res = await invoice(app, await placeOrder(app, 'cus_1002'))
  assert.equal(res.status, 201)
  const body = await res.json()
  assert.equal(body.amountCents, 2500)
  assert.equal(body.issuedOn, '2026-03-15')
  assert.equal(body.dueOn, '2026-05-15')
})

test('an invoice links to the billing host and names support', async () => {
  const app = createApp()
  const body = await (await invoice(app, await placeOrder(app, 'cus_1001'))).json()
  assert.equal(body.paymentUrl, `https://billing.brightwave.internal/pay/${body.id}`)
  assert.equal(body.supportEmail, 'support@brightwave-supply.com')
})

test('an order is invoiced once', async () => {
  const app = createApp()
  const orderId = await placeOrder(app, 'cus_1001')
  assert.equal((await invoice(app, orderId)).status, 201)
  assert.equal((await invoice(app, orderId)).status, 409)
})

test('an invoice for an unknown order is a 404', async () => {
  assert.equal((await invoice(createApp(), 'ORD-404')).status, 404)
})

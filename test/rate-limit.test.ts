import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createApp, type App } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'

const ITEMS = [{ sku: 'BOX-40', quantity: 1, unitPriceCents: 1250 }]

function placeOrder(app: App, customerId = 'cus_1001'): Promise<Response> {
  return app.fetch(new Request('http://test/orders', { method: 'POST', body: JSON.stringify({ customerId, items: ITEMS }) }))
}

/** An app limited to two orders a minute, with a clock the test moves. */
function limitedApp() {
  const clock = { ms: Date.UTC(2026, 2, 10) }
  const app = createApp({ rateLimit: { limit: 2, windowMs: 60_000 }, now: () => clock.ms })
  return { app, clock }
}

test('accepts orders up to the limit, then answers 429', async () => {
  const { app } = limitedApp()
  assert.equal((await placeOrder(app)).status, 201)
  assert.equal((await placeOrder(app)).status, 201)
  assert.equal((await placeOrder(app)).status, 429)
})

test('the 429 names the error and when to retry', async () => {
  const { app, clock } = limitedApp()
  await placeOrder(app)
  await placeOrder(app)
  clock.ms += 45_500
  const res = await placeOrder(app)
  assert.equal(res.status, 429)
  assert.equal(res.headers.get('retry-after'), '15')
  assert.equal((await res.json()).error, 'rate_limited')
})

test('each customer has a separate limit', async () => {
  const { app } = limitedApp()
  await placeOrder(app, 'cus_1001')
  await placeOrder(app, 'cus_1001')
  assert.equal((await placeOrder(app, 'cus_1001')).status, 429)
  assert.equal((await placeOrder(app, 'cus_1002')).status, 201)
})

test('a customer can order again when the window ends', async () => {
  const { app, clock } = limitedApp()
  await placeOrder(app)
  await placeOrder(app)
  clock.ms += 59_999
  assert.equal((await placeOrder(app)).status, 429)
  clock.ms += 1
  assert.equal((await placeOrder(app)).status, 201)
})

test('a limited customer can still read orders and create invoices', async () => {
  const { app } = limitedApp()
  const order = await (await placeOrder(app)).json()
  await placeOrder(app)
  assert.equal((await placeOrder(app)).status, 429)
  assert.equal((await app.fetch(new Request(`http://test/orders/${order.id}`))).status, 200)
  assert.equal((await app.fetch(new Request(`http://test/orders/${order.id}/invoice`, { method: 'POST' }))).status, 201)
})

test('the limit defaults to 60 orders a minute', async () => {
  const app = createApp({ now: () => Date.UTC(2026, 2, 10) })
  for (let i = 0; i < 60; i++) assert.equal((await placeOrder(app)).status, 201)
  assert.equal((await placeOrder(app)).status, 429)
})

test('ORDER_RATE_LIMIT and ORDER_RATE_WINDOW_SECONDS set the limit', async () => {
  const clock = { ms: Date.UTC(2026, 2, 10) }
  const app = createApp({ config: loadConfig({ ORDER_RATE_LIMIT: '1', ORDER_RATE_WINDOW_SECONDS: '10' }), now: () => clock.ms })
  assert.equal((await placeOrder(app)).status, 201)
  const res = await placeOrder(app)
  assert.equal(res.status, 429)
  assert.equal(res.headers.get('retry-after'), '10')
  clock.ms += 10_000
  assert.equal((await placeOrder(app)).status, 201)
})

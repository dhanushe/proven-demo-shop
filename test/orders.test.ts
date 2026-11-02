import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createApp } from '../src/app.ts'

const ITEMS = [
  { sku: 'BOX-40', quantity: 3, unitPriceCents: 1250 },
  { sku: 'TAPE-6', quantity: 1, unitPriceCents: 499 },
]

function post(path: string, body: unknown): Request {
  return new Request(`http://test${path}`, { method: 'POST', body: JSON.stringify(body) })
}

test('creates an order and totals its items', async () => {
  const app = createApp({ now: () => Date.UTC(2026, 2, 10) })
  const res = await app.fetch(post('/orders', { customerId: 'cus_1001', items: ITEMS }))
  assert.equal(res.status, 201)
  const order = await res.json()
  assert.equal(order.totalCents, 4249)
  assert.equal(order.createdAt, '2026-03-10T00:00:00.000Z')
})

test('reads an order back', async () => {
  const app = createApp()
  const created = await (await app.fetch(post('/orders', { customerId: 'cus_1002', items: ITEMS }))).json()
  const res = await app.fetch(new Request(`http://test/orders/${created.id}`))
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), created)
})

test('rejects an unknown customer', async () => {
  const res = await createApp().fetch(post('/orders', { customerId: 'cus_9999', items: ITEMS }))
  assert.equal(res.status, 404)
  assert.equal((await res.json()).error, 'unknown_customer')
})

test('rejects invalid items', async () => {
  const app = createApp()
  for (const items of [[], [{ sku: '', quantity: 1, unitPriceCents: 1 }], [{ sku: 'A', quantity: 0, unitPriceCents: 1 }], [{ sku: 'A', quantity: 1, unitPriceCents: 1.5 }]]) {
    const res = await app.fetch(post('/orders', { customerId: 'cus_1001', items }))
    assert.equal(res.status, 400)
  }
})

test('rejects a body that is not JSON', async () => {
  const res = await createApp().fetch(new Request('http://test/orders', { method: 'POST', body: 'not json' }))
  assert.equal(res.status, 400)
})

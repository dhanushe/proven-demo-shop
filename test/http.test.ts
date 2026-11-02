import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { test } from 'node:test'
import { createApp } from '../src/app.ts'
import { serve } from '../src/http.ts'

test('serves health, the status page and orders over HTTP', async (t) => {
  const server = await serve(createApp(), 0)
  t.after(() => server.close())
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  assert.deepEqual(await (await fetch(`${base}/health`)).json(), { ok: true })

  const page = await fetch(`${base}/status`)
  assert.match(page.headers.get('content-type')!, /text\/html/)
  assert.match(await page.text(), /Brightwave Supply status/)

  const order = await fetch(`${base}/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ customerId: 'cus_1001', items: [{ sku: 'BOX-40', quantity: 1, unitPriceCents: 1250 }] }),
  })
  assert.equal(order.status, 201)
})

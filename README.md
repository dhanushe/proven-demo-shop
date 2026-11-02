# Brightwave Supply orders

The order and invoicing API behind Brightwave Supply. Support: support@brightwave-supply.com.

It needs Node 22 and has no dependencies. Node strips the TypeScript types at runtime, so there is no build step.

## Run it

    npm start
    node --test

`npm start` uses the defaults below. To change them, copy `.env.example` to `.env`, edit it, and pass it to Node:

    node --env-file=.env --experimental-strip-types --no-warnings src/main.ts

The status page is at `/status`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | Port the API listens on. |
| `BILLING_HOST` | `billing.brightwave.internal` | Host in the payment link of each invoice. |
| `SUPPORT_EMAIL` | `support@brightwave-supply.com` | Address printed on each invoice. |
| `ORDER_RATE_LIMIT` | `60` | Orders one customer may create per window. |
| `ORDER_RATE_WINDOW_SECONDS` | `60` | Length of the rate limit window, in seconds. |

A rate limit value that is not a positive whole number falls back to its default.

## API

| Route | Purpose | Answers |
| --- | --- | --- |
| `POST /orders` | Create an order. | `201`, `400` invalid order, `404` unknown customer, `429` over the rate limit |
| `GET /orders/:id` | Read an order. | `200`, `404` |
| `POST /orders/:id/invoice` | Invoice an order, once. | `201`, `404`, `409` already invoiced |
| `GET /invoices/:id` | Read an invoice. | `200`, `404` |
| `GET /health` | Check the service is up. | `200` |
| `GET /status` | The status page. | `200` |

An order body looks like this:

    {
      "customerId": "cus_1001",
      "items": [{ "sku": "BOX-40", "quantity": 3, "unitPriceCents": 1250 }]
    }

Errors are JSON with an `error` code and a `message`. A `429` also has a `Retry-After` header, in seconds.

## Invoices

An invoice is due after the customer's payment terms, in whole calendar months. When the target month is shorter than the issue date needs, the due date is that month's last day.

## Rate limits

Each customer has a separate fixed window, which starts at their first order. Reading orders and creating invoices are not limited.

## Customers

`fixtures/customers.json` holds the customers the API knows. There is no database: orders and invoices live in memory and are lost on restart.

## Demo pull requests

This repository is the demo source for PR replay in [Proven](https://getproven.me). Brightwave Supply and its customers are fictional. Each pull request matches one assessment mode.

| Pull request | Mode | What it demonstrates |
| --- | --- | --- |
| [#1](https://github.com/dhanushe/proven-demo-shop/pull/1) Per-customer rate limiting | Has tests | A feature whose own tests fail before it and pass after it. They become the hidden tests. |
| [#2](https://github.com/dhanushe/proven-demo-shop/pull/2) Month-end due dates | Proven writes tests | A bug fix with no tests, so Proven writes tests that fail before the fix and pass after it. |
| [#3](https://github.com/dhanushe/proven-demo-shop/pull/3) Status page styles | Browser checks | A styles-only change to `public/index.html`, checked in a headless browser. |
| [#4](https://github.com/dhanushe/proven-demo-shop/pull/4) README and `.env.example` | Judged | A docs and config change, graded against acceptance criteria with no automated tests. |

The company name, `support@brightwave-supply.com`, `billing.brightwave.internal`, ticket IDs such as BW-142 and the people in `fixtures/customers.json` are there for the Sanitize step to find.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Customer {
  id: string
  company: string
  contact_name: string
  payment_terms_months: number
}

const FIXTURE = join(import.meta.dirname, '..', 'fixtures', 'customers.json')

export function loadCustomers(path: string = FIXTURE): Map<string, Customer> {
  const rows = JSON.parse(readFileSync(path, 'utf8')) as Customer[]
  return new Map(rows.map((c) => [c.id, c]))
}

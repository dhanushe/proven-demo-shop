export interface OrderItem {
  sku: string
  quantity: number
  unitPriceCents: number
}

export interface Order {
  id: string
  customerId: string
  items: OrderItem[]
  totalCents: number
  createdAt: string
}

/** The first problem with a list of items, or null when every item is valid. */
export function itemsError(items: unknown): string | null {
  if (!Array.isArray(items) || items.length === 0) return 'items must be a non-empty list'
  for (const item of items as Partial<OrderItem>[]) {
    if (typeof item?.sku !== 'string' || item.sku === '') return 'each item needs a sku'
    if (!Number.isInteger(item.quantity) || item.quantity! < 1) return 'quantity must be a positive whole number'
    if (!Number.isInteger(item.unitPriceCents) || item.unitPriceCents! < 0) return 'unitPriceCents must be a whole number of cents'
  }
  return null
}

export function orderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0)
}

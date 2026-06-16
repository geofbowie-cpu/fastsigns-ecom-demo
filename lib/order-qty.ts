// Shared minimum-order-quantity + pack-increment logic. Used by the cart UI
// and the submit route so the rules can't drift between client and server.

export function effectiveMin(min?: number | null): number {
  return min && min > 1 ? min : 1
}

export function effectiveStep(increment?: number | null): number {
  return increment && increment > 1 ? increment : 1
}

/** Smallest valid quantity >= desired, honoring the minimum and pack increment. */
export function normalizeQty(desired: number, min?: number | null, increment?: number | null): number {
  const m = effectiveMin(min)
  const step = effectiveStep(increment)
  let q = Math.max(Math.floor(desired) || m, m)
  if (step > 1) {
    const over = q - m
    q = m + Math.ceil(over / step) * step
  }
  return q
}

/** True when qty meets the minimum and lands on a valid pack increment. */
export function isValidQty(qty: number, min?: number | null, increment?: number | null): boolean {
  const m = effectiveMin(min)
  const step = effectiveStep(increment)
  if (!Number.isInteger(qty) || qty < m) return false
  if (step > 1 && (qty - m) % step !== 0) return false
  return true
}

/** Short human label, e.g. "Minimum 100" or "Minimum 100, in packs of 100". */
export function minLabel(min?: number | null, increment?: number | null): string | null {
  const m = effectiveMin(min)
  const step = effectiveStep(increment)
  if (m <= 1 && step <= 1) return null
  if (step > 1) return `Minimum ${m}, in packs of ${step}`
  return `Minimum ${m}`
}

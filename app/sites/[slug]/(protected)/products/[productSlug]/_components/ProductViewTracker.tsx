"use client"

import { useEffect } from "react"
import { trackProductView } from "@/lib/track"

export default function ProductViewTracker({
  productSlug,
  productName,
  category,
  tenantSlug,
}: {
  productSlug: string
  productName: string
  category: string
  tenantSlug: string
}) {
  useEffect(() => {
    trackProductView(productSlug, productName, category, tenantSlug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

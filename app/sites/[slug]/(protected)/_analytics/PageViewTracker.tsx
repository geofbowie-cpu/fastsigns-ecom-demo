"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { trackPageView } from "@/lib/track"

// Logs a page_view to our own store (and GTM) on each storefront navigation.
// `disabled` is set for master-admin previews so they don't inflate traffic.
export default function PageViewTracker({
  slug,
  disabled,
}: {
  slug: string
  disabled?: boolean
}) {
  const pathname = usePathname()
  useEffect(() => {
    if (disabled) return
    trackPageView(pathname || `/sites/${slug}`, slug)
  }, [pathname, slug, disabled])
  return null
}

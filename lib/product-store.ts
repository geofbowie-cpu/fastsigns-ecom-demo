"use client"

import { useEffect, useState, useCallback } from "react"
import { products as defaultProducts } from "@/brand.config"
import type { Product } from "@/brand.config"

const STORAGE_KEY = "ecom_products_v1"

function generateSku(category: string, index: number): string {
  const prefix = category.replace(/-/g, "").toUpperCase().slice(0, 3)
  return `${prefix}-${String(index + 1).padStart(4, "0")}`
}

function seeded(): Product[] {
  return defaultProducts.map((p, i) => ({
    ...p,
    sku: p.sku ?? generateSku(p.category, i),
  }))
}

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return seeded()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const s = seeded()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  return s
}

function persist(products: Product[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }
}

export function generateSlug(name: string, existing: Product[]): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  if (!existing.find((p) => p.slug === base)) return base
  let i = 2
  while (existing.find((p) => p.slug === `${base}-${i}`)) i++
  return `${base}-${i}`
}

export function autoSku(category: string): string {
  const prefix = category.replace(/-/g, "").toUpperCase().slice(0, 3)
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${rand}`
}

export function useProductStore() {
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setProducts(loadProducts())
    setLoaded(true)
  }, [])

  const save = useCallback((updated: Product[]) => {
    persist(updated)
    setProducts([...updated])
  }, [])

  const createProduct = useCallback(
    (product: Product) => {
      save([...products, product])
    },
    [products, save]
  )

  const updateProduct = useCallback(
    (slug: string, updates: Partial<Product>) => {
      save(products.map((p) => (p.slug === slug ? { ...p, ...updates } : p)))
    },
    [products, save]
  )

  const deleteProduct = useCallback(
    (slug: string) => {
      save(products.filter((p) => p.slug !== slug))
    },
    [products, save]
  )

  const getProduct = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products]
  )

  const resetToDefaults = useCallback(() => {
    const s = seeded()
    persist(s)
    setProducts(s)
  }, [])

  return { products, loaded, createProduct, updateProduct, deleteProduct, getProduct, resetToDefaults }
}

// GET  /api/master/products           — list all (with optional ?category= filter)
// POST /api/master/products           — create / update (upsert by slug)
// DELETE /api/master/products?slug=   — delete by slug

import { NextResponse } from "next/server"
import { getAllProducts, upsertProduct, deleteProduct } from "@/lib/products-db"
import { assertMasterAuth, apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { ProductUpsertSchema } from "@/lib/schemas"

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export async function GET() {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  try {
    const products = await getAllProducts()
    return NextResponse.json(products)
  } catch (e: any) {
    logger.error("products.list failed", { error: e.message })
    return apiError(e.message, 500)
  }
}

export async function POST(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const result = ProductUpsertSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  const body = result.data
  const slug = body.slug?.trim() || slugify(body.name)
  if (!slug) return apiError("Could not derive slug from name")
  try {
    const p = await upsertProduct({ ...body, slug })
    logger.info("product.upsert", { slug })
    return NextResponse.json(p)
  } catch (e: any) {
    logger.error("products.upsert failed", { error: e.message })
    return apiError(e.message, 500)
  }
}

export async function DELETE(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  if (!slug) return apiError("slug param required")
  try {
    await deleteProduct(slug)
    logger.info("product.delete", { slug })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    logger.error("products.delete failed", { error: e.message })
    return apiError(e.message, 500)
  }
}

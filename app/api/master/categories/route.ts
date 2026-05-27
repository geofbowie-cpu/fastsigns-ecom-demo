// CRUD for categories. Master-auth gated.
// GET  /api/master/categories          — list all
// POST /api/master/categories          — create or update (upsert by slug)
// DELETE /api/master/categories?slug=  — delete by slug

import { NextResponse } from "next/server"
import { getAllCategories, upsertCategory, deleteCategory } from "@/lib/products-db"
import { assertMasterAuth, apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { CategoryUpsertSchema } from "@/lib/schemas"

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  try {
    const cats = await getAllCategories()
    return NextResponse.json(cats)
  } catch (e: any) {
    logger.error("categories.list failed", { error: e.message })
    return apiError(e.message, 500)
  }
}

export async function POST(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const result = CategoryUpsertSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  const body = result.data

  const slug = body.slug?.trim() || slugify(body.name)
  if (!slug) {
    return apiError("Could not derive slug from name")
  }

  try {
    const cat = await upsertCategory({
      slug,
      name: body.name.trim(),
      icon: body.icon?.trim() || "Box",
      description: body.description?.trim() || "",
      image_url: body.image_url ?? null,
      product_slugs: body.product_slugs ?? [],
    })
    logger.info("category.upsert", { slug })
    return NextResponse.json(cat)
  } catch (e: any) {
    logger.error("categories.upsert failed", { error: e.message, slug })
    return apiError(e.message, 500)
  }
}

export async function DELETE(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  if (!slug) {
    return apiError("slug param required")
  }
  try {
    await deleteCategory(slug)
    logger.info("category.delete", { slug })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    logger.error("categories.delete failed", { error: e.message, slug })
    return apiError(e.message, 500)
  }
}

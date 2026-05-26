// CRUD for categories. Master-auth gated.
// GET  /api/master/categories          — list all
// POST /api/master/categories          — create or update (upsert by slug)
// DELETE /api/master/categories?slug=  — delete by slug

import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { getAllCategories, upsertCategory, deleteCategory } from "@/lib/products-db"

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const cats = await getAllCategories()
  return NextResponse.json(cats)
}

export async function POST(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let body: {
    slug?: string
    name: string
    icon?: string
    description?: string
    image_url?: string | null
    product_slugs?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const slug = body.slug?.trim() || slugify(body.name)
  if (!slug) {
    return NextResponse.json({ error: "Could not derive slug from name" }, { status: 400 })
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
    return NextResponse.json(cat)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  if (!slug) {
    return NextResponse.json({ error: "slug param required" }, { status: 400 })
  }
  try {
    await deleteCategory(slug)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

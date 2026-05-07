import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

// Accepts a base64-encoded PNG/JPEG from the client-side canvas composite
// and saves it to Supabase Storage.
export async function POST(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { image_base64: string; tenant_slug: string; mime?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { image_base64, tenant_slug, mime = "image/jpeg" } = body
  if (!image_base64 || !tenant_slug) {
    return NextResponse.json({ error: "image_base64 and tenant_slug are required" }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(
      image_base64.replace(/^data:[^;]+;base64,/, ""),
      "base64"
    )
    const ext = mime.includes("png") ? "png" : "jpg"

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const filename = `branded/${tenant_slug}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("tenant-assets")
      .upload(filename, buffer, { contentType: mime, upsert: false })

    if (uploadError) throw new Error(uploadError.message)

    const { data } = supabase.storage.from("tenant-assets").getPublicUrl(filename)
    return NextResponse.json({ url: data.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { createClient } from "@supabase/supabase-js"

const DM_BASE = "https://app.dynamicmockups.com/api/v1"

export async function POST(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.DYNAMIC_MOCKUPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "DYNAMIC_MOCKUPS_API_KEY not configured" }, { status: 500 })
  }

  let body: { mockup_uuid: string; smart_object_uuid: string; image_url: string; tenant_slug: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { mockup_uuid, smart_object_uuid, image_url, tenant_slug } = body
  if (!mockup_uuid || !smart_object_uuid || !image_url) {
    return NextResponse.json(
      { error: "mockup_uuid, smart_object_uuid, and image_url are required" },
      { status: 400 }
    )
  }

  // 1. Call Dynamic Mockups render API
  const dmRes = await fetch(`${DM_BASE}/renders`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      mockup_uuid,
      smart_objects: [
        {
          uuid: smart_object_uuid,
          asset: {
            type: "image",
            url: image_url,
          },
        },
      ],
    }),
  })

  if (!dmRes.ok) {
    const text = await dmRes.text()
    return NextResponse.json(
      { error: `Dynamic Mockups render failed: ${dmRes.status} ${text}` },
      { status: dmRes.status }
    )
  }

  const dmJson = await dmRes.json()
  // DM returns export_path at data.export_path or data.data.export_path
  const exportPath: string =
    dmJson?.data?.export_path ?? dmJson?.data?.data?.export_path ?? dmJson?.export_path

  if (!exportPath) {
    return NextResponse.json(
      { error: "No export_path in Dynamic Mockups response", raw: dmJson },
      { status: 500 }
    )
  }

  // 2. Download the rendered image and re-upload to Supabase Storage
  //    so we own the asset and it doesn't expire
  try {
    const imgRes = await fetch(exportPath)
    if (!imgRes.ok) throw new Error(`Failed to fetch rendered image: ${imgRes.status}`)

    const buffer = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get("content-type") ?? "image/png"
    const ext = contentType.includes("jpeg") ? "jpg" : "png"

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const slug = tenant_slug ?? "shared"
    const filename = `mockups/${slug}/${Date.now()}-${mockup_uuid.slice(0, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("tenant-assets")
      .upload(filename, buffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage
      .from("tenant-assets")
      .getPublicUrl(filename)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (e: any) {
    // If Supabase upload fails, fall back to the DM URL directly
    console.warn("Supabase upload failed, returning DM URL directly:", e.message)
    return NextResponse.json({ url: exportPath, warning: "Stored at Dynamic Mockups (not re-uploaded)" })
  }
}

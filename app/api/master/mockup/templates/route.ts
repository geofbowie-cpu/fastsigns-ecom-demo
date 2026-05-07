import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"

const DM_BASE = "https://app.dynamicmockups.com/api/v1"

export async function GET() {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.DYNAMIC_MOCKUPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "DYNAMIC_MOCKUPS_API_KEY not configured" }, { status: 500 })
  }

  try {
    const res = await fetch(`${DM_BASE}/mockups?per_page=100`, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // cache 5 min — template list rarely changes
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Dynamic Mockups API error: ${res.status} ${text}` },
        { status: res.status }
      )
    }

    const json = await res.json()

    // Normalise: return array of { uuid, name, preview_url, smart_objects }
    // DM returns { data: [...] } or { data: { data: [...] } } depending on version
    const raw: any[] = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.data?.data)
      ? json.data.data
      : []

    const templates = raw.map((t: any) => ({
      uuid: t.uuid,
      name: t.name ?? t.title ?? t.uuid,
      preview_url: t.preview_url ?? t.thumbnail_url ?? null,
      smart_objects: (t.smart_objects ?? []).map((so: any) => ({
        uuid: so.uuid,
        name: so.name ?? so.uuid,
      })),
    }))

    return NextResponse.json({ templates, _raw: json })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

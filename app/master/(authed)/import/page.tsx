"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import JSZip from "jszip"

function slugifyClient(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "svg"])

type ImportResult = {
  ok: boolean
  import_tag: string | null
  products: number
  images_from_zip: number
  categories_created: number
  mode: string
  error?: string
  errors?: string[]
}

const CSV_TEMPLATE = `slug,name,category,starting_price,unit,short_desc,description,sizes,materials,icon,featured,lead_time,tags,image_url,gradient_from,gradient_to,category_name,category_icon,category_description
vinyl-banner,Vinyl Banner,banners,49,per banner,Durable full-color banners,Premium vinyl banners...,2x4ft|3x6ft|4x8ft,13oz Scrim Vinyl|Mesh Vinyl,🚩,true,3-5 business days,outdoor|indoor|event,,#1e3a5f,#2d6a9f,,,
my-custom-product,My Custom Product,my-category,99,per unit,Short description here,Long description here,Small|Medium|Large,Material A|Material B,📦,false,5-7 business days,tag1|tag2,,#0057a8,#003d7a,My Category,📦,Category description here`

export default function ImportPage() {
  const csvInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [importTag, setImportTag] = useState("")
  const [mode, setMode] = useState<"add" | "replace">("add")
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!csvFile) return
    setBusy(true)
    setResult(null)
    setProgress(null)

    try {
      // ── 1. Extract images from the ZIP in the browser and upload them one
      //    at a time. The main import endpoint is capped at 4.5 MB so we can't
      //    send the whole ZIP through it. Each image is small enough on its own.
      const manifest: Record<string, string> = {}

      if (zipFile) {
        const zip = await JSZip.loadAsync(zipFile)
        const entries = Object.values(zip.files).filter((e) => {
          if (e.dir) return false
          // Skip macOS resource-fork metadata: __MACOSX/* paths and any file
          // basename that starts with `._`. Without this, the AppleDouble
          // metadata wins the slug match and you get 212-byte "images".
          if (e.name.startsWith("__MACOSX/") || e.name.includes("/__MACOSX/")) return false
          const base = e.name.split("/").pop() ?? ""
          if (base.startsWith("._")) return false
          const dot = base.lastIndexOf(".")
          if (dot < 0) return false
          return IMAGE_EXTS.has(base.slice(dot + 1).toLowerCase())
        })

        setProgress({ done: 0, total: entries.length, current: "" })

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i]
          const base = entry.name.split("/").pop() ?? entry.name
          const dot = base.lastIndexOf(".")
          const slug = slugifyClient(base.slice(0, dot))
          const ext = base.slice(dot + 1).toLowerCase()
          const mime =
            ext === "png" ? "image/png" :
            ext === "webp" ? "image/webp" :
            ext === "svg" ? "image/svg+xml" :
            "image/jpeg"

          setProgress({ done: i, total: entries.length, current: slug })

          const blob = await entry.async("blob")
          const file = new File([blob], `${slug}.${ext}`, { type: mime })

          const fd = new FormData()
          fd.append("file", file)
          fd.append("slug", slug)
          if (importTag.trim()) fd.append("import_tag", importTag.trim())

          const r = await fetch("/api/master/import/upload-image", { method: "POST", body: fd })
          if (r.ok) {
            const j = await r.json()
            if (j.url) manifest[slug] = j.url
          }
          // If a single image fails (e.g. too big), skip it — we'll still
          // import the row, just without an image.
        }

        setProgress({ done: entries.length, total: entries.length, current: "" })
      }

      // ── 2. Submit CSV + manifest (no ZIP) to the main import endpoint
      const fd = new FormData()
      fd.append("csv", csvFile)
      if (Object.keys(manifest).length > 0) {
        fd.append("image_manifest", JSON.stringify(manifest))
      }
      if (importTag.trim()) fd.append("import_tag", importTag.trim())
      fd.append("mode", mode)

      const res = await fetch("/api/master/import", { method: "POST", body: fd })
      const json = await res.json()
      setResult(json)
    } catch (err: any) {
      setResult({
        ok: false,
        import_tag: null,
        products: 0,
        images_from_zip: 0,
        categories_created: 0,
        mode,
        error: err?.message ?? "Import failed",
      })
    } finally {
      setProgress(null)
      setBusy(false)
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "product-import-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/master" className="text-xs text-gray-500 hover:text-gray-900 mb-1 inline-flex items-center gap-1">
          ← All sites
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Import products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV to add or replace products in the global catalog. An optional ZIP of product images (named{" "}
          <code className="font-mono bg-gray-100 px-1 rounded text-xs">slug.png</code>) gets uploaded to Storage automatically.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* CSV upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">CSV file <span className="text-red-500">*</span></h2>

          <div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-xs text-blue-600 hover:underline mb-3 block"
            >
              ↓ Download template CSV
            </button>

            {csvFile ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-lg">✓</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{csvFile.name}</div>
                  <div className="text-xs text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setCsvFile(null); if (csvInputRef.current) csvInputRef.current.value = "" }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-8 text-center bg-gray-50 transition-colors"
              >
                <div className="mb-2 flex justify-center text-gray-300"><svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                <div className="text-sm font-semibold text-gray-700">Drop CSV here or click to upload</div>
                <div className="text-xs text-gray-400 mt-1">.csv files only</div>
              </button>
            )}
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setCsvFile(f) }}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">Required columns</p>
            <p className="text-xs text-gray-500 font-mono">slug, name, category, starting_price</p>
            <p className="text-xs font-semibold text-gray-700 mt-2 mb-1">Optional columns</p>
            <p className="text-xs text-gray-500 font-mono leading-relaxed">
              unit, short_desc, description, icon, featured, lead_time,
              image_url, gradient_from, gradient_to,
              sizes (pipe-separated), materials (pipe-separated), tags (pipe-separated)
            </p>
            <p className="text-xs font-semibold text-gray-700 mt-2 mb-1">Auto-create categories</p>
            <p className="text-xs text-gray-500 font-mono">
              category_name, category_icon, category_description
            </p>
          </div>
        </div>

        {/* ZIP upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-gray-900">Product images <span className="text-gray-400 font-normal">(optional ZIP)</span></h2>
          <p className="text-xs text-gray-500">
            Zip your product images and name each file <code className="font-mono bg-gray-100 px-1 rounded">slug.jpg</code> (or .png / .webp). They'll be uploaded to Storage and linked automatically. Max 10 MB per image.
          </p>

          {zipFile ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 text-lg">✓</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{zipFile.name}</div>
                <div className="text-xs text-gray-500">{(zipFile.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                type="button"
                onClick={() => { setZipFile(null); if (zipInputRef.current) zipInputRef.current.value = "" }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => zipInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-6 text-center bg-gray-50 transition-colors"
            >
              <div className="mb-2 flex justify-center text-gray-300"><svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div className="text-sm font-semibold text-gray-700">Drop ZIP here or click to upload</div>
              <div className="text-xs text-gray-400 mt-1">.zip files only</div>
            </button>
          )}
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setZipFile(f) }}
          />
        </div>

        {/* Import tag + mode */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Import options</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Import tag <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Label this batch (e.g. <code className="font-mono bg-gray-100 px-1 rounded">reddy-2024</code>). Tenants can then select this tag to include only these products on their site.
            </p>
            <input
              type="text"
              value={importTag}
              onChange={(e) => setImportTag(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="e.g. reddy-2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Mode</label>
            <div className="flex gap-3">
              {(["add", "replace"] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-sm text-gray-700 capitalize">{m}</span>
                  <span className="text-xs text-gray-400">
                    {m === "add"
                      ? "— upsert (add new, update existing)"
                      : "— delete all with this tag, then insert"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              result.ok
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {result.ok ? (
              <div className="space-y-1">
                <p className="font-bold">✓ Import complete</p>
                <p>{result.products} products upserted</p>
                {result.images_from_zip > 0 && (
                  <p>{result.images_from_zip} images uploaded from ZIP</p>
                )}
                {result.categories_created > 0 && (
                  <p>{result.categories_created} categories created</p>
                )}
                {result.import_tag && (
                  <p>
                    Tag: <code className="font-mono bg-green-100 px-1 rounded">{result.import_tag}</code>
                    {" "}— select this in any site's edit form to enable these products
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-bold mb-1">Import failed</p>
                {result.error && <p>{result.error}</p>}
                {result.errors?.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </div>
        )}

        {progress && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-900">
                Uploading images… {progress.done} / {progress.total}
              </span>
              {progress.current && (
                <span className="text-blue-700 font-mono truncate ml-3">{progress.current}</span>
              )}
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!csvFile || busy}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg"
          >
            {busy ? "Importing…" : "Import products"}
          </button>
          <Link href="/master" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2.5">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

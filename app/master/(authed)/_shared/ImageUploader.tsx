"use client"

import { useCallback, useRef, useState } from "react"

type Props = {
  /** Current image URL (if any) */
  value: string
  /** Called with the public URL after a successful upload, or "" when cleared */
  onChange: (url: string) => void
  /** Tenant slug — folders the upload by tenant */
  slug?: string
  /** "hero" | "logo" — used in storage key + recommendation copy */
  kind?: "hero" | "logo"
  /** Hint copy shown inside the dropzone */
  recommendation?: string
  /** Aspect ratio for the preview box (default 21:9 for hero) */
  previewAspect?: string
  /** Cap preview height in px (e.g. 80 for logo, 120 for hero) */
  maxPreviewHeight?: number
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml"

export default function ImageUploader({
  value,
  onChange,
  slug,
  kind = "hero",
  recommendation,
  previewAspect = "21/9",
  maxPreviewHeight,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultRec =
    kind === "hero"
      ? "Recommended: 2400 × 1100 px (≈ 21:9). Min 1600 × 720. PNG, JPG, or WEBP. Up to 10 MB."
      : "Recommended: 600 × 200 px wide PNG with transparent background. Up to 10 MB."

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      setBusy(true)
      try {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("kind", kind)
        if (slug) fd.append("slug", slug)
        const res = await fetch("/api/master/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? "Upload failed")
          return
        }
        onChange(json.url as string)
      } catch (e: any) {
        setError(e.message ?? "Upload failed")
      } finally {
        setBusy(false)
      }
    },
    [kind, onChange, slug]
  )

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void upload(file)
    // reset so same filename can be re-picked
    e.target.value = ""
  }

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value ? (
        <div
          className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
          style={{ aspectRatio: previewAspect, maxHeight: maxPreviewHeight }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Hero preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-white/90 hover:bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`w-full rounded-lg border-2 border-dashed transition-colors text-left ${
            dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 bg-gray-50"
          }`}
          style={{ aspectRatio: previewAspect, maxHeight: maxPreviewHeight }}
        >
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-6">
            <div className="text-3xl mb-2">{busy ? "⏳" : "🖼️"}</div>
            <div className="font-semibold text-sm text-gray-900">
              {busy
                ? "Uploading…"
                : dragOver
                  ? "Drop to upload"
                  : "Drop image here or click to upload"}
            </div>
            <div className="text-xs text-gray-500 mt-1.5 max-w-md">
              {recommendation ?? defaultRec}
            </div>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        className="hidden"
      />

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {error}
        </div>
      )}
    </div>
  )
}

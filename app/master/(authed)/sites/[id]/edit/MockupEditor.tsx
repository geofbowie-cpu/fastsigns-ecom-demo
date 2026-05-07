"use client"

import { useEffect, useRef, useState, useCallback } from "react"

type Transform = {
  x: number      // px on canvas
  y: number      // px on canvas
  rotation: number  // degrees
  scale: number     // 0–1 fraction of canvas width
  skewX: number     // degrees
  skewY: number     // degrees
  opacity: number   // 0–1
}

const DEFAULT_TRANSFORM: Transform = {
  x: 0, y: 0,
  rotation: 0,
  scale: 0.35,
  skewX: 0,
  skewY: 0,
  opacity: 1,
}

const CANVAS_W = 720
const CANVAS_H = 540

export default function MockupEditor({
  productImageUrl,
  tenantLogoUrl,
  tenantSlug,
  onUseImage,
  onClose,
}: {
  productImageUrl: string
  tenantLogoUrl: string
  tenantSlug: string
  onUseImage: (url: string) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [productImg, setProductImg] = useState<HTMLImageElement | null>(null)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)
  const [logoUrl, setLogoUrl] = useState(tenantLogoUrl)
  const [logoUrlInput, setLogoUrlInput] = useState(tenantLogoUrl)
  const [transform, setTransform] = useState<Transform>({ ...DEFAULT_TRANSFORM })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, tx: 0, ty: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingLogo, setLoadingLogo] = useState(false)

  // ── Load product image ─────────────────────────────────────
  useEffect(() => {
    if (!productImageUrl) return
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => setProductImg(img)
    img.onerror = () => setProductImg(null)
    img.src = productImageUrl
  }, [productImageUrl])

  // ── Load logo ─────────────────────────────────────────────
  useEffect(() => {
    if (!logoUrl) { setLogoImg(null); return }
    setLoadingLogo(true)
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => { setLogoImg(img); setLoadingLogo(false) }
    img.onerror = () => { setLogoImg(null); setLoadingLogo(false) }
    img.src = logoUrl
    // centre the logo on first load
    setTransform((t) => ({ ...t, x: CANVAS_W / 2, y: CANVAS_H / 2 }))
  }, [logoUrl])

  // ── Draw to canvas ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Checkerboard background if no product image
    if (!productImg) {
      ctx.fillStyle = "#e5e7eb"
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.fillStyle = "#d1d5db"
      for (let r = 0; r < CANVAS_H / 20; r++) {
        for (let c = 0; c < CANVAS_W / 20; c++) {
          if ((r + c) % 2 === 0) ctx.fillRect(c * 20, r * 20, 20, 20)
        }
      }
    } else {
      // Draw product image cover-fitted
      const scale = Math.max(CANVAS_W / productImg.width, CANVAS_H / productImg.height)
      const sw = productImg.width * scale
      const sh = productImg.height * scale
      ctx.drawImage(productImg, (CANVAS_W - sw) / 2, (CANVAS_H - sh) / 2, sw, sh)
    }

    if (!logoImg) return

    const { x, y, rotation, scale, skewX, skewY, opacity } = transform
    const logoW = logoImg.width * scale * (CANVAS_W / logoImg.width)
    const logoH = (logoImg.height / logoImg.width) * logoW

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)
    // Affine skew — makes logo look like it's on an angled surface
    ctx.transform(1, Math.tan((skewY * Math.PI) / 180), Math.tan((skewX * Math.PI) / 180), 1, 0, 0)
    ctx.drawImage(logoImg, -logoW / 2, -logoH / 2, logoW, logoH)
    ctx.restore()

    // Draw crosshair at logo centre for reference
    ctx.save()
    ctx.strokeStyle = "rgba(255,255,255,0.6)"
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y)
    ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10)
    ctx.stroke()
    ctx.restore()
  }, [productImg, logoImg, transform])

  // ── Pointer drag to move logo ──────────────────────────────
  const getCanvasPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const pos = getCanvasPos(e)
    setDragging(true)
    setDragStart({ mx: pos.x, my: pos.y, tx: transform.x, ty: transform.y })
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragging) return
    const pos = getCanvasPos(e)
    setTransform((t) => ({
      ...t,
      x: dragStart.tx + (pos.x - dragStart.mx),
      y: dragStart.ty + (pos.y - dragStart.my),
    }))
  }

  function handlePointerUp() {
    setDragging(false)
  }

  // ── Save composite to Supabase ─────────────────────────────
  async function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true)
    setError(null)
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
      const res = await fetch("/api/master/mockup/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: dataUrl,
          tenant_slug: tenantSlug,
          mime: "image/jpeg",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Save failed")
      onUseImage(json.url)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function applyLogoUrl() {
    setLogoUrl(logoUrlInput.trim())
  }

  const pct = (v: number, min: number, max: number) =>
    Math.round(((v - min) / (max - min)) * 100)

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Logo placement editor</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 min-h-0">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="rounded-lg max-w-full max-h-full object-contain cursor-move"
              style={{ touchAction: "none" }}
            />
          </div>

          {/* Controls */}
          <div className="w-full lg:w-72 flex-shrink-0 border-l border-gray-100 overflow-y-auto p-4 space-y-5">
            {/* Logo source */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Logo URL</label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyLogoUrl()}
                  placeholder="https://…"
                  className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={applyLogoUrl}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 rounded"
                >
                  {loadingLogo ? "…" : "↵"}
                </button>
              </div>
              {tenantLogoUrl && tenantLogoUrl !== logoUrl && (
                <button
                  type="button"
                  onClick={() => { setLogoUrlInput(tenantLogoUrl); setLogoUrl(tenantLogoUrl) }}
                  className="mt-1 text-[11px] text-blue-500 hover:underline"
                >
                  ← Use tenant logo
                </button>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Drag hint */}
            <p className="text-[11px] text-gray-400">Drag the canvas to reposition the logo.</p>

            {/* Scale */}
            <Slider
              label="Size"
              value={transform.scale}
              min={0.05} max={0.9} step={0.01}
              display={`${Math.round(transform.scale * 100)}%`}
              onChange={(v) => setTransform((t) => ({ ...t, scale: v }))}
            />

            {/* Rotation */}
            <Slider
              label="Rotation"
              value={transform.rotation}
              min={-180} max={180} step={1}
              display={`${transform.rotation}°`}
              onChange={(v) => setTransform((t) => ({ ...t, rotation: v }))}
            />

            {/* Skew X */}
            <Slider
              label="Skew X (horizontal perspective)"
              value={transform.skewX}
              min={-45} max={45} step={1}
              display={`${transform.skewX}°`}
              onChange={(v) => setTransform((t) => ({ ...t, skewX: v }))}
            />

            {/* Skew Y */}
            <Slider
              label="Skew Y (vertical perspective)"
              value={transform.skewY}
              min={-45} max={45} step={1}
              display={`${transform.skewY}°`}
              onChange={(v) => setTransform((t) => ({ ...t, skewY: v }))}
            />

            {/* Opacity */}
            <Slider
              label="Opacity"
              value={transform.opacity}
              min={0.1} max={1} step={0.05}
              display={`${Math.round(transform.opacity * 100)}%`}
              onChange={(v) => setTransform((t) => ({ ...t, opacity: v }))}
            />

            <button
              type="button"
              onClick={() => setTransform({ ...DEFAULT_TRANSFORM, x: CANVAS_W / 2, y: CANVAS_H / 2 })}
              className="text-[11px] text-gray-400 hover:text-gray-600"
            >
              ↺ Reset transforms
            </button>

            <hr className="border-gray-100" />

            {/* Position fine-tune */}
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Fine-tune position</p>
              <div className="grid grid-cols-3 gap-1 w-28 mx-auto">
                {[
                  { label: "↖", dx: -10, dy: -10 }, { label: "↑", dx: 0, dy: -10 }, { label: "↗", dx: 10, dy: -10 },
                  { label: "←", dx: -10, dy: 0 },   { label: "·", dx: 0, dy: 0 },   { label: "→", dx: 10, dy: 0 },
                  { label: "↙", dx: -10, dy: 10 },  { label: "↓", dx: 0, dy: 10 },  { label: "↘", dx: 10, dy: 10 },
                ].map(({ label, dx, dy }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))}
                    className="h-7 w-7 flex items-center justify-center text-xs border border-gray-200 rounded hover:bg-gray-100"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="button"
              disabled={saving || !logoImg}
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl"
            >
              {saving ? "Saving…" : "✓ Use this as product image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Slider({
  label, value, min, max, step, display, onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-[11px] text-gray-400 font-mono">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  )
}

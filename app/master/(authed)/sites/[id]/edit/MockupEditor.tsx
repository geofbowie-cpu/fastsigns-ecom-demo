"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// ── Types ──────────────────────────────────────────────────────
type Transform = {
  x: number        // canvas px
  y: number        // canvas px
  rotation: number // degrees
  width: number    // logo width in canvas px
  skewX: number    // degrees
  skewY: number    // degrees
  opacity: number
}

type Handle = "move" | "rotate" | "scale-tl" | "scale-tr" | "scale-bl" | "scale-br"

type ColorFilter = "original" | "black" | "white" | "invert"

type DragState = {
  handle: Handle
  startMX: number
  startMY: number
  startT: Transform
  startAngle: number  // for rotation
}

type LogoEntry = { url: string; label?: string }

// ── Constants ──────────────────────────────────────────────────
const CW = 760
const CH = 540
const HR = 7      // handle radius (canvas px)
const ROT_GAP = 32 // rotation handle distance above logo

const COLOR_FILTERS: { id: ColorFilter; label: string; filter: string }[] = [
  { id: "original", label: "Original", filter: "none" },
  { id: "black",    label: "Black",    filter: "brightness(0)" },
  { id: "white",    label: "White",    filter: "brightness(0) invert(1)" },
  { id: "invert",   label: "Invert",   filter: "invert(1)" },
]

// ── Math helpers ───────────────────────────────────────────────
function localToCanvas(lx: number, ly: number, t: Transform): [number, number] {
  const sxR = Math.tan((t.skewX * Math.PI) / 180)
  const syR = Math.tan((t.skewY * Math.PI) / 180)
  const sx = lx + ly * sxR
  const sy = ly + lx * syR
  const rad = (t.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return [t.x + cos * sx - sin * sy, t.y + sin * sx + cos * sy]
}

function canvasToLocal(cx: number, cy: number, t: Transform): [number, number] {
  const dx = cx - t.x
  const dy = cy - t.y
  const rad = -(t.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const rx = cos * dx - sin * dy
  const ry = sin * dx + cos * dy
  const sxR = -Math.tan((t.skewX * Math.PI) / 180)
  const syR = -Math.tan((t.skewY * Math.PI) / 180)
  return [rx + ry * sxR, ry + rx * syR]
}

function getHandles(t: Transform, hw: number, hh: number) {
  return {
    "scale-tl": localToCanvas(-hw, -hh, t),
    "scale-tr": localToCanvas(hw, -hh, t),
    "scale-bl": localToCanvas(-hw, hh, t),
    "scale-br": localToCanvas(hw, hh, t),
    rotate:     localToCanvas(0, -hh - ROT_GAP, t),
    rotLine:    localToCanvas(0, -hh, t),
  } as const
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

function angle(cx: number, cy: number, px: number, py: number) {
  return Math.atan2(py - cy, px - cx)
}

// ── Component ──────────────────────────────────────────────────
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

  const [logoLibrary, setLogoLibrary] = useState<LogoEntry[]>(() => {
    const entries: LogoEntry[] = []
    if (tenantLogoUrl) entries.push({ url: tenantLogoUrl, label: "Tenant logo" })
    return entries
  })
  const [activeLogoIdx, setActiveLogoIdx] = useState(0)
  const [newLogoUrl, setNewLogoUrl] = useState("")
  const [colorFilter, setColorFilter] = useState<ColorFilter>("original")
  const [transform, setTransform] = useState<Transform>({
    x: CW / 2, y: CH / 2,
    rotation: 0,
    width: CW * 0.32,
    skewX: 0, skewY: 0,
    opacity: 1,
  })
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null)

  // ── Load product image ───────────────────────────────────────
  useEffect(() => {
    if (!productImageUrl) return
    const img = new Image(); img.crossOrigin = "anonymous"
    img.onload = () => setProductImg(img)
    img.src = productImageUrl
  }, [productImageUrl])

  // ── Load logo ────────────────────────────────────────────────
  useEffect(() => {
    const entry = logoLibrary[activeLogoIdx]
    if (!entry?.url) { setLogoImg(null); return }
    const img = new Image(); img.crossOrigin = "anonymous"
    img.onload = () => setLogoImg(img)
    img.onerror = () => setLogoImg(null)
    img.src = entry.url
  }, [logoLibrary, activeLogoIdx])

  // ── Draw ─────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    ctx.clearRect(0, 0, CW, CH)

    // Product image or checkerboard
    if (!productImg) {
      ctx.fillStyle = "#d1d5db"
      ctx.fillRect(0, 0, CW, CH)
    } else {
      const s = Math.max(CW / productImg.width, CH / productImg.height)
      const sw = productImg.width * s, sh = productImg.height * s
      ctx.drawImage(productImg, (CW - sw) / 2, (CH - sh) / 2, sw, sh)
    }

    if (!logoImg) return

    const aspect = logoImg.height / logoImg.width
    const lw = transform.width
    const lh = lw * aspect
    const hw = lw / 2, hh = lh / 2

    // ── Draw logo ────────────────────────────────────────────
    const cf = COLOR_FILTERS.find((f) => f.id === colorFilter)!
    ctx.save()
    ctx.globalAlpha = transform.opacity
    ctx.filter = cf.filter
    ctx.translate(transform.x, transform.y)
    ctx.rotate((transform.rotation * Math.PI) / 180)
    ctx.transform(
      1,
      Math.tan((transform.skewY * Math.PI) / 180),
      Math.tan((transform.skewX * Math.PI) / 180),
      1, 0, 0
    )
    ctx.drawImage(logoImg, -hw, -hh, lw, lh)
    ctx.restore()

    // ── Draw selection UI ────────────────────────────────────
    const handles = getHandles(transform, hw, hh)

    // Bounding box
    ctx.save()
    ctx.strokeStyle = "rgba(59,130,246,0.85)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    ctx.moveTo(...handles["scale-tl"])
    ctx.lineTo(...handles["scale-tr"])
    ctx.lineTo(...handles["scale-br"])
    ctx.lineTo(...handles["scale-bl"])
    ctx.closePath()
    ctx.stroke()
    ctx.restore()

    // Rotation line
    ctx.save()
    ctx.strokeStyle = "rgba(59,130,246,0.7)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(...handles.rotLine)
    ctx.lineTo(...handles.rotate)
    ctx.stroke()
    ctx.restore()

    // Scale corner handles
    const scaleHandles: Handle[] = ["scale-tl", "scale-tr", "scale-bl", "scale-br"]
    for (const h of scaleHandles) {
      const [hx, hy] = handles[h as keyof typeof handles] as [number, number]
      const hovered = hoveredHandle === h
      ctx.save()
      ctx.fillStyle = hovered ? "#3b82f6" : "#ffffff"
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(hx, hy, HR, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    // Rotation handle
    const [rx, ry] = handles.rotate
    ctx.save()
    ctx.fillStyle = hoveredHandle === "rotate" ? "#3b82f6" : "#ffffff"
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(rx, ry, HR + 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Arrow icon in the handle
    ctx.fillStyle = hoveredHandle === "rotate" ? "#fff" : "#3b82f6"
    ctx.font = "bold 9px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("↻", rx, ry + 0.5)
    ctx.restore()
  }, [productImg, logoImg, transform, colorFilter, hoveredHandle])

  useEffect(() => { draw() }, [draw])

  // ── Canvas coord helper ──────────────────────────────────────
  function getCanvasXY(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [
      (e.clientX - rect.left) * (CW / rect.width),
      (e.clientY - rect.top) * (CH / rect.height),
    ]
  }

  // ── Hit test ─────────────────────────────────────────────────
  function hitTest(mx: number, my: number): Handle | null {
    if (!logoImg) return null
    const aspect = logoImg.height / logoImg.width
    const lw = transform.width, lh = lw * aspect
    const hw = lw / 2, hh = lh / 2
    const handles = getHandles(transform, hw, hh)

    // Check handles first (corners + rotate)
    for (const key of ["scale-tl", "scale-tr", "scale-bl", "scale-br", "rotate"] as const) {
      const [hx, hy] = handles[key] as [number, number]
      if (dist(mx, my, hx, hy) <= HR + 4) return key as Handle
    }

    // Check inside logo body
    const [lx, ly] = canvasToLocal(mx, my, transform)
    if (Math.abs(lx) <= hw + 4 && Math.abs(ly) <= hh + 4) return "move"

    return null
  }

  // ── Pointer events ───────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!logoImg) return
    const [mx, my] = getCanvasXY(e)
    const handle = hitTest(mx, my)
    if (!handle) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragState({
      handle,
      startMX: mx,
      startMY: my,
      startT: { ...transform },
      startAngle: angle(transform.x, transform.y, mx, my),
    })
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const [mx, my] = getCanvasXY(e)

    if (!dragState) {
      // Hover highlight
      const h = hitTest(mx, my)
      setHoveredHandle(h)
      const cursor =
        h === "move" ? "move" :
        h === "rotate" ? "crosshair" :
        h ? "nwse-resize" :
        "default"
      e.currentTarget.style.cursor = cursor
      return
    }

    const { handle, startMX, startMY, startT, startAngle } = dragState

    if (handle === "move") {
      setTransform((t) => ({
        ...t,
        x: startT.x + (mx - startMX),
        y: startT.y + (my - startMY),
      }))
    } else if (handle === "rotate") {
      const currentAngle = angle(startT.x, startT.y, mx, my)
      const delta = (currentAngle - startAngle) * (180 / Math.PI)
      setTransform((t) => ({ ...t, rotation: startT.rotation + delta }))
    } else if (handle.startsWith("scale-")) {
      // Scale from center: ratio of dist(mouse, center) / dist(startMouse, center)
      const dNow  = dist(mx, my, startT.x, startT.y)
      const dStart = dist(startMX, startMY, startT.x, startT.y)
      if (dStart < 1) return
      const ratio = dNow / dStart
      setTransform((t) => ({ ...t, width: Math.max(20, startT.width * ratio) }))
    }
  }

  function handlePointerUp() {
    setDragState(null)
  }

  // ── Logo library ─────────────────────────────────────────────
  function addLogo() {
    const url = newLogoUrl.trim()
    if (!url) return
    setLogoLibrary((lib) => [...lib, { url }])
    setActiveLogoIdx(logoLibrary.length)
    setNewLogoUrl("")
  }

  function removeLogo(idx: number) {
    setLogoLibrary((lib) => lib.filter((_, i) => i !== idx))
    setActiveLogoIdx((i) => Math.max(0, i >= idx ? i - 1 : i))
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true); setError(null)
    try {
      // Render to an offscreen canvas WITHOUT the selection handles
      const off = document.createElement("canvas")
      off.width = CW; off.height = CH
      const ctx = off.getContext("2d")!

      // Background / product image
      if (!productImg) {
        ctx.fillStyle = "#d1d5db"
        ctx.fillRect(0, 0, CW, CH)
      } else {
        const s = Math.max(CW / productImg.width, CH / productImg.height)
        const sw = productImg.width * s, sh = productImg.height * s
        ctx.drawImage(productImg, (CW - sw) / 2, (CH - sh) / 2, sw, sh)
      }

      // Logo only — no handles
      if (logoImg) {
        const aspect = logoImg.height / logoImg.width
        const lw = transform.width, lh = lw * aspect
        const cf = COLOR_FILTERS.find((f) => f.id === colorFilter)!
        ctx.save()
        ctx.globalAlpha = transform.opacity
        ctx.filter = cf.filter
        ctx.translate(transform.x, transform.y)
        ctx.rotate((transform.rotation * Math.PI) / 180)
        ctx.transform(1, Math.tan((transform.skewY * Math.PI) / 180), Math.tan((transform.skewX * Math.PI) / 180), 1, 0, 0)
        ctx.drawImage(logoImg, -lw / 2, -lh / 2, lw, lh)
        ctx.restore()
      }

      const dataUrl = off.toDataURL("image/jpeg", 0.92)
      const res = await fetch("/api/master/mockup/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: dataUrl, tenant_slug: tenantSlug, mime: "image/jpeg" }),
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] flex flex-col max-h-[96vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-900 text-sm">Logo placement editor</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 bg-gray-800 flex items-center justify-center p-4 min-w-0">
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="rounded-lg max-w-full max-h-full object-contain select-none"
              style={{ touchAction: "none" }}
            />
          </div>

          {/* Right panel */}
          <div className="w-64 shrink-0 border-l border-gray-100 overflow-y-auto flex flex-col">
            <div className="p-4 space-y-5 flex-1">

              {/* Logo library */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Logos</p>
                <div className="space-y-1.5">
                  {logoLibrary.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors ${
                        activeLogoIdx === idx
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                      onClick={() => setActiveLogoIdx(idx)}
                    >
                      {/* Mini preview */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="w-10 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.url}
                          alt=""
                          className="max-w-full max-h-full object-contain"
                          style={{ filter: COLOR_FILTERS.find(f => f.id === colorFilter)?.filter }}
                        />
                      </div>
                      <span className="flex-1 text-[11px] text-gray-600 truncate">
                        {entry.label ?? `Logo ${idx + 1}`}
                      </span>
                      {logoLibrary.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeLogo(idx) }}
                          className="text-gray-300 hover:text-red-400 text-xs"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {/* Add logo */}
                <div className="flex gap-1.5 mt-2">
                  <input
                    type="url"
                    value={newLogoUrl}
                    onChange={(e) => setNewLogoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLogo()}
                    placeholder="Paste logo URL…"
                    className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={addLogo}
                    disabled={!newLogoUrl.trim()}
                    className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-xs font-bold px-2.5 rounded"
                  >+</button>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Color variants */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Color</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {COLOR_FILTERS.map((cf) => (
                    <button
                      key={cf.id}
                      type="button"
                      onClick={() => setColorFilter(cf.id)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-colors ${
                        colorFilter === cf.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-1.5 border border-gray-200 align-middle"
                        style={{
                          background:
                            cf.id === "original" ? "linear-gradient(135deg,#666,#ccc)" :
                            cf.id === "black" ? "#111" :
                            cf.id === "white" ? "#fff" :
                            "linear-gradient(135deg,#f0f,#0ff)",
                        }}
                      />
                      {cf.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Perspective skew */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Perspective</p>
                <div className="space-y-2">
                  {[
                    { label: "Horizontal", key: "skewX" as const },
                    { label: "Vertical",   key: "skewY" as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-gray-600">{label}</span>
                        <span className="text-[11px] font-mono text-gray-400">{transform[key]}°</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button"
                          onClick={() => setTransform((t) => ({ ...t, [key]: Math.max(-45, t[key] - 5) }))}
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-50">−</button>
                        <input type="range" min={-45} max={45} step={1} value={transform[key]}
                          onChange={(e) => setTransform((t) => ({ ...t, [key]: parseInt(e.target.value) }))}
                          className="flex-1 accent-blue-600 h-1" />
                        <button type="button"
                          onClick={() => setTransform((t) => ({ ...t, [key]: Math.min(45, t[key] + 5) }))}
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-50">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">Opacity</span>
                  <span className="text-[11px] font-mono text-gray-400">{Math.round(transform.opacity * 100)}%</span>
                </div>
                <input type="range" min={0.1} max={1} step={0.05} value={transform.opacity}
                  onChange={(e) => setTransform((t) => ({ ...t, opacity: parseFloat(e.target.value) }))}
                  className="w-full accent-blue-600" />
              </div>

              {/* Reset */}
              <button
                type="button"
                onClick={() => setTransform((t) => ({
                  x: CW / 2, y: CH / 2, rotation: 0, width: CW * 0.32,
                  skewX: 0, skewY: 0, opacity: 1,
                }))}
                className="text-[11px] text-gray-400 hover:text-gray-600 w-full text-left"
              >↺ Reset transforms</button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 space-y-2 shrink-0">
              {error && <p className="text-[11px] text-red-600">{error}</p>}
              <button
                type="button"
                disabled={saving || !logoImg}
                onClick={handleSave}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl"
              >
                {saving ? "Saving…" : "✓ Use as product image"}
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                Drag handles to scale · ↻ to rotate · drag body to move
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

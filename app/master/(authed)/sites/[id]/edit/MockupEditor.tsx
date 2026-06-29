"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { LogoPlacementSpec } from "@/lib/product-bank"

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

type Shadow = {
  enabled: boolean
  color: string
  blur: number
  offsetX: number
  offsetY: number
}

const DEFAULT_SHADOW: Shadow = { enabled: false, color: "#000000", blur: 12, offsetX: 6, offsetY: 6 }

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
  initialPlacement,
  onUseImage,
  onClose,
}: {
  productImageUrl: string
  tenantLogoUrl: string
  tenantSlug: string
  initialPlacement?: LogoPlacementSpec | null
  onUseImage: (url: string, placement: LogoPlacementSpec) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [productImg, setProductImg] = useState<HTMLImageElement | null>(null)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)

  const [logoLibrary, setLogoLibrary] = useState<LogoEntry[]>(() => {
    const entries: LogoEntry[] = []
    if (initialPlacement?.logoUrl) entries.push({ url: initialPlacement.logoUrl, label: "Placed logo" })
    if (tenantLogoUrl && tenantLogoUrl !== initialPlacement?.logoUrl) {
      entries.push({ url: tenantLogoUrl, label: "Tenant logo" })
    }
    return entries
  })
  const [activeLogoIdx, setActiveLogoIdx] = useState(0)
  const [newLogoUrl, setNewLogoUrl] = useState("")
  const [colorFilter, setColorFilter] = useState<ColorFilter>(
    (initialPlacement?.colorFilter as ColorFilter) ?? "original"
  )
  const [transform, setTransform] = useState<Transform>(
    initialPlacement?.transform ?? {
      x: CW / 2, y: CH / 2,
      rotation: 0,
      width: CW * 0.32,
      skewX: 0, skewY: 0,
      opacity: 1,
    }
  )
  const [shadow, setShadow] = useState<Shadow>(initialPlacement?.shadow ?? DEFAULT_SHADOW)
  const [showGrid, setShowGrid] = useState(false)
  const capturingRef = useRef(false)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null)
  // Selection — handles only render when selected. Defaults to true on open.
  const [selected, setSelected] = useState(true)
  const selectedRef = useRef(true)
  useEffect(() => { selectedRef.current = selected }, [selected])

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
    // SVGs rasterize with green chroma fringe on <canvas>; rasterize them to a
    // clean PNG via Sharp server-side first. Raster logos load directly.
    img.src = /\.svg(\?|$)/i.test(entry.url)
      ? `/api/master/rasterize?url=${encodeURIComponent(entry.url)}`
      : entry.url
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
    if (shadow.enabled) {
      ctx.shadowColor = shadow.color
      ctx.shadowBlur = shadow.blur
      ctx.shadowOffsetX = shadow.offsetX
      ctx.shadowOffsetY = shadow.offsetY
    }
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

    // ── Centering grid (editor-only guide; never saved into the image) ──
    if (showGrid && !capturingRef.current) {
      ctx.save()
      // Rule-of-thirds (faint)
      ctx.strokeStyle = "rgba(255,255,255,0.25)"
      ctx.lineWidth = 1
      ctx.setLineDash([])
      for (const fx of [1 / 3, 2 / 3]) {
        ctx.beginPath(); ctx.moveTo(CW * fx, 0); ctx.lineTo(CW * fx, CH); ctx.stroke()
      }
      for (const fy of [1 / 3, 2 / 3]) {
        ctx.beginPath(); ctx.moveTo(0, CH * fy); ctx.lineTo(CW, CH * fy); ctx.stroke()
      }
      // Center cross-hairs (stronger) — thicker/brighter blue when centered.
      // Deliberately NOT green: green reads as the chroma-artifact bug.
      const centeredX = Math.abs(transform.x - CW / 2) < 1
      const centeredY = Math.abs(transform.y - CH / 2) < 1
      ctx.setLineDash([6, 4])
      ctx.lineWidth = centeredX ? 2 : 1.5
      ctx.strokeStyle = centeredX ? "rgba(37,99,235,0.95)" : "rgba(59,130,246,0.55)"
      ctx.beginPath(); ctx.moveTo(CW / 2, 0); ctx.lineTo(CW / 2, CH); ctx.stroke()
      ctx.lineWidth = centeredY ? 2 : 1.5
      ctx.strokeStyle = centeredY ? "rgba(37,99,235,0.95)" : "rgba(59,130,246,0.55)"
      ctx.beginPath(); ctx.moveTo(0, CH / 2); ctx.lineTo(CW, CH / 2); ctx.stroke()
      ctx.restore()
    }

    // ── Draw selection UI ────────────────────────────────────
    // Only when selected, and skipped during save capture.
    if (!selectedRef.current) return
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
  }, [productImg, logoImg, transform, colorFilter, hoveredHandle, selected, shadow, showGrid])

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
  // includeHandles=false skips the corner/rotate handles (used when not selected
  // so a click on the logo body re-selects it without grabbing an invisible handle).
  function hitTest(mx: number, my: number, includeHandles = true): Handle | null {
    if (!logoImg) return null
    const aspect = logoImg.height / logoImg.width
    const lw = transform.width, lh = lw * aspect
    const hw = lw / 2, hh = lh / 2
    const handles = getHandles(transform, hw, hh)

    if (includeHandles) {
      for (const key of ["scale-tl", "scale-tr", "scale-bl", "scale-br", "rotate"] as const) {
        const [hx, hy] = handles[key] as [number, number]
        if (dist(mx, my, hx, hy) <= HR + 4) return key as Handle
      }
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
    const hit = hitTest(mx, my, selected)

    // Click on empty area while selected → deselect, no drag
    if (!hit) {
      if (selected) setSelected(false)
      return
    }

    // Click on logo while not selected → just select (no drag)
    if (!selected) {
      setSelected(true)
      return
    }

    e.currentTarget.setPointerCapture(e.pointerId)
    setDragState({
      handle: hit,
      startMX: mx,
      startMY: my,
      startT: { ...transform },
      startAngle: angle(transform.x, transform.y, mx, my),
    })
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const [mx, my] = getCanvasXY(e)

    if (!dragState) {
      // Hover highlight — only show handle hover if selected
      const h = hitTest(mx, my, selected)
      setHoveredHandle(selected ? h : null)
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
      const SNAP = 8 // px — pull to canvas center when close
      let nx = startT.x + (mx - startMX)
      let ny = startT.y + (my - startMY)
      if (Math.abs(nx - CW / 2) < SNAP) nx = CW / 2
      if (Math.abs(ny - CH / 2) < SNAP) ny = CH / 2
      setTransform((t) => ({ ...t, x: nx, y: ny }))
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
    if (!logoImg) return
    setSaving(true); setError(null)

    // Hide handles AND the centering grid before capturing — neither belongs
    // in the saved image. The drop shadow stays (it's part of the artwork).
    const prevSelected = selectedRef.current
    selectedRef.current = false
    capturingRef.current = true
    draw()

    try {
      let dataUrl: string
      try {
        dataUrl = canvasRef.current!.toDataURL("image/png")
      } catch {
        throw new Error("Cannot save: image source is CORS-blocked. Check that the product and logo image hosts return Access-Control-Allow-Origin.")
      }

      const res = await fetch("/api/master/mockup/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: dataUrl, tenant_slug: tenantSlug, mime: "image/png" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Save failed")
      // Return the editable spec alongside the flat composite so it can be
      // re-opened and adjusted (or removed) later.
      const placement: LogoPlacementSpec = {
        baseImageUrl: productImageUrl,
        logoUrl: logoLibrary[activeLogoIdx]?.url ?? "",
        colorFilter,
        transform: { ...transform },
        shadow: { ...shadow },
      }
      onUseImage(json.url, placement)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      // Restore handles + grid
      selectedRef.current = prevSelected
      capturingRef.current = false
      draw()
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
                      <button
                        type="button"
                        title="Remove this logo"
                        onClick={(e) => { e.stopPropagation(); removeLogo(idx) }}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 text-xs font-bold transition-colors"
                      >✕</button>
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

              <hr className="border-gray-100" />

              {/* Drop shadow */}
              <div>
                <label className="flex items-center justify-between cursor-pointer mb-2">
                  <span className="text-xs font-bold text-gray-700">Drop shadow</span>
                  <input
                    type="checkbox"
                    checked={shadow.enabled}
                    onChange={(e) => setShadow((s) => ({ ...s, enabled: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                {shadow.enabled && (
                  <div className="space-y-2">
                    {[
                      { label: "Blur", key: "blur" as const, min: 0, max: 60, step: 1, suffix: "px" },
                      { label: "Offset X", key: "offsetX" as const, min: -40, max: 40, step: 1, suffix: "px" },
                      { label: "Offset Y", key: "offsetY" as const, min: -40, max: 40, step: 1, suffix: "px" },
                    ].map(({ label, key, min, max, step, suffix }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-gray-600">{label}</span>
                          <span className="text-[11px] font-mono text-gray-400">{shadow[key]}{suffix}</span>
                        </div>
                        <input
                          type="range" min={min} max={max} step={step} value={shadow[key]}
                          onChange={(e) => setShadow((s) => ({ ...s, [key]: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600 h-1"
                        />
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Color</span>
                      <input
                        type="color"
                        value={shadow.color}
                        onChange={(e) => setShadow((s) => ({ ...s, color: e.target.value }))}
                        className="w-8 h-6 rounded border border-gray-200 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Alignment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">Alignment</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-gray-600">Grid</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button type="button"
                    onClick={() => setTransform((t) => ({ ...t, x: CW / 2 }))}
                    className="py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-gray-300">Center H</button>
                  <button type="button"
                    onClick={() => setTransform((t) => ({ ...t, y: CH / 2 }))}
                    className="py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-gray-300">Center V</button>
                  <button type="button"
                    onClick={() => setTransform((t) => ({ ...t, x: CW / 2, y: CH / 2 }))}
                    className="py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-gray-300">Both</button>
                </div>
              </div>

              {/* Reset */}
              <button
                type="button"
                onClick={() => { setTransform((t) => ({
                  x: CW / 2, y: CH / 2, rotation: 0, width: CW * 0.32,
                  skewX: 0, skewY: 0, opacity: 1,
                })); setShadow(DEFAULT_SHADOW) }}
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
                Click logo to select · drag to move · ↻ to rotate · click off to deselect
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

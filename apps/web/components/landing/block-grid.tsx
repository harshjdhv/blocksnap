"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface Block {
  id: number
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
  type: "code" | "card" | "image" | "nav" | "button" | "text" | "avatar" | "badge"
  delay: number
}

function generateBlocks(cols: number, rows: number, cellSize: number, gap: number): Block[] {
  const blocks: Block[] = []
  const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false))
  const types: Block["type"][] = ["code", "card", "image", "nav", "button", "text", "avatar", "badge"]

  let id = 0

  const patterns: { w: number; h: number; weight: number }[] = [
    { w: 2, h: 2, weight: 3 },
    { w: 2, h: 1, weight: 5 },
    { w: 1, h: 2, weight: 4 },
    { w: 3, h: 1, weight: 2 },
    { w: 1, h: 3, weight: 1 },
    { w: 1, h: 1, weight: 8 },
  ]

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row]![col]) continue

      const shuffled = [...patterns].sort(() => Math.random() - 0.5)
      let placed = false

      for (const pattern of shuffled) {
        if (Math.random() > pattern.weight / 10) continue
        if (col + pattern.w > cols || row + pattern.h > rows) continue

        let canPlace = true
        for (let dy = 0; dy < pattern.h; dy++) {
          for (let dx = 0; dx < pattern.w; dx++) {
            if (grid[row + dy]![col + dx]) {
              canPlace = false
              break
            }
          }
          if (!canPlace) break
        }

        if (canPlace) {
          for (let dy = 0; dy < pattern.h; dy++) {
            for (let dx = 0; dx < pattern.w; dx++) {
              grid[row + dy]![col + dx] = true
            }
          }

          const w = pattern.w * cellSize + (pattern.w - 1) * gap
          const h = pattern.h * cellSize + (pattern.h - 1) * gap
          const x = col * (cellSize + gap)
          const y = row * (cellSize + gap)

          blocks.push({
            id: id++,
            x,
            y,
            width: w,
            height: h,
            centerX: x + w / 2,
            centerY: y + h / 2,
            type: types[Math.floor(Math.random() * types.length)]!,
            delay: (row + col) * 0.02,
          })
          placed = true
          break
        }
      }

      if (!placed && !grid[row]![col]) {
        grid[row]![col] = true
        const x = col * (cellSize + gap)
        const y = row * (cellSize + gap)
        blocks.push({
          id: id++,
          x,
          y,
          width: cellSize,
          height: cellSize,
          centerX: x + cellSize / 2,
          centerY: y + cellSize / 2,
          type: types[Math.floor(Math.random() * types.length)]!,
          delay: (row + col) * 0.02,
        })
      }
    }
  }

  return blocks
}

function BlockContent({ type, width, height }: { type: Block["type"]; width: number; height: number }) {
  const isSmall = width <= 80 && height <= 80

  switch (type) {
    case "code":
      return (
        <div className="flex flex-col gap-1.5 p-3 h-full">
          <div className="h-1.5 w-3/4 rounded-full bg-emerald-500/20" />
          <div className="h-1.5 w-1/2 rounded-full bg-emerald-500/15" />
          <div className="h-1.5 w-2/3 rounded-full bg-emerald-500/10" />
          {!isSmall && (
            <>
              <div className="h-1.5 w-5/6 rounded-full bg-emerald-500/15" />
              <div className="h-1.5 w-1/3 rounded-full bg-emerald-500/10" />
            </>
          )}
        </div>
      )
    case "card":
      return (
        <div className="flex flex-col gap-2 p-3 h-full">
          <div className="h-2 w-1/2 rounded-full bg-white/10" />
          <div className="h-1.5 w-full rounded-full bg-white/5" />
          {!isSmall && <div className="h-1.5 w-3/4 rounded-full bg-white/5" />}
        </div>
      )
    case "image":
      return (
        <div className="h-full w-full rounded-[inherit] bg-gradient-to-br from-violet-500/8 to-blue-500/8 flex items-center justify-center">
          <svg className="w-5 h-5 text-white/10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4zm16-2a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h16z" />
            <circle cx="8.5" cy="10.5" r="1.5" />
            <path d="m6 18 4-5 3 3 2-2 3 4H6z" />
          </svg>
        </div>
      )
    case "nav":
      return (
        <div className="flex items-center gap-2 p-3 h-full">
          <div className="h-2 w-2 rounded-full bg-white/15" />
          <div className="h-1.5 w-8 rounded-full bg-white/8" />
          <div className="h-1.5 w-6 rounded-full bg-white/6" />
          <div className="h-1.5 w-10 rounded-full bg-white/6" />
        </div>
      )
    case "button":
      return (
        <div className="flex items-center justify-center h-full p-2">
          <div className="h-6 px-3 rounded-md bg-white/8 flex items-center">
            <div className="h-1.5 w-8 rounded-full bg-white/20" />
          </div>
        </div>
      )
    case "text":
      return (
        <div className="flex flex-col gap-1 p-3 h-full justify-center">
          <div className="h-2.5 w-2/3 rounded-full bg-white/10" />
          {!isSmall && <div className="h-1.5 w-full rounded-full bg-white/5" />}
        </div>
      )
    case "avatar":
      return (
        <div className="flex items-center gap-2 p-3 h-full">
          <div className="h-6 w-6 rounded-full bg-white/10 shrink-0" />
          {!isSmall && (
            <div className="flex flex-col gap-1 flex-1">
              <div className="h-1.5 w-12 rounded-full bg-white/10" />
              <div className="h-1 w-8 rounded-full bg-white/5" />
            </div>
          )}
        </div>
      )
    case "badge":
      return (
        <div className="flex items-center justify-center h-full p-2">
          <div className="h-5 px-2 rounded-full bg-white/6 border border-white/5 flex items-center">
            <div className="h-1 w-6 rounded-full bg-white/15" />
          </div>
        </div>
      )
  }
}

function StaticBlock({ block }: { block: Block }) {
  return (
    <div
      data-block-id={block.id}
      className="block-cell absolute will-change-transform"
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        opacity: 0,
        transform: "scale(0.92)",
        animation: `block-enter 0.5s ${block.delay}s both cubic-bezier(0.23, 1, 0.32, 1)`,
        transition: "transform 0.15s ease-out",
      }}
    >
      <div className="relative w-full h-full">
        {/* Base block */}
        <div className="absolute inset-0 rounded-lg bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <BlockContent type={block.type} width={block.width} height={block.height} />
        </div>

        {/* Glow overlay */}
        <div
          className="block-glow absolute -inset-px rounded-lg pointer-events-none"
          style={{
            opacity: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
            transition: "opacity 0.15s ease-out",
          }}
        />

        {/* Border highlight */}
        <div
          className="block-border absolute -inset-px rounded-lg pointer-events-none"
          style={{
            opacity: 0,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 0 15px rgba(255, 255, 255, 0.03), inset 0 0 15px rgba(255, 255, 255, 0.02)",
            transition: "opacity 0.15s ease-out",
          }}
        />

        {/* Snap corner brackets */}
        <div
          className="block-corners absolute -inset-1.5 pointer-events-none"
          style={{ opacity: 0, transition: "opacity 0.15s ease-out" }}
        >
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/40 rounded-tl-sm" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/40 rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-white/40 rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/40 rounded-br-sm" />
        </div>
      </div>
    </div>
  )
}

export function BlockGrid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)
  const blockElementsRef = useRef<
    Map<number, { glow: HTMLElement; border: HTMLElement; corners: HTMLElement; el: HTMLElement }>
  >(new Map())
  const offsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const cellSize = 72
    const gap = 6
    const cols = Math.ceil(window.innerWidth / (cellSize + gap)) + 2
    const rows = Math.ceil(window.innerHeight / (cellSize + gap)) + 2
    setBlocks(generateBlocks(cols, rows, cellSize, gap))
  }, [])

  // Cache all block DOM elements once after render
  useEffect(() => {
    if (!containerRef.current || blocks.length === 0) return

    const map = new Map<
      number,
      { glow: HTMLElement; border: HTMLElement; corners: HTMLElement; el: HTMLElement }
    >()
    const cells = containerRef.current.querySelectorAll<HTMLElement>(".block-cell")

    cells.forEach((el) => {
      const id = Number(el.dataset.blockId)
      const glow = el.querySelector<HTMLElement>(".block-glow")
      const border = el.querySelector<HTMLElement>(".block-border")
      const corners = el.querySelector<HTMLElement>(".block-corners")
      if (glow && border && corners) {
        map.set(id, { el, glow, border, corners })
      }
    })

    blockElementsRef.current = map
  }, [blocks])

  // Track container offset
  useEffect(() => {
    const updateOffset = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      offsetRef.current = { x: rect.left, y: rect.top }
    }
    updateOffset()
    window.addEventListener("resize", updateOffset)
    return () => window.removeEventListener("resize", updateOffset)
  }, [])

  // Single RAF loop — direct DOM mutation, no React re-renders
  useEffect(() => {
    if (blocks.length === 0) return

    const THRESHOLD = 180
    const THRESHOLD_SQ = THRESHOLD * THRESHOLD
    const GRID_OFFSET = -40

    const loop = () => {
      const mx = mouseRef.current.x - offsetRef.current.x - GRID_OFFSET
      const my = mouseRef.current.y - offsetRef.current.y - GRID_OFFSET

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]!
        const cached = blockElementsRef.current.get(block.id)
        if (!cached) continue

        const dx = mx - block.centerX
        const dy = my - block.centerY
        const distSq = dx * dx + dy * dy

        if (distSq < THRESHOLD_SQ) {
          const dist = Math.sqrt(distSq)
          const intensity = Math.max(0, Math.min(1, 1 - dist / THRESHOLD))

          cached.glow.style.opacity = String(intensity * 0.7)
          cached.border.style.opacity = String(intensity)
          cached.corners.style.opacity = String(intensity > 0.15 ? intensity : 0)
          cached.el.style.transform = `scale(${1 + intensity * 0.03})`
        } else {
          cached.glow.style.opacity = "0"
          cached.border.style.opacity = "0"
          cached.corners.style.opacity = "0"
          cached.el.style.transform = "scale(1)"
        }
      }

      // Update cursor-following radial glow
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(600px circle at ${mouseRef.current.x}px ${mouseRef.current.y}px, rgba(255,255,255,0.02), transparent 60%)`
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [blocks])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current.x = e.clientX
    mouseRef.current.y = e.clientY
  }, [])

  return (
    <>
      <style jsx global>{`
        @keyframes block-enter {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Radial glow following cursor */}
        <div ref={glowRef} className="fixed inset-0 pointer-events-none" />

        {/* Blocks */}
        <div className="absolute inset-0" style={{ transform: "translate(-40px, -40px)" }}>
          {blocks.map((block) => (
            <StaticBlock key={block.id} block={block} />
          ))}
        </div>
      </div>
    </>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface Block {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: "code" | "card" | "image" | "nav" | "button" | "text" | "avatar" | "badge"
  delay: number
}

function generateBlocks(cols: number, rows: number, cellSize: number, gap: number): Block[] {
  const blocks: Block[] = []
  const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false))
  const types: Block["type"][] = ["code", "card", "image", "nav", "button", "text", "avatar", "badge"]

  let id = 0

  // Place larger blocks first
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

      // Try to place a pattern
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

          blocks.push({
            id: id++,
            x: col * (cellSize + gap),
            y: row * (cellSize + gap),
            width: pattern.w * cellSize + (pattern.w - 1) * gap,
            height: pattern.h * cellSize + (pattern.h - 1) * gap,
            type: types[Math.floor(Math.random() * types.length)]!,
            delay: (row + col) * 0.03,
          })
          placed = true
          break
        }
      }

      if (!placed && !grid[row]![col]) {
        grid[row]![col] = true
        blocks.push({
          id: id++,
          x: col * (cellSize + gap),
          y: row * (cellSize + gap),
          width: cellSize,
          height: cellSize,
          type: types[Math.floor(Math.random() * types.length)]!,
          delay: (row + col) * 0.03,
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

function InteractiveBlock({
  block,
  mouseX,
  mouseY,
  containerRef,
}: {
  block: Block
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const blockRef = useRef<HTMLDivElement>(null)
  const [isNear, setIsNear] = useState(false)
  const [distance, setDistance] = useState(1000)

  const opacity = useSpring(0, { stiffness: 100, damping: 20 })
  const scale = useSpring(1, { stiffness: 300, damping: 25 })
  const glowOpacity = useSpring(0, { stiffness: 200, damping: 30 })
  const borderOpacity = useSpring(0, { stiffness: 200, damping: 30 })

  useEffect(() => {
    opacity.set(1)
  }, [opacity])

  useEffect(() => {
    const unsubX = mouseX.on("change", () => {
      if (!blockRef.current || !containerRef.current) return

      const rect = blockRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      const blockCenterX = rect.left + rect.width / 2
      const blockCenterY = rect.top + rect.height / 2

      const mx = mouseX.get() + containerRect.left
      const my = mouseY.get() + containerRect.top

      const dx = mx - blockCenterX
      const dy = my - blockCenterY
      const dist = Math.sqrt(dx * dx + dy * dy)

      setDistance(dist)

      const threshold = 150
      const near = dist < threshold
      setIsNear(near)

      if (near) {
        const intensity = 1 - dist / threshold
        scale.set(1 + intensity * 0.04)
        glowOpacity.set(intensity * 0.6)
        borderOpacity.set(intensity * 0.8)
      } else {
        scale.set(1)
        glowOpacity.set(0)
        borderOpacity.set(0)
      }
    })

    return () => unsubX()
  }, [mouseX, mouseY, containerRef, scale, glowOpacity, borderOpacity])

  return (
    <motion.div
      ref={blockRef}
      className="absolute"
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        opacity,
        scale,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: block.delay,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <div className="relative w-full h-full group">
        {/* Block background */}
        <div className="absolute inset-0 rounded-lg bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden transition-colors duration-300">
          <BlockContent type={block.type} width={block.width} height={block.height} />
        </div>

        {/* Glow effect on hover */}
        <motion.div
          className="absolute -inset-px rounded-lg pointer-events-none"
          style={{
            opacity: glowOpacity,
            background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            boxShadow: "inset 0 0 20px rgba(255,255,255,0.03)",
          }}
        />

        {/* Border glow */}
        <motion.div
          className="absolute -inset-px rounded-lg pointer-events-none"
          style={{
            opacity: borderOpacity,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        />

        {/* Snap indicator — the little corner brackets */}
        <motion.div
          className="absolute -inset-1 pointer-events-none"
          style={{ opacity: glowOpacity }}
        >
          {/* Top-left */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 rounded-tl" />
          {/* Top-right */}
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 rounded-tr" />
          {/* Bottom-left */}
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 rounded-bl" />
          {/* Bottom-right */}
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 rounded-br" />
        </motion.div>
      </div>
    </motion.div>
  )
}

export function BlockGrid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const cellSize = 72
    const gap = 6
    const cols = Math.ceil(window.innerWidth / (cellSize + gap)) + 2
    const rows = Math.ceil(window.innerHeight / (cellSize + gap)) + 2
    setBlocks(generateBlocks(cols, rows, cellSize, gap))
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    },
    [mouseX, mouseY]
  )

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Subtle radial gradient that follows cursor */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(800px circle at ${x}px ${y}px, rgba(255,255,255,0.015), transparent 60%)`
          ),
        }}
      />

      {/* Blocks */}
      <div className="absolute inset-0" style={{ transform: "translate(-40px, -40px)" }}>
        {blocks.map((block) => (
          <InteractiveBlock
            key={block.id}
            block={block}
            mouseX={mouseX}
            mouseY={mouseY}
            containerRef={containerRef}
          />
        ))}
      </div>
    </div>
  )
}

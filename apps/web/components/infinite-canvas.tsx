"use client"

import * as React from "react"

type Point = {
  x: number
  y: number
}

const MIN_ZOOM = 0.35
const MAX_ZOOM = 2.5
const ZOOM_SENSITIVITY = 0.0015
const GRID_SIZE = 28

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function InfiniteCanvas() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [offset, setOffset] = React.useState<Point>({ x: 0, y: 0 })
  const [scale, setScale] = React.useState(1)
  const [isPanning, setIsPanning] = React.useState(false)

  const offsetRef = React.useRef(offset)
  const scaleRef = React.useRef(scale)
  const panStateRef = React.useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })

  React.useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  React.useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  const onPointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    panStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    }
    setIsPanning(true)
  }, [])

  const onPointerMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const panState = panStateRef.current
    if (!panState.active) {
      return
    }

    const nextOffset = {
      x: panState.originX + (event.clientX - panState.startX),
      y: panState.originY + (event.clientY - panState.startY),
    }

    offsetRef.current = nextOffset
    setOffset(nextOffset)
  }, [])

  const endPan = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const panState = panStateRef.current
    if (!panState.active || panState.pointerId !== event.pointerId) {
      return
    }

    panStateRef.current.active = false
    setIsPanning(false)
  }, [])

  const onWheel = React.useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const container = containerRef.current
    if (!container) {
      return
    }

    const currentScale = scaleRef.current
    const nextScale = clamp(currentScale * Math.exp(-event.deltaY * ZOOM_SENSITIVITY), MIN_ZOOM, MAX_ZOOM)
    if (nextScale === currentScale) {
      return
    }

    const rect = container.getBoundingClientRect()
    const cursorX = event.clientX - rect.left
    const cursorY = event.clientY - rect.top
    const currentOffset = offsetRef.current

    const worldX = (cursorX - currentOffset.x) / currentScale
    const worldY = (cursorY - currentOffset.y) / currentScale

    const nextOffset = {
      x: cursorX - worldX * nextScale,
      y: cursorY - worldY * nextScale,
    }

    scaleRef.current = nextScale
    offsetRef.current = nextOffset
    setScale(nextScale)
    setOffset(nextOffset)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-muted-foreground/25 bg-background">
      <div
        ref={containerRef}
        className="size-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onWheel={onWheel}
        style={{
          cursor: isPanning ? "grabbing" : "grab",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--foreground) 16%, transparent) 1.2px, transparent 0)",
          backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      />
      <div className="pointer-events-none absolute top-3 left-3 rounded-md border border-border/70 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
        Drag to pan, scroll to zoom
      </div>
    </div>
  )
}

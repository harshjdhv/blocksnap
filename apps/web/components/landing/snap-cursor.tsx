"use client"

import { motion } from "framer-motion"

export function SnapCursor() {
  return (
    <svg
      className="fixed pointer-events-none z-40 mix-blend-difference"
      style={{
        width: 0,
        height: 0,
        overflow: "visible",
      }}
    >
      <defs>
        <filter id="snap-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

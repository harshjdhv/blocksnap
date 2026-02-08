"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export function CursorGlow() {
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const [isVisible, setIsVisible] = useState(false)

  const smoothX = useSpring(cursorX, { stiffness: 300, damping: 30 })
  const smoothY = useSpring(cursorY, { stiffness: 300, damping: 30 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [cursorX, cursorY, isVisible])

  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{
        x: smoothX,
        y: smoothY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          left: -150,
          top: -150,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Inner bright dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 4,
          height: 4,
          left: -2,
          top: -2,
          background: "rgba(255,255,255,0.4)",
          boxShadow: "0 0 10px rgba(255,255,255,0.15), 0 0 40px rgba(255,255,255,0.05)",
        }}
      />
    </motion.div>
  )
}

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// --- Types ---
interface Block {
    id: string
    x: number
    y: number
    w: number
    h: number
    label: string
    color: string
}

// --- Component ---
const BlockSnapHero = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Motion values for smooth cursor tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Smooth spring for the tooltip
    const springX = useSpring(mouseX, { stiffness: 500, damping: 28 })
    const springY = useSpring(mouseY, { stiffness: 500, damping: 28 })

    const [hoveredBlock, setHoveredBlock] = useState<Block | null>(null)
    const blocksRef = useRef<Block[]>([])

    const initBlocks = (w: number, h: number) => {
        // Config
        // Increased padding to prevent edge cutoff on some displays
        const padding = Math.max(32, w * 0.08)

        // Layout Calculation
        // We want a layout that looks like a modern SaaS dashboard or landing page
        const navHeight = 60
        const heroHeight = Math.min(400, h * 0.4)
        const contentY = padding + navHeight + 24

        // Dynamic width based on screen size
        const containerW = Math.min(1200, w - padding * 2)
        const containerX = (w - containerW) / 2

        const newBlocks: Block[] = [
            // Navigation Bar
            {
                id: 'nav',
                x: containerX,
                y: padding,
                w: containerW,
                h: navHeight,
                label: 'Navigation',
                color: '255, 255, 255'
            },
            // Hero Section
            {
                id: 'hero',
                x: containerX,
                y: contentY,
                w: containerW * 0.65, // 65% width
                h: heroHeight,
                label: 'Hero Section',
                color: '168, 85, 247' // Purple
            },
            // Sidebar / Feature List (Right side)
            {
                id: 'sidebar',
                x: containerX + (containerW * 0.65) + 24,
                y: contentY,
                w: (containerW * 0.35) - 24,
                h: heroHeight,
                label: 'Sidebar',
                color: '59, 130, 246' // Blue
            },
            // Content Grid below
        ]

        // Add 3 grid cards below
        const cardY = contentY + heroHeight + 24
        const cardGap = 24
        const cardW = (containerW - (cardGap * 2)) / 3

        for (let i = 0; i < 3; i++) {
            newBlocks.push({
                id: `card-${i}`,
                x: containerX + (i * (cardW + cardGap)),
                y: cardY,
                w: cardW,
                h: 200,
                label: `Component ${i + 1}`,
                color: '236, 72, 153' // Pink
            })
        }

        blocksRef.current = newBlocks
    }

    // Initialize
    useEffect(() => {
        const handleResize = () => {
            initBlocks(window.innerWidth, window.innerHeight)
        }

        // Initial setup
        handleResize()

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) return

        let animationFrameId: number

        const render = () => {
            const w = window.innerWidth
            const h = window.innerHeight
            const dpr = window.devicePixelRatio || 1

            // Check resize necessity
            if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
                canvas.width = w * dpr
                canvas.height = h * dpr
                canvas.style.width = `${w}px`
                canvas.style.height = `${h}px`
                ctx.scale(dpr, dpr)
            }

            // Clear
            ctx.clearRect(0, 0, w, h)

            // Get current mouse pos purely for drawing logic
            const mx = mouseX.get()
            const my = mouseY.get()

            // Find closest block
            let activeBlock: Block | null = null
            for (const block of blocksRef.current) {
                if (mx >= block.x && mx <= block.x + block.w && my >= block.y && my <= block.y + block.h) {
                    activeBlock = block
                    break
                }
            }

            // Update react state only if changed to avoid thrashing
            // We do this check inside a ref normally but here simple check is okay
            // Actually setHoveredBlock triggers re-render, optimize this?
            // For this demo, let's just do it.
            // Better: use a ref for hoveredBlockId and check before setState
            // To strictly avoid re-renders, we'd keep it all in canvas, but we want a DOM tooltip.
            // So let's just defer the state update or use a ref outside.

            // Draw Grid (Subtle)
            ctx.lineWidth = 1
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'
            const gridSize = 40

            // Parallax affect on grid
            const px = (mx - w / 2) * 0.02
            const py = (my - h / 2) * 0.02

            ctx.beginPath()
            for (let x = (px % gridSize); x <= w; x += gridSize) {
                ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h);
            }
            for (let y = (py % gridSize); y <= h; y += gridSize) {
                ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5);
            }
            ctx.stroke()

            // Draw Blocks
            blocksRef.current.forEach(block => {
                const isHovered = activeBlock?.id === block.id

                ctx.beginPath()
                ctx.rect(block.x, block.y, block.w, block.h)

                // Fill
                if (isHovered) {
                    ctx.fillStyle = `rgba(${block.color}, 0.1)`
                } else {
                    // Default vague fill
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.005)'
                }
                ctx.fill()

                // Stroke
                if (isHovered) {
                    ctx.strokeStyle = `rgba(${block.color}, 0.8)`
                    ctx.shadowColor = `rgba(${block.color}, 0.5)`
                    ctx.shadowBlur = 20
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
                    ctx.shadowBlur = 0
                }
                ctx.stroke()
                ctx.shadowBlur = 0 // Reset

                // Decorate corners if hovered (Snapping Visuals)
                if (isHovered) {
                    const cs = 6 // Corner size
                    ctx.fillStyle = `rgb(${block.color})`
                    // TL
                    ctx.fillRect(block.x - 1, block.y - 1, cs, 1)
                    ctx.fillRect(block.x - 1, block.y - 1, 1, cs)
                    // TR
                    ctx.fillRect(block.x + block.w - cs, block.y - 1, cs, 1)
                    ctx.fillRect(block.x + block.w, block.y - 1, 1, cs)
                    // BL
                    ctx.fillRect(block.x - 1, block.y + block.h, cs, 1)
                    ctx.fillRect(block.x - 1, block.y + block.h - cs, 1, cs)
                    // BR
                    ctx.fillRect(block.x + block.w - cs, block.y + block.h, cs, 1)
                    ctx.fillRect(block.x + block.w, block.y + block.h - cs, 1, cs)

                    // Draw Alignment Lines (The "Snapping" effect)
                    ctx.beginPath()
                    ctx.strokeStyle = `rgba(${block.color}, 0.3)`
                    ctx.setLineDash([2, 4])

                    // Crosshair lines through the block center or edges?
                    // Let's do edges to screen bounds
                    ctx.moveTo(block.x, 0); ctx.lineTo(block.x, h)
                    ctx.moveTo(block.x + block.w, 0); ctx.lineTo(block.x + block.w, h)
                    ctx.moveTo(0, block.y); ctx.lineTo(w, block.y)
                    ctx.moveTo(0, block.y + block.h); ctx.lineTo(w, block.y + block.h)
                    ctx.stroke()
                    ctx.setLineDash([])

                    // Label
                    ctx.fillStyle = `rgba(${block.color}, 1)`
                    ctx.font = '10px "Geist Mono", monospace'
                    ctx.fillText(`${block.w.toFixed(0)} × ${block.h.toFixed(0)}`, block.x + 4, block.y - 6)
                    ctx.fillText(block.label.toUpperCase(), block.x + 4, block.y + block.h + 14)
                }
            })

            // Update React State for Tooltip (careful with frequency)
            if (activeBlock?.id !== hoveredBlock?.id) {
                setHoveredBlock(activeBlock)
            }

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            cancelAnimationFrame(animationFrameId)
        }
    }, [mouseX, mouseY, hoveredBlock])

    return (
        <div className="relative w-full h-screen bg-[#050505] overflow-hidden cursor-none">
            {/* Cursor Custom */}
            <motion.div
                className="fixed top-0 left-0 w-4 h-4 rounded-full border border-white/50 bg-white/10 pointer-events-none z-50 backdrop-blur-sm"
                style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
            />

            {/* Canvas Layer */}
            <canvas ref={canvasRef} className="absolute inset-0 z-10" />

            {/* Noise Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.05]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1' /%3E%3C/svg%3E")`
                }}
            />

            {/* Content */}
            <div className="relative z-30 flex flex-col items-center justify-center h-full pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center"
                >
                    <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Coming Soon</span>
                    </div>

                    <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-tr from-white via-white to-white/40 mb-6 drop-shadow-2xl">
                        BlockSnap
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400/80 font-light tracking-wide max-w-lg mx-auto leading-relaxed">
                        Capture logic, not pixels. <br />
                        The component-first screenshot tool.
                    </p>

                    <div className="mt-12 pointer-events-auto flex flex-col md:flex-row items-center gap-4 justify-center">
                        <button disabled className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black opacity-80 cursor-not-allowed rounded-full font-medium text-sm transition-all">
                            <span className="relative z-10">Chrome Extension Coming Soon</span>
                        </button>

                        <a
                            href="https://github.com/harshjdhv/blocksnap"
                            target="_blank"
                            rel="noreferrer"
                            className="group relative inline-flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-full font-medium text-sm transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.17 22 16.42 22 12A10 10 0 0012 2z" />
                            </svg>
                            <span>Star on GitHub</span>
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* Dynamic Tooltip */}
            <motion.div
                className="fixed z-40 pointer-events-none"
                style={{ x: springX, y: springY }}
            >
                {hoveredBlock && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, y: 20 }}
                        animate={{ opacity: 1, x: 20, y: 20 }}
                        exit={{ opacity: 0, x: 20, y: 20 }}
                        className="px-3 py-2 bg-black/80 border border-white/10 backdrop-blur-md rounded text-xs text-white/90 font-mono shadow-xl whitespace-nowrap"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `rgb(${hoveredBlock.color})` }} />
                            <span className="opacity-50">ELEMENT</span>
                        </div>
                        <div className="font-bold">{hoveredBlock.label}</div>
                        <div className="opacity-50 mt-1 text-[10px]">{hoveredBlock.w.toFixed(0)}px width</div>
                    </motion.div>
                )}
            </motion.div>

        </div>
    )
}

export default BlockSnapHero

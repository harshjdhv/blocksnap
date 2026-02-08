"use client"

import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.6,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
    },
  },
}

export function HeroContent() {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-svh px-6">
      <motion.div
        className="flex flex-col items-center text-center max-w-2xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Logo mark */}
        <motion.div variants={item} className="mb-8">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center backdrop-blur-md">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white/80"
              >
                {/* Two overlapping rounded rectangles — "snap" icon */}
                <rect
                  x="2"
                  y="2"
                  width="11"
                  height="11"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <rect
                  x="11"
                  y="11"
                  width="11"
                  height="11"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                {/* Connection dot */}
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            {/* Subtle glow behind logo */}
            <div className="absolute -inset-4 rounded-2xl bg-white/[0.02] blur-xl -z-10" />
          </div>
        </motion.div>

        {/* Product name */}
        <motion.h1
          variants={item}
          className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white mb-4 leading-[1.05]"
        >
          Block
          <span className="text-white/40">Snap</span>
        </motion.h1>

        {/* One-liner */}
        <motion.p
          variants={item}
          className="text-lg sm:text-xl text-white/40 font-normal tracking-tight mb-10"
        >
          Capture UI blocks. Not screenshots.
        </motion.p>

        {/* CTA area */}
        <motion.div variants={item} className="flex flex-col items-center gap-5">
          {/* Chrome extension badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            <svg className="w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <line x1="21.17" y1="8" x2="15.87" y2="8" stroke="currentColor" strokeWidth="1.5" />
              <line x1="6.13" y1="16" x2="2.83" y2="16" stroke="currentColor" strokeWidth="1.5" />
              <line x1="9" y1="2.83" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="text-xs text-white/30 font-medium tracking-wide uppercase">
              Chrome extension · Coming soon
            </span>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/blocksnap"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm text-white/25 hover:text-white/50 transition-colors duration-300"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="border-b border-white/0 group-hover:border-white/20 transition-colors duration-300 pb-px">
              Open source on GitHub
            </span>
            <svg
              className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7,7 17,7 17,17" />
            </svg>
          </a>
        </motion.div>

        {/* Subtle bottom hint */}
        <motion.div
          variants={item}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-[11px] text-white/15 tracking-widest uppercase font-mono">
            Move your cursor
          </span>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg
              className="w-3 h-3 text-white/10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

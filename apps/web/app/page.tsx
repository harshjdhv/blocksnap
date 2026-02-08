import { BlockGrid } from "@/components/landing/block-grid"
import { HeroContent } from "@/components/landing/hero-content"

export default function Page() {
  return (
    <main className="relative min-h-svh bg-[#07070a] overflow-hidden selection:bg-white/10">
      {/* Interactive block grid background */}
      <BlockGrid />

      {/* Dark vignette overlays for depth */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,10,0.4)_50%,rgba(7,7,10,0.85)_100%)]" />

      {/* Top fade */}
      <div className="fixed top-0 inset-x-0 h-40 pointer-events-none z-[2] bg-gradient-to-b from-[#07070a] via-[#07070a]/60 to-transparent" />

      {/* Bottom fade */}
      <div className="fixed bottom-0 inset-x-0 h-40 pointer-events-none z-[2] bg-gradient-to-t from-[#07070a] via-[#07070a]/60 to-transparent" />

      {/* Left fade */}
      <div className="fixed left-0 inset-y-0 w-40 pointer-events-none z-[2] bg-gradient-to-r from-[#07070a] via-[#07070a]/40 to-transparent" />

      {/* Right fade */}
      <div className="fixed right-0 inset-y-0 w-40 pointer-events-none z-[2] bg-gradient-to-l from-[#07070a] via-[#07070a]/40 to-transparent" />

      {/* Hero content */}
      <div className="relative z-10">
        <HeroContent />
      </div>

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-20 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />
    </main>
  )
}

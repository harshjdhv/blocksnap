import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "BlockSnap — Capture UI blocks. Not screenshots.",
  description:
    "A Chrome extension that captures UI blocks (components) from the web as clean, shareable images. Open source.",
  metadataBase: new URL("https://blocksnap.dev"),
  openGraph: {
    title: "BlockSnap",
    description: "Capture UI blocks. Not screenshots.",
    siteName: "BlockSnap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockSnap",
    description: "Capture UI blocks. Not screenshots.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

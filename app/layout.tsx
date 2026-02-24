import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Veritas AI - News Authenticity Analyzer",
  description:
    "Advanced AI-powered tool for analyzing news article authenticity and fact-checking claims with real-time verification.",
  keywords: ["fact-checking", "news", "AI", "authenticity", "verification", "misinformation", "journalism"],
  authors: [{ name: "Veritas AI" }],
  creator: "Veritas AI",
  publisher: "Veritas AI",
  robots: "index, follow",
  openGraph: {
    title: "Veritas AI - News Authenticity Analyzer",
    description:
      "Advanced AI-powered tool for analyzing news article authenticity and fact-checking claims with real-time verification.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veritas AI - News Authenticity Analyzer",
    description:
      "Advanced AI-powered tool for analyzing news article authenticity and fact-checking claims with real-time verification.",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Veritas AI" />
        <meta name="application-name" content="Veritas AI" />
        <meta name="theme-color" content="#22c55e" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

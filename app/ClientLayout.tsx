"use client"

import type React from "react"
import { Inter, Heebo } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import Image from "next/image"

// Load Inter for the logo
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" })

// Load Heebo Light for the rest of the site
const heebo = Heebo({
  weight: ["300"], // Light weight
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heebo",
})

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${heebo.className} ${inter.variable} bg-background text-white min-h-screen font-light`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <Link href="/" className="flex flex-col items-center">
                  <div className="h-8">
                    <Image
                      src="/images/logo-white-alpha.png"
                      alt="Human Prompt"
                      width={180}
                      height={32}
                      className="h-full w-auto"
                    />
                  </div>
                  <div className="text-lg font-normal text-white -mt-2">prototype</div>
                </Link>
              </div>
              <nav className="flex space-x-8 text-base">
                <Link
                  href="/"
                  className="text-nav-inactive hover:text-nav-active transition-colors"
                  onClick={() => {
                    // Force a full page refresh to reset all state
                    window.location.href = "/"
                  }}
                >
                  generate
                </Link>
                <Link href="/subscriptions" className="text-nav-inactive hover:text-nav-active transition-colors">
                  subscriptions
                </Link>
                <Link href="/legal" className="text-nav-inactive hover:text-nav-active transition-colors">
                  legal
                </Link>
                <Link href="/contact" className="text-nav-inactive hover:text-nav-active transition-colors">
                  contact us
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}

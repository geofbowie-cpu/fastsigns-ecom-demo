import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { brand } from "@/brand.config"

export const metadata: Metadata = {
  title: `${brand.company} — Enterprise Signage Store`,
  description: brand.heroSubheading,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-50">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

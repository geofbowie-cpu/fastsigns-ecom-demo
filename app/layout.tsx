import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Providers } from "./providers"
import { ConditionalShell } from "./ConditionalShell"

const FALLBACK_SITE_URL = "https://fastsigns-demos.vercel.app"

// Runs at module scope: a blank or malformed SITE_URL must not be allowed to
// throw out of new URL(), or every page in the app 500s.
const SITE_URL = (() => {
  const raw = process.env.SITE_URL?.trim()
  if (!raw) return FALLBACK_SITE_URL
  try {
    return new URL(raw).origin
  } catch {
    return FALLBACK_SITE_URL
  }
})()
const APP_NAME = "FASTSIGNS Demo Builder"
const APP_DESC =
  "Build branded prospect storefront demos — logo, colors, and a curated catalog, live in minutes."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: APP_NAME,
  description: APP_DESC,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESC,
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESC,
  },
}

const GTM_ID = "GTM-NFMTDM7P"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        {/* End Google Tag Manager */}
      </head>
      <body className="flex flex-col min-h-screen bg-gray-50">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          <ConditionalShell>{children}</ConditionalShell>
        </Providers>
      </body>
    </html>
  )
}

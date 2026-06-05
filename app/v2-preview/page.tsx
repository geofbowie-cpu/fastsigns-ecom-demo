import {
  ArrowRight,
  Check,
  Mail,
  Phone,
  ShieldAlert,
  Navigation,
  Flag,
  Snowflake,
  Car,
  Store,
} from "lucide-react"
import { v2FontVars } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Button } from "@/components/v2/ui/button"
import { Card, CardBody, CardFooter, CardHeader } from "@/components/v2/ui/card"
import { Badge } from "@/components/v2/ui/badge"
import { Container } from "@/components/v2/ui/container"

// Fictional tenant for the design showcase.
const ACCENT = "#0f766e" // deep teal

const REP = {
  name: "Dana Whitfield",
  email: "dana.whitfield@northwind-facilities.com",
  phone: "(800) 555-0142",
}

const TRUST = [
  "Net-30 terms for approved accounts",
  "Nationwide install network",
  "OSHA & ANSI compliant",
]

const CATEGORIES: {
  icon: React.ComponentType<{ className?: string }>
  name: string
  desc: string
}[] = [
  {
    icon: ShieldAlert,
    name: "Safety Signage",
    desc: "OSHA, ANSI & ISO compliant warnings, PPE and hazard markings.",
  },
  {
    icon: Navigation,
    name: "Wayfinding",
    desc: "Directional, dock and zone signage that keeps facilities moving.",
  },
  {
    icon: Flag,
    name: "Banners",
    desc: "Heavy-duty indoor and outdoor banners for events and branding.",
  },
  {
    icon: Snowflake,
    name: "Cold Storage",
    desc: "Freezer-rated labels and signs that hold up below zero.",
  },
  {
    icon: Car,
    name: "Vehicle Graphics",
    desc: "Fleet wraps, decals and DOT numbering applied on-site.",
  },
  {
    icon: Store,
    name: "Trade Show",
    desc: "Modular displays, backdrops and booth kits that travel light.",
  },
]

const PRODUCTS: {
  name: string
  desc: string
  gradient: string
}[] = [
  {
    name: "Reflective Dock Numbers",
    desc: "High-visibility aluminum panels, 12–48 in.",
    gradient: "from-teal-500 to-emerald-700",
  },
  {
    name: "Forklift Crossing Sign",
    desc: "Floor and wall mount, ANSI compliant.",
    gradient: "from-amber-400 to-orange-600",
  },
  {
    name: "Mesh Building Banner",
    desc: "Wind-rated vinyl with reinforced grommets.",
    gradient: "from-sky-500 to-indigo-700",
  },
  {
    name: "Freezer Rack Labels",
    desc: "Cold-adhesive, -40°F rated polypropylene.",
    gradient: "from-slate-400 to-slate-700",
  },
]

const FOOTER_COLUMNS: { heading: string; links: string[] }[] = [
  {
    heading: "Products",
    links: ["Safety Signage", "Wayfinding", "Banners", "Vehicle Graphics"],
  },
  {
    heading: "Services",
    links: ["Site Surveys", "Installation", "Permitting", "Reorders"],
  },
  {
    heading: "Account",
    links: ["My Orders", "Quotes", "Brand Assets", "Net-30 Billing"],
  },
]

export default function V2PreviewPage() {
  return (
    <div className={cn(v2FontVars, "font-body bg-white text-ink-900 antialiased")}>
      {/* 1. Top contact bar */}
      <div className="bg-ink-900 text-white">
        <Container className="flex flex-col gap-1 py-2 text-[0.8rem] text-ink-200 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Your dedicated rep:{" "}
            <span className="font-medium text-white">{REP.name}</span>
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <a
              href={`mailto:${REP.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Mail className="h-3.5 w-3.5" />
              {REP.email}
            </a>
            <a
              href={`tel:${REP.phone}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Phone className="h-3.5 w-3.5" />
              {REP.phone}
            </a>
          </div>
        </Container>
      </div>

      {/* 2. Nav */}
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
        <Container className="flex h-20 items-center justify-between">
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl font-extrabold tracking-tight">
              NORTHWIND
            </span>
            <span
              className="mt-1 h-1 w-12 rounded-pill"
              style={{ backgroundColor: ACCENT }}
            />
          </div>
          <span className="hidden text-sm text-ink-600 sm:block">
            Facility signage, sourced & installed nationwide
          </span>
        </Container>
      </header>

      {/* 3. Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(60rem 40rem at 85% -10%, ${ACCENT}, transparent 60%)`,
          }}
        />
        <Container className="relative py-24 sm:py-32">
          <div className="max-w-3xl">
            <Badge variant="accent" className="bg-white/10 text-white">
              <span
                className="inline-block h-1.5 w-1.5 rounded-pill"
                style={{ backgroundColor: ACCENT }}
              />
              Trusted by 340+ distribution centers
            </Badge>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Signage that keeps every facility{" "}
              <span style={{ color: ACCENT }}>safe, clear, and on-brand.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-200">
              From OSHA-compliant safety signs to full vehicle fleets, Northwind
              sources, prints, and installs across all of your locations — billed
              to one account, delivered on one timeline.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button as="a" href="#categories" size="lg" accent={ACCENT}>
                Browse the catalog
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                as="a"
                href="#featured"
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              >
                Request a quote
              </Button>
            </div>
            <ul className="mt-12 flex flex-col gap-x-8 gap-y-3 text-sm text-ink-200 sm:flex-row sm:flex-wrap">
              {TRUST.map((t) => (
                <li key={t} className="inline-flex items-center gap-2">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-pill"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* 4. Category grid */}
      <section id="categories" className="bg-ink-50 py-24">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Shop by category
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              Everything your sites need, organized the way facilities teams
              actually order.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Card key={cat.name} interactive className="group">
                  <CardBody className="flex flex-col gap-4 py-8">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-card transition-transform duration-200 group-hover:scale-105"
                      style={{
                        backgroundColor: `${ACCENT}14`,
                        color: ACCENT,
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-display text-xl font-semibold tracking-tight">
                        {cat.name}
                      </h3>
                      <p className="text-[0.95rem] leading-relaxed text-ink-600">
                        {cat.desc}
                      </p>
                    </div>
                    <span
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                      style={{ color: ACCENT }}
                    >
                      Explore
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        </Container>
      </section>

      {/* 5. Featured products */}
      <section id="featured" className="bg-white py-24">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Featured products
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">
                Reorder favorites in a couple of clicks, or request a custom
                quote for volume.
              </p>
            </div>
            <Button as="a" href="#" variant="ghost" rounded="pill">
              View all products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <Card key={p.name} interactive className="flex flex-col overflow-hidden">
                <div
                  className={cn(
                    "aspect-[4/3] w-full bg-gradient-to-br",
                    p.gradient
                  )}
                />
                <CardHeader>
                  <Badge variant="neutral" className="self-start">
                    In stock
                  </Badge>
                  <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
                    {p.name}
                  </h3>
                </CardHeader>
                <CardBody className="flex-1 py-0">
                  <p className="text-sm leading-relaxed text-ink-600">{p.desc}</p>
                </CardBody>
                <CardFooter>
                  <Button
                    size="sm"
                    accent={ACCENT}
                    rounded="pill"
                    className="w-full"
                  >
                    Request quote
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. Footer */}
      <footer className="bg-ink-900 text-ink-200">
        <Container className="py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl font-extrabold tracking-tight text-white">
                  NORTHWIND
                </span>
                <span
                  className="mt-1 h-1 w-10 rounded-pill"
                  style={{ backgroundColor: ACCENT }}
                />
              </div>
              <p className="mt-5 max-w-xs text-sm leading-relaxed">
                Facility signage, sourced and installed nationwide. One account,
                every location, on time.
              </p>
              <a
                href={`mailto:support@northwind-facilities.com`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-ink-200"
              >
                <Mail className="h-4 w-4" />
                support@northwind-facilities.com
              </a>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="md:col-span-2">
                <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
                  {col.heading}
                </h4>
                <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="transition-colors hover:text-white"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-8 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Northwind Facilities. All rights reserved.</span>
            <span>A demonstration storefront — not a live account.</span>
          </div>
        </Container>
      </footer>
    </div>
  )
}

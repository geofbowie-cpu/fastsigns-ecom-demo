import {
  MapPin,
  Mail,
  Phone,
  User,
  ShoppingCart,
  ChevronRight,
  Clock,
} from "lucide-react"
import { v2FontVars } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Button } from "@/components/v2/ui/button"
import { Badge } from "@/components/v2/ui/badge"
import { Container } from "@/components/v2/ui/container"
import { SearchBar } from "@/components/v2/ui/search-bar"
import { Breadcrumb } from "@/components/v2/ui/breadcrumb"
import { FilterRail, type FilterGroup } from "@/components/v2/ui/filter-rail"

// Fictional tenant for the design showcase.
const ACCENT = "#0f766e" // deep teal — used sparingly

const REP = {
  name: "Samantha Winters",
  email: "samantha.winters@northwind-facilities.com",
  phone: "(800) 555-0142",
}

const DEPARTMENTS = [
  "All",
  "Safety Signage",
  "Wayfinding",
  "Banners",
  "Cold Storage",
  "Vehicle Graphics",
  "Trade Show",
  "Promotional",
]

const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "category",
    title: "Category",
    options: [
      { label: "Safety Signage", count: 42 },
      { label: "Wayfinding", count: 28 },
      { label: "Banners", count: 19 },
      { label: "Cold Storage", count: 11 },
      { label: "Vehicle Graphics", count: 14 },
      { label: "Trade Show", count: 9 },
      { label: "Promotional", count: 23 },
    ],
  },
  {
    id: "lead-time",
    title: "Lead time",
    options: [
      { label: "Ships in 24 hrs", count: 16 },
      { label: "2–3 business days", count: 54 },
      { label: "1 week", count: 31 },
      { label: "Made to order", count: 12 },
    ],
  },
  {
    id: "material",
    title: "Material",
    options: [
      { label: "Aluminum", count: 38 },
      { label: "Vinyl", count: 47 },
      { label: "Acrylic", count: 22 },
      { label: "Coroplast", count: 18 },
      { label: "Polypropylene", count: 9 },
    ],
  },
]

type Product = {
  name: string
  desc: string
  category: string
  leadTime: string
  gradient: string
}

const PRODUCTS: Product[] = [
  {
    name: "Reflective Dock Numbers",
    desc: "High-visibility aluminum panels, 12–48 in.",
    category: "Wayfinding",
    leadTime: "2–3 days",
    gradient: "from-teal-500 to-emerald-700",
  },
  {
    name: "Forklift Crossing Sign",
    desc: "Floor and wall mount, ANSI compliant.",
    category: "Safety Signage",
    leadTime: "Ships in 24 hrs",
    gradient: "from-amber-400 to-orange-600",
  },
  {
    name: "Mesh Building Banner",
    desc: "Wind-rated vinyl with reinforced grommets.",
    category: "Banners",
    leadTime: "1 week",
    gradient: "from-sky-500 to-indigo-700",
  },
  {
    name: "Freezer Rack Labels",
    desc: "Cold-adhesive, -40°F rated polypropylene.",
    category: "Cold Storage",
    leadTime: "2–3 days",
    gradient: "from-slate-400 to-slate-700",
  },
  {
    name: "Fleet Door Decals",
    desc: "DOT numbering & logo kit, cut vinyl.",
    category: "Vehicle Graphics",
    leadTime: "Made to order",
    gradient: "from-rose-500 to-red-700",
  },
  {
    name: "Exit Route Wayfinder",
    desc: "Photoluminescent acrylic, ADA tactile.",
    category: "Wayfinding",
    leadTime: "2–3 days",
    gradient: "from-cyan-500 to-blue-700",
  },
  {
    name: "Retractable Banner Stand",
    desc: "33 in. portable display, travel case incl.",
    category: "Trade Show",
    leadTime: "Ships in 24 hrs",
    gradient: "from-violet-500 to-purple-700",
  },
  {
    name: "PPE Required Sign",
    desc: "Rigid coroplast, indoor/outdoor rated.",
    category: "Safety Signage",
    leadTime: "Ships in 24 hrs",
    gradient: "from-lime-500 to-green-700",
  },
  {
    name: "Branded Hard Hat Stickers",
    desc: "Die-cut helmet decals, 50-pack.",
    category: "Promotional",
    leadTime: "2–3 days",
    gradient: "from-fuchsia-500 to-pink-700",
  },
]

const FOOTER_COLUMNS: { heading: string; links: string[] }[] = [
  {
    heading: "Shop",
    links: ["Safety Signage", "Wayfinding", "Banners", "Vehicle Graphics"],
  },
  {
    heading: "Services",
    links: ["Site Surveys", "Installation", "Permitting", "Reorders"],
  },
  {
    heading: "Account",
    links: ["My Quotes", "Order History", "Brand Assets", "Net-30 Billing"],
  },
  {
    heading: "Support",
    links: ["Contact Rep", "Help Center", "Shipping", "Returns"],
  },
]

export default function V2PreviewPage() {
  return (
    <div
      className={cn(
        v2FontVars,
        "font-body min-h-screen bg-ink-50 text-ink-900 antialiased"
      )}
    >
      {/* 1. Thin top utility bar */}
      <div className="bg-ink-900 text-ink-200">
        <Container className="flex h-9 items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" style={{ color: ACCENT }} />
            <span className="hidden sm:inline">Deliver to all </span>Northwind
            locations
          </span>
          <div className="flex items-center gap-x-5">
            <span className="hidden text-ink-400 md:inline">
              Your rep:{" "}
              <span className="font-medium text-white">{REP.name}</span>
            </span>
            <a
              href={`mailto:${REP.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{REP.email}</span>
              <span className="lg:hidden">Email</span>
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

      {/* 2. Main header — dark, Amazon-style */}
      <header className="sticky top-0 z-30 bg-ink-900 text-white shadow-elevated">
        <Container className="flex h-16 items-center gap-4 sm:gap-6">
          {/* Wordmark */}
          <a href="#" className="flex shrink-0 items-end leading-none">
            <span className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              NORTHWIND
            </span>
            <span
              className="mb-1 ml-1 h-1.5 w-1.5 rounded-pill"
              style={{ backgroundColor: ACCENT }}
            />
          </a>

          {/* Center search */}
          <div className="flex-1">
            <SearchBar accent={ACCENT} />
          </div>

          {/* Account + cart */}
          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <button
              type="button"
              className="hidden items-center gap-2 text-left text-sm transition-colors hover:text-ink-200 sm:flex"
            >
              <User className="h-5 w-5" />
              <span className="flex flex-col leading-tight">
                <span className="text-[0.7rem] text-ink-400">Hello,</span>
                <span className="font-semibold">Sign in</span>
              </span>
            </button>
            <button
              type="button"
              className="relative inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-ink-200"
            >
              <span className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span
                  className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-pill px-1 text-[0.65rem] font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  3
                </span>
              </span>
              <span className="hidden lg:inline">Quote</span>
            </button>
          </div>
        </Container>
      </header>

      {/* 3. Departments strip */}
      <nav className="bg-ink-900/95 text-sm text-ink-200">
        <Container>
          <ul className="flex items-center gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DEPARTMENTS.map((dept, i) => {
              const active = i === 0
              return (
                <li key={dept}>
                  <a
                    href="#"
                    className={cn(
                      "inline-block whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-colors",
                      active
                        ? "text-white"
                        : "text-ink-200 hover:bg-white/10 hover:text-white"
                    )}
                    style={
                      active
                        ? { backgroundColor: ACCENT, color: "#fff" }
                        : undefined
                    }
                  >
                    {dept}
                  </a>
                </li>
              )
            })}
          </ul>
        </Container>
      </nav>

      {/* 4. Slim promotional banner */}
      <div className="border-b border-ink-200 bg-white">
        <Container className="flex h-[88px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge
              className="hidden sm:inline-flex"
              style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
            >
              Net-30 accounts
            </Badge>
            <p className="text-sm font-medium text-ink-900 sm:text-[0.95rem]">
              Compliant signage for every site —{" "}
              <span className="text-ink-600">
                sourced, printed &amp; installed nationwide.
              </span>
            </p>
          </div>
          <Button as="a" href="#" size="sm" accent={ACCENT} className="shrink-0">
            Browse all products
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Container>
      </div>

      {/* 5 + 6. Breadcrumb + browse area */}
      <Container className="py-5">
        <Breadcrumb
          items={[{ label: "Home", href: "#" }, { label: "All products" }]}
          className="mb-4"
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left filter rail */}
          <div className="lg:w-[240px] lg:shrink-0">
            <div className="rounded-card border border-ink-200 bg-white p-4 shadow-soft lg:sticky lg:top-[136px]">
              <FilterRail groups={FILTER_GROUPS} accent={ACCENT} />
            </div>
          </div>

          {/* Right product grid */}
          <div className="min-w-0 flex-1">
            {/* Grid header */}
            <div className="mb-4 flex flex-col gap-3 rounded-card border border-ink-200 bg-white px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-600">
                <span className="font-semibold text-ink-900">
                  {PRODUCTS.length}
                </span>{" "}
                results in{" "}
                <span className="font-medium text-ink-900">All products</span>
              </p>
              <label className="flex items-center gap-2 text-sm text-ink-600">
                Sort by
                <select
                  className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 font-body text-sm text-ink-900 shadow-soft focus:border-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900/10"
                  defaultValue="featured"
                >
                  <option value="featured">Featured</option>
                  <option value="name">Name: A–Z</option>
                  <option value="lead">Lead time</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>

            {/* Dense product grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {PRODUCTS.map((p) => (
                <div
                  key={p.name}
                  className="group flex flex-col overflow-hidden rounded-card border border-ink-200 bg-white shadow-soft transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevated"
                >
                  {/* Image area */}
                  <div
                    className={cn(
                      "relative aspect-[4/3] w-full bg-gradient-to-br",
                      p.gradient
                    )}
                  >
                    <span className="absolute left-2 top-2">
                      <Badge
                        variant="neutral"
                        className="bg-white/90 text-ink-900 backdrop-blur"
                      >
                        {p.category}
                      </Badge>
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-1.5 px-3 pt-3">
                    <h3 className="font-display text-[0.95rem] font-semibold leading-snug tracking-tight text-ink-900">
                      {p.name}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-ink-600">
                      {p.desc}
                    </p>
                    <span
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: ACCENT }}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {p.leadTime}
                    </span>
                  </div>

                  {/* Footer CTA */}
                  <div className="px-3 pb-3 pt-2.5">
                    <Button
                      size="sm"
                      accent={ACCENT}
                      className="h-9 w-full text-sm"
                    >
                      Add to quote
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* 7. Footer */}
      <footer className="mt-8 bg-ink-900 text-ink-200">
        <Container className="py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-end leading-none">
                <span className="font-display text-lg font-extrabold tracking-tight text-white">
                  NORTHWIND
                </span>
                <span
                  className="mb-1 ml-1 h-1.5 w-1.5 rounded-pill"
                  style={{ backgroundColor: ACCENT }}
                />
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">
                Facility signage, sourced and installed nationwide. One account,
                every location.
              </p>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading}>
                <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-white">
                  {col.heading}
                </h4>
                <ul className="mt-3 flex flex-col gap-2 text-sm">
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

          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} Northwind Facilities. All rights
              reserved.
            </span>
            <span>A demonstration storefront — not a live account.</span>
          </div>
        </Container>
      </footer>
    </div>
  )
}

// Shared product bank — every demo tenant picks which categories of these
// products they want to show on their site. This is the single source of
// truth. To add a new product, add it here.

// Per-product overrides stored in tenants.product_overrides JSONB.
// All fields are optional — only set what you want to override.
export type ProductOverride = {
  disabled?: boolean   // hide this product from the tenant's site
  price?: number       // override startingPrice
  imageUrl?: string    // custom product image URL
  featured?: boolean   // override featured flag
}
export type ProductOverrides = Record<string, ProductOverride>

export type BankProduct = {
  slug: string
  name: string
  category: string
  shortDesc: string
  description: string
  sizes: string[]
  materials: string[]
  startingPrice: number
  unit: string
  gradientFrom: string
  gradientTo: string
  icon: string
  featured: boolean
  tags: string[]
  leadTime: string
  imageUrl?: string
}

export type BankCategory = {
  slug: string
  name: string
  icon: string
  description: string
  imageUrl?: string
  /** Explicit product slugs — if non-empty, the category shows these products
   *  regardless of the products' own category field. Used for custom / curated
   *  categories like "Cold Storage" or seasonal collections. */
  productSlugs?: string[]
}

export const bankCategories: BankCategory[] = [
  {
    slug: "banners",
    name: "Banners & Flags",
    icon: "Flag",
    description: "High-impact outdoor and indoor banners for every occasion",
  },
  {
    slug: "window-wall",
    name: "Window & Wall Graphics",
    icon: "Layers",
    description: "Transform your space with custom printed graphics",
  },
  {
    slug: "trade-show",
    name: "Trade Show Displays",
    icon: "Monitor",
    description: "Stand out at every event and conference",
  },
  {
    slug: "vehicle",
    name: "Vehicle Wraps",
    icon: "Car",
    description: "Turn your fleet into moving brand ambassadors",
  },
  {
    slug: "wayfinding",
    name: "Wayfinding & ADA",
    icon: "Navigation",
    description: "Guide customers and meet compliance requirements",
  },
  {
    slug: "promotional",
    name: "Promotional Products",
    icon: "Gift",
    description: "Branded merchandise your team and clients will love",
  },
  {
    slug: "adhesive-vinyls",
    name: "Adhesive Vinyls",
    icon: "Tag",
    description: "Safety and compliance vinyl decals for floors, walls, and equipment",
  },
  {
    slug: "interior-wayfinding",
    name: "Interior Wayfinding",
    icon: "Compass",
    description: "Guide employees and visitors through your facility safely",
  },
  {
    slug: "celebration-anniversary",
    name: "Celebration & Anniversary",
    icon: "Star",
    description: "Anniversary products, history walls, and recognition items",
  },
  {
    slug: "rebranding",
    name: "Rebranding",
    icon: "Palette",
    description: "Custom wall vinyls and signage for facility rebrands",
  },
  {
    slug: "startup-bundles",
    name: "Startup Bundles",
    icon: "Package",
    description: "Everything a new facility needs to open compliantly and on-brand",
  },
]

export const bankProducts: BankProduct[] = [
  // ── BANNERS ──────────────────────────────────────────────
  {
    slug: "vinyl-banner",
    name: "Vinyl Banner",
    category: "banners",
    shortDesc: "Durable full-color banners for indoor or outdoor use",
    description:
      "Premium vinyl banners on 13 oz. scrim vinyl with UV-resistant inks. Reinforced hems and rust-proof grommets included.",
    sizes: ["2' x 4'", "2' x 6'", "3' x 6'", "3' x 8'", "4' x 8'", "Custom"],
    materials: ["13 oz. Scrim Vinyl", "18 oz. Heavy Duty Vinyl", "Mesh Vinyl"],
    startingPrice: 49,
    unit: "per banner",
    gradientFrom: "#1e3a5f",
    gradientTo: "#2d6a9f",
    icon: "🚩",
    featured: true,
    tags: ["outdoor", "indoor", "event"],
    leadTime: "3–5 business days",
  },
  {
    slug: "retractable-banner-stand",
    name: "Retractable Banner Stand",
    category: "banners",
    shortDesc: "Premium pull-up stands for events and retail",
    description:
      "Professional retractable banner stands with a smooth mechanism and premium aluminum base. Carry bag included.",
    sizes: ['24" x 80"', '33" x 80"', '36" x 80"', '48" x 80"'],
    materials: ["Standard Vinyl", "Premium Fabric"],
    startingPrice: 89,
    unit: "per unit",
    gradientFrom: "#0f2d4a",
    gradientTo: "#1e3a5f",
    icon: "📋",
    featured: true,
    tags: ["event", "retail", "portable"],
    leadTime: "3–5 business days",
  },
  {
    slug: "outdoor-feather-flag",
    name: "Outdoor Feather Flag",
    category: "banners",
    shortDesc: "Eye-catching flags that move with the wind",
    description:
      "Feather flags on wind-resistant dye-sublimated polyester. Available with ground spike, cross base, or weighted base.",
    sizes: ["8 ft", "11 ft", "15 ft"],
    materials: ["Dye-Sublimated Polyester"],
    startingPrice: 79,
    unit: "per flag",
    gradientFrom: "#c2410c",
    gradientTo: "#ea580c",
    icon: "🏳️",
    featured: false,
    tags: ["outdoor", "event", "retail"],
    leadTime: "5–7 business days",
  },
  // ── WINDOW & WALL ────────────────────────────────────────
  {
    slug: "perforated-window-decals",
    name: "Perforated Window Decals",
    category: "window-wall",
    shortDesc: "See-through vinyl graphics for storefront windows",
    description:
      "Perforated vinyl allows light and visibility from inside while displaying full-color graphics outside.",
    sizes: ['12" x 12"', '24" x 24"', '24" x 36"', '36" x 48"', "Custom"],
    materials: ["Perforated Vinyl", "Clear Vinyl", "Static Cling"],
    startingPrice: 29,
    unit: "per decal",
    gradientFrom: "#0891b2",
    gradientTo: "#0e7490",
    icon: "🪟",
    featured: true,
    tags: ["window", "retail", "storefront"],
    leadTime: "3–5 business days",
  },
  {
    slug: "wall-mural",
    name: "Wall Mural",
    category: "window-wall",
    shortDesc: "Transform blank walls into brand statements",
    description:
      "Floor-to-ceiling or accent wall murals printed and installed by certified technicians. Removable options available.",
    sizes: ["Per Square Foot"],
    materials: ["Removable Vinyl", "Permanent Vinyl", "Fabric"],
    startingPrice: 8,
    unit: "per sq ft (installed)",
    gradientFrom: "#7c3aed",
    gradientTo: "#5b21b6",
    icon: "🖼️",
    featured: false,
    tags: ["interior", "branding", "office"],
    leadTime: "10–14 business days",
  },
  // ── TRADE SHOW ───────────────────────────────────────────
  {
    slug: "trade-show-booth-10x10",
    name: "10x10 Trade Show Booth",
    category: "trade-show",
    shortDesc: "Complete booth package for trade shows and conferences",
    description:
      "Full 10'x10' booth with backwall, side walls, and counter. Custom printed and ready to set up in under 30 minutes.",
    sizes: ["10' x 10'", "10' x 20'"],
    materials: ["Tension Fabric", "Aluminum Frame"],
    startingPrice: 1499,
    unit: "per booth",
    gradientFrom: "#1f2937",
    gradientTo: "#374151",
    icon: "🏢",
    featured: true,
    tags: ["event", "conference", "premium"],
    leadTime: "10–14 business days",
  },
  {
    slug: "table-throw",
    name: "Table Throw",
    category: "trade-show",
    shortDesc: "Branded table covers for any 6ft or 8ft table",
    description:
      "Full-color dye-sublimated table throws that fit standard 6ft or 8ft tables. Wrinkle-resistant, machine washable.",
    sizes: ['6 ft (3-sided)', '6 ft (4-sided)', '8 ft (3-sided)', '8 ft (4-sided)'],
    materials: ["Polyester Twill"],
    startingPrice: 119,
    unit: "per throw",
    gradientFrom: "#0d9488",
    gradientTo: "#0f766e",
    icon: "🎪",
    featured: false,
    tags: ["event", "table", "branded"],
    leadTime: "5–7 business days",
  },
  // ── VEHICLE ──────────────────────────────────────────────
  {
    slug: "vehicle-magnets",
    name: "Vehicle Magnets",
    category: "vehicle",
    shortDesc: "Removable branded magnets for fleet vehicles",
    description:
      "Heavy-duty 30-mil magnetic vinyl with full-color UV print. Perfect for fleet branding without permanent vinyl.",
    sizes: ['12" x 24"', '18" x 24"', '24" x 36"', "Custom"],
    materials: ["30 mil Magnetic Vinyl"],
    startingPrice: 39,
    unit: "per magnet",
    gradientFrom: "#7c2d12",
    gradientTo: "#9a3412",
    icon: "🚗",
    featured: false,
    tags: ["vehicle", "fleet", "removable"],
    leadTime: "3–5 business days",
  },
  // ── WAYFINDING ───────────────────────────────────────────
  {
    slug: "ada-room-sign",
    name: "ADA Room Sign",
    category: "wayfinding",
    shortDesc: "Compliant ADA tactile and Braille room identification",
    description:
      "Photopolymer ADA-compliant signs with Grade 2 Braille and raised tactile characters. Meets all federal requirements.",
    sizes: ['6" x 8"', '8" x 8"', '8" x 10"'],
    materials: ["Photopolymer", "Acrylic"],
    startingPrice: 45,
    unit: "per sign",
    gradientFrom: "#1e40af",
    gradientTo: "#1e3a8a",
    icon: "♿",
    featured: false,
    tags: ["ada", "compliance", "wayfinding"],
    leadTime: "5–7 business days",
  },
  // ── PROMOTIONAL ──────────────────────────────────────────
  {
    slug: "branded-tote",
    name: "Branded Tote Bag",
    category: "promotional",
    shortDesc: "Eco-friendly cotton tote bags with custom branding",
    description:
      "Heavy-weight cotton canvas tote bags with full-color screen-printed or embroidered branding. Reusable and durable.",
    sizes: ['15" x 16"', '18" x 18"'],
    materials: ["Cotton Canvas", "Recycled Polyester"],
    startingPrice: 4.5,
    unit: "per bag (50 min.)",
    gradientFrom: "#15803d",
    gradientTo: "#166534",
    icon: "🛍️",
    featured: false,
    tags: ["promo", "eco", "giveaway"],
    leadTime: "10–14 business days",
  },
  {
    slug: "branded-water-bottle",
    name: "Branded Water Bottle",
    category: "promotional",
    shortDesc: "Stainless steel insulated water bottles",
    description:
      "Double-wall vacuum insulated stainless steel water bottles. Laser-engraved or full-color printed branding.",
    sizes: ["20 oz", "32 oz", "40 oz"],
    materials: ["Stainless Steel"],
    startingPrice: 18,
    unit: "per bottle (24 min.)",
    gradientFrom: "#475569",
    gradientTo: "#334155",
    icon: "💧",
    featured: true,
    tags: ["promo", "drinkware", "premium"],
    leadTime: "10–14 business days",
  },
  // ── ADHESIVE VINYLS / SAFETY ─────────────────────────────
  {
    slug: "floor-decals",
    name: "Floor Decals",
    category: "adhesive-vinyls",
    shortDesc: "Custom slip-resistant floor decals for any message",
    description:
      "High-durability floor decals with non-slip UV laminate. Use for directional arrows, safety warnings, or branding.",
    sizes: ['12" x 12"', '12" x 24"', '24" x 24"', "Custom"],
    materials: ["Non-Slip Laminate Vinyl"],
    startingPrice: 29,
    unit: "per decal",
    gradientFrom: "#0057a8",
    gradientTo: "#1a78d4",
    icon: "⬇️",
    featured: true,
    tags: ["floor", "safety", "wayfinding"],
    leadTime: "3–5 business days",
  },
  {
    slug: "safety-decal-pack",
    name: "Safety Decal Starter Pack",
    category: "adhesive-vinyls",
    shortDesc: "OSHA-compliant safety decals for warehouses and facilities",
    description:
      "Pre-approved safety decal pack — hard hat zones, eye protection, AED markers, no-package floor signs, and more.",
    sizes: ["Standard Pack (12)", "Full Pack (24)"],
    materials: ["Wall Vinyl", "Non-Slip Floor Laminate"],
    startingPrice: 145,
    unit: "per pack",
    gradientFrom: "#dc2626",
    gradientTo: "#991b1b",
    icon: "⚠️",
    featured: false,
    tags: ["safety", "osha", "warehouse"],
    leadTime: "5–7 business days",
  },
  // ── INTERIOR WAYFINDING ──────────────────────────────────
  {
    slug: "hanging-pvc-signs",
    name: "Hanging PVC Signs",
    category: "interior-wayfinding",
    shortDesc: "Suspended aisle and department identification signs",
    description:
      "Rigid PVC hanging signs for aisle identification, department labeling, and overhead directionals. Pre-drilled.",
    sizes: ['12" x 18"', '18" x 24"', '24" x 36"'],
    materials: ["4mm Coroplast", "6mm PVC", "Aluminum Composite"],
    startingPrice: 45,
    unit: "per sign",
    gradientFrom: "#0057a8",
    gradientTo: "#1a78d4",
    icon: "🪧",
    featured: false,
    tags: ["wayfinding", "interior", "hanging"],
    leadTime: "5–7 business days",
  },
  // ── STARTUP BUNDLE ───────────────────────────────────────
  {
    slug: "facility-startup-bundle",
    name: "Facility Startup Bundle",
    category: "startup-bundles",
    shortDesc: "Everything a new facility needs on day one",
    description:
      "Complete signage package for new facility openings. Emergency exits, AED markers, safety decals, aisle wayfinding, dock door signs, exterior identification.",
    sizes: ["Small (<50k sqft)", "Standard", "Large (>100k sqft)"],
    materials: ["Mixed — see spec sheet"],
    startingPrice: 1200,
    unit: "per bundle",
    gradientFrom: "#0057a8",
    gradientTo: "#003d7a",
    icon: "📦",
    featured: true,
    tags: ["bundle", "startup", "complete"],
    leadTime: "10–14 business days",
  },
]

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function categoriesForTenant(enabledSlugs: string[]): BankCategory[] {
  if (enabledSlugs.length === 0) return bankCategories
  const set = new Set(enabledSlugs)
  return bankCategories.filter((c) => set.has(c.slug))
}

export function productsForTenant(
  enabledSlugs: string[],
  overrides: ProductOverrides = {}
): BankProduct[] {
  const base =
    enabledSlugs.length === 0
      ? bankProducts
      : bankProducts.filter((p) => {
          const set = new Set(enabledSlugs)
          return set.has(p.category)
        })
  return base
    .filter((p) => !overrides[p.slug]?.disabled)
    .map((p) => {
      const ov = overrides[p.slug]
      if (!ov) return p
      return {
        ...p,
        startingPrice: ov.price ?? p.startingPrice,
        imageUrl: ov.imageUrl ?? p.imageUrl,
        featured: ov.featured ?? p.featured,
      }
    })
}

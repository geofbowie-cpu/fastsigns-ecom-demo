// ============================================================
// BRAND CONFIG — Edit this file to clone for a new customer
// ============================================================

export const brand = {
  company: "Visual Solutions Group",
  tagline: "Enterprise Signage & Branded Products",
  logoText: "VSG", // shown when no logo image
  logoImage: null as string | null, // e.g. "/logo.png"
  primaryColor: "#1e3a5f",        // brand primary (nav, buttons, hero)
  primaryDark: "#152a47",         // darker shade for gradients
  primaryLight: "#2d6a9f",        // lighter shade
  accentColor: "#f59e0b",         // accent (badges, highlights)
  accentDark: "#d97706",
  heroHeading: "Branded Signage for Every Location",
  heroSubheading:
    "Order, approve, and track signage for all your facilities — from one central storefront connected to your procurement system.",
  heroCtaText: "Browse Products",
  // Procurement integration
  procurementSystem: "COUPA" as "COUPA" | "SAP Ariba" | "Oracle" | "Custom" | null,
  procurementLabel: "COUPA", // display name
  costCenters: [
    "Corporate Marketing",
    "Facilities & Real Estate",
    "Events & Conferences",
    "Regional — West",
    "Regional — East",
    "Regional — Central",
    "Human Resources",
    "Sales Operations",
  ],
  approvers: [
    "Sarah Mitchell (VP Marketing)",
    "James Okafor (Procurement)",
    "Auto-Approve (under $500)",
  ],
  // Footer
  footerTagline: "Powered by FASTSIGNS Enterprise",
  supportEmail: "support@fastsigns.com",
  // Admin
  adminEmail: "admin@visualsolutionsgroup.com",
  adminPassword: "demo2024",
}

// ============================================================
// PRODUCT CATALOG
// ============================================================

export type Product = {
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
  sku?: string
  imageUrl?: string
  imagePosition?: { x: number; y: number }
  imageZoom?: number
}

export const categories = [
  {
    slug: "banners",
    name: "Banners & Flags",
    icon: "🚩",
    description: "High-impact outdoor and indoor banners for every occasion",
  },
  {
    slug: "window-wall",
    name: "Window & Wall Graphics",
    icon: "🪟",
    description: "Transform your space with custom printed graphics",
  },
  {
    slug: "trade-show",
    name: "Trade Show Displays",
    icon: "🏢",
    description: "Stand out at every event and conference",
  },
  {
    slug: "vehicle",
    name: "Vehicle Wraps",
    icon: "🚗",
    description: "Turn your fleet into moving brand ambassadors",
  },
  {
    slug: "wayfinding",
    name: "Wayfinding & ADA",
    icon: "🗺️",
    description: "Guide customers and meet compliance requirements",
  },
  {
    slug: "promotional",
    name: "Promotional Products",
    icon: "🎁",
    description: "Branded merchandise your team and clients will love",
  },
]

export const products: Product[] = [
  // ── BANNERS ──────────────────────────────────────────────
  {
    slug: "vinyl-banner",
    name: "Vinyl Banner",
    category: "banners",
    shortDesc: "Durable full-color banners for indoor or outdoor use",
    description:
      "Our premium vinyl banners are printed on 13 oz. scrim vinyl with UV-resistant inks that stay vibrant outdoors. Reinforced hems and rust-proof grommets included. Perfect for storefronts, events, and grand openings.",
    sizes: ["2' x 4'", "2' x 6'", "3' x 6'", "3' x 8'", "4' x 8'", "Custom"],
    materials: ["13 oz. Scrim Vinyl", "18 oz. Heavy Duty Vinyl", "Mesh Vinyl (Wind-Resistant)"],
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
      "Professional retractable banner stands with a smooth mechanism and premium aluminum base. Easy to set up, tear down, and transport in the included carry bag. Full-color print included.",
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
      "Feather flags printed on wind-resistant dye-sublimated polyester. Available with ground spike, cross base, or weighted base for any surface. High-visibility from distance.",
    sizes: ["8 ft", "11 ft", "15 ft"],
    materials: ["Dye-Sublimated Polyester"],
    startingPrice: 79,
    unit: "per flag (hardware separate)",
    gradientFrom: "#c2410c",
    gradientTo: "#ea580c",
    icon: "🏳️",
    featured: false,
    tags: ["outdoor", "event", "retail"],
    leadTime: "5–7 business days",
  },
  {
    slug: "step-repeat-banner",
    name: "Step & Repeat Banner",
    category: "banners",
    shortDesc: "Event backdrops for press moments and brand visibility",
    description:
      "Custom step and repeat banners for corporate events, award ceremonies, and photo opportunities. Includes aluminum frame and carry bag. Double-sided printing available.",
    sizes: ["8' x 8'", "8' x 10'", "10' x 10'", "10' x 20'"],
    materials: ["Fabric", "Vinyl"],
    startingPrice: 199,
    unit: "per banner",
    gradientFrom: "#374151",
    gradientTo: "#111827",
    icon: "🎬",
    featured: false,
    tags: ["event", "corporate", "premium"],
    leadTime: "5–7 business days",
  },

  // ── WINDOW & WALL ─────────────────────────────────────────
  {
    slug: "perforated-window-decals",
    name: "Perforated Window Decals",
    category: "window-wall",
    shortDesc: "See-through vinyl graphics for storefront windows",
    description:
      "Perforated vinyl allows natural light and visibility from the inside while displaying full-color graphics from the outside. Perfect for retail storefronts, office windows, and vehicle rear windows.",
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
      "Floor-to-ceiling or accent wall murals printed and installed by our certified technicians. Removable options available for leased spaces. Design consultation included.",
    sizes: ["Per Square Foot"],
    materials: ["Removable Vinyl", "Permanent Vinyl", "Fabric"],
    startingPrice: 8,
    unit: "per sq ft (installed)",
    gradientFrom: "#7c3aed",
    gradientTo: "#6d28d9",
    icon: "🖼️",
    featured: true,
    tags: ["interior", "office", "retail", "premium"],
    leadTime: "7–10 business days",
  },
  {
    slug: "frosted-window-film",
    name: "Frosted Window Film",
    category: "window-wall",
    shortDesc: "Privacy glass and branded graphics in one product",
    description:
      "Decorative frosted film adds privacy while allowing light through. Add logos, patterns, or text. Perfect for conference rooms, office partitions, and glass doors. No residue removal.",
    sizes: ["Per Square Foot"],
    materials: ["Frosted Film", "Etched Glass Film"],
    startingPrice: 12,
    unit: "per sq ft",
    gradientFrom: "#64748b",
    gradientTo: "#475569",
    icon: "❄️",
    featured: false,
    tags: ["office", "privacy", "interior"],
    leadTime: "5–7 business days",
  },
  {
    slug: "floor-graphics",
    name: "Non-Slip Floor Graphics",
    category: "window-wall",
    shortDesc: "Branded floor decals — ADA-compliant and slip-resistant",
    description:
      "ADA-compliant, slip-resistant floor graphics for wayfinding, promotions, or brand reinforcement. UV-laminated top coat. Suitable for tile, carpet, and concrete surfaces.",
    sizes: ['12" x 12"', '24" x 24"', "Custom"],
    materials: ["Non-Slip Laminate Vinyl"],
    startingPrice: 39,
    unit: "per decal",
    gradientFrom: "#065f46",
    gradientTo: "#047857",
    icon: "⬇️",
    featured: false,
    tags: ["floor", "wayfinding", "retail"],
    leadTime: "3–5 business days",
  },

  // ── TRADE SHOW ────────────────────────────────────────────
  {
    slug: "popup-display",
    name: "Pop-Up Display (10 ft)",
    category: "trade-show",
    shortDesc: "Full backwall display for trade show booths",
    description:
      "Magnetic pop-up frame with full-color fabric or vinyl graphic panels. Sets up in under 5 minutes with no tools. Includes carry bag and optional integrated lighting.",
    sizes: ["8 ft", "10 ft", "20 ft"],
    materials: ["Fabric", "Vinyl"],
    startingPrice: 449,
    unit: "per display",
    gradientFrom: "#1e3a5f",
    gradientTo: "#2d6a9f",
    icon: "🏢",
    featured: true,
    tags: ["trade-show", "event", "premium"],
    leadTime: "7–10 business days",
  },
  {
    slug: "tension-fabric-display",
    name: "Tension Fabric Display",
    category: "trade-show",
    shortDesc: "Sleek modern backwall with optional LED backlighting",
    description:
      "Backlit or non-backlit SEG (Silicone Edge Graphics) displays with lightweight aluminum frame. Pillowcase-style fabric slides on for a wrinkle-free, seamless finish.",
    sizes: ["8' x 8'", "8' x 10'", "10' x 10'"],
    materials: ["Stretch Fabric"],
    startingPrice: 599,
    unit: "per display",
    gradientFrom: "#312e81",
    gradientTo: "#4338ca",
    icon: "✨",
    featured: false,
    tags: ["trade-show", "premium", "backlit"],
    leadTime: "7–10 business days",
  },
  {
    slug: "table-throw",
    name: "Custom Table Throw",
    category: "trade-show",
    shortDesc: "Branded table covers for any event",
    description:
      "Full-color dye-sublimated table throws for 6 ft or 8 ft tables. Machine washable and wrinkle-resistant. 3-sided or 4-sided coverage available.",
    sizes: ["6 ft", "8 ft"],
    materials: ["Polyester"],
    startingPrice: 89,
    unit: "per throw",
    gradientFrom: "#374151",
    gradientTo: "#1f2937",
    icon: "🪑",
    featured: false,
    tags: ["trade-show", "event"],
    leadTime: "5–7 business days",
  },

  // ── VEHICLE ───────────────────────────────────────────────
  {
    slug: "full-vehicle-wrap",
    name: "Full Vehicle Wrap",
    category: "vehicle",
    shortDesc: "Complete coverage wrap for maximum brand impact",
    description:
      "Full vehicle wraps using premium 3M or Avery cast vinyl. Professionally installed by 3M-certified wrappers. Includes design, print, lamination, and installation. 2-year installation warranty.",
    sizes: ["Sedan", "SUV / Truck", "Cargo Van", "Box Truck", "Sprinter Van"],
    materials: ["3M 1080 Cast Vinyl", "Avery Supreme Wrap Film"],
    startingPrice: 2499,
    unit: "per vehicle",
    gradientFrom: "#1e3a5f",
    gradientTo: "#c2410c",
    icon: "🚗",
    featured: true,
    tags: ["vehicle", "fleet", "outdoor", "premium"],
    leadTime: "10–14 business days",
  },
  {
    slug: "vehicle-magnets",
    name: "Vehicle Door Magnets",
    category: "vehicle",
    shortDesc: "Removable magnets — brand without commitment",
    description:
      "High-strength magnetic signs that won't scratch your vehicle's finish. Easy on, easy off. Great for sales fleets, service vehicles, and seasonal branding.",
    sizes: ['12" x 18"', '12" x 24"', '18" x 24"'],
    materials: ["Magnetic Vinyl"],
    startingPrice: 39,
    unit: "per pair",
    gradientFrom: "#374151",
    gradientTo: "#4b5563",
    icon: "🔖",
    featured: false,
    tags: ["vehicle", "removable"],
    leadTime: "3–5 business days",
  },

  // ── WAYFINDING ────────────────────────────────────────────
  {
    slug: "interior-directional-signs",
    name: "Interior Directional Signs",
    category: "wayfinding",
    shortDesc: "Guide visitors through your facility with clarity",
    description:
      "Blade, overhead, and wall-mounted directional signage systems consistent with your brand standards. Available in aluminum, acrylic, or PVC. Installation available.",
    sizes: ['4" x 18"', '6" x 24"', "Custom"],
    materials: ["Aluminum", "Acrylic", "PVC"],
    startingPrice: 49,
    unit: "per sign",
    gradientFrom: "#1e3a5f",
    gradientTo: "#1d4ed8",
    icon: "🗺️",
    featured: false,
    tags: ["wayfinding", "interior", "facility"],
    leadTime: "5–7 business days",
  },
  {
    slug: "ada-compliant-signs",
    name: "ADA Compliant Room Signs",
    category: "wayfinding",
    shortDesc: "Room ID signs that meet ADA/ABA requirements",
    description:
      "Tactile text, Grade 2 Braille, and non-glare finish — fully ADA/ABA compliant. Available in a range of sizes and substrate colors to match your interior design standards.",
    sizes: ['6" x 8"', '6" x 9"', '8" x 9"'],
    materials: ["Acrylic"],
    startingPrice: 79,
    unit: "per sign",
    gradientFrom: "#065f46",
    gradientTo: "#047857",
    icon: "♿",
    featured: false,
    tags: ["wayfinding", "ada", "compliance", "facility"],
    leadTime: "7–10 business days",
  },
  {
    slug: "dimensional-lobby-sign",
    name: "Dimensional Lobby Sign",
    category: "wayfinding",
    shortDesc: "Impressive 3D lettering for reception areas",
    description:
      "Laser-cut acrylic or metal lettering in painted, brushed, or backlit finish. Standoff-mounted for a floating effect. Installation included. Make your brand the first thing visitors notice.",
    sizes: ["Per Letter / Per Logo"],
    materials: ["Acrylic", "Brushed Aluminum", "Painted Metal", "Backlit Channel Letters"],
    startingPrice: 299,
    unit: "starting price — quote required",
    gradientFrom: "#78350f",
    gradientTo: "#92400e",
    icon: "🏛️",
    featured: true,
    tags: ["lobby", "interior", "premium", "branding"],
    leadTime: "14–21 business days",
  },

  // ── PROMOTIONAL ───────────────────────────────────────────
  {
    slug: "branded-apparel",
    name: "Branded Apparel",
    category: "promotional",
    shortDesc: "Embroidered and screen-printed shirts, jackets, hats",
    description:
      "Custom embroidered or screen-printed apparel from top brands including Port Authority, Nike, Carhartt, and New Era. Logo digitizing included. Volume pricing available.",
    sizes: ["XS – 4XL"],
    materials: ["Cotton", "Polyester Blend", "Performance Fabric"],
    startingPrice: 18,
    unit: "per item (12 min.)",
    gradientFrom: "#1e3a5f",
    gradientTo: "#374151",
    icon: "👕",
    featured: false,
    tags: ["apparel", "promotional", "corporate"],
    leadTime: "10–14 business days",
  },
  {
    slug: "branded-merchandise-pack",
    name: "Branded Merchandise Pack",
    category: "promotional",
    shortDesc: "Curated kits — pens, notebooks, drinkware, and more",
    description:
      "Curated branded merchandise packs for employee onboarding, client gifts, or events. Logo setup included. Mix and match items to build your custom kit. White-label packaging available.",
    sizes: ["Starter (5 items)", "Premium (8 items)", "Executive (12 items)"],
    materials: [],
    startingPrice: 45,
    unit: "per kit",
    gradientFrom: "#7c3aed",
    gradientTo: "#4c1d95",
    icon: "🎁",
    featured: false,
    tags: ["promotional", "corporate", "gift"],
    leadTime: "10–14 business days",
  },
]

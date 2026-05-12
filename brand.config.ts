// ============================================================
// BRAND CONFIG — Reddy Ice
// ============================================================

export const brand = {
  company: "Reddy Ice",
  tagline: "Facility Signage & Safety Products",
  logoText: "REDDY ICE",
  logoImage: "/reddy-logo.png" as string | null,
  // Hero background (stock cold-storage / ice photo)
  heroBgImage: "https://images.unsplash.com/photo-1551845728-6820a30c64e2?auto=format&fit=crop&w=2000&q=80" as string | null,
  heroBgPosition: { x: 50, y: 45 },
  heroBgZoom: 1.05,
  heroBgOverlay: 0.55,
  primaryColor: "#0057a8",        // Reddy Ice blue
  primaryDark: "#003d7a",
  primaryLight: "#1a78d4",
  accentColor: "#e31837",         // Reddy Ice red
  accentDark: "#b8112b",
  heroHeading: "Signage Built for Reddy Ice Facilities",
  heroSubheading:
    "Order safety signage, wayfinding, rebranding materials, and celebration products — approved and shipped direct to your facility.",
  heroCtaText: "Browse Products",
  // Hero CTA overrides (read by buildBrand)
  heroCta1Text: "Browse Products",
  heroCta1Url: "/products",
  heroCta1Color: "#e31837",
  heroCta2Text: "Startup Bundle",
  heroCta2Url: "/products?category=startup-bundles",
  // Hero background defaults
  heroGradientFrom: "#003d7a",
  heroGradientTo: "#0057a8",
  // Trust badges
  trustBadge1: "OSHA-Compliant Messaging",
  trustBadge2: "Pre-Approved Templates",
  trustBadge3: "Nationwide Installation",
  trustBadge4: "Net 30 / PO Accepted",
  // Category section
  catSectionHeading: "Shop by Category",
  catSectionSubheading: "Pre-approved signage for every Reddy Ice facility need",
  // Featured section
  featuredSectionHeading: "Most Ordered",
  featuredSectionSubheading: "Top products across Reddy Ice facilities",
  // Enterprise callout
  enterpriseHeading: "Connects to your procurement system",
  enterpriseBody:
    "This storefront integrates directly with enterprise procurement platforms — COUPA, SAP Ariba, Oracle, and others. PO numbers, cost center coding, and approval routing happen right at checkout. No shadow spend. No rogue ordering.",
  enterpriseCtaText: "Start an order",
  // Procurement integration
  procurementSystem: null as "COUPA" | "SAP Ariba" | "Oracle" | "Custom" | null,
  procurementLabel: "",
  costCenters: [
    "Facilities & Maintenance",
    "Safety & Compliance",
    "Marketing",
    "Operations",
    "HR & Culture",
  ],
  approvers: [
    "Facilities Manager",
    "Safety Director",
    "Auto-Approve (under $500)",
  ],
  // Footer
  footerTagline: "Powered by FASTSIGNS Enterprise",
  supportEmail: "support@fastsigns.com",
  // Admin
  adminEmail: "admin@reddyice.com",
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
    slug: "adhesive-vinyls",
    name: "Adhesive Vinyls",
    icon: "🏷️",
    description: "Safety and compliance vinyl decals for floors, walls, and equipment",
  },
  {
    slug: "interior-wayfinding",
    name: "Interior Wayfinding",
    icon: "🗺️",
    description: "Guide employees and visitors through your facility safely",
  },
  {
    slug: "banners-flags",
    name: "Banners & Flags",
    icon: "🚩",
    description: "High-visibility banners, fabric backdrops, and canopy tents",
  },
  {
    slug: "celebration-anniversary",
    name: "Celebration & Anniversary",
    icon: "🎉",
    description: "100th anniversary products, history walls, and recognition items",
  },
  {
    slug: "rebranding",
    name: "Rebranding",
    icon: "🔄",
    description: "Custom wall vinyls and signage for facility rebrands",
  },
  {
    slug: "startup-bundles",
    name: "Warehouse Startup Bundles",
    icon: "📦",
    description: "Everything a new facility needs to open compliantly and on-brand",
  },
]

export const products: Product[] = [

  // ── ADHESIVE VINYLS ──────────────────────────────────────
  {
    slug: "no-packages-on-floor",
    name: "No Packages on the Floor",
    category: "adhesive-vinyls",
    shortDesc: "Floor or wall vinyl — keep aisles clear and compliant",
    description:
      "High-durability adhesive vinyl decal reminding staff and contractors to keep packages off the floor. Available as floor decal (slip-resistant laminate) or wall vinyl. Pre-approved Reddy Ice safety messaging.",
    sizes: ['6" x 18"', '12" x 36"', 'Custom'],
    materials: ["Non-Slip Floor Laminate", "Wall Vinyl"],
    startingPrice: 18,
    unit: "per decal",
    gradientFrom: "#0057a8",
    gradientTo: "#1a78d4",
    icon: "🚫",
    featured: false,
    tags: ["safety", "floor", "compliance"],
    leadTime: "3–5 business days",
  },
  {
    slug: "always-apply-parking-brake",
    name: "Always Apply the Parking Brake",
    category: "adhesive-vinyls",
    shortDesc: "Forklift and dock safety reminder vinyl",
    description:
      "Bold adhesive vinyl safety decal for dock areas, forklift zones, and vehicle staging areas. OSHA-aligned messaging. Available in floor decal or wall-mount versions.",
    sizes: ['6" x 18"', '12" x 36"', 'Custom'],
    materials: ["Non-Slip Floor Laminate", "Wall Vinyl"],
    startingPrice: 18,
    unit: "per decal",
    gradientFrom: "#0057a8",
    gradientTo: "#003d7a",
    icon: "⚠️",
    featured: false,
    tags: ["safety", "forklift", "dock", "compliance"],
    leadTime: "3–5 business days",
  },
  {
    slug: "hard-hats-required",
    name: "Hard Hats Required Beyond This Point",
    category: "adhesive-vinyls",
    shortDesc: "PPE compliance decal for warehouse entry points",
    description:
      "High-visibility hard hat requirement decal for facility entry points, loading docks, and production areas. ANSI-compliant color coding. Available as wall vinyl or rigid sign.",
    sizes: ['8" x 12"', '12" x 18"', '18" x 24"'],
    materials: ["Wall Vinyl", "Rigid Aluminum", "Coroplast"],
    startingPrice: 22,
    unit: "per sign",
    gradientFrom: "#e31837",
    gradientTo: "#b8112b",
    icon: "⛑️",
    featured: false,
    tags: ["safety", "ppe", "compliance", "warehouse"],
    leadTime: "3–5 business days",
  },
  {
    slug: "aed-do-not-block",
    name: "AED — Do Not Block",
    category: "adhesive-vinyls",
    shortDesc: "AED station floor and wall markers",
    description:
      "Floor decal and wall vinyl package marking AED locations. Includes floor approach path marker and cabinet identification decal. Meets OSHA and NFPA visibility requirements.",
    sizes: ['12" x 12" floor', '8" x 12" wall', 'Bundle'],
    materials: ["Non-Slip Floor Laminate", "Wall Vinyl"],
    startingPrice: 35,
    unit: "per set",
    gradientFrom: "#e31837",
    gradientTo: "#0057a8",
    icon: "❤️",
    featured: true,
    tags: ["safety", "aed", "compliance", "emergency"],
    leadTime: "3–5 business days",
  },

  // ── INTERIOR WAYFINDING ──────────────────────────────────
  {
    slug: "emergency-exit-sign",
    name: "Emergency Exit",
    category: "interior-wayfinding",
    shortDesc: "Compliant emergency exit signage for all facility types",
    description:
      "NFPA 101-compliant emergency exit signs in wall vinyl, rigid PVC, or backlit formats. Available with directional arrows. Coordinates with Reddy Ice brand standards while meeting life safety codes.",
    sizes: ['6" x 12"', '8" x 16"', '12" x 24"'],
    materials: ["Wall Vinyl", "Rigid PVC", "Aluminum", "Backlit Acrylic"],
    startingPrice: 29,
    unit: "per sign",
    gradientFrom: "#065f46",
    gradientTo: "#047857",
    icon: "🚪",
    featured: false,
    tags: ["safety", "wayfinding", "emergency", "compliance"],
    leadTime: "5–7 business days",
  },
  {
    slug: "hanging-pvc-signs",
    name: "Hanging PVC Signs",
    category: "interior-wayfinding",
    shortDesc: "Suspended aisle and department identification signs",
    description:
      "Rigid PVC hanging signs for aisle identification, department labeling, and overhead directionals. Pre-drilled for ceiling cable suspension. Double-sided printing standard.",
    sizes: ['12" x 18"', '18" x 24"', '24" x 36"', 'Custom'],
    materials: ["4mm Coroplast", "6mm PVC", "Aluminum Composite"],
    startingPrice: 45,
    unit: "per sign",
    gradientFrom: "#0057a8",
    gradientTo: "#1a78d4",
    icon: "🪧",
    featured: false,
    tags: ["wayfinding", "interior", "aisle", "hanging"],
    leadTime: "5–7 business days",
  },
  {
    slug: "hanging-inverted-coro-pyramid",
    name: "Hanging Inverted Coro Pyramid",
    category: "interior-wayfinding",
    shortDesc: "360° visibility pyramid signs for high-ceiling warehouses",
    description:
      "Inverted pyramid-shaped Coroplast signs visible from all four sides — ideal for high-bay warehouse environments. Custom printed with aisle numbers, department names, or safety messaging. Includes hanging hardware.",
    sizes: ['12" per side', '18" per side', 'Custom'],
    materials: ["Coroplast (Corrugated Plastic)"],
    startingPrice: 65,
    unit: "per pyramid",
    gradientFrom: "#0057a8",
    gradientTo: "#003d7a",
    icon: "🔷",
    featured: true,
    tags: ["wayfinding", "warehouse", "hanging", "360"],
    leadTime: "5–7 business days",
  },
  {
    slug: "dock-door-coro-signs",
    name: "Dock Door Hanging Coro Signs",
    category: "interior-wayfinding",
    shortDesc: "Door number and status signs for loading dock bays",
    description:
      "Coroplast hanging signs for dock door identification — door numbers, bay assignments, and status indicators (Open/Closed/Reserved). Durable in cold and wet dock environments.",
    sizes: ['12" x 18"', '18" x 24"'],
    materials: ["Coroplast", "Rigid PVC"],
    startingPrice: 38,
    unit: "per sign",
    gradientFrom: "#374151",
    gradientTo: "#1f2937",
    icon: "🚛",
    featured: false,
    tags: ["dock", "wayfinding", "warehouse", "door"],
    leadTime: "5–7 business days",
  },

  // ── BANNERS & FLAGS ──────────────────────────────────────
  {
    slug: "logo-fabric-backdrop",
    name: "Logo Fabric Backdrop",
    category: "banners-flags",
    shortDesc: "Branded fabric step-and-repeat for events and photos",
    description:
      "Premium dye-sublimated fabric backdrops featuring the Reddy Ice logo pattern. Perfect for award ceremonies, recruiting events, and press moments. Lightweight aluminum frame included.",
    sizes: ["8' x 8'", "8' x 10'", "10' x 10'", "10' x 20'"],
    materials: ["Stretch Fabric", "Vinyl"],
    startingPrice: 249,
    unit: "per backdrop",
    gradientFrom: "#0057a8",
    gradientTo: "#003d7a",
    icon: "🎬",
    featured: false,
    tags: ["event", "branding", "backdrop", "fabric"],
    leadTime: "7–10 business days",
  },
  {
    slug: "canopy-tent",
    name: "Canopy Tent",
    category: "banners-flags",
    shortDesc: "Branded 10x10 popup tent for outdoor events",
    description:
      "Full-color dye-sublimated canopy tent with Reddy Ice branding. Heavy-duty aluminum frame, water-resistant canopy, with optional sidewalls. Setup in under 5 minutes. Carry bag included.",
    sizes: ["10' x 10'", "10' x 15'", "10' x 20'"],
    materials: ["600D Polyester Canopy", "Heavy-Duty Aluminum Frame"],
    startingPrice: 549,
    unit: "per tent",
    gradientFrom: "#0057a8",
    gradientTo: "#e31837",
    icon: "⛺",
    featured: false,
    tags: ["event", "outdoor", "tent", "branded"],
    leadTime: "10–14 business days",
  },
  {
    slug: "disaster-assistance-team-banner",
    name: "Disaster Assistance Team",
    category: "banners-flags",
    shortDesc: "Deployment identification banners and signage",
    description:
      "High-visibility banners and identification signage for Reddy Ice Disaster Assistance Team deployments. Weather-resistant materials. Includes vehicle magnets, retractable banner stands, and portable signage kit.",
    sizes: ["Banner Kit", "Vehicle Magnets", "Full Deployment Kit"],
    materials: ["13 oz. Scrim Vinyl", "Magnetic Vinyl", "Fabric"],
    startingPrice: 189,
    unit: "per kit",
    gradientFrom: "#e31837",
    gradientTo: "#b8112b",
    icon: "🆘",
    featured: false,
    tags: ["disaster", "emergency", "team", "deployment"],
    leadTime: "5–7 business days",
  },

  // ── CELEBRATION & ANNIVERSARY ────────────────────────────
  {
    slug: "history-wall-vinyl",
    name: "History Wall Vinyl",
    category: "celebration-anniversary",
    shortDesc: "Custom timeline mural for lobby and break room walls",
    description:
      "Large-format wall vinyl celebrating Reddy Ice's 100-year history. Includes custom timeline layout design, photography, and milestones. Removable vinyl options available for leased facilities.",
    sizes: ["Per Square Foot", "Full Wall (custom quote)"],
    materials: ["Removable Vinyl", "Permanent Vinyl"],
    startingPrice: 8,
    unit: "per sq ft (installed)",
    gradientFrom: "#0057a8",
    gradientTo: "#e31837",
    icon: "🏛️",
    featured: false,
    tags: ["anniversary", "history", "mural", "interior"],
    leadTime: "10–14 business days",
  },
  {
    slug: "100th-anniversary-stickers",
    name: "100th Anniversary Celebration Stickers",
    category: "celebration-anniversary",
    shortDesc: "Die-cut stickers for employee recognition and events",
    description:
      "Custom die-cut stickers featuring the Reddy Ice 100th anniversary logo. Weather-resistant laminate. Ideal for hard hats, water bottles, laptops, and event giveaways.",
    sizes: ['2" round', '3" round', '2" x 3"', 'Custom shape'],
    materials: ["Vinyl with UV Laminate"],
    startingPrice: 1.25,
    unit: "per sticker (100 min.)",
    gradientFrom: "#e31837",
    gradientTo: "#b8112b",
    icon: "⭐",
    featured: true,
    tags: ["anniversary", "stickers", "promo", "giveaway"],
    leadTime: "5–7 business days",
  },
  {
    slug: "100th-anniversary-pins",
    name: "100th Anniversary Celebration Pins",
    category: "celebration-anniversary",
    shortDesc: "Enamel or printed lapel pins for the centennial",
    description:
      "Commemorative lapel pins for Reddy Ice's 100th anniversary. Available in soft enamel, hard enamel, or printed epoxy dome. Butterfly clutch backing standard. Custom packaging available.",
    sizes: ['3/4"', '1"', '1.25"'],
    materials: ["Soft Enamel", "Hard Enamel", "Printed Epoxy"],
    startingPrice: 3.50,
    unit: "per pin (100 min.)",
    gradientFrom: "#374151",
    gradientTo: "#1f2937",
    icon: "📌",
    featured: false,
    tags: ["anniversary", "pins", "promo", "recognition"],
    leadTime: "14–21 business days",
  },
  {
    slug: "100th-anniversary-promo-item",
    name: "100th Anniversary Promo Item",
    category: "celebration-anniversary",
    shortDesc: "Curated branded merchandise for the centennial",
    description:
      "Premium branded merchandise marking Reddy Ice's 100th anniversary. Items include drinkware, apparel, bags, and desk accessories — all featuring the centennial logo. White-label gift packaging available.",
    sizes: ["Single Item", "Gift Kit (5 items)", "Executive Kit (8 items)"],
    materials: [],
    startingPrice: 25,
    unit: "per item",
    gradientFrom: "#0057a8",
    gradientTo: "#e31837",
    icon: "🎁",
    featured: true,
    tags: ["anniversary", "promo", "merchandise", "gift"],
    leadTime: "10–14 business days",
  },

  // ── REBRANDING ───────────────────────────────────────────
  {
    slug: "custom-wall-vinyl",
    name: "Custom Wall Vinyl",
    category: "rebranding",
    shortDesc: "Full-facility rebranding vinyl for walls, windows, and floors",
    description:
      "Large-format custom wall vinyls for facility rebranding — lobby graphics, mission statements, brand walls, and exterior window graphics. Design consultation included. Installation available nationwide.",
    sizes: ["Per Square Foot", "Full Wall", "Custom"],
    materials: ["Removable Vinyl", "Permanent Vinyl", "Perforated Window Film"],
    startingPrice: 6,
    unit: "per sq ft",
    gradientFrom: "#0057a8",
    gradientTo: "#003d7a",
    icon: "🔄",
    featured: false,
    tags: ["rebrand", "vinyl", "interior", "wall"],
    leadTime: "7–10 business days",
  },

  // ── WAREHOUSE STARTUP BUNDLES ────────────────────────────
  {
    slug: "warehouse-startup-bundle",
    name: "Warehouse Startup Bundle",
    category: "startup-bundles",
    shortDesc: "Everything a new Reddy Ice facility needs on day one",
    description:
      "Comprehensive signage package for new facility openings. Includes: emergency exit signs, AED markers, safety decals, aisle wayfinding, dock door signs, and exterior identification. Pre-approved Reddy Ice templates — ready to order, ready to install.",
    sizes: ["Small Facility (< 50k sq ft)", "Standard Facility", "Large Facility (> 100k sq ft)"],
    materials: ["Mixed — see full spec sheet"],
    startingPrice: 1200,
    unit: "per bundle",
    gradientFrom: "#0057a8",
    gradientTo: "#e31837",
    icon: "📦",
    featured: true,
    tags: ["bundle", "startup", "warehouse", "compliance", "complete"],
    leadTime: "10–14 business days",
  },

  // ── FEATURED / MOST ORDERED (cross-category) ────────────
  {
    slug: "floor-decals",
    name: "Floor Decals",
    category: "adhesive-vinyls",
    shortDesc: "Custom slip-resistant floor decals for any message",
    description:
      "High-durability floor decals with non-slip UV laminate. Use for directional arrows, safety warnings, social distancing markers, or brand messaging. ADA-compliant options available. Suitable for concrete, tile, and sealed floors.",
    sizes: ['12" x 12"', '12" x 24"', '24" x 24"', 'Custom'],
    materials: ["Non-Slip Laminate Vinyl"],
    startingPrice: 29,
    unit: "per decal",
    gradientFrom: "#0057a8",
    gradientTo: "#1a78d4",
    icon: "⬇️",
    featured: true,
    tags: ["floor", "safety", "wayfinding", "decal"],
    leadTime: "3–5 business days",
  },
  {
    slug: "cold-storage-signs",
    name: "Cold Storage Signage",
    category: "interior-wayfinding",
    shortDesc: "Signage rated for freezer and cold storage environments",
    description:
      "Purpose-built signage for cold storage, freezer, and refrigerated dock environments. Materials resist moisture, condensation, and temperature cycling. Includes door identification, temperature zone markers, PPE requirement signs, and safety decals. All materials tested to -20°F.",
    sizes: ['6" x 12"', '12" x 18"', '18" x 24"', 'Custom'],
    materials: ["Cold-Rated Vinyl", "Rigid Aluminum", "Freeze-Rated Coroplast"],
    startingPrice: 35,
    unit: "per sign",
    gradientFrom: "#0891b2",
    gradientTo: "#0e7490",
    icon: "🧊",
    featured: true,
    tags: ["cold-storage", "freezer", "safety", "warehouse"],
    leadTime: "5–7 business days",
  },
  {
    slug: "leaderboard-sign",
    name: "Leaderboard",
    category: "interior-wayfinding",
    shortDesc: "Facility performance and recognition display boards",
    description:
      "Custom leaderboard signs for tracking facility KPIs, safety records, and team recognition. Available as static printed boards or dry-erase magnetic surfaces. Mounts to wall or free-standing easel.",
    sizes: ['24" x 36"', '36" x 48"', '48" x 72"', 'Custom'],
    materials: ["Rigid PVC", "Aluminum Composite", "Magnetic Dry-Erase"],
    startingPrice: 89,
    unit: "per board",
    gradientFrom: "#0057a8",
    gradientTo: "#003d7a",
    icon: "🏆",
    featured: true,
    tags: ["leaderboard", "recognition", "interior", "performance"],
    leadTime: "5–7 business days",
  },
]

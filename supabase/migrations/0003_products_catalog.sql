-- ============================================================
-- Products catalog — global product bank stored in DB.
-- Replaces the hard-coded product-bank.ts arrays as the source
-- of truth. Seeded with the 11 categories + 14 products that
-- previously lived in code.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ecom_demos.categories (
  slug        text PRIMARY KEY,
  name        text NOT NULL,
  icon        text NOT NULL DEFAULT '📦',
  description text NOT NULL DEFAULT ''
);

GRANT ALL ON ecom_demos.categories TO service_role;
GRANT SELECT ON ecom_demos.categories TO anon, authenticated;

ALTER TABLE ecom_demos.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_public_read ON ecom_demos.categories;
CREATE POLICY categories_public_read ON ecom_demos.categories
  FOR SELECT TO anon, authenticated USING (true);

-- ─────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ecom_demos.products (
  slug            text PRIMARY KEY,
  name            text NOT NULL,
  category        text NOT NULL REFERENCES ecom_demos.categories(slug),
  short_desc      text NOT NULL DEFAULT '',
  description     text NOT NULL DEFAULT '',
  sizes           text[] NOT NULL DEFAULT '{}',
  materials       text[] NOT NULL DEFAULT '{}',
  starting_price  numeric NOT NULL DEFAULT 0,
  unit            text NOT NULL DEFAULT 'per unit',
  gradient_from   text NOT NULL DEFAULT '#1e3a5f',
  gradient_to     text NOT NULL DEFAULT '#2d6a9f',
  icon            text NOT NULL DEFAULT '📦',
  featured        boolean NOT NULL DEFAULT false,
  tags            text[] NOT NULL DEFAULT '{}',
  lead_time       text NOT NULL DEFAULT '5–7 business days',
  image_url       text,
  import_tag      text,   -- NULL = built-in; string = batch tag from CSV import
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON ecom_demos.products (category);
CREATE INDEX IF NOT EXISTS products_import_tag_idx ON ecom_demos.products (import_tag)
  WHERE import_tag IS NOT NULL;

GRANT ALL ON ecom_demos.products TO service_role;
GRANT SELECT ON ecom_demos.products TO anon, authenticated;

ALTER TABLE ecom_demos.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS products_public_read ON ecom_demos.products;
CREATE POLICY products_public_read ON ecom_demos.products
  FOR SELECT TO anon, authenticated USING (true);

-- updated_at trigger (reuse function from migration 0001)
DROP TRIGGER IF EXISTS products_updated_at ON ecom_demos.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON ecom_demos.products
  FOR EACH ROW EXECUTE FUNCTION ecom_demos.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Add import_tags to tenants
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ecom_demos.tenants
  ADD COLUMN IF NOT EXISTS import_tags text[] NOT NULL DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────
-- Seed: categories
-- ─────────────────────────────────────────────────────────────
INSERT INTO ecom_demos.categories (slug, name, icon, description) VALUES
  ('banners',               'Banners & Flags',          '🚩', 'High-impact outdoor and indoor banners for every occasion'),
  ('window-wall',           'Window & Wall Graphics',   '🪟', 'Transform your space with custom printed graphics'),
  ('trade-show',            'Trade Show Displays',      '🏢', 'Stand out at every event and conference'),
  ('vehicle',               'Vehicle Wraps',            '🚗', 'Turn your fleet into moving brand ambassadors'),
  ('wayfinding',            'Wayfinding & ADA',         '🗺️', 'Guide customers and meet compliance requirements'),
  ('promotional',           'Promotional Products',     '🎁', 'Branded merchandise your team and clients will love'),
  ('adhesive-vinyls',       'Adhesive Vinyls',          '🏷️', 'Safety and compliance vinyl decals for floors, walls, and equipment'),
  ('interior-wayfinding',   'Interior Wayfinding',      '🗺️', 'Guide employees and visitors through your facility safely'),
  ('celebration-anniversary','Celebration & Anniversary','🎉', 'Anniversary products, history walls, and recognition items'),
  ('rebranding',            'Rebranding',               '🔄', 'Custom wall vinyls and signage for facility rebrands'),
  ('startup-bundles',       'Startup Bundles',          '📦', 'Everything a new facility needs to open compliantly and on-brand')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Seed: products
-- ─────────────────────────────────────────────────────────────
INSERT INTO ecom_demos.products
  (slug, name, category, short_desc, description, sizes, materials, starting_price, unit, gradient_from, gradient_to, icon, featured, tags, lead_time)
VALUES
  (
    'vinyl-banner', 'Vinyl Banner', 'banners',
    'Durable full-color banners for indoor or outdoor use',
    'Premium vinyl banners on 13 oz. scrim vinyl with UV-resistant inks. Reinforced hems and rust-proof grommets included.',
    ARRAY['2'' x 4''','2'' x 6''','3'' x 6''','3'' x 8''','4'' x 8''','Custom'],
    ARRAY['13 oz. Scrim Vinyl','18 oz. Heavy Duty Vinyl','Mesh Vinyl'],
    49, 'per banner', '#1e3a5f', '#2d6a9f', '🚩', true,
    ARRAY['outdoor','indoor','event'], '3–5 business days'
  ),
  (
    'retractable-banner-stand', 'Retractable Banner Stand', 'banners',
    'Premium pull-up stands for events and retail',
    'Professional retractable banner stands with a smooth mechanism and premium aluminum base. Carry bag included.',
    ARRAY['24" x 80"','33" x 80"','36" x 80"','48" x 80"'],
    ARRAY['Standard Vinyl','Premium Fabric'],
    89, 'per unit', '#0f2d4a', '#1e3a5f', '📋', true,
    ARRAY['event','retail','portable'], '3–5 business days'
  ),
  (
    'outdoor-feather-flag', 'Outdoor Feather Flag', 'banners',
    'Eye-catching flags that move with the wind',
    'Feather flags on wind-resistant dye-sublimated polyester. Available with ground spike, cross base, or weighted base.',
    ARRAY['8 ft','11 ft','15 ft'],
    ARRAY['Dye-Sublimated Polyester'],
    79, 'per flag', '#c2410c', '#ea580c', '🏳️', false,
    ARRAY['outdoor','event','retail'], '5–7 business days'
  ),
  (
    'perforated-window-decals', 'Perforated Window Decals', 'window-wall',
    'See-through vinyl graphics for storefront windows',
    'Perforated vinyl allows light and visibility from inside while displaying full-color graphics outside.',
    ARRAY['12" x 12"','24" x 24"','24" x 36"','36" x 48"','Custom'],
    ARRAY['Perforated Vinyl','Clear Vinyl','Static Cling'],
    29, 'per decal', '#0891b2', '#0e7490', '🪟', true,
    ARRAY['window','retail','storefront'], '3–5 business days'
  ),
  (
    'wall-mural', 'Wall Mural', 'window-wall',
    'Transform blank walls into brand statements',
    'Floor-to-ceiling or accent wall murals printed and installed by certified technicians. Removable options available.',
    ARRAY['Per Square Foot'],
    ARRAY['Removable Vinyl','Permanent Vinyl','Fabric'],
    8, 'per sq ft (installed)', '#7c3aed', '#5b21b6', '🖼️', false,
    ARRAY['interior','branding','office'], '10–14 business days'
  ),
  (
    'trade-show-booth-10x10', '10x10 Trade Show Booth', 'trade-show',
    'Complete booth package for trade shows and conferences',
    'Full 10''x10'' booth with backwall, side walls, and counter. Custom printed and ready to set up in under 30 minutes.',
    ARRAY['10'' x 10''','10'' x 20'''],
    ARRAY['Tension Fabric','Aluminum Frame'],
    1499, 'per booth', '#1f2937', '#374151', '🏢', true,
    ARRAY['event','conference','premium'], '10–14 business days'
  ),
  (
    'table-throw', 'Table Throw', 'trade-show',
    'Branded table covers for any 6ft or 8ft table',
    'Full-color dye-sublimated table throws that fit standard 6ft or 8ft tables. Wrinkle-resistant, machine washable.',
    ARRAY['6 ft (3-sided)','6 ft (4-sided)','8 ft (3-sided)','8 ft (4-sided)'],
    ARRAY['Polyester Twill'],
    119, 'per throw', '#0d9488', '#0f766e', '🎪', false,
    ARRAY['event','table','branded'], '5–7 business days'
  ),
  (
    'vehicle-magnets', 'Vehicle Magnets', 'vehicle',
    'Removable branded magnets for fleet vehicles',
    'Heavy-duty 30-mil magnetic vinyl with full-color UV print. Perfect for fleet branding without permanent vinyl.',
    ARRAY['12" x 24"','18" x 24"','24" x 36"','Custom'],
    ARRAY['30 mil Magnetic Vinyl'],
    39, 'per magnet', '#7c2d12', '#9a3412', '🚗', false,
    ARRAY['vehicle','fleet','removable'], '3–5 business days'
  ),
  (
    'ada-room-sign', 'ADA Room Sign', 'wayfinding',
    'Compliant ADA tactile and Braille room identification',
    'Photopolymer ADA-compliant signs with Grade 2 Braille and raised tactile characters. Meets all federal requirements.',
    ARRAY['6" x 8"','8" x 8"','8" x 10"'],
    ARRAY['Photopolymer','Acrylic'],
    45, 'per sign', '#1e40af', '#1e3a8a', '♿', false,
    ARRAY['ada','compliance','wayfinding'], '5–7 business days'
  ),
  (
    'branded-tote', 'Branded Tote Bag', 'promotional',
    'Eco-friendly cotton tote bags with custom branding',
    'Heavy-weight cotton canvas tote bags with full-color screen-printed or embroidered branding. Reusable and durable.',
    ARRAY['15" x 16"','18" x 18"'],
    ARRAY['Cotton Canvas','Recycled Polyester'],
    4.5, 'per bag (50 min.)', '#15803d', '#166534', '🛍️', false,
    ARRAY['promo','eco','giveaway'], '10–14 business days'
  ),
  (
    'branded-water-bottle', 'Branded Water Bottle', 'promotional',
    'Stainless steel insulated water bottles',
    'Double-wall vacuum insulated stainless steel water bottles. Laser-engraved or full-color printed branding.',
    ARRAY['20 oz','32 oz','40 oz'],
    ARRAY['Stainless Steel'],
    18, 'per bottle (24 min.)', '#475569', '#334155', '💧', true,
    ARRAY['promo','drinkware','premium'], '10–14 business days'
  ),
  (
    'floor-decals', 'Floor Decals', 'adhesive-vinyls',
    'Custom slip-resistant floor decals for any message',
    'High-durability floor decals with non-slip UV laminate. Use for directional arrows, safety warnings, or branding.',
    ARRAY['12" x 12"','12" x 24"','24" x 24"','Custom'],
    ARRAY['Non-Slip Laminate Vinyl'],
    29, 'per decal', '#0057a8', '#1a78d4', '⬇️', true,
    ARRAY['floor','safety','wayfinding'], '3–5 business days'
  ),
  (
    'safety-decal-pack', 'Safety Decal Starter Pack', 'adhesive-vinyls',
    'OSHA-compliant safety decals for warehouses and facilities',
    'Pre-approved safety decal pack — hard hat zones, eye protection, AED markers, no-package floor signs, and more.',
    ARRAY['Standard Pack (12)','Full Pack (24)'],
    ARRAY['Wall Vinyl','Non-Slip Floor Laminate'],
    145, 'per pack', '#dc2626', '#991b1b', '⚠️', false,
    ARRAY['safety','osha','warehouse'], '5–7 business days'
  ),
  (
    'hanging-pvc-signs', 'Hanging PVC Signs', 'interior-wayfinding',
    'Suspended aisle and department identification signs',
    'Rigid PVC hanging signs for aisle identification, department labeling, and overhead directionals. Pre-drilled.',
    ARRAY['12" x 18"','18" x 24"','24" x 36"'],
    ARRAY['4mm Coroplast','6mm PVC','Aluminum Composite'],
    45, 'per sign', '#0057a8', '#1a78d4', '🪧', false,
    ARRAY['wayfinding','interior','hanging'], '5–7 business days'
  ),
  (
    'facility-startup-bundle', 'Facility Startup Bundle', 'startup-bundles',
    'Everything a new facility needs on day one',
    'Complete signage package for new facility openings. Emergency exits, AED markers, safety decals, aisle wayfinding, dock door signs, exterior identification.',
    ARRAY['Small (<50k sqft)','Standard','Large (>100k sqft)'],
    ARRAY['Mixed — see spec sheet'],
    1200, 'per bundle', '#0057a8', '#003d7a', '📦', true,
    ARRAY['bundle','startup','complete'], '10–14 business days'
  )
ON CONFLICT (slug) DO NOTHING;

"use client"

import Link from "next/link"
import { categories } from "@/brand.config"
import ProductCard from "@/components/ProductCard"
import { ArrowRight, CheckCircle, Zap, Globe, Lock } from "lucide-react"
import { useProductStore } from "@/lib/product-store"
import { useBrandStore } from "@/lib/brand-store"

export default function HomePage() {
  const { products } = useProductStore()
  const { brand } = useBrandStore()
  const featured = products.filter((p) => p.featured)

  const trustBadges = [
    brand.trustBadge1,
    brand.trustBadge2,
    brand.trustBadge3,
    brand.trustBadge4,
  ].filter(Boolean)

  // Hero background: image if set, else gradient
  const heroStyle = brand.heroBgImage
    ? { backgroundImage: `url(${brand.heroBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${brand.heroGradientFrom} 0%, ${brand.heroGradientTo} 100%)` }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={heroStyle}>
        {/* Overlay — always present for image, optional for gradient */}
        {brand.heroBgImage && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${brand.heroBgOverlay ?? 0.5})` }}
          />
        )}

        {/* Dot pattern (gradient mode only) */}
        {!brand.heroBgImage && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            {brand.procurementSystem && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                <span className="text-white/90 text-sm font-medium">
                  Connects to {brand.procurementLabel}
                </span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {brand.heroHeading}
            </h1>
            <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
              {brand.heroSubheading}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: brand.accentColor, color: "#000" }}
              >
                {brand.heroCtaText} <ArrowRight size={16} />
              </Link>
              <Link
                href="/products?category=trade-show"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
              >
                Trade Show Displays
              </Link>
            </div>
            {trustBadges.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-8">
                {trustBadges.map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-white/70 text-xs">
                    <CheckCircle size={13} className="text-green-400" />
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{brand.catSectionHeading}</h2>
            <p className="text-gray-500 text-sm mt-1">{brand.catSectionSubheading}</p>
          </div>
          <Link href="/products" className="text-sm font-medium flex items-center gap-1 hover:opacity-80" style={{ color: brand.primaryColor }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`}
              className="group bg-white rounded-xl p-4 text-center border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-700 leading-tight">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{brand.featuredSectionHeading}</h2>
                <p className="text-gray-500 text-sm mt-1">{brand.featuredSectionSubheading}</p>
              </div>
              <Link href="/products" className="text-sm font-medium flex items-center gap-1 hover:opacity-80" style={{ color: brand.primaryColor }}>
                See all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enterprise integration callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl p-8 md:p-12 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${brand.heroGradientFrom}, ${brand.heroGradientTo})` }}>
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-4"
                style={{ backgroundColor: brand.accentColor, color: "#000" }}>
                <Zap size={12} /> Enterprise Ready
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                {brand.enterpriseHeading}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                {brand.enterpriseBody}
              </p>
              <Link href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-all">
                {brand.enterpriseCtaText} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Globe size={20} />, title: "PO-Based Ordering", desc: "Attach PO numbers at checkout — no credit card required" },
                { icon: <CheckCircle size={20} />, title: "Approval Routing", desc: "Auto-route orders to the right approver by cost center" },
                { icon: <Lock size={20} />, title: "Cost Center Coding", desc: "Tag every order for accurate GL allocation" },
                { icon: <Zap size={20} />, title: "Order Tracking", desc: "Real-time status from approval through delivery" },
              ].map((f) => (
                <div key={f.title} className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="text-white/80 mb-2">{f.icon}</div>
                  <div className="text-white text-sm font-semibold mb-1">{f.title}</div>
                  <div className="text-white/60 text-xs leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

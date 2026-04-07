import Link from "next/link"
import type { Product } from "@/brand.config"
import { brand } from "@/brand.config"
import { ArrowRight } from "lucide-react"

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-200 flex flex-col"
    >
      {/* Product visual */}
      <div
        className="h-44 flex flex-col items-center justify-center relative overflow-hidden"
        style={product.imageUrl ? {} : {
          background: `linear-gradient(135deg, ${product.gradientFrom}, ${product.gradientTo})`,
        }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            style={{
              objectPosition: product.imagePosition
                ? `${product.imagePosition.x}% ${product.imagePosition.y}%`
                : undefined,
              transform: product.imageZoom && product.imageZoom !== 1
                ? `scale(${product.imageZoom})`
                : undefined,
              transformOrigin: product.imagePosition
                ? `${product.imagePosition.x}% ${product.imagePosition.y}%`
                : undefined,
            }}
          />
        ) : (
          <span className="text-5xl mb-2 drop-shadow-sm">{product.icon}</span>
        )}
        {product.featured && (
          <span
            className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: brand.accentColor, color: "#000" }}
          >
            Popular
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
          {product.category.replace("-", " & ")}
        </div>
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 flex-1 leading-relaxed">{product.shortDesc}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3 mb-3">
          {product.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400">Starting at</span>
            <div className="font-bold text-gray-900">
              ${product.startingPrice.toLocaleString()}
              <span className="text-xs font-normal text-gray-400 ml-1">{product.unit.split(" ").slice(0, 2).join(" ")}</span>
            </div>
          </div>
          <span
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white group-hover:opacity-90 transition-opacity"
            style={{ backgroundColor: brand.primaryColor }}
          >
            View <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}

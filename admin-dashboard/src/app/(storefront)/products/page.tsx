"use client"
import React, { useEffect, useState, useMemo, Suspense } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, Filter, ShoppingBag, X, Heart } from "lucide-react"
import { MediaImage } from "../../../components/ui/media-image"
import { useWishlistStore } from "../../../store/useWishlistStore"
import { toast } from "sonner"
import { STATIC_CATALOG } from "../../../config/static-catalog"

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialSearch = searchParams.get("search") || ""
  const initialCategory = searchParams.get("category") || ""

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const isInWishlist = useWishlistStore(state => state.isInWishlist)
  const toggleWishlist = useWishlistStore(state => state.toggleItem)

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "")
    setSelectedCategory(searchParams.get("category") || "")
  }, [searchParams])

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await api.get('/public/catalog/products')
        const items = res.data.items || res.data || []
        const prods = items.filter((p: any) => p.type === 'PRODUCT' || !p.type)
        if (prods.length > 0) {
          setProducts(prods)
        } else {
          setProducts(STATIC_CATALOG.filter(i => i.type === 'PRODUCT'))
        }
      } catch (err) {
        console.error("Failed to load catalog, using static fallback", err)
        setProducts(STATIC_CATALOG.filter(i => i.type === 'PRODUCT'))
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => {
      if (p.category?.name) set.add(p.category.name)
    })
    return Array.from(set)
  }, [products])

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch = !q || 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)

      const catParam = selectedCategory.toLowerCase().trim()
      const matchesCategory = !catParam || 
        p.category?.name?.toLowerCase().includes(catParam) ||
        (catParam === 'electronics' && (p.name?.toLowerCase().includes('mouse') || p.name?.toLowerCase().includes('keyboard') || p.name?.toLowerCase().includes('usb') || p.name?.toLowerCase().includes('ssd') || p.name?.toLowerCase().includes('headphone') || p.name?.toLowerCase().includes('earbuds') || p.name?.toLowerCase().includes('router') || p.name?.toLowerCase().includes('cable'))) ||
        (catParam === 'stationery' && (p.name?.toLowerCase().includes('paper') || p.name?.toLowerCase().includes('pen') || p.name?.toLowerCase().includes('diary') || p.name?.toLowerCase().includes('notebook') || p.name?.toLowerCase().includes('folder') || p.name?.toLowerCase().includes('stapler') || p.name?.toLowerCase().includes('glue')))

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    router.push("/products")
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-16 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2 sm:mb-3">All Products</h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-xl">
            Browse our complete catalog of computer accessories, stationery, office essentials, and retail goods.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in products..." 
              className="control-input pl-10 pr-9 h-11 w-full bg-white shadow-sm text-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        <button
          onClick={() => {
            setSelectedCategory("")
            if (searchTerm) router.push(`/products?search=${encodeURIComponent(searchTerm)}`)
            else router.push("/products")
          }}
          className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors ${
            !selectedCategory 
              ? "bg-[#04BBFD] text-white shadow-sm" 
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Items ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat)
              router.push(`/products?category=${encodeURIComponent(cat.toLowerCase())}`)
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? "bg-[#04BBFD] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}

        {(searchTerm || selectedCategory) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-full font-medium transition-colors ml-auto shrink-0"
          >
            <X className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Main Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-100 aspect-[4/5] rounded-2xl mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-24 sm:py-32 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          <ShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No products matched your criteria</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
            {searchTerm || selectedCategory ? (
              <>We couldn't find any products matching your search or filters.</>
            ) : (
              <>We couldn't find any active products in the catalog.</>
            )}
          </p>
          {(searchTerm || selectedCategory) && (
            <button 
              onClick={clearFilters}
              className="control-button-primary rounded-full px-6 h-11 inline-flex items-center text-sm font-semibold"
            >
              Reset Filters & Show All
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product: any) => (
            <Link href={`/products/${product.id}`} key={product.id} className="group block interactive-item bg-white rounded-2xl p-3 border border-slate-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="bg-slate-50 aspect-[4/5] rounded-xl mb-4 overflow-hidden relative border border-slate-100">
                <MediaImage 
                  asset={product.imageUrl} 
                  fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 mix-blend-multiply" 
                />
                <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-800 shadow-sm">
                  {product.category?.name || 'Essential'}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const added = toggleWishlist({
                      id: product.id,
                      name: product.name,
                      price: Number(product.sellingPrice),
                      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
                      imageUrl: product.imageUrl,
                      category: product.category?.name,
                      type: product.type || 'PRODUCT',
                    });
                    if (added) {
                      toast.success(`"${product.name}" added to wishlist!`);
                    } else {
                      toast.info(`"${product.name}" removed from wishlist.`);
                    }
                  }}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 hover:bg-white flex items-center justify-center shadow-sm z-10 transition-all hover:scale-110"
                  title="Save to wishlist"
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>
              <div className="px-1">
                <h3 className="font-bold text-slate-900 mb-1 leading-snug line-clamp-1 group-hover:text-[#04BBFD] transition-colors">{product.name}</h3>
                <p className="text-slate-500 mb-3 text-xs line-clamp-2 leading-relaxed">{product.description || 'Quality product for business and personal productivity.'}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <p className="font-extrabold text-slate-900 text-lg tabular-nums">৳{Number(product.sellingPrice).toLocaleString()}</p>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-[#04BBFD] group-hover:text-white transition-colors">
                    View
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StorefrontProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-6 py-20 text-center text-slate-400">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  )
}

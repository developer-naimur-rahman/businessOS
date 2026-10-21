"use client"

import React, { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { api } from "../../../lib/api-client"
import { MediaImage } from "../../../components/ui/media-image"
import { useWishlistStore } from "../../../store/useWishlistStore"
import { useCartStore } from "../../../store/useCartStore"
import { toast } from "sonner"
import { 
  Flame, 
  Search, 
  ShoppingCart, 
  Heart, 
  ArrowUpDown, 
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react"

export default function NewArrivalsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<string>("newest")

  const isInWishlist = useWishlistStore((state) => state.isInWishlist)
  const toggleWishlist = useWishlistStore((state) => state.toggleItem)
  const addItemToCart = useCartStore((state) => state.addItem)

  useEffect(() => {
    async function fetchNewArrivals() {
      try {
        const [prodRes, servRes] = await Promise.all([
          api.get('/public/catalog/products').catch(() => ({ data: [] })),
          api.get('/public/catalog/services').catch(() => ({ data: [] }))
        ])

        const prods = (prodRes.data?.items || prodRes.data || []).map((p: any) => ({
          ...p,
          itemType: 'PRODUCT'
        }))
        const servs = (servRes.data?.items || servRes.data || []).map((s: any) => ({
          ...s,
          itemType: 'SERVICE'
        }))

        // Combined and sort by createdAt descending if available
        const combined = [...prods, ...servs].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return timeB - timeA
        })

        setItems(combined)
      } catch (err) {
        console.error("Failed to load new arrivals", err)
      } finally {
        setLoading(false)
      }
    }
    fetchNewArrivals()
  }, [])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch = !q || 
        item.name?.toLowerCase().includes(q) || 
        item.description?.toLowerCase().includes(q) ||
        item.category?.name?.toLowerCase().includes(q)

      const matchesType = 
        selectedFilter === "ALL" || 
        (selectedFilter === "PRODUCTS" && item.itemType === 'PRODUCT') ||
        (selectedFilter === "SERVICES" && item.itemType === 'SERVICE') ||
        item.category?.name?.toLowerCase() === selectedFilter.toLowerCase()

      return matchesSearch && matchesType
    })

    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.sellingPrice || a.basePrice || 0) - Number(b.sellingPrice || b.basePrice || 0))
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.sellingPrice || b.basePrice || 0) - Number(a.sellingPrice || a.basePrice || 0))
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    }

    return result
  }, [items, searchTerm, selectedFilter, sortBy])

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => {
      if (item.category?.name) set.add(item.category.name)
    })
    return Array.from(set)
  }, [items])

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const price = Number(item.sellingPrice || item.basePrice || 0)
    addItemToCart({
      productId: item.id,
      name: item.name,
      price,
      quantity: 1,
      type: item.itemType || 'PRODUCT',
      imageUrl: item.imageUrl
    })
    toast.success(`"${item.name}" added to cart!`)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 opacity-90" />
        <div className="relative max-w-[1400px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5" />
            Just Landed in Stock
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            New Arrivals
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Stay ahead with the latest releases in technology accessories, academic supplies, office equipment, and specialized print solutions.
          </p>
        </div>
      </section>

      {/* Main Catalog Area */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-10">
        
        {/* Controls: Search, Filter Tabs, Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search new arrivals..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedFilter("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedFilter === "ALL"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setSelectedFilter("PRODUCTS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedFilter === "PRODUCTS"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setSelectedFilter("SERVICES")}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedFilter === "SERVICES"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Services &amp; Print
            </button>
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedFilter === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">Latest Releases</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>

        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse">
                <div className="bg-slate-100 aspect-square rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No items found</h3>
            <p className="text-slate-500 text-xs mb-6">
              No new items match your selected filters. Check back soon for fresh stock!
            </p>
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedFilter("ALL")
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const price = Number(item.sellingPrice || item.basePrice || 0)
              const link = item.itemType === 'SERVICE' ? `/services/${item.id}` : `/products/${item.id}`

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image Area */}
                    <Link href={link} className="block relative aspect-square rounded-xl bg-slate-50 overflow-hidden mb-4 border border-slate-100">
                      <MediaImage
                        asset={item.imageUrl}
                        fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Badge */}
                      <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        New Arrival
                      </span>

                      {/* Wishlist Heart Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const added = toggleWishlist({
                            id: item.id,
                            name: item.name,
                            price,
                            imageUrl: item.imageUrl,
                            category: item.category?.name,
                            type: item.itemType
                          })
                          if (added) {
                            toast.success(`"${item.name}" added to wishlist!`)
                          } else {
                            toast.info(`"${item.name}" removed from wishlist.`)
                          }
                        }}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 hover:bg-white flex items-center justify-center shadow-sm transition-all hover:scale-110 z-10"
                        title="Add to wishlist"
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(item.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </Link>

                    {/* Content */}
                    <Link href={link} className="block">
                      <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-3">
                        {item.description || "Freshly stocked item with complete manufacturer warranty."}
                      </p>
                    </Link>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Price</div>
                      <div className="text-base font-black text-slate-900 tabular-nums">
                        ৳{price.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(item, e)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>

    </div>
  )
}

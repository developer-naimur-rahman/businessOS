"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, ArrowLeft, ShoppingBag, Trash2, ArrowRight } from "lucide-react"
import { useWishlistStore } from "../../../store/useWishlistStore"
import { useCartStore } from "../../../store/useCartStore"
import { toast } from "sonner"

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false)
  const items = useWishlistStore((state) => state.items)
  const removeItem = useWishlistStore((state) => state.removeItem)
  const clearWishlist = useWishlistStore((state) => state.clearWishlist)
  const addToCart = useCartStore((state) => state.addItem)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Loading wishlist...</p>
      </div>
    )
  }

  const handleAddToCart = (item: any) => {
    addToCart({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      type: item.type || 'PRODUCT',
      imageUrl: item.imageUrl,
    })
    toast.success(`"${item.name}" added to cart!`)
  }

  const handleRemove = (item: any) => {
    removeItem(item.id)
    toast.info(`Removed "${item.name}" from wishlist.`)
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500">
      <Link href="/products" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">My Wishlist</h1>
            <span className="bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-full text-xs">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Keep track of items you love and move them directly to your cart anytime.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => {
              clearWishlist()
              toast.info("Wishlist cleared.")
            }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-28 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto p-8">
          <div className="w-20 h-20 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Explore our curated catalog of electronics, printing materials, stationery, and creative services, then click the heart icon on any product to save it here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/products" className="control-button-primary rounded-full px-8 h-12 inline-flex items-center text-sm shadow-md">
              Browse Products <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/services" className="control-button-secondary rounded-full px-8 h-12 inline-flex items-center text-sm">
              Explore Services
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-semibold">
                    No Image
                  </div>
                )}
                
                <button
                  onClick={() => handleRemove(item)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-slate-400 hover:text-rose-500 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {item.category && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {item.category}
                    </span>
                  )}
                  <Link href={`/products/${item.id}`} className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-2 transition-colors text-base">
                    {item.name}
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-slate-900">৳{Number(item.price).toLocaleString()}</span>
                    {item.compareAtPrice && Number(item.compareAtPrice) > Number(item.price) && (
                      <span className="text-xs text-slate-400 line-through">
                        ৳{Number(item.compareAtPrice).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full control-button-primary h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

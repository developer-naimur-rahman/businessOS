"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../../lib/api-client"
import Link from "next/link"
import { Search, Filter, ShoppingBag, ArrowLeft } from "lucide-react"
import { MediaImage } from "../../../../components/ui/media-image"
import { useParams } from "next/navigation"

export default function CategoryProductsPage() {
  const params = useParams()
  const [products, setProducts] = useState<any[]>([])
  const [category, setCategory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/public/catalog/products'),
          api.get('/public/catalog/categories')
        ])
        
        const currentCategory = categoriesRes.data.find((c: any) => c.id === params.id)
        setCategory(currentCategory || null)
        
        const categoryProducts = productsRes.data.filter((p: any) => p.category?.id === params.id)
        setProducts(categoryProducts)
      } catch (err) {
        console.error("Failed to load category data", err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchData()
  }, [params.id])

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500">
      
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-3">
            {loading ? "Loading..." : category ? category.name : "Category Not Found"}
          </h1>
          <p className="text-lg text-slate-500 max-w-xl">
            {category?.description || "Browse our curated selection of products."}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="control-input pl-9 h-11 w-full bg-slate-50"
            />
          </div>
          <button className="control-button-secondary h-11 px-4 shrink-0">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </button>
        </div>
      </div>

      {/* Main Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-100 aspect-[4/5] rounded-2xl mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : !category ? (
        <div className="text-center py-32 bg-slate-50 rounded-3xl border border-slate-100">
          <ShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-6" />
          <h2 className="text-2xl font-medium text-slate-900 mb-2">Category not found</h2>
          <p className="text-slate-500">This category doesn't exist or is currently unavailable.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-32 bg-slate-50 rounded-3xl border border-slate-100">
          <ShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-6" />
          <h2 className="text-2xl font-medium text-slate-900 mb-2">No products found</h2>
          <p className="text-slate-500">We couldn't find any active products in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product: any) => (
            <Link href={`/products/${product.id}`} key={product.id} className="group block interactive-item">
              <div className="bg-slate-100 aspect-[4/5] rounded-2xl mb-6 overflow-hidden relative shadow-sm border border-slate-200/50">
                <MediaImage 
                  asset={null} 
                  fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 mix-blend-multiply" 
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-slate-900 shadow-sm">
                  {category.name}
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 leading-tight">{product.name}</h3>
              <p className="text-slate-500 mb-3 text-sm line-clamp-2">{product.description || 'No description available.'}</p>
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900 text-lg">৳{Number(product.sellingPrice).toLocaleString()}</p>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  Details
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

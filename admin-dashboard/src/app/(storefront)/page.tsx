"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../lib/api-client"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function StorefrontHomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await api.get('/public/catalog/products')
        setProducts(res.data)
      } catch (err) {
        console.error("Failed to load catalog", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Abstract structural background instead of generic image */}
        <div className="absolute inset-0 bg-slate-50 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.04),transparent_50%)]"></div>
          {/* Subtle grid lines for a technical, precise feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-20">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-slate-900 mb-8 leading-[1.1]">
            Curated excellence for <br/> the modern professional.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto font-medium">
            Discover our collection of premium products, designed with precision and built to elevate your daily workspace.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link 
              href="/products" 
              className="h-12 px-8 rounded-full bg-slate-900 text-white font-medium flex items-center justify-center hover:bg-slate-800 transition-transform active:scale-95"
            >
              Shop Collection
            </Link>
            <Link 
              href="/about" 
              className="h-12 px-8 rounded-full bg-white text-slate-900 font-medium flex items-center justify-center border border-slate-200 hover:border-slate-300 transition-all hover:bg-slate-50 active:scale-95"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-32 px-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">Featured Arrivals</h2>
            <p className="text-slate-500 text-lg">The latest additions to our catalog.</p>
          </div>
          <Link href="/products" className="hidden md:flex items-center text-slate-900 font-medium hover:opacity-70 transition-opacity">
            View all products <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-100 aspect-square rounded-2xl mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-slate-500 text-lg">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {products.slice(0, 8).map((product: any) => (
              <Link href={`/products/${product.id}`} key={product.id} className="group block">
                <div className="bg-slate-100 aspect-[4/5] rounded-2xl mb-6 overflow-hidden relative">
                  {/* Image placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/50 to-slate-100/50 group-hover:scale-105 transition-transform duration-500 ease-out"></div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{product.name}</h3>
                <p className="text-slate-500 mb-2 text-sm">{product.category || 'Essential'}</p>
                <p className="font-medium text-slate-900">৳{Number(product.price).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      
      {/* Visual Storytelling Break */}
      <section className="bg-slate-900 text-white py-32 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 leading-tight">
              Design is not just <br/>what it looks like.
            </h2>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-md">
              We believe in removing the unnecessary so that the necessary may speak. Every detail is carefully considered to provide you with an exceptional experience.
            </p>
          </div>
          <div className="bg-slate-800 rounded-3xl aspect-square md:aspect-[4/3] overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_50%)]"></div>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../lib/api-client"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { demoContent } from "../../config/demo-content"
import { MediaImage } from "../../components/ui/media-image"

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
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MediaImage 
            asset={demoContent.hero.image} 
            className="w-full h-full object-cover brightness-[0.95]" 
            priority
          />
          {/* Subtle gradient overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent"></div>
        </div>
        
        <div className="relative z-10 px-6 max-w-[1400px] w-full mx-auto mt-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-slate-900 mb-6 leading-[1.05]">
              {demoContent.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-slate-700 mb-10 font-medium max-w-xl leading-relaxed">
              {demoContent.hero.subtitle}
            </p>
            <div className="flex items-center gap-4">
              <Link 
                href={demoContent.hero.primaryActionLink} 
                className="control-button-primary shadow-md h-14 px-8 text-base rounded-full"
              >
                {demoContent.hero.primaryActionText}
              </Link>
              <Link 
                href={demoContent.hero.secondaryActionLink} 
                className="control-button-secondary h-14 px-8 text-base rounded-full border-slate-300 bg-white/50 backdrop-blur-md hover:bg-white/80"
              >
                {demoContent.hero.secondaryActionText}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Navigation */}
      <section className="py-12 border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex overflow-x-auto pb-4 hide-scrollbar gap-4 md:grid md:grid-cols-4 md:gap-6 md:pb-0">
            {demoContent.categories.map((category) => (
              <Link href={category.link} key={category.title} className="group relative min-w-[200px] aspect-[16/9] rounded-2xl overflow-hidden interactive-item shadow-sm border border-slate-200/50">
                <MediaImage asset={category.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <h3 className="font-semibold text-white tracking-tight">{category.title}</h3>
                  <ArrowRight className="w-4 h-4 text-white opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section (Real API) */}
      <section className="py-32 px-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">Featured Products</h2>
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
                <div className="bg-slate-100 aspect-[4/5] rounded-2xl mb-4"></div>
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
              <Link href={`/products/${product.id}`} key={product.id} className="group block interactive-item">
                <div className="bg-slate-100 aspect-[4/5] rounded-2xl mb-6 overflow-hidden relative shadow-sm border border-slate-200/50">
                  {/* NOTE: Backend does not currently support product images. We use a fallback placeholder for now. */}
                  <MediaImage 
                    asset={null} 
                    fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 mix-blend-multiply" 
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-slate-900 shadow-sm">
                    {product.category?.name || 'Essential'}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{product.name}</h3>
                <p className="text-slate-500 mb-3 text-sm line-clamp-2">{product.description || 'No description available.'}</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">৳{Number(product.sellingPrice).toLocaleString()}</p>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    View
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Services Showcase (Demo Config) */}
      <section className="py-32 px-6 bg-slate-900 text-white">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="mb-16">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-3">Professional Services</h2>
            <p className="text-slate-400 text-lg">Beyond products, we offer specialized services to accelerate your business.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {demoContent.featuredServices.map((service, idx) => (
              <Link href={service.link} key={idx} className="group block relative rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] interactive-item border border-slate-700">
                <MediaImage asset={service.image} className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-2xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-slate-300 mb-4 max-w-lg">{service.description}</p>
                  <span className="inline-block text-sm font-medium bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white border border-white/20">
                    {service.priceText}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Storytelling Break */}
      <section className="py-32 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 leading-tight">
              {demoContent.promotionalBanner.title}
            </h2>
            <p className="text-slate-500 text-lg md:text-xl leading-relaxed max-w-md mb-8">
              {demoContent.promotionalBanner.description}
            </p>
            <Link href="/about" className="control-button-primary rounded-full px-8 h-12 inline-flex">
              Learn about our approach
            </Link>
          </div>
          <div className="bg-white rounded-3xl aspect-square md:aspect-[4/3] overflow-hidden relative shadow-lg border border-slate-200">
            <MediaImage asset={demoContent.promotionalBanner.image} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  )
}

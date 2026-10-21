"use client"
import { demoContent } from "../../config/demo-content"

import React, { useEffect, useState } from "react"
import { api } from "../../lib/api-client"
import Link from "next/link"
import { ArrowRight, Star, ChevronLeft, ChevronRight, ShoppingCart, ShieldCheck, Truck, RefreshCcw, HeadphonesIcon, Flame, Heart } from "lucide-react"
import { MediaImage } from "../../components/ui/media-image"
import { useCartStore } from "../../store/useCartStore"
import { useWishlistStore } from "../../store/useWishlistStore"
import { toast } from "sonner"

const getFallbackProductImage = (name: string = "", type?: string) => {
  const n = name.toLowerCase();
  if (n.includes("mouse")) return "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop";
  if (n.includes("keyboard")) return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop";
  if (n.includes("pendrive") || n.includes("usb")) return "https://images.unsplash.com/photo-1624823183493-5f212ceea2eb?q=80&w=800&auto=format&fit=crop";
  if (n.includes("cable") || n.includes("hdmi") || n.includes("cat6")) return "https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=800&auto=format&fit=crop";
  if (n.includes("ssd") || n.includes("storage")) return "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800&auto=format&fit=crop";
  if (n.includes("ram") || n.includes("memory")) return "https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=800&auto=format&fit=crop";
  if (n.includes("router") || n.includes("wi-fi") || n.includes("net")) return "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop";
  if (n.includes("earbuds") || n.includes("airpod")) return "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop";
  if (n.includes("headphone") || n.includes("audio")) return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";
  if (n.includes("paper") || n.includes("ream")) return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=800&auto=format&fit=crop";
  if (n.includes("pen")) return "https://images.unsplash.com/photo-1585336261026-77825593c66f?q=80&w=800&auto=format&fit=crop";
  if (n.includes("wedding")) return "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";
  if (n.includes("photo") || n.includes("portrait") || n.includes("passport")) return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop";
  if (n.includes("print") || n.includes("copy")) return "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800&auto=format&fit=crop";
  if (n.includes("logo") || n.includes("design") || n.includes("creative")) return "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop";
  if (n.includes("cv") || n.includes("resume") || n.includes("form")) return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop";
  if (type === 'SERVICE') return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
  return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";
};

const ProductCard = ({ product }: { product: any }) => {
  const imageUrl = product.imageUrl || (product.variants && product.variants.length > 0 ? product.variants[0].imageUrl : null)
  const price = Number(product.sellingPrice)
  
  const originalPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null
  const hasDiscount = originalPrice && originalPrice > price
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const addItem = useCartStore(state => state.addItem)
  const isWishlisted = useWishlistStore(state => state.isInWishlist(product.id))
  const toggleWishlist = useWishlistStore(state => state.toggleItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: price,
      quantity: 1,
      type: "product",
      imageUrl: imageUrl
    });
    toast.success(`Added "${product.name}" to cart!`)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist({
      id: product.id,
      name: product.name,
      price: price,
      compareAtPrice: originalPrice,
      imageUrl: imageUrl,
      category: product.category?.name,
      type: product.type,
    });
    if (added) {
      toast.success(`Added "${product.name}" to wishlist!`);
    } else {
      toast.info(`Removed "${product.name}" from wishlist.`);
    }
  }

  return (
    <Link href={`/products/${product.id}`} className="group block bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden relative flex flex-col h-full">
      {hasDiscount && (
        <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
          -{discountPct}%
        </div>
      )}
      <button
        onClick={handleToggleWishlist}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-slate-400 hover:text-rose-500 hover:bg-white flex items-center justify-center shadow-sm z-20 transition-all hover:scale-110"
        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
      </button>
      <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden group-hover:bg-slate-100 transition-colors">
        <MediaImage 
          asset={imageUrl} 
          fallbackUrl={getFallbackProductImage(product.name, product.type)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-multiply p-4" 
          alt={product.name}
        />
        
        {/* Quick Add Button Overlay */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 px-4">
          <button 
            onClick={handleAddToCart}
            className="w-full bg-slate-900/90 backdrop-blur hover:bg-[#04BBFD] text-white font-medium text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-[#04BBFD] font-medium mb-1.5 uppercase tracking-wider">{product.category?.name || "Product"}</div>
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-3 group-hover:text-[#04BBFD] transition-colors flex-1">{product.name}</h3>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-[11px] text-slate-400 line-through">৳{originalPrice.toLocaleString()}</span>
                <span className="text-base font-bold text-rose-600">৳{price.toLocaleString()}</span>
              </>
            ) : (
              <span className="text-base font-bold text-slate-900">৳{price.toLocaleString()}</span>
            )}
          </div>
          {product.reviewCount > 0 ? (
            <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-amber-600 text-xs font-bold">
              <Star className="w-3 h-3 fill-current" />
              {Number(product.rating).toFixed(1)}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-medium">New</div>
          )}
        </div>
      </div>
    </Link>
  )
}

const TrustSection = () => (
  <div className="bg-white border-y border-slate-200 py-12">
    <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
      {[
        { icon: Truck, title: "Fast Delivery", sub: "Free shipping over ৳5000" },
        { icon: ShieldCheck, title: "Secure Payment", sub: "100% secure payment" },
        { icon: RefreshCcw, title: "Easy Returns", sub: "7 day return policy" },
        { icon: HeadphonesIcon, title: "24/7 Support", sub: "Dedicated support" }
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#04BBFD] shrink-0">
            <item.icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default function StorefrontHomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<any>(null)
  const [currentStoreSlide, setCurrentStoreSlide] = useState(0)
  const [currentServiceSlide, setCurrentServiceSlide] = useState(0)
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: "08",
    minutes: "30",
    seconds: "00",
  })

  useEffect(() => {
    const getTargetTime = () => {
      if (config?.flashSaleEnd) {
        const end = new Date(config.flashSaleEnd).getTime()
        if (end > Date.now()) return end
      }
      const now = new Date()
      const target = new Date(now)
      target.setHours(23, 59, 59, 999)
      return target.getTime()
    }

    const targetTime = getTargetTime()

    const updateCountdown = () => {
      const diff = Math.max(0, targetTime - Date.now())
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [config?.flashSaleEnd])

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes, configRes] = await Promise.all([
          api.get('/storefront/catalog/products'),
          api.get('/storefront/catalog/services'),
          api.get('/public/storefront-config').catch(() => ({ data: null }))
        ])
        
        
        const productsData = productsRes.data.items || productsRes.data || [];
        const servicesData = categoriesRes.data.items || categoriesRes.data || [];
        setProducts([...productsData, ...servicesData]);
        
        // Extract unique product categories
        const prodCats = Array.from(new Map(productsData.filter((p: any) => p.category).map((p: any) => [p.category.id, p.category])).values());
        // Extract unique service categories
        const servCats = Array.from(new Map(servicesData.filter((s: any) => s.category).map((s: any) => [s.category.id, s.category])).values());
        
        setCategories([...prodCats, ...servCats]);

        
        if (configRes?.data) {
          setConfig(configRes.data)
        }
      } catch (err) {
        console.error("Failed to load storefront data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Auto-slide hero
  // Auto-play for Store slider
  useEffect(() => {
    if (!config?.heroSlides || config.heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentStoreSlide((prev) => (prev + 1) % config.heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [config?.heroSlides])

  // Auto-play for Service slider
  useEffect(() => {
    if (!config?.serviceSlides || config.serviceSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentServiceSlide((prev) => (prev + 1) % config.serviceSlides.length)
    }, 6000) // Slightly offset timing so they don't change at the exact same moment
    return () => clearInterval(timer)
  }, [config?.serviceSlides])

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#04BBFD] border-t-transparent rounded-full animate-spin"></div></div>
  }

  const allItems = products || []
  const actualProducts = allItems.filter(p => p.type !== 'SERVICE')
  const actualServices = allItems.filter(p => p.type === 'SERVICE')

  const newArrivals = actualProducts.slice(0, 8)
  const popular = actualProducts.slice().reverse().slice(0, 8)
  const flashSale = actualProducts.filter(p => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.sellingPrice)).slice(0, 6)

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      
      {/* Dual CMS Hero Banner */}
      <div className="w-full max-w-[1400px] mx-auto sm:px-4 sm:pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* Left Column: STORE */}
          <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden bg-slate-950 sm:rounded-3xl shadow-xl border border-slate-800">
            {config?.heroSlides?.length > 0 ? (
              config.heroSlides.map((slide: any, i: number) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${currentStoreSlide === i ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                  <MediaImage 
                    asset={slide?.image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop"} 
                    alt="Store Banner" 
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  
                  <div className="absolute inset-0 z-10 p-6 sm:p-10 flex flex-col justify-end">
                    <div className="bg-[#04BBFD]/90 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-max mb-4 backdrop-blur-sm shadow-lg border border-sky-400/30">
                      🛍️ Store
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-[1.1] tracking-tight drop-shadow-md">
                      {slide?.title || "Welcome to Our Store"}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-200 mb-6 max-w-md font-medium drop-shadow">
                      {slide?.subtitle || "Discover our amazing products."}
                    </p>
                    <Link href={slide?.link || "/products"} className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg hover:scale-105 flex items-center gap-2 w-max">
                      {slide?.buttonText || "Shop Collection"} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <p className="text-slate-500 font-medium">No Store Slides Configured</p>
              </div>
            )}
            
            {/* Store Carousel Controls */}
            {(config?.heroSlides?.length > 1) && (
              <div className="absolute top-6 right-6 flex gap-2 z-20">
                {config.heroSlides.map((_: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentStoreSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentStoreSlide ? 'bg-white w-6 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/30 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: SERVICES */}
          <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden bg-slate-950 sm:rounded-3xl shadow-xl border border-slate-800">
            {config?.serviceSlides?.length > 0 ? (
              config.serviceSlides.map((slide: any, i: number) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${currentServiceSlide === i ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                  <MediaImage 
                    asset={slide?.image || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"} 
                    alt="Service Banner" 
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  
                  <div className="absolute inset-0 z-10 p-6 sm:p-10 flex flex-col justify-end">
                    <div className="bg-rose-600/90 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-max mb-4 backdrop-blur-sm shadow-lg border border-rose-400/30">
                      🛠️ Services
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-[1.1] tracking-tight drop-shadow-md">
                      {slide?.title || "Professional Services"}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-200 mb-6 max-w-md font-medium drop-shadow">
                      {slide?.subtitle || "Expert solutions for your business."}
                    </p>
                    <Link href={slide?.link || "/services"} className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg hover:scale-105 flex items-center gap-2 w-max">
                      {slide?.buttonText || "Book Service"} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <p className="text-slate-500 font-medium">No Service Slides Configured</p>
              </div>
            )}

            {/* Service Carousel Controls */}
            {(config?.serviceSlides?.length > 1) && (
              <div className="absolute top-6 right-6 flex gap-2 z-20">
                {config.serviceSlides.map((_: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentServiceSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentServiceSlide ? 'bg-white w-6 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/30 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 md:py-20 w-full space-y-20">
        
        {/* Categories Carousel */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Shop by Category</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((cat, i) => (
                <Link key={cat.id} href={`/products?category=${cat.id}`} className="group bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:shadow-xl transition-all border border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                     {cat.imageUrl ? <MediaImage asset={cat.imageUrl} className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 bg-slate-200 rounded-full" />}
                  </div>
                  <span className="font-semibold text-slate-700 text-center text-sm group-hover:text-[#04BBFD]">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Flash Sale */}
        {flashSale.length > 0 && (
          <section className="bg-rose-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 relative z-10 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="w-8 h-8 text-amber-300 fill-current" />
                  <h2 className="text-3xl md:text-4xl font-bold">Flash Sale</h2>
                </div>
                <p className="text-rose-100 text-lg">Grab these amazing deals before they're gone!</p>
              </div>
              
              {/* Dynamic Live Countdown Timer */}
              <div className="flex items-center gap-3 text-center">
                {[
                  { l: timeLeft.hours, u: 'HOURS' },
                  { l: timeLeft.minutes, u: 'MINS' },
                  { l: timeLeft.seconds, u: 'SECS' }
                ].map((t, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-3 min-w-[70px] border border-white/10 shadow-sm">
                    <div className="text-2xl font-bold tabular-nums">{t.l}</div>
                    <div className="text-[10px] uppercase tracking-wider text-rose-200">{t.u}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
              {flashSale.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl p-2 text-slate-900 hover:-translate-y-2 transition-transform duration-300">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">New Arrivals</h2>
            <Link href="/products" className="text-[#04BBFD] font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Popular Products */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Popular Right Now</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

      </div>

      {/* Services Showcase (Real Data) */}
      <section className="py-24 px-6 bg-slate-950 text-white w-full">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Professional Services</h2>
            <p className="text-slate-400 text-lg">Beyond products, we offer specialized services to accelerate your business.</p>
          </div>
          
          {actualServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {actualServices.slice(0, 8).map((service: any) => (
                <Link href={`/products/${service.id}`} key={service.id} className="group block relative rounded-3xl overflow-hidden aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] border border-slate-800 shadow-xl bg-slate-900 flex flex-col">
                  <div className="absolute inset-0">
                    <MediaImage 
                      asset={service.imageUrl} 
                      fallbackUrl={getFallbackProductImage(service.name, 'SERVICE')}
                      className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-40" 
                      alt={service.name}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent z-0"></div>
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-10 w-full">
                    <div className="text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">{service.category?.name || "Service"}</div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 text-white leading-tight group-hover:text-sky-300 transition-colors">{service.name}</h3>
                    <p className="text-slate-300 mb-6 text-sm line-clamp-2 md:line-clamp-3 leading-relaxed">{service.description || "Premium business service offering tailored for your professional needs."}</p>
                    <div className="mt-auto pt-4">
                      <span className="inline-flex items-center justify-between w-full text-sm font-bold bg-white/10 backdrop-blur-md border border-white/10 text-white px-5 py-3 rounded-full group-hover:bg-[#04BBFD] group-hover:border-[#04BBFD] transition-all duration-300">
                        <span>From ৳{Number(service.sellingPrice).toLocaleString()}</span> 
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 text-slate-400">
              No services available at the moment.
            </div>
          )}
        </div>
      </section>

      
      {/* Printing CTA */}
      <section className="bg-slate-100 py-16 px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Need Printing Services?</h2>
          <p className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto">Upload your documents, choose your paper size and finishing options, and get an instant quote for pickup or delivery.</p>
          <Link href="/printing" className="inline-flex items-center gap-2 bg-[#04BBFD] hover:bg-[#03a0d9] text-white px-8 py-4 rounded-full font-bold transition-colors shadow-lg hover:shadow-xl">
            Start Printing Order <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      
      <TrustSection />

    </div>
  )
}

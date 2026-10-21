"use client"
import React, { useEffect, useState, useMemo, Suspense } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MediaImage } from "../../../components/ui/media-image"
import { Printer, Sparkles, ArrowRight } from "lucide-react"

function ServicesContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category") || ""

  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await api.get('/public/catalog/products')
        const items = res.data.items || res.data || []
        setServices(items.filter((p: any) => p.type === 'SERVICE'))
      } catch (err) {
        console.error("Failed to load catalog", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  const filteredServices = useMemo(() => {
    if (!categoryParam) return services
    const cat = categoryParam.toLowerCase().trim()
    return services.filter((s: any) => 
      s.category?.name?.toLowerCase().includes(cat) ||
      s.name?.toLowerCase().includes(cat) ||
      s.description?.toLowerCase().includes(cat)
    )
  }, [services, categoryParam])

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 md:py-20 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="mb-12 max-w-3xl">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          Professional Services
        </h1>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed">
          Beyond physical products, we offer specialized business services. From high-resolution printing and photocopy to professional studio photography and design studio workflows.
        </p>
      </div>

      {/* Featured Banner for Printing Studio */}
      <div className="mb-12 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700/60">
        <div className="space-y-3 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#04BBFD]/20 text-[#04BBFD] text-xs font-bold uppercase tracking-wider border border-[#04BBFD]/30">
            <Sparkles className="w-3.5 h-3.5" /> Featured Service
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Online Document & Banner Printing</h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Need thesis binding, laser photocopy, PVC vinyl banners, or passport photos? Use our instant price calculator and upload files online.
          </p>
        </div>
        <Link 
          href="/printing" 
          className="z-10 bg-[#04BBFD] hover:bg-[#03a0d9] text-white px-7 py-3.5 rounded-full font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-[#04BBFD]/25 transition-all shrink-0"
        >
          <Printer className="w-4 h-4" /> Open Printing Studio <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <Printer className="w-80 h-80" />
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-100 aspect-[16/9] md:aspect-[4/3] rounded-3xl mb-4"></div>
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          <p className="text-slate-500 text-lg mb-4">No services available for this selection.</p>
          <Link href="/services" className="control-button-primary rounded-full px-6 h-11 inline-flex items-center text-sm font-semibold">
            View All Services
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredServices.map((service: any) => (
            <Link 
              href={`/services/${service.id}`} 
              key={service.id} 
              className="group block relative rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[4/3] interactive-item border border-slate-200/80 shadow-sm"
            >
              <MediaImage 
                asset={service.imageUrl} 
                fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
              
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{service.name}</h3>
                <p className="text-slate-300 mb-6 text-sm sm:text-base max-w-lg leading-relaxed line-clamp-2">
                  {service.description || 'Specialized service backed by experienced technicians.'}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="inline-block font-bold text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white border border-white/20">
                    From ৳{Number(service.sellingPrice).toLocaleString()}
                  </span>
                  <span className="text-white text-sm bg-[#04BBFD] hover:bg-[#03a0d9] px-5 py-2 rounded-full font-bold transition-colors shadow-sm">
                    View Details
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

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-6 py-20 text-center text-slate-400">Loading services...</div>}>
      <ServicesContent />
    </Suspense>
  )
}

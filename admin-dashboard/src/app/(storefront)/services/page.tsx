"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { MediaImage } from "../../../components/ui/media-image"

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await api.get('/public/catalog/products')
        setServices(res.data.filter((p: any) => p.type === 'SERVICE'))
      } catch (err) {
        console.error("Failed to load catalog", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="mb-16">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-4">Professional Services</h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          Beyond physical products, we offer specialized services to help your business operate efficiently. From high-quality printing to professional photography, our experts are ready to assist you.
        </p>
      </div>

      {/* Services Grid (Using API Data) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-100 aspect-[16/9] md:aspect-[4/3] rounded-3xl mb-4"></div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-lg">No services available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service: any) => (
            <Link href={`/services/${service.id}`} key={service.id} className="group block relative rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[4/3] interactive-item border border-slate-200 shadow-sm">
              <MediaImage 
                asset={null} 
                fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <h3 className="text-3xl font-semibold text-white mb-3">{service.name}</h3>
                <p className="text-slate-300 mb-6 text-lg max-w-lg leading-relaxed line-clamp-2">{service.description || 'No description available.'}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="inline-block font-medium bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-white border border-white/20">
                    From ৳{Number(service.sellingPrice).toLocaleString()}
                  </span>
                  <span className="text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-2.5 rounded-full font-medium transition-colors">
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

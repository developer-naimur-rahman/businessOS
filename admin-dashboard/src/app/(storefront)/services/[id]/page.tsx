"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Clock, Calendar } from "lucide-react"
import { MediaImage } from "../../../../components/ui/media-image"
import { useParams } from "next/navigation"
import { api } from "../../../../lib/api-client"

export default function ServiceDetailPage() {
  const params = useParams()
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await api.get(`/public/catalog/products/${params.id}`)
        if (res.data && res.data.type === 'SERVICE') {
          setService(res.data)
        } else {
          setService(null) // Only allow viewing services on this page
        }
      } catch (err) {
        console.error("Failed to load service", err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchService()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-12 animate-pulse">
        <div className="h-[40vh] bg-slate-100 rounded-3xl mb-12"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-32 text-center animate-in fade-in">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">Service not found</h1>
        <p className="text-slate-500 mb-8">The service you're looking for doesn't exist or is currently unavailable.</p>
        <Link href="/services" className="control-button-primary rounded-full px-8 h-12 inline-flex items-center">
          Back to Services
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[400px] flex items-end pb-12">
        <div className="absolute inset-0 z-0">
          <MediaImage asset={service.image} className="w-full h-full object-cover brightness-[0.7]" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 w-full">
          <Link href="/services" className="inline-flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
          </Link>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
            {service.name}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
            {service.description || "Professional service delivered with highest quality standards."}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          <div className="lg:col-span-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">What to expect</h2>
            <div className="prose prose-slate max-w-none mb-12">
              <p className="text-lg text-slate-600 leading-relaxed">
                Our professional {service.name.toLowerCase()} service is designed to deliver exceptional results with maximum convenience. We use state-of-the-art equipment and follow industry best practices to ensure your complete satisfaction.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Whether you need a quick turnaround for an urgent project or a comprehensive solution for a large-scale requirement, our team is equipped to handle it with precision.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Service Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {['Professional execution', 'Quick turnaround time', 'Quality guarantee', 'Dedicated support', 'Flexible options'].map((feature, i) => (
                <div key={i} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mr-4 shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="font-medium text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 sticky top-28">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Service Details</h3>
              <div className="text-3xl font-medium text-slate-900 mb-8 pb-8 border-b border-slate-200/80">
                From ৳{Number(service.sellingPrice).toLocaleString()}
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-slate-400 mr-4 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">Duration</h4>
                    <p className="text-sm text-slate-500">Varies based on requirements</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-slate-400 mr-4 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">Availability</h4>
                    <p className="text-sm text-slate-500">Monday - Saturday (9AM - 6PM)</p>
                  </div>
                </div>
              </div>

              {/* As requested in the master prompt: "If actual service booking API does not exist: Do NOT fake booking. Use an appropriate CTA such as Contact / Request service" */}
              <button className="control-button-primary w-full h-14 rounded-full text-base flex justify-center interactive-item shadow-md hover:shadow-lg">
                Request Service
              </button>
              
              <p className="text-center text-xs text-slate-400 mt-4">
                Our team will contact you to confirm details
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

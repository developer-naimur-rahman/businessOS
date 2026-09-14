"use client"
import React from "react"
import Link from "next/link"
import { demoContent } from "../../../config/demo-content"
import { MediaImage } from "../../../components/ui/media-image"

export default function ServicesPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="mb-16">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-4">Professional Services</h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          Beyond physical products, we offer specialized services to help your business operate efficiently. From high-quality printing to professional photography, our experts are ready to assist you.
        </p>
      </div>

      {/* Services Grid (Using demo config for now) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {demoContent.featuredServices.map((service, idx) => (
          <Link href={service.link} key={idx} className="group block relative rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[4/3] interactive-item border border-slate-200">
            <MediaImage asset={service.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <h3 className="text-3xl font-semibold text-white mb-3">{service.title}</h3>
              <p className="text-slate-300 mb-6 text-lg max-w-lg leading-relaxed">{service.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <span className="inline-block font-medium bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-white border border-white/20">
                  {service.priceText}
                </span>
                <span className="text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-2.5 rounded-full font-medium transition-colors">
                  View Details
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

"use client"

import React from "react"
import Link from "next/link"
import { 
  Printer, 
  ShoppingBag, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowRight,
  Award,
  Users,
  Layers
} from "lucide-react"

export default function AboutPage() {
  const stats = [
    { label: "Satisfied Customers", value: "15,000+", icon: Users },
    { label: "Print & Media Projects", value: "50,000+", icon: Printer },
    { label: "Product Catalog Items", value: "500+", icon: Layers },
    { label: "Customer Satisfaction", value: "99.8%", icon: Award },
  ]

  const pillars = [
    {
      icon: ShoppingBag,
      title: "Retail Stationery & Computer Accessories",
      color: "from-blue-500 to-indigo-600",
      description: "From certified office stationery and academic supplies to high-performance mice, mechanical keyboards, SSDs, and cables. We source exclusively from verified brands with official warranty.",
      features: ["100% Genuine Branded Accessories", "Wholesale & Student Bundle Pricing", "Instant Store Pickup & Express Delivery"]
    },
    {
      icon: Printer,
      title: "Digital Printing & Creative Studio",
      color: "from-sky-500 to-cyan-600",
      description: "Heavy-duty commercial digital presses delivering ultra-crisp document printing, thesis hardcover binding, PVC ID cards, promotional banners, and studio photo reproduction.",
      features: ["Same-Day Rapid Turnaround", "Premium Paper Stocks & Archival Toners", "Full Color Calibration & Proofing"]
    },
    {
      icon: Cpu,
      title: "IT Engineering & Hardware Servicing",
      color: "from-emerald-500 to-teal-600",
      description: "Dedicated bench technicians specializing in custom PC builds, laptop hardware upgrades, data recovery, thermal servicing, and certified networking solutions for home and business.",
      features: ["Certified Component Repair", "Free Hardware Diagnostics", "On-Demand Business Support"]
    }
  ]

  const values = [
    {
      icon: ShieldCheck,
      title: "Integrity & Genuine Quality",
      description: "Every product on our shelves and online catalog is 100% genuine with verifiable supplier provenance."
    },
    {
      icon: Clock,
      title: "Speed You Can Rely On",
      description: "Same-day express delivery across Savar and Hemayetpur, and rapid 24-48 hour delivery throughout Dhaka City."
    },
    {
      icon: Sparkles,
      title: "Obsession with Print Precision",
      description: "Every document, photo, and commercial banner is calibrated for true-to-life colors and flawless finishing."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 animate-in fade-in duration-500">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(4,187,253,0.25),rgba(255,255,255,0))]" />
        
        <div className="relative max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#04BBFD]/20 border border-[#04BBFD]/40 text-[#04BBFD] text-xs font-bold tracking-wide uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Established Excellence in Savar & Dhaka
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
            Empowering Modern Retail, High-Speed Print &amp; Computer Services
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            BusinessOS bridges the gap between a neighborhood physical retail hub and an ultra-modern digital storefront. From office stationery to commercial printing presses and IT diagnostics, we deliver excellence under one roof.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/products" 
              className="bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-[#04BBFD]/25 transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/contact" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-3.5 rounded-xl backdrop-blur-md transition-all"
            >
              Visit Our Store
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="relative -mt-10 max-w-[1200px] mx-auto px-6 z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-100">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="text-center p-3">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-sky-50 text-[#04BBFD] flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-500">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-[#04BBFD] uppercase tracking-wider mb-2">Our Capabilities</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Three Specialized Departments, One Unified Business
          </h3>
          <p className="text-slate-600 mt-4 text-base">
            Whether you are a university student needing thesis hardcover binding, a corporation needing bulk stationery, or an individual upgrading your workstation, we have you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon
            return (
              <div 
                key={i} 
                className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.color} text-white flex items-center justify-center shadow-md mb-6`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{pillar.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {pillar.description}
                  </p>
                  <div className="space-y-2.5 mb-6 pt-4 border-t border-slate-100">
                    {pillar.features.map((feat, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Link 
                  href={i === 1 ? "/printing" : "/products"}
                  className="text-xs font-bold text-[#04BBFD] hover:text-[#03a0d9] inline-flex items-center gap-1.5 transition-colors group mt-2"
                >
                  Learn More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-slate-900 text-white py-16 mb-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Why Customers Trust BusinessOS
            </h3>
            <p className="text-slate-400 text-sm">
              We operate with uncompromising standards for product authenticity, print accuracy, and customer transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, i) => {
              const Icon = val.icon
              return (
                <div key={i} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#04BBFD]/10 text-[#04BBFD] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{val.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{val.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Store Location & Physical Counter */}
      <section className="max-w-[1200px] mx-auto px-6">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 rounded-3xl p-8 sm:p-12 border border-indigo-100 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
                <MapPin className="w-3.5 h-3.5" />
                Physical Retail Hub
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
                Visit Us at Our Hemayetpur Counter
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Prefer to inspect products in person or drop off custom documents for high-resolution printing? Our full-service physical retail and printing facility is open 7 days a week.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Main Facility &amp; Counter</h5>
                    <p className="text-xs text-slate-600">Holding 42/B, Hemayetpur Bus Stand Road, Savar, Dhaka 1340, Bangladesh</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Operating Hours</h5>
                    <p className="text-xs text-slate-600">Saturday – Thursday: 9:00 AM – 10:00 PM | Friday: 3:00 PM – 10:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Direct Customer Helpline</h5>
                    <p className="text-xs text-slate-600">+880 1712-345678 (Voice &amp; WhatsApp Support)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-lg text-center">
              <div className="w-16 h-16 rounded-full bg-sky-50 text-[#04BBFD] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Have a Custom Inquire?</h4>
              <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                Need wholesale supply contracts, corporate gift printing, or specialized IT servicing? Contact our corporate accounts team.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact"
                  className="bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-md"
                >
                  Send Inquiry Online
                </Link>
                <a
                  href="https://wa.me/8801712345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

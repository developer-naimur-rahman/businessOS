"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  Truck, 
  RotateCcw, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Printer, 
  AlertCircle, 
  CreditCard,
  CheckCircle2,
  PhoneCall,
  PackageCheck
} from "lucide-react"

export default function ShippingPolicyPage() {
  const [activeTab, setActiveTab] = useState<'shipping' | 'printing' | 'returns'>('shipping')

  const deliveryRates = [
    {
      region: "Inside Savar & Hemayetpur",
      timeline: "Same Day or 24 Hours",
      charge: "৳60",
      badge: "Local Express",
      notes: "Orders confirmed before 1:00 PM are frequently delivered on the same evening."
    },
    {
      region: "Dhaka City (North & South)",
      timeline: "24 – 48 Hours",
      charge: "৳60",
      badge: "Metropolitan",
      notes: "Direct doorstep delivery via trusted city logistics partners."
    },
    {
      region: "Outside Dhaka (All 64 Districts)",
      timeline: "48 – 72 Hours",
      charge: "৳120",
      badge: "Nationwide",
      notes: "Dispatched via Steadfast, RedX, or eCourier with real-time SMS tracking."
    },
    {
      region: "In-Store Counter Pickup",
      timeline: "Ready within 1–2 Hours",
      charge: "FREE (৳0)",
      badge: "Self Pickup",
      notes: "Pick up at our Hemayetpur, Savar retail hub anytime during regular business hours."
    }
  ]

  const printingTimelines = [
    {
      service: "Standard Document Printing & Photocopying",
      duration: "1 – 4 Hours",
      description: "A4, Legal, A3 documents, lecture notes, certificates, and black & white or full color laser prints."
    },
    {
      service: "Spiral & Tape Binding",
      duration: "2 – 6 Hours",
      description: "Plastic coil, wire-o, or thermal tape binding with clear protective acetate covers."
    },
    {
      service: "Thesis & Hardcover Book Binding",
      duration: "12 – 24 Hours",
      description: "University standard rexine hard binding with crisp gold or silver foil embossed lettering."
    },
    {
      service: "PVC ID Cards & Custom Lanyards",
      duration: "24 – 48 Hours",
      description: "Double-sided high-density PVC cards with heat-sealed sublimation printed ribbon lanyards."
    },
    {
      service: "Commercial Posters, Banners & Vinyl",
      duration: "24 – 48 Hours",
      description: "Large-format outdoor banners, sticker prints, and x-banner stands with eyelets."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 animate-in fade-in duration-500">
      
      {/* Hero Header */}
      <section className="bg-slate-900 text-white py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#04BBFD]/20 border border-[#04BBFD]/40 text-[#04BBFD] text-xs font-bold tracking-wide uppercase mb-4">
            <Truck className="w-3.5 h-3.5" />
            Transparent Logistics &amp; Fair Policies
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Shipping, Turnaround &amp; Return Policy
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about our delivery coverage across Bangladesh, custom printing turnaround schedules, and our 7-day return guarantee.
          </p>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <section className="max-w-[1200px] mx-auto px-6 -mt-7 relative z-10">
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-slate-200/80 flex items-center justify-center gap-2 max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'shipping' 
                ? 'bg-[#04BBFD] text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            Delivery Rates
          </button>
          <button
            onClick={() => setActiveTab('printing')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'printing' 
                ? 'bg-[#04BBFD] text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            Printing Turnaround
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'returns' 
                ? 'bg-[#04BBFD] text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Return &amp; Refunds
          </button>
        </div>
      </section>

      {/* Tab Content Container */}
      <section className="max-w-[1200px] mx-auto px-6 pt-12">
        
        {/* 1. SHIPPING TAB */}
        {activeTab === 'shipping' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Delivery Zones, Timelines &amp; Rates
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                We partner with dedicated courier fleets to ensure safe, moisture-proof delivery right to your door.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {deliveryRates.map((rate, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-[#04BBFD] border border-sky-100">
                      {rate.badge}
                    </span>
                    <span className="text-2xl font-black text-slate-900 tabular-nums">
                      {rate.charge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{rate.region}</h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>Estimated: {rate.timeline}</span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed border-t border-slate-100 pt-3">
                    {rate.notes}
                  </p>
                </div>
              ))}
            </div>

            {/* Packaging Highlights */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-600" />
                Protective Packaging Standards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Moisture Barrier:</strong> All documents and paper goods are sealed in waterproof polybags.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Corner Guards:</strong> Bound books and hardcovers include rigid cardboard corner reinforcement.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Electronics Bubblewrap:</strong> Computer accessories are double-cushioned against courier drops.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRINTING TURNAROUND TAB */}
        {activeTab === 'printing' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Custom Printing Turnaround Schedules
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Production timelines begin as soon as your PDF/Artwork files are approved and payment is verified.
              </p>
            </div>

            <div className="space-y-4">
              {printingTimelines.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="max-w-xl">
                    <h3 className="text-base font-bold text-slate-900 mb-1">{item.service}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                    <Clock className="w-4 h-4 text-[#04BBFD]" />
                    <span className="text-xs font-bold text-slate-800">{item.duration}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong>Proof Approval Notice:</strong> For large volume book runs (over 10 copies) or corporate banner orders, we provide digital PDF proofs or 1 physical sample before full production starts. Production turnaround clock starts after customer approval.
              </div>
            </div>
          </div>
        )}

        {/* 3. RETURNS & REFUNDS TAB */}
        {activeTab === 'returns' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                7-Day Easy Return &amp; Refund Guarantee
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                We stand 100% behind the quality of our physical products and commercial print services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Retail Products &amp; Accessories</h3>
                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Eligible for exchange or return within <strong>7 days</strong> of delivery.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Item must be unused, in original retail packaging with barcodes and accessories intact.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Damaged or defective items must be reported within <strong>48 hours</strong> with unboxing photos/video.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#04BBFD] flex items-center justify-center mb-4">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Custom Printing &amp; Copy Orders</h3>
                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#04BBFD] shrink-0 mt-0.5" />
                    <span>If there is a defect caused by our printing press (smudges, misaligned binding, wrong paper stock), we provide <strong>100% free reprint</strong> immediately.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#04BBFD] shrink-0 mt-0.5" />
                    <span>Because custom prints are bespoke, orders cannot be cancelled after production has begun.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#04BBFD] shrink-0 mt-0.5" />
                    <span>Customer-submitted artwork errors (typos, low resolution files) are not eligible for cash refund.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Refund Process */}
            <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#04BBFD]" />
                How Refunds Are Dispatched
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                Once returned merchandise is received and verified at our Hemayetpur facility, refunds are processed within <strong>24 to 48 hours</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
                  <h4 className="text-sm font-bold text-white mb-1">bKash / Nagad</h4>
                  <p className="text-xs text-slate-400">Sent directly to customer's personal mobile wallet number within 24 hours.</p>
                </div>
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
                  <h4 className="text-sm font-bold text-white mb-1">Bank / Card Transfer</h4>
                  <p className="text-xs text-slate-400">Reversed to issuing bank within 3–5 business working days.</p>
                </div>
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
                  <h4 className="text-sm font-bold text-white mb-1">Store Credit</h4>
                  <p className="text-xs text-slate-400">Instant promo coupon credit with no expiry date for future orders.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Callout Banner */}
        <div className="mt-14 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white text-[#04BBFD] flex items-center justify-center shadow-sm shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Need Immediate Delivery Assistance?</h4>
              <p className="text-xs text-slate-600">Our customer support desk is ready to track your shipment or answer policy questions.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link 
              href="/contact" 
              className="bg-[#04BBFD] hover:bg-[#03a0d9] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Contact Support
            </Link>
            <a 
              href="https://wa.me/8801712345678" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>

      </section>

    </div>
  )
}

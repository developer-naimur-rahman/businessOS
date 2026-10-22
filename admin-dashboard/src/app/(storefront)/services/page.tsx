"use client"
import React, { useEffect, useState, useMemo, Suspense } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  HelpCircle,
  Camera,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  SendHorizontal
} from "lucide-react"

function ServicesContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category") || "ALL"

  const [internetServices, setInternetServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await api.get('/public/services')
        if (Array.isArray(res.data) && res.data.length > 0) {
          setInternetServices(res.data)
        }
      } catch (err) {
        console.error("Failed to load services from API", err)
      } finally {
        setLoading(false)
      }
    }
    loadServices()
  }, [])

  const categories = [
    { key: 'ALL', labelBn: 'সকল ডিজিটাল ও অনলাইন সেবা', labelEn: 'All Services' },
    { key: 'VIDEO_EDITING', labelBn: 'ভিডিও এডিটিং ও রিলস', labelEn: 'Video Editing & Reels' },
    { key: 'GRAPHIC_DESIGN', labelBn: 'গ্রাফিক ডিজাইন ও লোগো', labelEn: 'Graphic Design & Logo' },
    { key: 'DIGITAL_MARKETING', labelBn: 'ডিজিটাল মার্কেটিং ও অ্যাডস', labelEn: 'Digital Marketing & Ads' },
    { key: 'CYBERSECURITY', labelBn: 'সাইবার সিকিউরিটি ও আইটি', labelEn: 'Cybersecurity & IT' },
    { key: 'GOVT_JOB', labelBn: 'সরকারি ও টেলিটক চাকরি', labelEn: 'Govt Job Applications' },
    { key: 'PASSPORT', labelBn: 'ই-পাসপোর্ট নতুন ও নবায়ন', labelEn: 'E-Passport' },
    { key: 'CIVIL_REG', labelBn: 'জন্ম নিবন্ধন সংশোধন', labelEn: 'Birth Registration' },
    { key: 'NID', labelBn: 'NID ও ভোটার কার্ড', labelEn: 'NID & Voter Services' },
    { key: 'VISA', labelBn: 'ভিসা ও দূতাবাস ডকুমেন্ট', labelEn: 'Visa Assistance' },
    { key: 'TAX_TIN', labelBn: 'ই-টিআইএন ও আয়কর', labelEn: 'e-TIN Tax' },
    { key: 'PHOTO_DOC', labelBn: 'ফটো স্টুডিও রিসাইজ', labelEn: 'Photo Studio Preset' },
    { key: 'PRINT_PHOTOCOPY', labelBn: 'প্রিন্টিং ও ফটোকপি', labelEn: 'Printing & Binding' },
  ]

  const filtered = useMemo(() => {
    return internetServices.filter(s => {
      const matchCat = selectedCategory === 'ALL' || s.category === selectedCategory
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        s.titleBn?.toLowerCase().includes(q) ||
        s.titleEn?.toLowerCase().includes(q) ||
        s.descriptionBn?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [internetServices, selectedCategory, search])

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 md:py-16 animate-in fade-in duration-500">
      
      {/* Hero Header */}
      <div className="mb-10 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          AI-Powered Internet & Citizen Service Center
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          সরকারি ও অনলাইন সেবার <span className="text-cyan-600">স্মার্ট সেন্টার</span>
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          চাকরির আবেদন, ই-পাসপোর্ট, জন্ম নিবন্ধন ও NID সংশোধনের নির্ভুল সমাধান। ঘরে বসে রিকোয়েস্ট সাবমিট করুন অথবা দোকানে এসে সময় বাঁচাতে অ্যাপয়েন্টমেন্ট বুকিং করুন।
        </p>

        {/* Quick Action Navigation Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/service-helper"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 shadow-md transition-all"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            স্মার্ট রিকোয়ারমেন্ট গাইড
          </Link>
          <Link
            href="/service-request"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 shadow-md shadow-cyan-600/20 transition-all"
          >
            <SendHorizontal className="w-4 h-4" />
            অনলাইনে আবেদন ফরম
          </Link>
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            দোকান অ্যাপয়েন্টমেন্ট বুকিং
          </Link>
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            আবেদন ট্র্যাকিং
          </Link>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="mb-8 space-y-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="যেকোনো সেবা খুঁজুন (যেমন: পাসপোর্ট, চাকরির ছবি সাইজ, জন্ম নিবন্ধন...)"
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all text-sm sm:text-base"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === c.key
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {c.labelBn}
            </button>
          ))}
        </div>
      </div>

      {/* Service Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium text-lg mb-2">কোনো সেবা খুঁজে পাওয়া যায়নি।</p>
          <p className="text-slate-400 text-sm mb-6">অন্য কোনো নাম বা ক্যাটাগরি দিয়ে চেষ্টা করুন।</p>
          <button
            onClick={() => { setSearch(""); setSelectedCategory("ALL"); }}
            className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            সব সেবা দেখুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => (
            <div
              key={service.slug}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-cyan-300"
            >
              <div className="p-6 space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {service.targetAudience || 'সাধারণ নাগরিক'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" /> সরকারি পোর্টালে ভেরিফাইড
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-2">
                    {service.titleBn}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {service.titleEn}
                  </p>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {service.descriptionBn}
                  </p>
                </div>

                {/* Specs Pill Summary */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                    {service.estimatedProcessingTime || '১৫-৩০ মিনিট'}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    {service.requiredDocs?.length || 3}টি প্রমাণক কাগজ
                  </div>
                  {service.photoSpecs && (
                    <div className="inline-flex items-center gap-1 bg-cyan-50/80 px-2.5 py-1 rounded-lg border border-cyan-100 font-medium text-cyan-800">
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                      {service.photoSpecs.widthPx}x{service.photoSpecs.heightPx} px ছবি
                    </div>
                  )}
                </div>

                {/* Granular Fee Breakdown */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">সরকারি ফি</span>
                    <span className="text-sm font-bold text-slate-700">
                      {service.officialGovtFeeBdt > 0 ? `৳${service.officialGovtFeeBdt.toLocaleString()}` : 'সরকারি ফি নেই'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">দোকান চার্জ</span>
                    <span className="text-base font-extrabold text-cyan-700">
                      ৳{service.shopServiceChargeBdt.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 grid grid-cols-2 gap-2">
                <Link
                  href={`/service-helper?service=${service.slug}`}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 text-xs font-bold text-center flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
                  কাগজপত্র ও গাইড
                </Link>
                <Link
                  href={`/service-request?service=${service.slug}`}
                  className="px-3 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 text-xs font-bold text-center flex items-center justify-center gap-1 shadow-md shadow-cyan-600/20 transition-all"
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                  আবেদন করুন
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Featured Banner for Physical Printing & Custom Studio */}
      <div className="mt-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700/60">
        <div className="space-y-3 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-bold uppercase tracking-wider border border-cyan-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Zero-Pendrive File Drop
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">পেনড্রাইভ ছাড়াই সরাসরি প্রিন্ট পাঠান</h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            দোকানে না দাঁড়িয়ে মোবাইল থেকে সরাসরি পিডিএফ বা ছবি ড্রপ করুন। কাউন্টারে এসে তাৎক্ষণিক প্রিন্ট ও ফটোকপি সংগ্রহ করুন।
          </p>
        </div>
        <div className="flex flex-wrap gap-3 z-10">
          <Link 
            href="/upload-print" 
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 shadow-lg transition-all"
          >
            <SendHorizontal className="w-4 h-4" /> ফাইল ড্রপ করুন <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/appointments" 
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 transition-all"
          >
            <Calendar className="w-4 h-4" /> অ্যাপয়েন্টমেন্ট শিডিউল
          </Link>
        </div>
      </div>

    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto p-12 text-center text-slate-400">Loading services...</div>}>
      <ServicesContent />
    </Suspense>
  )
}

"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, X, ArrowRight, CornerDownLeft, Sparkles, 
  ShoppingCart, Wrench, Printer, CircleDollarSign, 
  Package, Users, Receipt, TrendingUp, Barcode, 
  Building2, Bot, Database, Store, ExternalLink,
  ShieldCheck, Loader2, Clock, Phone, Tag
} from "lucide-react"
import { api } from "../../lib/api-client"

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  title: string
  subtitle: string
  href: string
  category: "Navigation" | "POS & Cash" | "Services & Print" | "Inventory" | "Finance"
  icon: any
  badge?: string
  shortcut?: string
}

const STATIC_NAV_ITEMS: NavItem[] = [
  { title: "Counter POS", subtitle: "কুইক সেলস, বারকোড স্ক্যানার ও স্প্লিট পেমেন্ট", href: "/admin/pos", category: "POS & Cash", icon: ShoppingCart, badge: "F2 / POS", shortcut: "POS" },
  { title: "Cash Register & Till", subtitle: "দৈনিক ক্যাশ ড্রয়ার ব্যালেন্স ও ডে ক্লোজিং অডিট", href: "/admin/cash-register", category: "POS & Cash", icon: CircleDollarSign, badge: "Till" },
  { title: "Service Jobs & Repair", subtitle: "পিসি/ল্যাপটপ মেরামত, জব টিকিট ও ডেলিভারি হ্যান্ডঅফ", href: "/admin/service-jobs", category: "Services & Print", icon: Wrench, badge: "F7" },
  { title: "Print Queue Express", subtitle: "পেনড্রাইভ-মুক্ত প্রিন্ট ও ফটোকপি ফাইল কিউ", href: "/admin/print-queue", category: "Services & Print", icon: Printer, badge: "Queue" },
  { title: "Products & Catalog", subtitle: "প্রোডাক্ট ক্যাটালগ, ভ্যারিয়েন্ট ও পাইকারি মূল্য", href: "/admin/products", category: "Inventory", icon: Package },
  { title: "Inventory & Stock Levels", subtitle: "রিয়েল-টাইম গুদাম স্টক ও লো-স্টক অ্যালার্ট", href: "/admin/inventory", category: "Inventory", icon: Tag },
  { title: "Customers List", subtitle: "কাস্টমার প্রোফাইল, ফোন বুক ও অর্ডারের ইতিহাস", href: "/admin/customers", category: "Navigation", icon: Users },
  { title: "Digital Baki Khata", subtitle: "গ্রাহকদের বাকি খাতা, ট্র্যাকিং ও পেমেন্ট কালেকশন", href: "/admin/baki-khata", category: "Finance", icon: Receipt, badge: "Baki" },
  { title: "Daily Expenses", subtitle: "দোকানের দৈনন্দিন খরচ ও ক্যাশ ড্রয়ার আউটফ্লো", href: "/admin/expenses", category: "Finance", icon: Receipt },
  { title: "Profit & Loss (P&L)", subtitle: "মোট আয়, খরচ ও নেট লাভের মাসিক অডিট", href: "/admin/finance/profit-loss", category: "Finance", icon: TrendingUp },
  { title: "Barcode Studio", subtitle: "বারকোড ও প্রাইস স্টিকার জেনারেটর ও প্রিন্ট", href: "/admin/barcode-studio", category: "Inventory", icon: Barcode },
  { title: "Supplier Ledger (AP)", subtitle: "সাপ্লায়ার বাকি ও পেমেন্ট রিকনসিলিয়েশন", href: "/admin/suppliers/ledger", category: "Finance", icon: Building2 },
  { title: "Dropshipping AI Hub", subtitle: "প্রোডাক্ট লিংক রিসার্চ, ট্রেন্ডিং প্রফিট অ্যানালাইসিস", href: "/admin/dropshipping", category: "Inventory", icon: Sparkles },
  { title: "AI Copilot Dashboard", subtitle: "স্বয়ংক্রিয় ব্যবসায়িক অ্যানালিটিক্স ও ডিশিসন ইঞ্জিন", href: "/admin/ai-copilot", category: "Navigation", icon: Bot, badge: "AI" },
  { title: "Cloud Backup Vault", subtitle: "ডাটাবেজ ও সিস্টেম ফাইল ব্যাকআপ সংরক্ষণ", href: "/admin/system/backup", category: "Navigation", icon: Database },
  { title: "Storefront CMS", subtitle: "অনলাইন কাস্টমার শপ ব্যানার ও ক্যাটাগরি কনফিগ", href: "/admin/storefront", category: "Navigation", icon: Store },
  { title: "Public Print Drop", subtitle: "গ্রাহকদের মোবাইল থেকে পেনড্রাইভ-মুক্ত ফাইল আপলোড", href: "/upload-print", category: "Services & Print", icon: ExternalLink, badge: "Storefront" },
  { title: "Public Live Tracker", subtitle: "গ্রাহক সার্ভিস টিকিট ও ওয়ারেন্টি লাইভ ট্র্যাকিং", href: "/track", category: "Services & Print", icon: ExternalLink, badge: "Storefront" },
]

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Live remote search states
  const [searchingRemote, setSearchingRemote] = useState(false)
  const [remoteProducts, setRemoteProducts] = useState<any[]>([])
  const [remoteJobs, setRemoteJobs] = useState<any[]>([])
  const [remoteCustomers, setRemoteCustomers] = useState<any[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
      setRemoteProducts([])
      setRemoteJobs([])
      setRemoteCustomers([])
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Debounced search for live database entities
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setRemoteProducts([])
      setRemoteJobs([])
      setRemoteCustomers([])
      setSearchingRemote(false)
      return
    }

    setSearchingRemote(true)
    const timeout = setTimeout(async () => {
      try {
        const cleanQ = query.trim()
        const [prodRes, jobsRes, custRes] = await Promise.allSettled([
          api.get("/business-core/products", { params: { search: cleanQ, pageSize: 5 } }),
          api.get("/admin/service-jobs", { params: { search: cleanQ } }),
          api.get("/business-core/customers", { params: { search: cleanQ, pageSize: 5 } }),
        ])

        if (prodRes.status === "fulfilled" && prodRes.value.data) {
          const items = Array.isArray(prodRes.value.data.items) 
            ? prodRes.value.data.items 
            : Array.isArray(prodRes.value.data) ? prodRes.value.data : []
          setRemoteProducts(items.slice(0, 4))
        }

        if (jobsRes.status === "fulfilled" && jobsRes.value.data) {
          const jobs = Array.isArray(jobsRes.value.data.jobs) 
            ? jobsRes.value.data.jobs 
            : Array.isArray(jobsRes.value.data) ? jobsRes.value.data : []
          setRemoteJobs(jobs.slice(0, 4))
        }

        if (custRes.status === "fulfilled" && custRes.value.data) {
          const custs = Array.isArray(custRes.value.data.items) 
            ? custRes.value.data.items 
            : Array.isArray(custRes.value.data) ? custRes.value.data : []
          setRemoteCustomers(custs.slice(0, 4))
        }
      } catch (err) {
        console.warn("Global search fetch error", err)
      } finally {
        setSearchingRemote(false)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

  // Filter static navigation shortcuts
  const filteredNavItems = useMemo(() => {
    if (!query.trim()) return STATIC_NAV_ITEMS.slice(0, 8)
    const q = query.toLowerCase().trim()
    return STATIC_NAV_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    )
  }, [query])

  // Flatten all navigable results for keyboard navigation
  const allResults = useMemo(() => {
    const list: Array<{
      id: string
      type: "NAV" | "PRODUCT" | "JOB" | "CUSTOMER"
      title: string
      subtitle: string
      badge?: string
      href: string
      icon: any
    }> = []

    // 1. Navigation items
    filteredNavItems.forEach((item, idx) => {
      list.push({
        id: `nav-${idx}`,
        type: "NAV",
        title: item.title,
        subtitle: item.subtitle,
        badge: item.badge || item.category,
        href: item.href,
        icon: item.icon,
      })
    })

    // 2. Service Jobs
    remoteJobs.forEach((job) => {
      list.push({
        id: `job-${job.id || job.jobNumber}`,
        type: "JOB",
        title: `Service #${job.jobNumber}: ${job.customerName}`,
        subtitle: `${job.customerPhone} • ${job.jobDescription || job.deviceOrFileDetails || "Service Job"} • বাকি: ৳${job.dueAmountBdt || 0}`,
        badge: job.status,
        href: `/admin/service-jobs`,
        icon: Wrench,
      })
    })

    // 3. Products
    remoteProducts.forEach((prod) => {
      list.push({
        id: `prod-${prod.id}`,
        type: "PRODUCT",
        title: prod.name,
        subtitle: `SKU: ${prod.code || prod.variants?.[0]?.sku || "N/A"} • প্রাইস: ৳${prod.sellingPrice || 0}`,
        badge: prod.type === "SERVICE" ? "সার্ভিস" : "পণ্য",
        href: `/admin/products`,
        icon: Package,
      })
    })

    // 4. Customers
    remoteCustomers.forEach((cust) => {
      list.push({
        id: `cust-${cust.id}`,
        type: "CUSTOMER",
        title: cust.name,
        subtitle: `ফোন: ${cust.phone || "N/A"} ${cust.email ? "• " + cust.email : ""}`,
        badge: "কাস্টমার",
        href: `/admin/customers/${cust.id}`,
        icon: Users,
      })
    })

    return list
  }, [filteredNavItems, remoteJobs, remoteProducts, remoteCustomers])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (allResults.length || 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + (allResults.length || 1)) % (allResults.length || 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (allResults[selectedIndex]) {
        handleNavigate(allResults[selectedIndex].href)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    }
  }

  const handleNavigate = (href: string) => {
    onClose()
    router.push(href)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Top Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-slate-200/80 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Search pages, products, service jobs, customers, or SKU..."
            className="flex-1 bg-transparent border-none text-base text-slate-900 placeholder:text-slate-400 outline-none font-medium"
          />
          {searchingRemote && (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
          )}
          {query ? (
            <button
              onClick={() => {
                setQuery("")
                inputRef.current?.focus()
              }}
              className="w-6 h-6 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-bold text-slate-400 bg-slate-200/60 rounded-md border border-slate-300/60">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div 
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4"
        >
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-600">কোনো ফলাফল পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 mt-1">অন্য কোনো কীওয়ার্ড বা ফোন নম্বর লিখে খুঁজুন</p>
            </div>
          ) : (
            <>
              {/* Service Jobs Section */}
              {remoteJobs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 px-3">
                    🛠️ Service Jobs Found
                  </span>
                  {remoteJobs.map((job) => {
                    const idx = allResults.findIndex((r) => r.id === `job-${job.id || job.jobNumber}`)
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={job.id || job.jobNumber}
                        onClick={() => handleNavigate("/admin/service-jobs")}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected ? "bg-teal-50 border border-teal-200" : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              #{job.jobNumber} • {job.customerName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {job.customerPhone} • {job.jobDescription || job.deviceOrFileDetails}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-rose-600">
                            বাকি: ৳{job.dueAmountBdt || 0}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {job.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Products Section */}
              {remoteProducts.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 px-3">
                    📦 Products & Services Found
                  </span>
                  {remoteProducts.map((prod) => {
                    const idx = allResults.findIndex((r) => r.id === `prod-${prod.id}`)
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleNavigate("/admin/products")}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected ? "bg-indigo-50 border border-indigo-200" : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              SKU: {prod.code || prod.variants?.[0]?.sku || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-600">
                            ৳{prod.sellingPrice || 0}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {prod.type === "SERVICE" ? "সার্ভিস" : "পণ্য"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Customers Section */}
              {remoteCustomers.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 px-3">
                    👥 Customers Found
                  </span>
                  {remoteCustomers.map((cust) => {
                    const idx = allResults.findIndex((r) => r.id === `cust-${cust.id}`)
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={cust.id}
                        onClick={() => handleNavigate(`/admin/customers/${cust.id}`)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{cust.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{cust.phone || "No phone"}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Customer
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Navigation Shortcuts Section */}
              {filteredNavItems.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                    {query.trim() ? "⚡ Navigation Shortcuts" : "🚀 Quick Jump & Actions"}
                  </span>
                  {filteredNavItems.map((item) => {
                    const idx = allResults.findIndex((r) => r.title === item.title && r.type === "NAV")
                    const isSelected = idx === selectedIndex
                    const IconComponent = item.icon
                    return (
                      <div
                        key={item.href}
                        onClick={() => handleNavigate(item.href)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected ? "bg-indigo-50 border border-indigo-200" : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {item.badge}
                            </span>
                          )}
                          <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? "text-indigo-600 translate-x-0.5" : "text-slate-300"}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Footer Info */}
        <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-600">↑↓</kbd> নেভিগেট
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-600">↵</kbd> সিলেক্ট
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-600">ESC</kbd> ক্লোজ
            </span>
          </div>
          <span className="font-semibold text-indigo-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> BusinessOS Spotlight
          </span>
        </div>
      </div>
    </div>
  )
}

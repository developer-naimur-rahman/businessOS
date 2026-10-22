"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../../lib/api-client"
import {
  ShoppingCart,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Minimize2,
  Store,
  CreditCard,
  Smartphone,
} from "lucide-react"

export default function PosCustomerDisplayPage() {
  const [displayState, setDisplayState] = useState<any>({
    status: "IDLE_PROMO",
    items: [],
    subtotal: 0,
    discount: 0,
    grandTotal: 0,
    currency: "BDT",
    qrPaymentAmount: 0,
  })
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // 1. Initial fetch from server
    fetchState()

    // 2. Setup BroadcastChannel for zero-latency local dual-screen sync
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel("pos_customer_display")
      bc.onmessage = (event) => {
        if (event.data) {
          setDisplayState(event.data)
        }
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported in this environment", e)
    }

    // 3. Fallback localStorage listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "pos_customer_display_state" && e.newValue) {
        try {
          setDisplayState(JSON.parse(e.newValue))
        } catch (err) {}
      }
    }
    window.addEventListener("storage", handleStorage)

    // 4. Polling backup (every 2.5 seconds)
    const interval = setInterval(fetchState, 2500)

    return () => {
      bc?.close()
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [])

  const fetchState = async () => {
    try {
      const res = await api.get("/admin/pos/live-display-state")
      if (res.data) {
        setDisplayState(res.data)
      }
    } catch (err) {
      // Offline fallback from local storage
      const local = localStorage.getItem("pos_customer_display_state")
      if (local) {
        try {
          setDisplayState(JSON.parse(local))
        } catch (e) {}
      }
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const isIdle = !displayState.items || displayState.items.length === 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Banner Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white uppercase">BusinessOS Super Store</h1>
            <p className="text-[11px] text-slate-400">Customer Facing Terminal #01</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Screen Connected
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Cart & Pricing */}
        <div className="lg:col-span-7 border-r border-slate-800 flex flex-col h-full bg-slate-900/40">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-300">
                আপনার শপিং কার্ট ({displayState.items?.length || 0} আইটেম)
              </h2>
            </div>
            {displayState.items?.length > 0 && (
              <span className="text-xs text-indigo-400 font-semibold animate-pulse">
                স্ক্যানিং চলছে...
              </span>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isIdle ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 p-8 text-center">
                <ShoppingCart className="w-16 h-16 opacity-20" />
                <h3 className="text-lg font-bold text-slate-400">ক্যাশ কাউন্টারে স্বাগতম</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  ক্যাশিয়ার পণ্য স্ক্যান করার সাথে সাথে আপনার আইটেম এবং ডিসকাউন্ট এখানে প্রদর্শিত হবে।
                </p>
              </div>
            ) : (
              displayState.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 animate-in slide-in-from-left duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base leading-snug truncate">
                      {item.name || item.productName || "Product"}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.quantity} x ৳{Number(item.sellingPrice || item.unitPrice || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-indigo-400 tabular-nums">
                      ৳{(Number(item.sellingPrice || item.unitPrice || 0) * Number(item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Totals Bar */}
          <div className="p-6 bg-slate-900 border-t border-slate-800 shrink-0 space-y-3">
            <div className="flex justify-between text-sm text-slate-400">
              <span>সাবটোটাল</span>
              <span className="font-semibold text-slate-200 tabular-nums">
                ৳{Number(displayState.subtotal || 0).toLocaleString()}
              </span>
            </div>

            {Number(displayState.discount || 0) > 0 && (
              <div className="flex justify-between text-sm text-emerald-400 font-semibold">
                <span>বিশেষ ছাড় / সেভিংস</span>
                <span className="tabular-nums">-৳{Number(displayState.discount).toLocaleString()}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-between items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  সর্বমোট পরিশোধযোগ্য (Grand Total)
                </span>
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> ১০০% আসল পণ্য ও অথেনটিক ওয়ারেন্টি
                </div>
              </div>
              <div className="text-right">
                <span className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tight">
                  ৳{Number(displayState.grandTotal || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Merchant QR & Promotional Showcase */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between h-full bg-slate-950">
          {/* Dynamic Payment QR Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                বিকাশ ও নগদ কিউআর পেমেন্ট (Scan to Pay)
              </span>
            </div>

            {/* Generated QR Box Container */}
            <div className="relative w-48 h-48 bg-white p-3 rounded-2xl shadow-lg flex flex-col items-center justify-center my-2">
              <QrCode className="w-36 h-36 text-slate-900" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black uppercase tracking-wider shadow">
                  bKash / Nagad
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <p className="text-sm font-bold text-white">
                মার্চেন্ট নাম্বার: <span className="text-emerald-400 font-mono">01700-000000</span>
              </p>
              <p className="text-xs text-slate-400">
                বিকাশ বা নগদ অ্যাপ খুলে ওপরের কিউআর স্ক্যান করুন
              </p>
              {Number(displayState.grandTotal || 0) > 0 && (
                <div className="inline-block mt-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold text-sm rounded-xl">
                  পেমেন্ট করুন: ৳{Number(displayState.grandTotal).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Promotional Banner Card */}
          <div className="mt-6 p-6 rounded-3xl bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-900/40 text-left space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                বিশেষ অফার ও গ্যারান্টি
              </span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug">
              ল্যাপটপ, গ্যাজেট ও অ্যাক্সেসরিজে পাচ্ছেন অফিসিয়াল ওয়ারেন্টি সুবিধা
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              যেকোনো পণ্য কেনার পর ডিজিটাল রিসিট ও ওয়ারেন্টি ক্লেইম করতে আপনার মোবাইল নম্বর ক্যাশিয়ারের কাছে দিন।
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

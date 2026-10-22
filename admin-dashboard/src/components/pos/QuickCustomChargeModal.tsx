"use client"

import React, { useState } from "react"
import { X, Zap, Plus } from "lucide-react"

interface QuickCustomChargeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCharge: (name: string, price: number, qty: number) => void
}

const COMMON_PRESETS = [
  { name: "ফটোকপি A4", price: 3, icon: "📄" },
  { name: "সাদাকালো প্রিন্ট A4", price: 5, icon: "🖨️" },
  { name: "কালার প্রিন্ট A4", price: 15, icon: "🎨" },
  { name: "পাসপোর্ট ছবি (৪ কপি)", price: 100, icon: "📷" },
  { name: "অনলাইন ফরম পূরণ", price: 50, icon: "🌐" },
  { name: "সিভি মেকিং / টাইপিং", price: 300, icon: "📝" },
  { name: "লেমিনেশন A4", price: 20, icon: "🛡️" },
  { name: "কম্পিউটার স্ক্যানিং", price: 10, icon: "🔍" },
  { name: "উইন্ডোজ ও সফটওয়্যার সেটআপ", price: 350, icon: "💻" },
  { name: "প্লাস্টিক আইডি কার্ড প্রিন্ট", price: 80, icon: "🪪" },
]

export function QuickCustomChargeModal({ isOpen, onClose, onAddCharge }: QuickCustomChargeModalProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("20")
  const [qty, setQty] = useState(1)

  if (!isOpen) return null

  const handleApplyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setName(preset.name)
    setPrice(preset.price.toString())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const numPrice = Math.max(1, parseFloat(price) || 10)
    const numQty = Math.max(1, qty)
    onAddCharge(name.trim(), numPrice, numQty)
    setName("")
    setPrice("20")
    setQty(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">⚡ কুইক কাস্টম সেবা ও চার্জ</h3>
              <p className="text-xs text-slate-500">ফটোকপি, প্রিন্ট বা কাস্টম কাজের ইনস্ট্যান্ট বিল যোগ করুন</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Presets Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              জনপ্রিয় রেডিমেড প্রিসেট (১-ক্লিক নির্বাচন)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                    name === p.name
                      ? "bg-amber-50 border-amber-400 text-amber-900 shadow-xs ring-1 ring-amber-400"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate mr-1">{p.icon} {p.name}</span>
                  <span className="font-bold text-indigo-600 shrink-0">৳{p.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Name & Price Inputs */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সেবা / চার্জের নাম (Service Title) <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                placeholder="যেমন: লেমিনেশন A4, বায়োডাটা ড্রাফট, ছবি প্রিন্ট..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm font-medium text-slate-900 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  দর / মূল্য (টাকা)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  <input 
                    type="number"
                    step="any"
                    min="1"
                    placeholder="20"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full h-11 pl-7 pr-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পরিমাণ (Quantity)
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-11 px-2">
                  <button 
                    type="button" 
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setQty(qty + 1)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Total Preview */}
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900">মোট কার্ট মূল্য:</span>
            <span className="text-lg font-black text-indigo-600">
              ৳{(Math.max(0, parseFloat(price) || 0) * Math.max(1, qty)).toLocaleString()}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> কার্টে যোগ করুন
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

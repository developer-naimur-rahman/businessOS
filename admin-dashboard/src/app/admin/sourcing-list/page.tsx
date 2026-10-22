"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import {
  ShoppingBag,
  Copy,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Store,
  DollarSign,
  AlertTriangle,
  X,
  Send,
  Building2,
} from "lucide-react"
import { toast } from "sonner"

export default function SourcingListPage() {
  const [bazaarData, setBazaarData] = useState<any>({
    totalItemsCount: 0,
    totalEstimatedBazaarCostBdt: 0,
    marketsCount: 0,
    groupedByMarket: {},
    items: [],
    wantedPendingCount: 0,
  })
  const [wantedItems, setWantedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"BAZAAR" | "WANTED">("BAZAAR")
  const [searchQuery, setSearchQuery] = useState("")

  // Modal
  const [showAddWantedModal, setShowAddWantedModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Add Wanted Form
  const [requestedProductName, setRequestedProductName] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [requestCount, setRequestCount] = useState("1")
  const [estimatedBuyPrice, setEstimatedBuyPrice] = useState("")
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH")
  const [preferredSupplierOrMarket, setPreferredSupplierOrMarket] = useState("Elephant Road Computer City")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bazaarRes, wantedRes] = await Promise.all([
        api.get("/admin/sourcing-list/auto-bazaar-sheet"),
        api.get("/admin/sourcing-list"),
      ])
      setBazaarData(bazaarRes.data)
      setWantedItems(wantedRes.data || [])
    } catch (err: any) {
      console.error("Failed to load sourcing data", err)
      toast.error("বাজার সোর্সিং ডাটা লোড করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWanted = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestedProductName) return
    setSubmitting(true)
    try {
      await api.post("/admin/sourcing-list/wanted", {
        requestedProductName,
        customerName,
        customerPhone,
        requestCount: Number(requestCount),
        estimatedBuyPrice: Number(estimatedBuyPrice || 0),
        priority,
        preferredSupplierOrMarket,
        notes,
      })
      toast.success("ওয়ান্টেড প্রোডাক্ট খাতায় সংরক্ষিত হয়েছে")
      setShowAddWantedModal(false)
      setRequestedProductName("")
      setCustomerPhone("")
      setEstimatedBuyPrice("")
      setNotes("")
      loadData()
    } catch (err: any) {
      toast.error("ওয়ান্টেড প্রোডাক্ট সংরক্ষণ করতে সমস্যা হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFulfillWanted = async (item: any) => {
    try {
      await api.patch(`/admin/sourcing-list/wanted/${item.wantedId || item.id}/fulfill`)
      toast.success("প্রোডাক্ট স্টকে এসেছে হিসেবে মার্ক করা হয়েছে")

      if (item.customerPhone) {
        const cleanPhone = item.customerPhone.replace(/[^0-9]/g, "")
        const msg = `আসসালামু আলাইকুম ${item.customerName || ""}, আপনি যে "${item.requestedProductName}" খুঁজেছিলেন তা এখন আমাদের শপে স্টকে এসেছে। অনুগ্রহ করে শপ থেকে সংগ্রহ করুন। ধন্যবাদ।`
        const waUrl = `https://wa.me/88${cleanPhone.startsWith("88") ? cleanPhone.slice(2) : cleanPhone}?text=${encodeURIComponent(msg)}`
        window.open(waUrl, "_blank")
      }
      loadData()
    } catch (err: any) {
      toast.error("স্ট্যাটাস আপডেট ব্যর্থ হয়েছে")
    }
  }

  const handleCopyBazaarList = () => {
    let text = `📋 দৈনিক পাইকারি বাজার সোর্সিং তালিকা (${new Date().toLocaleDateString()})\n\n`
    Object.entries(bazaarData.groupedByMarket || {}).forEach(([market, items]: [string, any]) => {
      text += `📍 ${market}:\n`
      items.forEach((it: any, i: number) => {
        text += `  ${i + 1}. ${it.productName} (পরিমাণ: ${it.suggestedBuyQty} টি) - আনুমানিক রেট: ৳${it.unitCostBdt}\n`
      })
      text += `\n`
    })
    text += `💰 সর্বমোট আনুমানিক বাজেট: ৳${Number(bazaarData.totalEstimatedBazaarCostBdt || 0).toLocaleString()}\n`

    navigator.clipboard.writeText(text)
    toast.success("পাইকারি বাজারের তালিকা হোয়াটসঅ্যাপে পাঠানোর জন্য কপি হয়েছে!")
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <ShoppingBag className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              পাইকারি বাজার শিট ও ওয়ান্টেড খাতা (Wholesale Sourcing Hub)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            লো-স্টক পণ্য এবং কাস্টমারদের চাওয়া কিন্তু না থাকা পণ্যের কেন্দ্রীয় বাজার কেনাকাটা শিট
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyBazaarList}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Copy className="w-4 h-4 text-slate-500" /> হোয়াটসঅ্যাপ বাজার শিট কপি
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" /> প্রিন্ট শিট
          </button>
          <button
            onClick={() => setShowAddWantedModal(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> ওয়ান্টেড বইতে যোগ
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">বাজারের পণ্য তালিকা</p>
            <h3 className="text-2xl font-black text-slate-900 tabular-nums">{bazaarData.totalItemsCount || 0} টি</h3>
            <p className="text-xs text-slate-400 mt-0.5">লো-স্টক + ওয়ান্টেড কম্বাইন্ড</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">প্রয়োজনীয় বাজার বাজেট</p>
            <h3 className="text-2xl font-black text-emerald-600 tabular-nums">
              ৳{Number(bazaarData.totalEstimatedBazaarCostBdt || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">আনুমানিক পাইকারি পুঁজী</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">কাস্টমার ওয়ান্টেড আইটেম</p>
            <h3 className="text-2xl font-black text-rose-600 tabular-nums">{bazaarData.wantedPendingCount || 0} টি</h3>
            <p className="text-xs text-rose-600/80 mt-0.5 font-medium">কাস্টমারকে মাল এনে দিতে হবে</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">পাইকারি মার্কেট হাব</p>
            <h3 className="text-2xl font-black text-indigo-600 tabular-nums">{bazaarData.marketsCount || 0} টি</h3>
            <p className="text-xs text-slate-400 mt-0.5">মার্কেট-ভিত্তিক সোর্সিং</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("BAZAAR")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "BAZAAR"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> দৈনিক পাইকারি বাজার তালিকা (Bazaar Sheet)
        </button>
        <button
          onClick={() => setActiveTab("WANTED")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "WANTED"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" /> কাস্টমার ওয়ান্টেড খাতা (Wanted Book)
          {bazaarData.wantedPendingCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-xs rounded-full font-bold">
              {bazaarData.wantedPendingCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BAZAAR SHEET */}
      {activeTab === "BAZAAR" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400">বাজার শিট প্রস্তুত হচ্ছে...</div>
          ) : Object.keys(bazaarData.groupedByMarket || {}).length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              বর্তমানে কোনো পণ্যের বাজার করার প্রয়োজন নেই
            </div>
          ) : (
            Object.entries(bazaarData.groupedByMarket || {}).map(([market, items]: [string, any]) => (
              <div key={market} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{market}</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{items.length} টি পণ্য কিনতে হবে</span>
                </div>

                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">পণ্যের নাম</th>
                      <th className="px-5 py-3 text-center">বর্তমান স্টক</th>
                      <th className="px-5 py-3 text-center">কেনার পরিমাণ</th>
                      <th className="px-5 py-3 text-right">পাইকারি ইউনিট রেট</th>
                      <th className="px-5 py-3 text-right">মোট আনুমানিক খরচ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{item.productName}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{item.sku}</span>
                            {item.sourceType === "CUSTOMER_WANTED_BOOK" && (
                              <span className="px-1.5 py-0.2 bg-rose-50 text-rose-600 rounded text-[10px] font-bold">
                                🔔 গ্রাহকের ডিমান্ড ({item.customerPhone})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-rose-600">{item.currentStock} টি</td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-900">{item.suggestedBuyQty} টি</td>
                        <td className="px-5 py-3.5 text-right font-medium text-slate-600 tabular-nums">
                          ৳{Number(item.unitCostBdt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 tabular-nums">
                          ৳{Number(item.estimatedCostBdt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: WANTED BOOK */}
      {activeTab === "WANTED" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">অনুরোধকৃত পণ্য</th>
                  <th className="px-5 py-3.5">গ্রাহক ও মোবাইল</th>
                  <th className="px-5 py-3.5">মার্কেট সোর্স</th>
                  <th className="px-5 py-3.5 text-center">স্ট্যাটাস</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wantedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      ওয়ান্টেড বইতে কোনো পণ্য রেকর্ড নেই
                    </td>
                  </tr>
                ) : (
                  wantedItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{item.requestedProductName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">পরিমাণ: {item.requestCount} টি | বাজেট: ৳{item.estimatedBuyPrice}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800 text-xs">{item.customerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" /> {item.customerPhone}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">{item.preferredSupplierOrMarket}</td>
                      <td className="px-5 py-4 text-center">
                        {item.status === "FULFILLED_IN_STOCK" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✅ স্টকে এসেছে
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            ⏳ বাজার করা বাকি
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {item.status !== "FULFILLED_IN_STOCK" && (
                          <button
                            onClick={() => handleFulfillWanted(item)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 ml-auto shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" /> স্টকে এসেছে ও কাস্টমারকে জানান
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD WANTED PRODUCT MODAL */}
      {showAddWantedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">কাস্টমার ওয়ান্টেড খাতা এন্ট্রি</h3>
              <button onClick={() => setShowAddWantedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWanted} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">যে পণ্যটি কাস্টমার চেয়েছেন *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logitech C922 Pro Webcam / iPhone 13 Case"
                  value={requestedProductName}
                  onChange={(e) => setRequestedProductName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">কাস্টমারের নাম</label>
                  <input
                    type="text"
                    placeholder="e.g. সাব্বির আহমেদ"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">পরিমাণ (Pieces)</label>
                  <input
                    type="number"
                    value={requestCount}
                    onChange={(e) => setRequestCount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">কেনার আনুমানিক রেট (৳)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={estimatedBuyPrice}
                    onChange={(e) => setEstimatedBuyPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">যে মার্কেট বা ডিলার থেকে আনতে হবে</label>
                <select
                  value={preferredSupplierOrMarket}
                  onChange={(e) => setPreferredSupplierOrMarket(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="Elephant Road Computer City">ইসিএস কম্পিউটার সিটি (মাল্টিপ্ল্যান সেন্টার / এলিফ্যান্ট রোড)</option>
                  <option value="IDB Bhaban Computer Market">বিসিএস কম্পিউটার সিটি (আইডিবি ভবন)</option>
                  <option value="Stadium Market Wholesale">বঙ্গবন্ধু স্টেডিয়াম ইলেকট্রনিক্স মার্কেট</option>
                  <option value="Chawkbazar / Nawabpur Wholesale">চকবাজার ও নবাবপুর পাইকারি মার্কেট</option>
                  <option value="Skybuy China Cargo">স্কাইবুক চায়না এয়ার কার্গো</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWantedModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "খাতায় লিপিবদ্ধ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

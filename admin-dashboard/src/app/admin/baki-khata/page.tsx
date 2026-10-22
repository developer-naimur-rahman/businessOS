"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import {
  BookOpen,
  DollarSign,
  AlertTriangle,
  Search,
  Plus,
  Send,
  CheckCircle2,
  Phone,
  FileText,
  Printer,
  X,
  CreditCard,
  UserCheck,
  TrendingDown,
} from "lucide-react"
import { toast } from "sonner"

export default function BakiKhataPage() {
  const [data, setData] = useState<any>({
    totalMarketDueBdt: 0,
    collectedThisMonthBdt: 0,
    overdueCustomersCount: 0,
    totalCustomersWithDue: 0,
    customers: [],
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState("ALL")

  // Modals state
  const [showAddDueModal, setShowAddDueModal] = useState(false)
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [showStatementModal, setShowStatementModal] = useState(false)
  const [showTaqadaModal, setShowTaqadaModal] = useState(false)

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerStatement, setCustomerStatement] = useState<any>(null)
  const [taqadaData, setTaqadaData] = useState<any>(null)

  // Form states
  const [newDueAmount, setNewDueAmount] = useState("")
  const [newDueNotes, setNewDueNotes] = useState("")
  const [collectAmount, setCollectAmount] = useState("")
  const [collectMethod, setCollectMethod] = useState("CASH")
  const [collectNotes, setCollectNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadLedger()
  }, [])

  const loadLedger = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/baki-khata/ledger")
      setData(res.data)
    } catch (err: any) {
      console.error("Failed to load baki khata ledger", err)
      toast.error("বাকি খাতার ডাটা লোড করা সম্ভব হয়নি")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenStatement = async (cust: any) => {
    setSelectedCustomer(cust)
    const cId = cust.customerId || cust.id
    try {
      const res = await api.get(`/admin/baki-khata/customers/${cId}`)
      setCustomerStatement(res.data)
      setShowStatementModal(true)
    } catch (err: any) {
      toast.error("স্টেটমেন্ট লোড করতে সমস্যা হয়েছে")
    }
  }

  const handleOpenTaqada = async (cust: any) => {
    setSelectedCustomer(cust)
    const cId = cust.customerId || cust.id
    try {
      const res = await api.post("/admin/baki-khata/send-reminder", {
        customerId: cId,
        customerPhone: cust.phone,
        dueAmountBdt: cust.netDueBdt ?? cust.dueAmount ?? 0,
        paymentBkashNumber: "01700000000",
      })
      setTaqadaData(res.data)
      setShowTaqadaModal(true)
    } catch (err: any) {
      toast.error("তাগাদা মেসেজ প্রস্তুত করতে ব্যর্থ")
    }
  }

  const handleRecordNewDue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !newDueAmount) return
    const cId = selectedCustomer.customerId || selectedCustomer.id
    setSubmitting(true)
    try {
      await api.post("/admin/baki-khata/transaction", {
        customerId: cId,
        type: "NEW_BAKI_SALE",
        amount: Number(newDueAmount),
        notes: newDueNotes,
      })
      toast.success("বকেয়া সফলভাবে যোগ করা হয়েছে")
      setShowAddDueModal(false)
      setNewDueAmount("")
      setNewDueNotes("")
      loadLedger()
    } catch (err: any) {
      toast.error("বকেয়া যোগ করতে সমস্যা হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !collectAmount) return
    const cId = selectedCustomer.customerId || selectedCustomer.id
    setSubmitting(true)
    try {
      await api.post("/admin/baki-khata/transaction", {
        customerId: cId,
        type: "DUE_COLLECTION",
        amount: Number(collectAmount),
        paymentMethod: collectMethod,
        notes: collectNotes,
      })

      toast.success("বকেয়া আদায় সফলভাবে জমা হয়েছে")
      setShowCollectModal(false)
      setCollectAmount("")
      setCollectNotes("")
      loadLedger()
    } catch (err: any) {
      toast.error("টাকা জমা রেকর্ড করতে সমস্যা হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredCustomers = (data.customers || []).filter((c: any) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    const matchesRisk =
      riskFilter === "ALL"
        ? true
        : riskFilter === "OVERDUE"
        ? c.isOverdue
        : c.riskLevel === riskFilter
    return matchesSearch && matchesRisk
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              ডিজিটাল বাকির খাতা (Digital Baki Khata & Taqada)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            গ্রাহকের বাকিতে বিক্রয়, কিস্তি ও আদায় ট্র্যাকিং এবং ১-ক্লিক বাংলা হোয়াটসঅ্যাপ তাগাদা
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">মোট বকেয়া পাওনা</p>
            <h3 className="text-2xl font-black text-rose-600 tabular-nums">
              ৳{Number(data.totalMarketDueBdt || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{data.totalCustomersWithDue || 0} জন গ্রাহকের দেনা রয়েছে</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">এই মাসে আদায়</p>
            <h3 className="text-2xl font-black text-emerald-600 tabular-nums">
              ৳{Number(data.collectedThisMonthBdt || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">ক্যাশ ড্রয়ারে জমা হয়েছে</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">৩০+ দিন বকেয়া (Overdue)</p>
            <h3 className="text-2xl font-black text-amber-600 tabular-nums">{data.overdueCustomersCount || 0}</h3>
            <p className="text-xs text-amber-700/80 mt-0.5 font-medium">তাগাদা পাঠানো জরুরি</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">মোট নিবন্ধিত কাস্টমার</p>
            <h3 className="text-2xl font-black text-slate-900 tabular-nums">{(data.customers || []).length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">অ্যাক্টিভ খাতা তালিকা</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
          >
            <option value="ALL">সকল গ্রাহক</option>
            <option value="OVERDUE">🚨 বকেয়া ৩০+ দিন অতিবাহিত</option>
            <option value="HIGH_RISK">⚠️ হাই রিস্ক (৳১০,০০০+)</option>
            <option value="NORMAL">✅ নিয়মিত কাস্টমার</option>
          </select>
        </div>
      </div>

      {/* Customer Due Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">গ্রাহক ও মোবাইল</th>
                <th className="px-5 py-4 text-right">মোট বাকি বিক্রয়</th>
                <th className="px-5 py-4 text-right">মোট পরিশোধ</th>
                <th className="px-5 py-4 text-right">বর্তমান নিট বকেয়া</th>
                <th className="px-5 py-4 text-center">স্ট্যাটাস / রিস্ক</th>
                <th className="px-5 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    খাতা লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    কোনো বকেয়া রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust: any) => (
                  <tr key={cust.customerId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{cust.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {cust.phone}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-600 tabular-nums">
                      ৳{Number(cust.totalCreditBdt ?? cust.dueAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-emerald-600 tabular-nums">
                      ৳{Number(cust.totalPaidBdt ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-rose-600 text-base tabular-nums">
                      ৳{Number(cust.netDueBdt ?? cust.dueAmount ?? 0).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {cust.netDueBdt === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          পরিশোধিত (Clear)
                        </span>
                      ) : cust.isOverdue ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          🚨 Overdue &gt; 30 দিন
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          বকেয়া বিদ্যমান
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCustomer(cust)
                            setShowAddDueModal(true)
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                          title="বকেয়া যোগ করুন"
                        >
                          <Plus className="w-3.5 h-3.5" /> বাকি
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(cust)
                            setShowCollectModal(true)
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors flex items-center gap-1"
                          title="বকেয়া টাকা জমা নিন"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> জমা
                        </button>
                        {cust.netDueBdt > 0 && (
                          <button
                            onClick={() => handleOpenTaqada(cust)}
                            className="px-2.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                            title="হোয়াটসঅ্যাপ তাগাদা পাঠান"
                          >
                            <Send className="w-3.5 h-3.5" /> তাগাদা
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenStatement(cust)}
                          className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="পুরো খাতা দেখুন"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add Due */}
      {showAddDueModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">নতুন বকেয়া যোগ করুন (Add Due)</h3>
              <button onClick={() => setShowAddDueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordNewDue} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">গ্রাহকের নাম</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedCustomer.name} (${selectedCustomer.phone})`}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">বকেয়ার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2500"
                  value={newDueAmount}
                  onChange={(e) => setNewDueAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-base font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">বিবরণ / নোট</label>
                <textarea
                  rows={2}
                  placeholder="পণ্য বা চালানের বিবরণ লিখুন..."
                  value={newDueNotes}
                  onChange={(e) => setNewDueNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDueModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "বাকি নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Collect Due */}
      {showCollectModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">বকেয়া টাকা জমা গ্রহণ (Collect Due)</h3>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordCollection} className="space-y-4 mt-4">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex justify-between items-center">
                <span className="text-xs font-medium text-rose-800">মোট পাওনা বকেয়া:</span>
                <span className="text-base font-black text-rose-700">৳{Number(selectedCustomer.netDueBdt).toLocaleString()}</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">আদায়ের পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-base font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">পেমেন্ট মেথড</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                >
                  <option value="CASH">💵 নগদ ক্যাশ (Cash Register)</option>
                  <option value="MOBILE_BANKING">📱 বিকাশ / নগদ (bKash/Nagad)</option>
                  <option value="BANK">🏛️ ব্যাংক ট্রান্সফার (Bank Account)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">রিসিট রেফারেন্স / নোট</label>
                <input
                  type="text"
                  placeholder="TrxID বা রিসিট নম্বর..."
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? "জমা হচ্ছে..." : "জমা সম্পন্ন করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WhatsApp Taqada Preview */}
      {showTaqadaModal && taqadaData && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-green-100 text-green-700 rounded-lg">
                  <Send className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-lg">হোয়াটসঅ্যাপ তাগাদা মেসেজ (Due Taqada)</h3>
              </div>
              <button onClick={() => setShowTaqadaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                {taqadaData.message}
              </div>

              <div className="text-xs text-slate-500 flex justify-between">
                <span>গ্রাহক মোবাইল: <b>{taqadaData.customerPhone}</b></span>
                <span>মোট দেনা: <b className="text-rose-600">৳{taqadaData.dueAmountBdt}</b></span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(taqadaData.message)
                    toast.success("মেসেজ কপি করা হয়েছে")
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  টেক্সট কপি করুন
                </button>
                <a
                  href={taqadaData.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> সরাসরি হোয়াটসঅ্যাপে পাঠান
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Full Statement Drawer */}
      {showStatementModal && customerStatement && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{customerStatement.customer.name} - খাতার স্টেটমেন্ট</h3>
                <p className="text-xs text-slate-500">ফোন: {customerStatement.customer.phone} | ঠিকানা: {customerStatement.customer.address || "Local"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট
                </button>
                <button onClick={() => setShowStatementModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5">তারিখ</th>
                    <th className="px-3 py-2.5">রেফারেন্স / নোট</th>
                    <th className="px-3 py-2.5 text-right">বাকি (Debit)</th>
                    <th className="px-3 py-2.5 text-right">জমা (Credit)</th>
                    <th className="px-3 py-2.5 text-right">ব্যালেন্স</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerStatement.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        কোনো লেনদেন রেকর্ড নেই
                      </td>
                    </tr>
                  ) : (
                    customerStatement.transactions.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2.5 text-slate-900 font-medium">{t.notes}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-rose-600">
                          {t.debit > 0 ? `৳${Number(t.debit).toLocaleString()}` : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">
                          {t.credit > 0 ? `৳${Number(t.credit).toLocaleString()}` : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                          ৳{Number(t.balance).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center shrink-0">
              <span className="font-semibold text-slate-700">সর্বমোট নিট পাওনা:</span>
              <span className="text-xl font-black text-rose-600">৳{Number(customerStatement.netDueBdt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import {
  ShieldCheck,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Barcode,
  Truck,
  User,
  Phone,
  Calendar,
  X,
  FileCheck,
} from "lucide-react"
import { toast } from "sonner"

export default function WarrantyPage() {
  const [data, setData] = useState<any>({
    metrics: {
      totalRegistered: 0,
      activeUnderWarranty: 0,
      expiredWarranty: 0,
      totalClaimsLogged: 0,
    },
    items: [],
    recentClaims: [],
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Instant Verification Box
  const [verifyInput, setVerifyInput] = useState("")
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [verifying, setVerifying] = useState(false)

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Registration Form
  const [serialNumber, setSerialNumber] = useState("")
  const [productName, setProductName] = useState("")
  const [sku, setSku] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [supplierName, setSupplierName] = useState("Star Tech / UCC / Smart")
  const [warrantyDurationDays, setWarrantyDurationDays] = useState("365")
  const [invoiceNumber, setInvoiceNumber] = useState("")

  // Claim Form
  const [claimSerial, setClaimSerial] = useState("")
  const [claimIssue, setClaimIssue] = useState("")
  const [claimStatus, setClaimStatus] = useState("RECEIVED_FOR_WARRANTY")

  useEffect(() => {
    loadWarranties()
  }, [])

  const loadWarranties = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/warranty/lookup")
      setData(res.data)
    } catch (err: any) {
      console.error("Failed to load warranties", err)
      toast.error("ওয়ারেন্টি ডাটা লোড করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyInstant = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!verifyInput.trim()) return
    setVerifying(true)
    try {
      const res = await api.get(`/admin/warranty/verify/${encodeURIComponent(verifyInput.trim())}`)
      setVerifyResult(res.data)
      if (!res.data.found) {
        toast.error("কোনো ওয়ারেন্টি রেকর্ড পাওয়া যায়নি")
      } else if (res.data.isUnderWarranty) {
        toast.success(`অ্যাক্টিভ ওয়ারেন্টি! অবশিষ্ট দিন: ${res.data.daysRemaining}`)
      } else {
        toast.warning("ওয়ারেন্টির মেয়াদ শেষ হয়ে গেছে!")
      }
    } catch (err: any) {
      toast.error("যাচাই করতে সমস্যা হয়েছে")
    } finally {
      setVerifying(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serialNumber || !productName || !customerPhone) return
    setSubmitting(true)
    try {
      await api.post("/admin/warranty/register", {
        serialNumber,
        productName,
        sku,
        customerName,
        customerPhone,
        supplierName,
        warrantyDurationDays: Number(warrantyDurationDays),
        invoiceNumber,
      })
      toast.success("সিরিয়াল নম্বর ও ওয়ারেন্টি সফলভাবে নিবন্ধিত হয়েছে")
      setShowRegisterModal(false)
      setSerialNumber("")
      setProductName("")
      setCustomerName("")
      setCustomerPhone("")
      loadWarranties()
    } catch (err: any) {
      toast.error("ওয়ারেন্টি নিবন্ধন ব্যর্থ হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimSerial || !claimIssue) return
    setSubmitting(true)
    try {
      const res = await api.post("/admin/warranty/claim", {
        serialNumber: claimSerial,
        issueDescription: claimIssue,
        status: claimStatus as any,
      })
      toast.success(`ওয়ারেন্টি ক্লেইম টিকেট #${res.data.claimTicket} তৈরি হয়েছে`)
      setShowClaimModal(false)
      setClaimSerial("")
      setClaimIssue("")
      loadWarranties()
    } catch (err: any) {
      toast.error("ক্লেইম টিকেট তৈরি করতে সমস্যা হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredItems = (data.items || []).filter((item: any) => {
    const q = searchQuery.toLowerCase()
    return (
      item.serialNumber.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.customerPhone.includes(q) ||
      item.customerName.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              সিরিয়াল (S/N & IMEI) ও ওয়ারেন্টি ট্র্যাকার (Warranty Hub)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            হার্ডওয়্যার, গ্যাজেট ও ইলেকট্রনিক্সের ১-সেকেন্ডে মেয়াদ যাচাই ও সাপ্লায়ার রিপ্লেসমেন্ট ক্লেইম
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowClaimModal(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" /> ওয়ারেন্টি ক্লেইম
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> নতুন সিরিয়াল এন্ট্রি
          </button>
        </div>
      </div>

      {/* INSTANT VERIFICATION SEARCH BOX */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="max-w-2xl">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30 uppercase tracking-wider">
            ⚡ ১-সেকেন্ডে মেয়াদ যাচাই (Instant 1-Sec Lookup)
          </span>
          <h2 className="text-xl font-black mt-2">বারকোড স্ক্যান করুন অথবা সিরিয়াল / IMEI নম্বর লিখুন</h2>
          <p className="text-xs text-slate-300 mt-1">
            বারকোড স্ক্যানার দিয়ে সরাসরি স্ক্যান করুন বা কাস্টমারের মোবাইল নম্বর / ইনভয়েস নম্বর দিয়ে সার্চ করুন
          </p>

          <form onSubmit={handleVerifyInstant} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="e.g. SN-GIGABYTE-B550M-8899 বা 01712345678..."
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="h-12 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-colors shadow-lg shadow-emerald-500/30 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Search className="w-4 h-4" /> {verifying ? "যাচাই হচ্ছে..." : "যাচাই করুন"}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {verifyResult && (
          <div className="mt-6 pt-5 border-t border-white/10 animate-in fade-in duration-200">
            {verifyResult.found ? (
              <div
                className={`p-5 rounded-2xl border ${
                  verifyResult.isUnderWarranty
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-100"
                    : "bg-rose-950/60 border-rose-500/50 text-rose-100"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {verifyResult.isUnderWarranty ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-10 h-10 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                        {verifyResult.isUnderWarranty ? "✅ অ্যাক্টিভ ওয়ারেন্টি বিদ্যমান" : "❌ ওয়ারেন্টির মেয়াদ উত্তীর্ণ"}
                      </span>
                      <h3 className="text-xl font-black text-white mt-0.5">{verifyResult.productName}</h3>
                      <p className="text-xs opacity-90 font-mono mt-0.5">S/N: {verifyResult.serialNumber}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase font-semibold opacity-75">মেয়াদ বাকি আছে</p>
                    <p className="text-3xl font-black tabular-nums">
                      {verifyResult.isUnderWarranty ? `${verifyResult.daysRemaining} দিন` : "০ দিন"}
                    </p>
                    <p className="text-[11px] opacity-75 mt-0.5">
                      মেয়াদ শেষ: {new Date(verifyResult.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
                  <div>গ্রাহক: <b>{verifyResult.customerName}</b></div>
                  <div>মোবাইল: <b>{verifyResult.customerPhone}</b></div>
                  <div>সাপ্লায়ার: <b>{verifyResult.supplierName}</b></div>
                  <div>বিক্রয় চালান: <b>{verifyResult.invoiceNumber}</b></div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/40 text-rose-200 text-sm">
                ❌ &quot;{verifyResult.query}&quot; সিরিয়াল বা নম্বরের কোনো ওয়ারেন্টি ডাটাবেসে পাওয়া যায়নি।
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">নিবন্ধিত হার্ডওয়্যার</p>
            <h3 className="text-2xl font-black text-slate-900 tabular-nums">
              {data.metrics?.totalRegistered || 0}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">সিরিয়াল ও আইএমইআই</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">মেয়াদযুক্ত (Active)</p>
            <h3 className="text-2xl font-black text-emerald-600 tabular-nums">
              {data.metrics?.activeUnderWarranty || 0}
            </h3>
            <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">ওয়ারেন্টি বৈধ আছে</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">মেয়াদোত্তীর্ণ (Expired)</p>
            <h3 className="text-2xl font-black text-rose-600 tabular-nums">
              {data.metrics?.expiredWarranty || 0}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">ওয়ারেন্টি শেষ</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">রিপ্লেসমেন্ট ক্লেইম</p>
            <h3 className="text-2xl font-black text-amber-600 tabular-nums">
              {data.metrics?.totalClaimsLogged || 0}
            </h3>
            <p className="text-xs text-amber-700/80 mt-0.5 font-medium">সাপ্লায়ার আরএমএ রেকর্ড</p>
          </div>
        </div>
      </div>

      {/* Warranties Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-900 text-base">নিবন্ধিত পণ্যের তালিকা (Registered Hardware S/N)</h3>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সিরিয়াল, পণ্য বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">সিরিয়াল নম্বর (S/N)</th>
                <th className="px-5 py-3.5">পণ্য</th>
                <th className="px-5 py-3.5">গ্রাহক</th>
                <th className="px-5 py-3.5">সাপ্লায়ার</th>
                <th className="px-5 py-3.5 text-center">মেয়াদ বাকি</th>
                <th className="px-5 py-3.5 text-center">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    ওয়ারেন্টি রেকর্ড লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    কোনো ওয়ারেন্টি রেকর্ড নেই
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {item.serialNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{item.productName}</td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-900 font-medium">{item.customerName}</div>
                      <div className="text-[11px] text-slate-400">{item.customerPhone}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{item.supplierName}</td>
                    <td className="px-5 py-4 text-center font-bold tabular-nums">
                      {item.isUnderWarranty ? (
                        <span className="text-emerald-600">{item.daysRemaining} দিন</span>
                      ) : (
                        <span className="text-slate-400">মেয়াদ শেষ</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {item.isUnderWarranty ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active ({item.warrantyDurationDays}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          Expired
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: REGISTER S/N */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">নতুন সিরিয়াল নম্বর ও ওয়ারেন্টি নিবন্ধন</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">সিরিয়াল নম্বর / IMEI *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SN-ROG-3060TI-9912 বা স্ক্যান করুন"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">পণ্যের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asus ROG RTX 3060Ti OC 8GB GPU"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">গ্রাহকের নাম</label>
                  <input
                    type="text"
                    placeholder="e.g. আসিফ রহমান"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="017xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">ওয়ারেন্টির মেয়াদ (দিন)</label>
                  <select
                    value={warrantyDurationDays}
                    onChange={(e) => setWarrantyDurationDays(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="30">১ মাস (30 Days)</option>
                    <option value="90">৩ মাস (90 Days)</option>
                    <option value="180">৬ মাস (180 Days)</option>
                    <option value="365">১ বছর (365 Days)</option>
                    <option value="730">২ বছর (730 Days)</option>
                    <option value="1095">৩ বছর (1095 Days - Motherboard/RAM)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">ডিস্ট্রিবিউটর / সাপ্লায়ার</label>
                  <input
                    type="text"
                    placeholder="e.g. UCC / Smart / UCC BD"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "নিবন্ধন নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG CLAIM */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">ওয়ারেন্টি ক্লেইম টিকেট এন্ট্রি</h3>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogClaim} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">সিরিয়াল নম্বর *</label>
                <input
                  type="text"
                  required
                  placeholder="সিরিয়াল নম্বর লিখুন বা স্ক্যান করুন"
                  value={claimSerial}
                  onChange={(e) => setClaimSerial(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">সমস্যার বিবরণ *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: নো ডিসপ্লে, রি-স্টার্ট সমস্যা, পোর্ট কাজ করছে না..."
                  value={claimIssue}
                  onChange={(e) => setClaimIssue(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">প্রাথমিক স্ট্যাটাস</label>
                <select
                  value={claimStatus}
                  onChange={(e) => setClaimStatus(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="RECEIVED_FOR_WARRANTY">📥 শপে রিসিভ করা হয়েছে (Received)</option>
                  <option value="SENT_TO_SUPPLIER">🚚 সাপ্লায়ার বা সার্ভিস সেন্টারে পাঠানো হয়েছে</option>
                  <option value="REPLACED_OR_REPAIRED">✅ রিপ্লেসড বা মেরামত সম্পন্ন</option>
                  <option value="RETURNED_TO_CUSTOMER">🎉 কাস্টমারকে ফেরত প্রদান করা হয়েছে</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "ক্লেইম টিকেট সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

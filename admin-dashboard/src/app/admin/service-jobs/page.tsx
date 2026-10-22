"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import {
  Wrench,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Phone,
  User,
  Calendar,
  X,
  Send,
  FileText,
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"

export default function ServiceJobsPage() {
  const [data, setData] = useState<any>({
    metrics: {
      totalJobs: 0,
      activeJobs: 0,
      readyForDelivery: 0,
      totalDuePendingBdt: 0,
    },
    jobs: [],
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPrintSlipModal, setShowPrintSlipModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Create form
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [serviceCategory, setServiceCategory] = useState("PC_LAPTOP_REPAIR")
  const [jobDescription, setJobDescription] = useState("")
  const [deviceOrFileDetails, setDeviceOrFileDetails] = useState("")
  const [estimatedCostBdt, setEstimatedCostBdt] = useState("")
  const [advancePaidBdt, setAdvancePaidBdt] = useState("")
  const [assignedStaffName, setAssignedStaffName] = useState("Ripon (Senior Technician)")
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState("")

  useEffect(() => {
    loadJobs()
  }, [statusFilter])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/service-jobs", {
        params: { status: statusFilter !== "ALL" ? statusFilter : undefined },
      })
      setData(res.data)
    } catch (err: any) {
      console.error("Failed to load service jobs", err)
      toast.error("সার্ভিস জব ডাটা লোড করা সম্ভব হয়নি")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !customerPhone || !estimatedCostBdt) return
    setSubmitting(true)
    try {
      const res = await api.post("/admin/service-jobs", {
        customerName,
        customerPhone,
        serviceCategory,
        jobDescription,
        deviceOrFileDetails,
        estimatedCostBdt: Number(estimatedCostBdt),
        advancePaidBdt: Number(advancePaidBdt || 0),
        assignedStaffName,
        promisedDeliveryDate,
      })
      toast.success(`জব টিকিট #${res.data.jobNumber} সফলভাবে তৈরি হয়েছে`)
      setShowCreateModal(false)
      // Reset form
      setCustomerName("")
      setCustomerPhone("")
      setJobDescription("")
      setDeviceOrFileDetails("")
      setEstimatedCostBdt("")
      setAdvancePaidBdt("")
      loadJobs()
    } catch (err: any) {
      toast.error("জব টিকিট তৈরি করতে সমস্যা হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (job: any, newStatus: string) => {
    try {
      const res = await api.patch(`/admin/service-jobs/${job.jobNumber}/status`, {
        status: newStatus,
      })
      toast.success(`জব #${job.jobNumber} স্ট্যাটাস ${newStatus} এ আপডেট হয়েছে`)
      if (res.data.whatsappUrl) {
        window.open(res.data.whatsappUrl, "_blank")
      }
      loadJobs()
    } catch (err: any) {
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে")
    }
  }

  const filteredJobs = (data.jobs || []).filter((j: any) => {
    const q = searchQuery.toLowerCase()
    return (
      (j.jobNumber && j.jobNumber.toLowerCase().includes(q)) ||
      (j.customerName && j.customerName.toLowerCase().includes(q)) ||
      (j.customerPhone && j.customerPhone.includes(q)) ||
      (j.jobDescription && j.jobDescription.toLowerCase().includes(q))
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">📥 গ্রহীত (Received)</span>
      case "IN_PROGRESS":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">⚙️ কাজ চলছে (In Progress)</span>
      case "WAITING_FOR_PARTS":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">⏳ পার্টসের অপেক্ষা</span>
      case "READY_FOR_DELIVERY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">🎉 ডেলিভারির জন্য প্রস্তুত</span>
      case "DELIVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">✅ ডেলিভার্ড</span>
      default:
        return <span>{status}</span>
    }
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "PRINTING_PRESS":
        return "🖨️ প্রিন্টিং ও ব্যানার"
      case "PC_LAPTOP_REPAIR":
        return "💻 কম্পিউটার ও ল্যাপটপ রিপেয়ার"
      case "PHOTO_VIDEO_EDIT":
        return "🎬 ফটো ও ভিডিও এডিটিং"
      case "CUSTOM_DESIGN":
        return "🎨 গ্রাফিক্স ডিজাইন"
      default:
        return "🛠️ সাধারণ সার্ভিস"
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Wrench className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              সার্ভিস ও প্রিন্টিং প্রেস জব ট্র্যাকার (Service & Job Studio)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            হার্ডওয়্যার সার্ভিসিং, ল্যাপটপ রিপেয়ার, ফটো/ভিডিও এবং প্রিন্টিং প্রেস জব স্লিপ ও ডেলিভারি ট্র্যাকিং
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> নতুন জব টিকিট তৈরি করুন
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">মোট জব রিসিভড</p>
            <h3 className="text-2xl font-black text-slate-900 tabular-nums">{data.metrics?.totalJobs || 0}</h3>
            <p className="text-xs text-slate-400 mt-0.5">সর্বমোট সার্ভিস অর্ডার</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">চলমান কাজ (In Progress)</p>
            <h3 className="text-2xl font-black text-blue-600 tabular-nums">{data.metrics?.activeJobs || 0}</h3>
            <p className="text-xs text-blue-600/80 mt-0.5 font-medium">ডেস্ক ও ল্যাবে প্রসেসিং হচ্ছে</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">রেডি ফর ডেলিভারি</p>
            <h3 className="text-2xl font-black text-emerald-600 tabular-nums">{data.metrics?.readyForDelivery || 0}</h3>
            <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">কাস্টমারকে কল/মেসেজ দিন</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">ডেলিভারির সময় পাওনা</p>
            <h3 className="text-2xl font-black text-rose-600 tabular-nums">
              ৳{Number(data.metrics?.totalDuePendingBdt || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">বকেয়া বিল আদায়যোগ্য</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "ALL", label: "সকল জব" },
            { id: "RECEIVED", label: "📥 গ্রহীত" },
            { id: "IN_PROGRESS", label: "⚙️ কাজ চলছে" },
            { id: "WAITING_FOR_PARTS", label: "⏳ পার্টস অপেক্ষা" },
            { id: "READY_FOR_DELIVERY", label: "🎉 রেডি" },
            { id: "DELIVERED", label: "✅ ডেলিভার্ড" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="জব নম্বর, গ্রাহক বা কাজের বিবরণ..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Jobs Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">সার্ভিস জব লোড হচ্ছে...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            কোনো সার্ভিস টিকিট পাওয়া যায়নি
          </div>
        ) : (
          filteredJobs.map((job: any) => (
            <div
              key={job.jobNumber}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {job.jobNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {getCategoryLabel(job.serviceCategory)}
                    </span>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {job.jobDescription}
                  </h4>
                  {job.deviceOrFileDetails && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      ডিভাইস / ফাইল: <b>{job.deviceOrFileDetails}</b>
                    </p>
                  )}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {job.customerName}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {job.customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">মোট খরচ: <b>৳{job.estimatedCostBdt}</b></span>
                    <span className="text-emerald-700">অগ্রিম: <b>৳{job.advancePaidBdt}</b></span>
                    <span className="font-bold text-rose-600">বাকি: <b>৳{job.dueAmountBdt}</b></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedJob(job)
                    setShowPrintSlipModal(true)
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> টোকেন স্লিপ
                </button>

                <div className="flex items-center gap-1">
                  {job.status === "RECEIVED" && (
                    <button
                      onClick={() => handleUpdateStatus(job, "IN_PROGRESS")}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      কাজ শুরু করুন
                    </button>
                  )}
                  {job.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleUpdateStatus(job, "READY_FOR_DELIVERY")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      রেডি ঘোষণা করুন
                    </button>
                  )}
                  {job.status === "READY_FOR_DELIVERY" && (
                    <button
                      onClick={() => handleUpdateStatus(job, "DELIVERED")}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      ডেলিভার করুন ও বিল নিন
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE JOB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">নতুন সার্ভিস ও প্রিন্ট জব টিকিট</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">গ্রাহকের নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. তানভীর আহমেদ"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">ক্যাটাগরি</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="PC_LAPTOP_REPAIR">💻 কম্পিউটার ও ল্যাপটপ রিপেয়ার</option>
                  <option value="PRINTING_PRESS">🖨️ প্রিন্টিং প্রেস ও ব্যানার প্রিন্ট</option>
                  <option value="PHOTO_VIDEO_EDIT">🎬 ছবি / পাসপোর্ট ফটো / ভিডিও এডিটিং</option>
                  <option value="CUSTOM_DESIGN">🎨 ভিজিটিং কার্ড ও গ্রাফিক্স ডিজাইন</option>
                  <option value="OTHER_SERVICE">🛠️ অন্যান্য প্রযুক্তি সেবা</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">কাজের বিস্তারিত বিবরণ *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: উইন্ডোজ ইনস্টল, থার্মাল পেস্ট ও ডিসপ্লে সমস্যা সমাধান..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">ডিভাইস মডেল / সিরিয়াল বা ফাইলের নাম</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Inspiron 15 (S/N: 7G8X92), PenDrive-01"
                  value={deviceOrFileDetails}
                  onChange={(e) => setDeviceOrFileDetails(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">মোট আনুমানিক বিল (৳) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={estimatedCostBdt}
                    onChange={(e) => setEstimatedCostBdt(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">অগ্রিম জমা (Advance ৳)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={advancePaidBdt}
                    onChange={(e) => setAdvancePaidBdt(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-base font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {Number(estimatedCostBdt) > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between text-xs">
                  <span className="text-slate-500">ডেলিভারির সময় অবশিষ্ট বাকি:</span>
                  <span className="font-bold text-rose-600">
                    ৳{Math.max(0, Number(estimatedCostBdt) - Number(advancePaidBdt || 0)).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? "তৈরি হচ্ছে..." : "টিকিট সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT CLAIM SLIP MODAL (Customer Copy + Shop Desk Copy) */}
      {showPrintSlipModal && selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">সার্ভিস টোকেন ও ক্লেইম স্লিপ প্রিন্ট</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট করুন
                </button>
                <button onClick={() => setShowPrintSlipModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Dual Voucher */}
            <div className="mt-4 space-y-6 font-mono text-xs">
              {/* Part 1: Customer Copy */}
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl space-y-2 bg-white">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div>
                    <h2 className="font-bold text-sm uppercase text-slate-900">BUSINESSOS SERVICE STUDIO</h2>
                    <p className="text-[10px] text-slate-500">Dhaka, Bangladesh | Phone: 01700000000</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-700 text-xs">CUSTOMER COPY</span>
                    <p className="font-bold text-sm text-slate-900 mt-0.5">#{selectedJob.jobNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>গ্রাহক: <b>{selectedJob.customerName}</b></div>
                  <div className="text-right">মোবাইল: <b>{selectedJob.customerPhone}</b></div>
                </div>

                <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                  কাজ: <b>{selectedJob.jobDescription}</b>
                  {selectedJob.deviceOrFileDetails && (
                    <div className="text-slate-500 mt-0.5">ডিভাইস: {selectedJob.deviceOrFileDetails}</div>
                  )}
                </div>

                <div className="flex justify-between text-[11px] font-bold pt-1">
                  <span>মোট বিল: ৳{selectedJob.estimatedCostBdt}</span>
                  <span className="text-emerald-700">অগ্রিম: ৳{selectedJob.advancePaidBdt}</span>
                  <span className="text-rose-600">বাকি: ৳{selectedJob.dueAmountBdt}</span>
                </div>

                <p className="text-[9px] text-slate-400 text-center pt-2">
                  * ডেলিভারির সময় এই টোকেন স্লিপ প্রদর্শন করুন। ৭ দিনের মধ্যে পণ্য সংগ্রহ না করলে কর্তৃপক্ষ দায়ী নয়।
                </p>
              </div>

              {/* Part 2: Shop Desk Copy */}
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl space-y-2 bg-slate-50/60">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">SHOP DESK & LAB COPY</span>
                    <p className="text-[10px] text-slate-500">টেকনিশিয়ান কপি</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-slate-900">#{selectedJob.jobNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>গ্রাহক: <b>{selectedJob.customerName}</b> ({selectedJob.customerPhone})</div>
                  <div className="text-right">এসাইনড: <b>{selectedJob.assignedStaffName}</b></div>
                </div>

                <div className="text-[11px]">কাজ: <b>{selectedJob.jobDescription}</b></div>
                <div className="flex justify-between text-[11px] font-bold pt-1 border-t border-slate-200">
                  <span>বিল: ৳{selectedJob.estimatedCostBdt}</span>
                  <span className="text-rose-600">বাকি: ৳{selectedJob.dueAmountBdt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

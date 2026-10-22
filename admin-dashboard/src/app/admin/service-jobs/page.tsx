"use client"

import React, { useEffect, useState, useMemo } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
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
  Sparkles,
  Copy,
  ExternalLink,
  UploadCloud,
  Check,
  ChevronRight,
  ShieldCheck,
  SendHorizontal,
  Camera,
  Layers,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"

export default function ServiceJobsPage() {
  const [activeMainTab, setActiveMainTab] = useState<'PHYSICAL' | 'INTERNET_APPLICATIONS'>('INTERNET_APPLICATIONS')

  // --- PHYSICAL JOBS STATE ---
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

  // Modals for physical jobs
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPrintSlipModal, setShowPrintSlipModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Physical Create form
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [serviceCategory, setServiceCategory] = useState("PC_LAPTOP_REPAIR")
  const [jobDescription, setJobDescription] = useState("")
  const [deviceOrFileDetails, setDeviceOrFileDetails] = useState("")
  const [estimatedCostBdt, setEstimatedCostBdt] = useState("")
  const [advancePaidBdt, setAdvancePaidBdt] = useState("")
  const [assignedStaffName, setAssignedStaffName] = useState("Ripon (Senior Technician)")
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState("")

  // --- INTERNET SERVICE APPLICATIONS STATE ---
  const [applications, setApplications] = useState<any[]>([])
  const [appStatusFilter, setAppStatusFilter] = useState("ALL")
  const [appSearchQuery, setAppSearchQuery] = useState("")
  const [loadingApps, setLoadingApps] = useState(true)

  // Ordered Field Copy Assistant Worksheet Modal
  const [worksheetApp, setWorksheetApp] = useState<any | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [nextCopyIndex, setNextCopyIndex] = useState(0)
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null)
  const [editingFieldValue, setEditingFieldValue] = useState("")

  // Deliverable Upload Form in Worksheet
  const [deliverableTitle, setDeliverableTitle] = useState("")
  const [deliverableUrl, setDeliverableUrl] = useState("")
  const [deliverableType, setDeliverableType] = useState<string>("CONFIRMATION_SLIP")
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false)

  // Load Physical Jobs
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

  // Load Internet Applications
  const loadApplications = async () => {
    setLoadingApps(true)
    try {
      const res = await api.get("/admin/service-applications", {
        params: {
          status: appStatusFilter !== "ALL" ? appStatusFilter : undefined,
          search: appSearchQuery || undefined,
        },
      })
      setApplications(res.data || [])
    } catch (err: any) {
      console.error("Failed to load applications", err)
    } finally {
      setLoadingApps(false)
    }
  }

  useEffect(() => {
    if (activeMainTab === 'PHYSICAL') {
      loadJobs()
    } else {
      loadApplications()
    }
  }, [activeMainTab, statusFilter, appStatusFilter])

  // --- PHYSICAL JOBS HANDLERS ---
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

  // --- INTERNET APPLICATION HANDLERS ---
  const handleVerifyAppPayment = async (refNumber: string, amount: number) => {
    try {
      await api.patch(`/admin/service-applications/${refNumber}/payment`, {
        paymentStatus: 'VERIFIED',
        verifiedAmountBdt: amount,
        notes: 'Verified by staff operator',
      })
      toast.success(`পেমেন্ট ভেরিফিকেশন সম্পন্ন ও লেজারে অন্তর্ভুক্ত হয়েছে!`)
      loadApplications()
      if (worksheetApp?.referenceNumber === refNumber) {
        const updated = await api.get(`/admin/service-applications/${refNumber}`)
        setWorksheetApp(updated.data)
      }
    } catch (e: any) {
      toast.error("পেমেন্ট ভেরিফিকেশনে সমস্যা।")
    }
  }

  const handleUpdateAppStatus = async (refNumber: string, newStatus: string) => {
    try {
      await api.patch(`/admin/service-applications/${refNumber}/status`, { status: newStatus })
      toast.success(`আবেদন স্ট্যাটাস ${newStatus} এ পরিবর্তন হয়েছে`)
      loadApplications()
      if (worksheetApp?.referenceNumber === refNumber) {
        const updated = await api.get(`/admin/service-applications/${refNumber}`)
        setWorksheetApp(updated.data)
      }
    } catch (e: any) {
      toast.error("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।")
    }
  }

  // Copy Single Field
  const handleCopyFieldValue = (key: string, value: string) => {
    if (!value) {
      toast.info("এই ফিল্ডে কোনো মান নেই।")
      return
    }
    navigator.clipboard.writeText(value)
    setCopiedKey(key)
    toast.success(`কপি হয়েছে: "${value}"`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Stepper: Copy Next Field
  const handleCopyNextField = () => {
    if (!worksheetApp?.fieldValues || worksheetApp.fieldValues.length === 0) return
    const fields = worksheetApp.fieldValues
    const curIdx = nextCopyIndex % fields.length
    const f = fields[curIdx]

    if (f && f.value) {
      navigator.clipboard.writeText(f.value)
      setCopiedKey(f.key)
      toast.success(`[ফিল্ড ${f.order}/${fields.length}] কপি হয়েছে: "${f.value}" (${f.labelBn})`)
      setTimeout(() => setCopiedKey(null), 2000)
    } else {
      toast.info(`[ফিল্ড ${f?.order || curIdx + 1}] খালি ফিল্ড। পরবর্তী ফিল্ডে যাওয়া হচ্ছে।`)
    }
    setNextCopyIndex(curIdx + 1)
  }

  // Copy All Fields as Formatted Text
  const handleCopyAllFields = () => {
    if (!worksheetApp?.fieldValues) return
    const text = worksheetApp.fieldValues
      .map((f: any) => `${f.order}. ${f.labelBn} (${f.labelEn}): ${f.value || 'N/A'}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    toast.success("সকল ফিল্ডের ডাটা ক্লিপবোর্ডে কপি হয়েছে!")
  }

  // Save Inline Field Edit
  const handleSaveFieldEdit = async (refNumber: string, fieldKey: string) => {
    try {
      await api.patch(`/admin/service-applications/${refNumber}/field`, {
        fieldKey,
        newValue: editingFieldValue,
      })
      toast.success("ফিল্ড মান আপডেট হয়েছে!")
      setEditingFieldKey(null)
      const updated = await api.get(`/admin/service-applications/${refNumber}`)
      setWorksheetApp(updated.data)
      loadApplications()
    } catch (e: any) {
      toast.error("ফিল্ড সেভ করতে সমস্যা।")
    }
  }

  // Upload Completed Deliverable
  const handleUploadDeliverable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deliverableTitle || !deliverableUrl || !worksheetApp) return

    setUploadingDeliverable(true)
    try {
      await api.post(`/admin/service-applications/${worksheetApp.referenceNumber}/deliverables`, {
        title: deliverableTitle.trim(),
        fileUrl: deliverableUrl.trim(),
        type: deliverableType,
      })
      toast.success("অফিসিয়াল ফাইল সফলভাবে আপলোড হয়েছে! গ্রাহক এখনই ডাউনলোড করতে পারবেন।")
      setDeliverableTitle("")
      setDeliverableUrl("")
      const updated = await api.get(`/admin/service-applications/${worksheetApp.referenceNumber}`)
      setWorksheetApp(updated.data)
      loadApplications()
    } catch (e: any) {
      toast.error("ফাইল আপলোডে সমস্যা হয়েছে।")
    } finally {
      setUploadingDeliverable(false)
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Layers className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              সার্ভিস স্টুডিও ও অনলাইন অ্যাপ্লিকেশন পাইপলাইন
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            সরকারি ও অনলাইন আবেদন প্রসেসিং, অর্ডারড ফিল্ড কপি অ্যাসিস্ট্যান্ট এবং ফিজিক্যাল কম্পিউটার/প্রিন্ট জব ট্র্যাকিং।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeMainTab === 'PHYSICAL' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> নতুন ফিজিক্যাল জব টিকিট
            </button>
          )}
          <Link
            href="/admin/service-knowledge"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            নলেজবেস ও রিকোয়ারমেন্ট
          </Link>
          <Link
            href="/admin/service-scheduling"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            দোকান অ্যাপয়েন্টমেন্ট
          </Link>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveMainTab('INTERNET_APPLICATIONS')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'INTERNET_APPLICATIONS'
              ? 'bg-white text-cyan-800 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-600" />
          অনলাইন সেবা আবেদন ({applications.length})
        </button>
        <button
          onClick={() => setActiveMainTab('PHYSICAL')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'PHYSICAL'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4 text-indigo-600" />
          হার্ডওয়্যার ও প্রিন্ট টিকিট ({data.jobs?.length || 0})
        </button>
      </div>

      {/* TAB 1: INTERNET SERVICE APPLICATIONS & ORDERED FIELD WORKSPACE */}
      {activeMainTab === 'INTERNET_APPLICATIONS' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Applications Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              {[
                { id: "ALL", label: "সকল আবেদন" },
                { id: "SUBMITTED_FOR_REVIEW", label: "📥 নতুন দাখিলকৃত" },
                { id: "READY_FOR_PROCESSING", label: "⚙️ প্রসেসিং রেডি" },
                { id: "IN_PROGRESS", label: "📝 ফরম পূরণ চলছে" },
                { id: "READY_FOR_APPROVAL", label: "⏳ গ্রাহক অনুমোদন" },
                { id: "COMPLETED", label: "✅ সম্পন্ন" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAppStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    appStatusFilter === tab.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                placeholder="রেফারেন্স, নাম বা মোবাইল..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Applications List Grid */}
          {loadingApps ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 bg-slate-100 rounded-3xl" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-base">কোনো অনলাইন আবেদন পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                গ্রাহকরা /service-request থেকে ফরম পূরণ করলে এখানে সরাসরি পাইপলাইনে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {applications.map((app) => (
                <div
                  key={app.referenceNumber}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-lg transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-100">
                        #{app.referenceNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'READY_FOR_APPROVAL' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {/* Service & Customer */}
                    <div>
                      <h4 className="text-base font-bold text-slate-900 line-clamp-1">{app.serviceTitleBn}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        গ্রাহক: {app.customerName} ({app.customerPhone})
                      </p>
                    </div>

                    {/* Financial & Payment Badge */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">মোট বিল:</span>
                        <span className="font-bold text-slate-800">৳{app.financials?.totalAmountBdt}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">পেমেন্ট স্ট্যাটাস:</span>
                        <span className={`font-bold ${app.paymentEvidence?.paymentStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {app.paymentEvidence?.paymentStatus || 'AWAITING_PAYMENT'}
                        </span>
                      </div>
                      {app.paymentEvidence?.transactionId && (
                        <div className="text-[11px] text-cyan-700 font-mono flex items-center justify-between pt-1 border-t border-slate-200">
                          <span>Trx: {app.paymentEvidence.transactionId}</span>
                          {app.paymentEvidence.paymentStatus !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerifyAppPayment(app.referenceNumber, app.financials?.totalAmountBdt)}
                              className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold hover:bg-emerald-700"
                            >
                              ভেরিফাই করুন
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>ডেলিভারি: {app.deliveryMode}</span>
                      <span>{app.uploadedDocuments?.length || 0} টি ফাইল</span>
                    </div>
                  </div>

                  {/* Worksheet Button */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setWorksheetApp(app)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md inline-flex items-center justify-center gap-2 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      ওয়ার্কশিট ও ফিল্ড কপি অ্যাসিস্ট্যান্ট
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: PHYSICAL SERVICE & REPAIR JOBS (Existing) */}
      {activeMainTab === 'PHYSICAL' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">মোট জব রিসিভড</p>
                <h3 className="text-2xl font-black text-slate-900 tabular-nums">{data.metrics?.totalJobs || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">চলমান কাজ</p>
                <h3 className="text-2xl font-black text-blue-600 tabular-nums">{data.metrics?.activeJobs || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">রেডি ফর ডেলিভারি</p>
                <h3 className="text-2xl font-black text-emerald-600 tabular-nums">{data.metrics?.readyForDelivery || 0}</h3>
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

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-16 text-center text-slate-400">সার্ভিস জব লোড হচ্ছে...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                কোনো সার্ভিস জব টিকিট পাওয়া যায়নি
              </div>
            ) : (
              filteredJobs.map((job: any) => (
                <div
                  key={job.jobNumber}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="font-mono text-xs font-black text-indigo-600">#{job.jobNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {job.status}
                      </span>
                    </div>

                    <div className="pt-3 space-y-1">
                      <h4 className="font-bold text-slate-900 text-base">{job.customerName}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {job.customerPhone}
                      </p>
                      <p className="text-xs text-slate-700 mt-2 line-clamp-2">
                        <strong>বিবরণ:</strong> {job.jobDescription}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-slate-400 block">বিল: ৳{job.estimatedCostBdt}</span>
                      <span className="font-bold text-rose-600">বাকি: ৳{job.dueAmountBdt}</span>
                    </div>
                    <button
                      onClick={() => { setSelectedJob(job); setShowPrintSlipModal(true); }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> স্লিপ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- ORDERED APPLICATION PREPARATION & COPY ASSISTANT MODAL (PROMPT SECTION 10) --- */}
      {worksheetApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-cyan-800 bg-cyan-100 px-3 py-1 rounded-xl">
                    #{worksheetApp.referenceNumber}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {worksheetApp.status}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {worksheetApp.serviceTitleBn}
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  আবেদনকারী: {worksheetApp.customerName} • {worksheetApp.customerPhone}
                </p>
              </div>

              <button
                onClick={() => setWorksheetApp(null)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Quick Action Bar for Staff Fast Data Entry into Official Government Portal */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-xs font-bold text-cyan-300 block">স্মার্ট ডাটা কপি অ্যাসিস্ট্যান্ট</span>
                  <span className="text-[11px] text-slate-400">সরকারি পোর্টালে ফরম পূরণ করতে ১-ক্লিকে কপি করুন</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyNextField}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  কপি পরবর্তী ফিল্ড (Next Field #{nextCopyIndex + 1})
                </button>
                <button
                  type="button"
                  onClick={handleCopyAllFields}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all inline-flex items-center gap-1.5"
                >
                  সব ডাটা কপি
                </button>
              </div>
            </div>

            {/* Ordered Fields Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                অর্ডার অনুযায়ী সাজানো আবেদন ফিল্ডসমূহ (Ordered Application Fields):
              </h3>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2">
                {worksheetApp.fieldValues?.map((field: any, idx: number) => {
                  const isCopied = copiedKey === field.key
                  const isEditing = editingFieldKey === field.key
                  return (
                    <div
                      key={field.key}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCopied
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-cyan-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {field.order || idx + 1}
                        </span>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-800 block">
                            {field.labelBn} <span className="text-[10px] text-slate-400">({field.labelEn})</span>
                          </span>

                          {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={editingFieldValue}
                                onChange={(e) => setEditingFieldValue(e.target.value)}
                                className="px-3 py-1 text-xs rounded-lg border border-slate-300 bg-white flex-1"
                              />
                              <button
                                onClick={() => handleSaveFieldEdit(worksheetApp.referenceNumber, field.key)}
                                className="px-2.5 py-1 bg-cyan-600 text-white text-xs font-bold rounded-lg"
                              >
                                সেভ
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-cyan-950 mt-0.5 font-mono select-all">
                              {field.value || <span className="text-slate-400 italic font-sans font-normal">মান দেওয়া হয়নি</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleCopyFieldValue(field.key, field.value)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 ${
                            isCopied
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {isCopied ? "কপি হয়েছে!" : "কপি (Copy)"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingFieldKey(field.key); setEditingFieldValue(field.value || ""); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                          title="এডিট করুন"
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Uploaded Customer Supporting Documents */}
            {worksheetApp.uploadedDocuments && worksheetApp.uploadedDocuments.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  গ্রাহকের আপলোডকৃত ডকুমেন্ট ও ছবি ({worksheetApp.uploadedDocuments.length} টি):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {worksheetApp.uploadedDocuments.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between font-semibold text-slate-700"
                    >
                      <span className="truncate">📎 {doc.title} ({doc.docType})</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Final Deliverable (Confirmation Slip, Admit Card) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                অফিসিয়াল ফাইল / এডমিট কার্ড আপলোড (Customer Deliverable)
              </h4>
              <form onSubmit={handleUploadDeliverable} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="ফাইলের নাম (যেমন: Admit Card PDF)"
                  value={deliverableTitle}
                  onChange={(e) => setDeliverableTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
                <input
                  type="url"
                  required
                  placeholder="ফাইল ইউআরএল / লিঙ্ক (https://...)"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={uploadingDeliverable}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm"
                >
                  {uploadingDeliverable ? "আপলোড হচ্ছে..." : "✓ ফাইল যুক্ত করুন"}
                </button>
              </form>
            </div>

            {/* Status Changer Footer */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-600">স্ট্যাটাস পরিবর্তন:</span>
                <select
                  value={worksheetApp.status}
                  onChange={(e) => handleUpdateAppStatus(worksheetApp.referenceNumber, e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                >
                  <option value="SUBMITTED_FOR_REVIEW">SUBMITTED_FOR_REVIEW</option>
                  <option value="DOCUMENTS_VERIFIED">DOCUMENTS_VERIFIED</option>
                  <option value="READY_FOR_PROCESSING">READY_FOR_PROCESSING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (ফরম পূরণ চলছে)</option>
                  <option value="READY_FOR_APPROVAL">READY_FOR_APPROVAL (ড্রাফট অনুমোদন)</option>
                  <option value="COMPLETED">COMPLETED (সম্পন্ন)</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP (কাউন্টার রেডি)</option>
                  <option value="DELIVERED">DELIVERED (ডেলিভার্ড)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setWorksheetApp(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- PHYSICAL JOB MODALS --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">নতুন সার্ভিস জব টিকিট এন্ট্রি</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs mt-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">গ্রাহকের নাম *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">সার্ভিস ক্যাটাগরি</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="PC_LAPTOP_REPAIR">কম্পিউটার ও ল্যাপটপ রিপেয়ার</option>
                  <option value="PRINTING_PRESS">প্রিন্টিং ও ব্যানার প্রেস</option>
                  <option value="PHOTO_VIDEO_EDIT">ফটো ও ভিডিও এডিটিং</option>
                  <option value="CUSTOM_DESIGN">গ্রাফিক্স ডিজাইন</option>
                  <option value="OTHER_SERVICE">অন্যান্য সার্ভিস</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">কাজের বিবরণ *</label>
                <textarea
                  rows={2}
                  required
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোট আনুমানিক বিল (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={estimatedCostBdt}
                    onChange={(e) => setEstimatedCostBdt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">অগ্রিম জমা (BDT)</label>
                  <input
                    type="number"
                    value={advancePaidBdt}
                    onChange={(e) => setAdvancePaidBdt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "টিকিট তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Slip Modal */}
      {showPrintSlipModal && selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
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

            <div className="mt-4 space-y-4 font-mono text-xs">
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl space-y-2 bg-white">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div>
                    <h2 className="font-bold text-sm uppercase text-slate-900">BUSINESSOS SERVICE STUDIO</h2>
                    <p className="text-[10px] text-slate-500">Dhaka, Bangladesh</p>
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
                </div>

                <div className="flex justify-between text-[11px] font-bold pt-1">
                  <span>মোট বিল: ৳{selectedJob.estimatedCostBdt}</span>
                  <span className="text-emerald-700">অগ্রিম: ৳{selectedJob.advancePaidBdt}</span>
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

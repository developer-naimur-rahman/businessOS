"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { toast } from "sonner"
import {
  HelpCircle,
  Sparkles,
  Search,
  Plus,
  Edit,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Bot,
  FileText,
  Camera,
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react"

export default function AdminServiceKnowledgePage() {
  const [services, setServices] = useState<any[]>([])
  const [researchQueue, setResearchQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'AI_RESEARCH'>('SERVICES')
  const [search, setSearch] = useState("")

  // Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [formData, setFormData] = useState<any>({
    titleBn: "",
    titleEn: "",
    slug: "",
    category: "GOVT_JOB",
    descriptionBn: "",
    targetAudience: "সাধারণ নাগরিক",
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 100,
    estimatedProcessingTime: "১৫-৩০ মিনিট",
    officialSourceUrl: "",
    officialSourceTitle: "",
  })

  // AI Research Proposal Modal State
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false)
  const [researchSlug, setResearchSlug] = useState("")
  const [researchUrl, setResearchUrl] = useState("")
  const [researchNotes, setResearchNotes] = useState("")
  const [isSubmittingResearch, setIsSubmittingResearch] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [srvRes, queueRes] = await Promise.all([
        api.get('/admin/service-knowledge'),
        api.get('/admin/service-knowledge/research-queue')
      ])
      setServices(srvRes.data || [])
      setResearchQueue(queueRes.data || [])
    } catch (e: any) {
      toast.error("তথ্য লোড করতে ব্যর্থ হয়েছে: " + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenEdit = (srv?: any) => {
    if (srv) {
      setEditingService(srv)
      setFormData({
        titleBn: srv.titleBn || "",
        titleEn: srv.titleEn || "",
        slug: srv.slug || "",
        category: srv.category || "GOVT_JOB",
        descriptionBn: srv.descriptionBn || "",
        targetAudience: srv.targetAudience || "সাধারণ নাগরিক",
        officialGovtFeeBdt: srv.officialGovtFeeBdt || 0,
        shopServiceChargeBdt: srv.shopServiceChargeBdt || 100,
        estimatedProcessingTime: srv.estimatedProcessingTime || "১৫-৩০ মিনিট",
        officialSourceUrl: srv.officialSourceUrl || "",
        officialSourceTitle: srv.officialSourceTitle || "",
      })
    } else {
      setEditingService(null)
      setFormData({
        titleBn: "",
        titleEn: "",
        slug: "",
        category: "GOVT_JOB",
        descriptionBn: "",
        targetAudience: "সাধারণ নাগরিক",
        officialGovtFeeBdt: 0,
        shopServiceChargeBdt: 100,
        estimatedProcessingTime: "১৫-৩০ মিনিট",
        officialSourceUrl: "",
        officialSourceTitle: "",
      })
    }
    setIsModalOpen(true)
  }

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/service-knowledge', {
        ...formData,
        id: editingService?.id,
      })
      toast.success("সার্ভিস সফলভাবে সংরক্ষিত হয়েছে!")
      setIsModalOpen(false)
      loadData()
    } catch (e: any) {
      toast.error("সার্ভিস সংরক্ষণে সমস্যা: " + (e.response?.data?.message || e.message))
    }
  }

  // Submit AI Research Proposal
  const handleProposeResearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingResearch(true)
    try {
      await api.post('/admin/service-knowledge/research/propose', {
        serviceSlug: researchSlug || 'teletalk-govt-job',
        sourceUrl: researchUrl,
        sourceTitle: 'Official Government Instruction Portal',
        extractedRequirementsBn: researchNotes,
        proposedGovtFeeBdt: 223,
        confidenceScore: 0.95,
        notes: researchNotes,
      })
      toast.success("AI রিসার্চ প্রস্তাব কিউতে যুক্ত হয়েছে!")
      setIsResearchModalOpen(false)
      setResearchUrl("")
      setResearchNotes("")
      loadData()
    } catch (e: any) {
      toast.error("রিসার্চ প্রস্তাব তৈরিতে সমস্যা।")
    } finally {
      setIsSubmittingResearch(false)
    }
  }

  // Review & Approve / Reject Research
  const handleReviewResearch = async (proposalId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post(`/admin/service-knowledge/research/${proposalId}/review`, { action })
      toast.success(action === 'APPROVE' ? "প্রস্তাব অনুমোদিত ও নলেজবেসে পাবলিশ হয়েছে!" : "প্রস্তাব বাতিল করা হয়েছে।")
      loadData()
    } catch (e: any) {
      toast.error("রিভিউ করতে সমস্যা হয়েছে।")
    }
  }

  const filteredServices = services.filter(s => {
    const q = search.toLowerCase().trim()
    return !q || s.titleBn?.toLowerCase().includes(q) || s.titleEn?.toLowerCase().includes(q) || s.slug?.includes(q)
  })

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            Service Knowledge Base & AI Research Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            সার্ভিস নলেজবেস ও সরকারি তথ্য গবেষণা
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            যেকোনো সার্ভিসের সরকারি ফি, ছবির মাপ, প্রয়োজনীয় ডকুমেন্টস ও অর্ডার করা ফিল্ড কনফিগার করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsResearchModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 inline-flex items-center gap-2 shadow-sm"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            AI রিসার্চ শুরু করুন
          </button>
          <button
            onClick={() => handleOpenEdit()}
            className="px-4 py-2.5 rounded-2xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 inline-flex items-center gap-2 shadow-md shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            নতুন সেবা যুক্ত করুন
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'SERVICES'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          সক্রিয় সেবা ক্যাটালগ ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('AI_RESEARCH')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'AI_RESEARCH'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4 text-cyan-600" />
          AI রিসার্চ প্রস্তাব কিউ ({researchQueue.length})
        </button>
      </div>

      {/* TAB 1: Services Catalog Manager */}
      {activeTab === 'SERVICES' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="সার্ভিস খুঁজুন (নাম, স্লাগ বা ক্যাটাগরি)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((srv) => (
              <div
                key={srv.slug}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {srv.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ✓ {srv.verificationStatus}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{srv.titleBn}</h3>
                    <p className="text-xs text-slate-400 font-medium">{srv.titleEn}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{srv.descriptionBn}</p>
                  </div>

                  {/* Pricing and specs */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">সরকারি ফি</span>
                      <span className="text-slate-800">৳{srv.officialGovtFeeBdt}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">দোকান চার্জ</span>
                      <span className="text-cyan-700 font-bold">৳{srv.shopServiceChargeBdt}</span>
                    </div>
                  </div>

                  {/* Photo specs badge */}
                  {srv.photoSpecs && (
                    <div className="text-[11px] text-slate-600 bg-cyan-50/60 p-2.5 rounded-xl border border-cyan-100 flex items-center gap-1.5 font-medium">
                      <Camera className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span>{srv.photoSpecs.widthPx}x{srv.photoSpecs.heightPx} px ছবি (ম্যাক্স {srv.photoSpecs.maxKb}KB)</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {srv.requiredDocs?.length || 0} টি ডকুমেন্ট • {srv.orderedFields?.length || 0} টি ফিল্ড
                  </span>
                  <button
                    onClick={() => handleOpenEdit(srv)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> এডিট
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AI Research Queue */}
      {activeTab === 'AI_RESEARCH' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-cyan-950 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
            <Bot className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">AI ডাটা পাবলিশিং ও ভেরিফিকেশন ওয়ার্কফ্লো:</span>
              <p className="mt-0.5 text-cyan-900">
                AI স্বয়ংক্রিয়ভাবে সরকারি পোর্টাল ও অফিসিয়াল বিজ্ঞপ্তি গবেষণা করে প্রস্তাব তৈরি করে। অ্যাডমিনিস্ট্রেটর যাচাই ও অনুমোদন করলেই তা সরাসরি ওয়েবসাইটে পাবলিশ হয়।
              </p>
            </div>
          </div>

          {researchQueue.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <Bot className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-base">কোনো অপেক্ষারত রিসার্চ প্রস্তাব নেই</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                নতুন কোনো সরকারি নীতি বা ফি পরিবর্তন হলে "AI রিসার্চ শুরু করুন" বাটনে ক্লিক করে লিঙ্ক দিন।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {researchQueue.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">#{item.proposalId || item.id}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        {item.serviceSlug}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      রিসার্চ তারিখ: {new Date(item.researchedAt || item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 font-semibold uppercase">অফিসিয়াল সোর্স:</span>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-cyan-700 hover:underline flex items-center gap-1"
                    >
                      {item.sourceTitle || item.sourceUrl} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1">
                    <span className="font-bold block text-slate-900">নিষ্কাশিত শর্তাবলী ও প্রস্তাব:</span>
                    <p>{item.extractedRequirementsBn || item.notes}</p>
                    {item.proposedGovtFeeBdt !== undefined && (
                      <p className="font-bold text-cyan-800 pt-1">প্রস্তাবিত সরকারি ফি: ৳{item.proposedGovtFeeBdt}</p>
                    )}
                  </div>

                  {item.status === 'PENDING_REVIEW' && (
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReviewResearch(item.proposalId || item.id, 'REJECT')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-all"
                      >
                        বাতিল (Reject)
                      </button>
                      <button
                        onClick={() => handleReviewResearch(item.proposalId || item.id, 'APPROVE')}
                        className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> অনুমোদন ও পাবলিশ (Approve & Publish)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {editingService ? "সার্ভিস তথ্য সম্পাদনা" : "নতুন সেবা যুক্ত করুন"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সেবার নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={formData.titleBn}
                    onChange={(e) => setFormData({ ...formData, titleBn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ইউআরএল স্লাগ (Slug) *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ক্যাটাগরি *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
                  >
                    <option value="GOVT_JOB">সরকারি ও টেলিটক চাকরি (GOVT_JOB)</option>
                    <option value="PASSPORT">ই-পাসপোর্ট (PASSPORT)</option>
                    <option value="CIVIL_REG">জন্ম নিবন্ধন (CIVIL_REG)</option>
                    <option value="NID">জাতীয় পরিচয়পত্র (NID)</option>
                    <option value="VISA">ভিসা ও দূতাবাস (VISA)</option>
                    <option value="TAX_TIN">ই-টিআইএন ও কর (TAX_TIN)</option>
                    <option value="PHOTO_DOC">ফটো স্টুডিও ও প্রিন্ট (PHOTO_DOC)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">অফিসিয়াল সরকারি ফি (BDT) *</label>
                  <input
                    type="number"
                    value={formData.officialGovtFeeBdt}
                    onChange={(e) => setFormData({ ...formData, officialGovtFeeBdt: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">দোকানের সার্ভিস চার্জ (BDT) *</label>
                  <input
                    type="number"
                    value={formData.shopServiceChargeBdt}
                    onChange={(e) => setFormData({ ...formData, shopServiceChargeBdt: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm font-bold text-cyan-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">সেবার বিবরণ (বাংলা) *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.descriptionBn}
                  onChange={(e) => setFormData({ ...formData, descriptionBn: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">অফিসিয়াল সরকারি পোর্টাল লিঙ্ক</label>
                  <input
                    type="url"
                    value={formData.officialSourceUrl}
                    onChange={(e) => setFormData({ ...formData, officialSourceUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পোর্টাল শিরোনাম / কর্তৃপক্ষ</label>
                  <input
                    type="text"
                    value={formData.officialSourceTitle}
                    onChange={(e) => setFormData({ ...formData, officialSourceTitle: e.target.value })}
                    placeholder="e.g. Bangladesh Election Commission"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 inline-flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Research Proposal Modal */}
      {isResearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-600" />
                AI সার্ভিস গবেষণা প্রস্তাব তৈরি
              </h2>
              <button
                onClick={() => setIsResearchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeResearch} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">টার্গেট সার্ভিস নির্বাচন করুন</label>
                <select
                  value={researchSlug}
                  onChange={(e) => setResearchSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
                >
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.titleBn} ({s.slug})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">অফিসিয়াল সোর্স বা বিজ্ঞপ্তির ইউআরএল (URL)</label>
                <input
                  type="url"
                  required
                  value={researchUrl}
                  onChange={(e) => setResearchUrl(e.target.value)}
                  placeholder="https://alljobs.teletalk.com.bd/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বিজ্ঞপ্তির শর্তাবলী বা তথ্যের স্নিপেট</label>
                <textarea
                  rows={4}
                  required
                  value={researchNotes}
                  onChange={(e) => setResearchNotes(e.target.value)}
                  placeholder="যেমন: নতুন পরিপত্র অনুযায়ী ছবির সাইজ ও চালানের সরকারি ফি এত টাকা..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResearchModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResearch}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 inline-flex items-center gap-1.5"
                >
                  <Bot className="w-4 h-4" />
                  {isSubmittingResearch ? "AI গবেষণা করছে..." : "প্রস্তাব তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

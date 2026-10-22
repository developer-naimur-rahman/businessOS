"use client"

import React, { useState } from "react"
import { X, Search, Wrench, Printer, Sparkles, Check, ArrowRight, User, Phone, Loader2 } from "lucide-react"
import { api } from "../../lib/api-client"
import { toast } from "sonner"

interface ServiceJobHandoffModalProps {
  isOpen: boolean
  onClose: () => void
  onImportJob: (job: {
    type: 'SERVICE_JOB' | 'INTERNET_APP' | 'PRINT_DROP'
    id: string
    ref: string
    title: string
    customerName: string
    customerPhone: string
    dueBdt: number
  }) => void
}

export function ServiceJobHandoffModal({ isOpen, onClose, onImportJob }: ServiceJobHandoffModalProps) {
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [searched, setSearched] = useState(false)

  if (!isOpen) return null

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) {
      toast.warning("অনুগ্রহ করে টোকেন নং বা কাস্টমার মোবাইল নাম্বার লিখুন।")
      return
    }

    setSearching(true)
    setSearched(true)
    const combined: any[] = []

    try {
      // 1. Search Physical Service Jobs
      try {
        const jobRes = await api.get('/admin/service-jobs', { params: { search: query.trim() } })
        const jobList = jobRes.data?.jobs || (Array.isArray(jobRes.data) ? jobRes.data : [])
        jobList.forEach((j: any) => {
          const cost = Number(j.estimatedCostBdt || j.costBdt || 0)
          const adv = Number(j.advancePaidBdt || 0)
          const due = Math.max(0, cost - adv)
          combined.push({
            type: 'SERVICE_JOB',
            id: j.id,
            ref: j.ticketNumber || `#SJ-${j.id.slice(0, 6)}`,
            title: `${j.serviceCategory?.replace(/_/g, ' ') || 'সার্ভিস ও মেরামত'} - ${j.deviceOrFileDetails || j.jobDescription || 'ডিভাইস'}`,
            customerName: j.customerName,
            customerPhone: j.customerPhone,
            totalCost: cost,
            advancePaid: adv,
            dueBdt: due,
            status: j.status,
            date: j.createdAt
          })
        })
      } catch {
        // Ignore individual module failure
      }

      // 2. Search Internet & Citizen Service Applications
      try {
        const appRes = await api.get('/admin/service-applications', { params: { search: query.trim() } })
        const appList = Array.isArray(appRes.data) ? appRes.data : []
        appList.forEach((a: any) => {
          const cost = Number(a.feeBdt || a.serviceCostBdt || 50)
          const adv = Number(a.advancePaidBdt || 0)
          const due = Math.max(0, cost - adv)
          combined.push({
            type: 'INTERNET_APP',
            id: a.referenceNumber || a.id,
            ref: a.referenceNumber || `#APP-${a.id?.slice(0, 6)}`,
            title: a.serviceTitleBn || a.serviceTitleEn || 'অনলাইন সরকারি সেবা',
            customerName: a.customerName,
            customerPhone: a.customerPhone,
            totalCost: cost,
            advancePaid: adv,
            dueBdt: due,
            status: a.status,
            date: a.createdAt
          })
        })
      } catch {
        // Ignore
      }

      // 3. Search Print Queue Drops
      try {
        const prtRes = await api.get('/admin/print-queue')
        const prtList = Array.isArray(prtRes.data) ? prtRes.data : []
        const qClean = query.trim().toLowerCase()
        const matchedPrints = prtList.filter((p: any) => 
          p.tokenNumber?.toLowerCase().includes(qClean) ||
          p.customerPhone?.includes(qClean) ||
          p.customerName?.toLowerCase().includes(qClean)
        )
        matchedPrints.forEach((p: any) => {
          const cost = Number(p.estimatedPriceBdt || 10)
          combined.push({
            type: 'PRINT_DROP',
            id: p.id,
            ref: p.tokenNumber || `#PRT-${p.id.slice(0, 5)}`,
            title: `প্রিন্ট ড্রপ: ${p.fileName || 'ডকুমেন্ট'} (${p.colorMode === 'FULL_COLOR' ? 'কালার' : 'B&W'}, ${p.copies || 1} কপি)`,
            customerName: p.customerName,
            customerPhone: p.customerPhone,
            totalCost: cost,
            advancePaid: 0,
            dueBdt: cost,
            status: p.status,
            date: p.submittedAt || p.createdAt
          })
        })
      } catch {
        // Ignore
      }

      setResults(combined)
    } catch {
      toast.error("সার্ভিস জব খুঁজতে সমস্যা হয়েছে।")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">🛠️ সার্ভিস ও মেরামত জব কালেকশন</h3>
              <p className="text-xs text-slate-500">টোকেন স্লিপ বা মোবাইল নম্বর দিয়ে বকেয়া বিল সরাসরি POS কার্টে আনুন</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 border-b border-slate-100 shrink-0 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="টোকেন নম্বর (যেমন: SJ-101, PRT-123) অথবা কাস্টমার মোবাইল..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm font-medium text-slate-900 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              খুঁজুন
            </button>
          </form>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-slate-50/40">
          {searching ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-semibold">সার্ভিস ডাটাবেজ অনুসন্ধান করা হচ্ছে...</p>
            </div>
          ) : searched && results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="font-bold text-slate-600 text-sm">কোনো সার্ভিস জব খুঁজে পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400">টোকেন নম্বর বা মোবাইল নম্বরটি সঠিক কিনা পরীক্ষা করুন।</p>
            </div>
          ) : results.length > 0 ? (
            results.map((job, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {job.ref}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      job.status === 'READY_FOR_DELIVERY' || job.status === 'COMPLETED' || job.status === 'READY_FOR_PICKUP'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {job.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {job.type === 'SERVICE_JOB' ? '🛠️ মেরামত' : job.type === 'PRINT_DROP' ? '🖨️ প্রিন্ট ড্রপ' : '🌐 অনলাইন আবেদন'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm truncate">{job.title}</h4>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {job.customerName || 'গ্রাহক'}</span>
                    <span className="flex items-center gap-1 font-mono"><Phone className="w-3.5 h-3.5" /> {job.customerPhone || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">বকেয়া বিল (Due)</span>
                    <span className="text-lg font-black text-rose-600 font-mono">৳{Number(job.dueBdt || 0).toLocaleString()}</span>
                    {Number(job.advancePaid || 0) > 0 && (
                      <span className="text-[10px] text-slate-400 block">(অগ্রিম: ৳{Number(job.advancePaid || 0).toLocaleString()})</span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onImportJob(job)
                      onClose()
                      toast.success(`সার্ভিস জব #${job.ref} কার্টে বকেয়া বিল যোগ করা হয়েছে!`)
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>কার্টে আনুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <p className="text-xs">উপরের সার্চ বক্সে টোকেন নম্বর বা মোবাইল লিখে খুঁজুন।</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

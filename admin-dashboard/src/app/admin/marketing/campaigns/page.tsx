"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../../lib/api-client"
import { 
  Send, Sparkles, Smartphone, Mail, Users, CheckCircle2, 
  DollarSign, RefreshCw, Layers, Copy, Check 
} from "lucide-react"
import { toast } from "sonner"

export default function MarketingCampaignsPage() {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [launching, setLaunching] = useState(false)

  const [segments, setSegments] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])

  // Campaign Form State
  const [channel, setChannel] = useState<"BULK_SMS" | "EMAIL_BLAST" | "WHATSAPP_PROMO">("BULK_SMS")
  const [selectedSegmentId, setSelectedSegmentId] = useState("ALL_CUSTOMERS")
  const [campaignTheme, setCampaignTheme] = useState("Eid Ul-Fitr Mega Sale 2026")
  const [discountPercent, setDiscountPercent] = useState(15)
  const [discountCode, setDiscountCode] = useState("EID15")
  const [campaignTitle, setCampaignTitle] = useState("Eid Ul-Fitr Special Discount Blast")
  const [messageBody, setMessageBody] = useState("প্রিয় {customerName}, ঈদ মেগা সেলে আমাদের স্টোরের সকল পণ্যে পাচ্ছেন ১৫% ছাড়! চেকআউটে কোড {discountCode} ব্যবহার করুন। অর্ডার করুন: https://mybusiness.com.bd")
  const [emailSubject, setEmailSubject] = useState("🎉 ঈদ মোবারক! আপনার জন্য ১৫% স্পেশাল ডিসকাউন্ট")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [segRes, campRes] = await Promise.all([
        api.get("/admin/marketing/segments"),
        api.get("/admin/marketing/campaigns"),
      ])
      setSegments(segRes.data?.segments || [])
      setCampaigns(campRes.data || [])
    } catch (err) {
      console.error("Failed to load marketing data:", err)
      toast.error("Failed to load marketing segments")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAiCopy = async () => {
    setGenerating(true)
    try {
      const res = await api.post("/admin/marketing/campaigns/generate-copy", {
        campaignTheme,
        channel,
        discountPercent,
        discountCode,
        language: "BANGLA",
      })

      const data = res.data
      setMessageBody(data.messageBody || messageBody)
      if (data.subject) setEmailSubject(data.subject)
      toast.success(`Generated promo copy via ${data.engineUsed}!`)
    } catch (err) {
      toast.error("Failed to generate campaign copy")
    } finally {
      setGenerating(false)
    }
  }

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setLaunching(true)
    try {
      const res = await api.post("/admin/marketing/campaigns/launch", {
        title: campaignTitle,
        segmentId: selectedSegmentId,
        channel,
        messageBody,
        emailSubject,
        discountCode,
      })

      toast.success(res.data.message || "Campaign launched successfully!")
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to launch campaign")
    } finally {
      setLaunching(false)
    }
  }

  const targetedSegment = segments.find(s => s.id === selectedSegmentId)
  const targetedCount = targetedSegment?.customerCount || 0
  const costPerMsg = channel === "BULK_SMS" ? 0.35 : channel === "WHATSAPP_PROMO" ? 0.45 : 0.05
  const estimatedCost = (targetedCount * costPerMsg).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
              <Send className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Customer Growth & Promotional Broadcast
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Campaign Studio & Bulk Marketing</h1>
          <p className="text-slate-400 text-xs mt-1">
            Audience segmentation, AI Bangla promotional copywriting, SMS and WhatsApp promotional broadcasts.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Builder (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#04BBFD]" />
            <span>Create Promotional Broadcast</span>
          </h2>

          <form onSubmit={handleLaunchCampaign} className="space-y-4">
            {/* Channel Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(["BULK_SMS", "EMAIL_BLAST", "WHATSAPP_PROMO"] as const).map((ch) => (
                <button
                  type="button"
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    channel === ch
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {ch === "BULK_SMS" ? <Smartphone className="w-4 h-4" /> : ch === "EMAIL_BLAST" ? <Mail className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>{ch.replace("_", " ")}</span>
                </button>
              ))}
            </div>

            {/* Segment Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Target Audience Segment</label>
              <select
                value={selectedSegmentId}
                onChange={(e) => setSelectedSegmentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
              >
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.customerCount} Customers)
                  </option>
                ))}
              </select>
            </div>

            {/* AI Generator Box */}
            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-sky-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#04BBFD]" />
                  <span>AI Copy Generator Assistance</span>
                </span>
                <button
                  type="button"
                  onClick={handleGenerateAiCopy}
                  disabled={generating}
                  className="px-3 py-1 bg-white hover:bg-sky-100 text-[#04BBFD] border border-sky-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  {generating ? "Generating..." : "✨ Generate AI Copy"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Campaign Theme</label>
                  <input
                    type="text"
                    value={campaignTheme}
                    onChange={(e) => setCampaignTheme(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Campaign Title (Internal)</label>
              <input
                type="text"
                required
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            {channel === "EMAIL_BLAST" && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600">Message Body</label>
                <span className="text-[10px] font-mono text-slate-400">
                  {messageBody.length} chars • {messageBody.length <= 160 ? "1 SMS" : "2 SMS"}
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 leading-relaxed outline-none"
              />
            </div>

            {/* Cost & Launch Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Targeted: </span>
                <span className="font-extrabold text-slate-900">{targetedCount} Customers</span>
                <div className="text-[11px] text-slate-400">Estimated Cost: ৳{estimatedCost}</div>
              </div>

              <button
                type="submit"
                disabled={launching || targetedCount === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-50"
              >
                {launching ? "Broadcasting..." : "🚀 Launch Campaign Now"}
              </button>
            </div>
          </form>
        </div>

        {/* Live Mobile SMS Preview (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Live Customer Phone Preview</h3>

          {/* Phone Mockup Frame */}
          <div className="w-full max-w-xs mx-auto border-4 border-slate-800 rounded-[36px] p-3 shadow-2xl bg-slate-900">
            {/* Speaker bar */}
            <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto mb-3" />

            {/* Phone Screen */}
            <div className="bg-slate-100 rounded-[28px] p-3 min-h-[380px] flex flex-col justify-between">
              {/* Top Banner */}
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="text-[10px] font-bold text-slate-500">BusinessOS Store</div>
                <div className="text-[9px] text-slate-400">Today • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>

              {/* Chat Bubble */}
              <div className="my-auto">
                <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs text-left">
                  {channel === "EMAIL_BLAST" && (
                    <div className="font-extrabold text-[11px] text-slate-900 mb-1 border-b border-slate-100 pb-1">
                      {emailSubject}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-800 whitespace-pre-line leading-relaxed">
                    {messageBody
                      .replace("{customerName}", "রাকিব হাসান")
                      .replace("{discountCode}", discountCode)
                      .replace("{storeUrl}", "mybusiness.com.bd")}
                  </p>
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-24 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900">Broadcast Campaign History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Tracking Code</th>
                <th className="p-4">Campaign Title</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Targeted / Delivered</th>
                <th className="p-4">Total Cost</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No marketing campaigns launched yet. Create your first broadcast above!
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{c.campaignId}</td>
                    <td className="p-4 font-bold text-slate-900">{c.title}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                        {c.channel}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {c.deliveredCount} / {c.totalTargeted} Delivered (98%)
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      ৳{c.estimatedCostBdt}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

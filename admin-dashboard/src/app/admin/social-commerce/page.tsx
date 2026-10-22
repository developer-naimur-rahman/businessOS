"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../lib/api-client"
import { 
  MessageSquare, Sparkles, Send, CheckCircle2, User, Phone, 
  MapPin, ShoppingCart, RefreshCw, Layers, ArrowRight, Check,
  Clock, AlertCircle
} from "lucide-react"
import { toast } from "sonner"

export default function SocialCommercePage() {
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [converting, setConverting] = useState(false)
  const [leads, setLeads] = useState<any[]>([])

  // Raw Chat Input
  const [rawText, setRawText] = useState("ভাই আমি মিরপুর ১০ থেকে বলছি, কালো রঙের ২টা ঘড়ি লাগবে, নাম রাকিব 01712345678")
  const [sourceChannel, setSourceChannel] = useState<"FB_INBOX" | "FB_COMMENT" | "IG_DM" | "WHATSAPP">("FB_INBOX")

  // Extracted Order Form
  const [extractedOrder, setExtractedOrder] = useState<any>({
    leadId: `LEAD-${Date.now()}`,
    customerName: "রাকিব",
    customerPhone: "01712345678",
    customerAddress: "মিরপুর ১০, ঢাকা",
    detectedZone: "INSIDE_DHAKA",
    quantity: 2,
    unitPrice: 1200,
    deliveryCharge: 70,
    confidenceScore: 95,
    engineUsed: "AI_GEMINI",
  })

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/social-commerce/leads")
      setLeads(res.data || [])
    } catch (err) {
      console.error("Failed to load social leads:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleParseMessage = async () => {
    if (!rawText.trim()) {
      toast.error("Please paste customer text first")
      return
    }

    setParsing(true)
    try {
      const res = await api.post("/admin/social-commerce/parse-message", { rawCustomerText: rawText })
      const data = res.data

      setExtractedOrder({
        leadId: `LEAD-${Date.now()}`,
        customerName: data.extractedName || "Customer",
        customerPhone: data.extractedPhone || "",
        customerAddress: data.extractedAddress || "",
        detectedZone: data.detectedZone || "INSIDE_DHAKA",
        quantity: data.quantity || 1,
        unitPrice: 1200,
        deliveryCharge: data.estimatedDeliveryCharge || 70,
        confidenceScore: data.confidenceScore || 90,
        engineUsed: data.engineUsed || "AI_GEMINI",
      })

      toast.success(`Parsed successfully via ${data.engineUsed}!`)
    } catch (err: any) {
      toast.error("Failed to parse message")
    } finally {
      setParsing(false)
    }
  }

  const handleConvertToOrder = async () => {
    if (!extractedOrder.customerPhone) {
      toast.error("Valid customer phone number is required to create central order")
      return
    }

    setConverting(true)
    try {
      const res = await api.post("/admin/social-commerce/convert-to-order", {
        leadId: extractedOrder.leadId,
        customerName: extractedOrder.customerName,
        customerPhone: extractedOrder.customerPhone,
        customerAddress: extractedOrder.customerAddress,
        quantity: extractedOrder.quantity,
        unitPrice: extractedOrder.unitPrice,
        deliveryCharge: extractedOrder.deliveryCharge,
      })

      toast.success(res.data.message || "Central order created successfully!")
      loadLeads()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to convert to central order")
    } finally {
      setConverting(false)
    }
  }

  const grandTotal = (extractedOrder.unitPrice * extractedOrder.quantity) + extractedOrder.deliveryCharge

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#04BBFD]/20 text-[#04BBFD] rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#04BBFD]">
              Social Commerce & NLP Engine
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Omnichannel Social Order Desk</h1>
          <p className="text-slate-400 text-xs mt-1">
            Auto-extract customer name, phone, address, and quantity from Facebook Messenger & comments into formal orders.
          </p>
        </div>

        <button
          onClick={loadLeads}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Main Grid: Parser + Extracted Order */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Raw Input */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#04BBFD]" />
              <span>Smart Unstructured Chat Parser</span>
            </h2>

            <div className="flex items-center gap-1.5">
              {(["FB_INBOX", "FB_COMMENT", "IG_DM", "WHATSAPP"] as const).map((channel) => (
                <button
                  key={channel}
                  onClick={() => setSourceChannel(channel)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    sourceChannel === channel
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {channel.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Paste Customer Message / Comment (Bangla, English, or Banglish)
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. ভাই আমি মিরপুর থেকে বলছি, কালো কালার ঘড়ি ২টা লাগবে, নাম রফিক 01712345678"
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#04BBFD] rounded-2xl p-3.5 text-xs outline-none text-slate-800 leading-relaxed font-sans"
            />
          </div>

          <button
            onClick={handleParseMessage}
            disabled={parsing || !rawText.trim()}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${parsing ? "animate-spin" : ""}`} />
            <span>{parsing ? "Parsing with Gemini AI..." : "✨ Auto-Extract Customer & Order Details"}</span>
          </button>
        </div>

        {/* Right: Extracted Order Form & Convert */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Extracted Order Parameters</h3>
              <p className="text-[11px] text-slate-400">Review parameters before pushing to Central Orders queue</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Confidence: {extractedOrder.confidenceScore}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Customer Name</label>
              <input
                type="text"
                value={extractedOrder.customerName}
                onChange={(e) => setExtractedOrder({ ...extractedOrder, customerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Phone Number</label>
              <input
                type="text"
                value={extractedOrder.customerPhone}
                onChange={(e) => setExtractedOrder({ ...extractedOrder, customerPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Delivery Address</label>
            <input
              type="text"
              value={extractedOrder.customerAddress}
              onChange={(e) => setExtractedOrder({ ...extractedOrder, customerAddress: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={extractedOrder.quantity}
                onChange={(e) => setExtractedOrder({ ...extractedOrder, quantity: Number(e.target.value) || 1 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Unit Price (৳)</label>
              <input
                type="number"
                value={extractedOrder.unitPrice}
                onChange={(e) => setExtractedOrder({ ...extractedOrder, unitPrice: Number(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Delivery Charge (৳)</label>
              <input
                type="number"
                value={extractedOrder.deliveryCharge}
                onChange={(e) => setExtractedOrder({ ...extractedOrder, deliveryCharge: Number(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total COD Collect:</span>
            <span className="text-base font-black text-slate-900">৳{grandTotal.toLocaleString()}</span>
          </div>

          <button
            onClick={handleConvertToOrder}
            disabled={converting}
            className="w-full py-3 bg-slate-900 hover:bg-[#04BBFD] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{converting ? "Creating Central Order..." : "✅ 1-Click Convert to Central Order"}</span>
          </button>
        </div>
      </div>

      {/* Social Leads Feed */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900">Recent Social Commerce Leads</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Lead ID</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Customer Name & Phone</th>
                <th className="p-4">Original Message</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No social leads ingested yet. Parse messages above to generate leads!
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{l.leadId}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {l.sourceChannel}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      <div>{l.customerName}</div>
                      <div className="text-[11px] font-mono text-slate-500 font-normal">{l.customerPhone}</div>
                    </td>
                    <td className="p-4 text-slate-600 max-w-sm truncate">{l.rawCustomerText}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {l.status}
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

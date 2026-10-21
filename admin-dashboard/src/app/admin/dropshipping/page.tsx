"use client"
import React, { useState, useEffect, useMemo } from "react"
import { api } from "../../../lib/api-client"
import { 
  Sparkles, TrendingUp, Package, Truck, ExternalLink, 
  CheckCircle2, AlertTriangle, XCircle, Copy, Check, 
  Trash2, Plus, ArrowRight, RefreshCw, ShoppingCart, 
  DollarSign, ShieldAlert, Layers, Plane, Globe, Store,
  Send, HelpCircle, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function DropshippingHubPage() {
  const [activeTab, setActiveTab] = useState<"analyzer" | "watchlist" | "orders">("analyzer")

  // ==========================================
  // TAB 1: AI ANALYZER STATE
  // ==========================================
  const [analyzing, setAnalyzing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [copiedNote, setCopiedNote] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    productName: "Skybuy Mini Pocket Thermal Bluetooth Printer",
    sourcePlatform: "SKYBUY_CHINA" as "SKYBUY_CHINA" | "RESELLING_BD" | "ALIEXPRESS" | "LOCAL_WHOLESALE",
    supplierUrl: "https://skybuybd.com/item/mini-pocket-printer-58mm",
    supplierPriceBdt: 680,
    weightGrams: 260,
    targetSellingPrice: 1890,
    categoryHint: "Gadgets & Stationery",
    estimatedAdSpendPerOrder: 220,
    codReturnRatePercent: 14,
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
  })

  // Quick Preset Templates for Instant 1-Click Testing
  const presets = [
    {
      name: "🖨️ Skybuy Thermal Printer",
      platform: "SKYBUY_CHINA" as const,
      price: 680,
      weight: 260,
      target: 1890,
      ad: 220,
      cod: 14,
      cat: "Gadgets & Printing",
      url: "https://skybuybd.com/item/mini-pocket-printer-58mm",
      img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "🔪 BD Reselling Kitchen Chopper",
      platform: "RESELLING_BD" as const,
      price: 380,
      weight: 420,
      target: 1190,
      ad: 180,
      cod: 16,
      cat: "Home & Kitchen",
      url: "https://daraz.com.bd/products/kitchen-chopper-i12345.html",
      img: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "🌅 RGB Sunset Projection Lamp",
      platform: "SKYBUY_CHINA" as const,
      price: 320,
      weight: 210,
      target: 1250,
      ad: 190,
      cod: 12,
      cat: "Lifestyle & Decor",
      url: "https://skybuybd.com/item/sunset-lamp-16colors",
      img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "🎧 TWS Wireless Earbuds Pro",
      platform: "LOCAL_WHOLESALE" as const,
      price: 490,
      weight: 160,
      target: 1490,
      ad: 240,
      cod: 15,
      cat: "Electronics & Audio",
      url: "https://aliexpress.com/item/10050098231.html",
      img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop",
    },
  ]

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setFormData({
      productName: preset.name.replace(/^[^\s]+\s/, ""),
      sourcePlatform: preset.platform,
      supplierPriceBdt: preset.price,
      weightGrams: preset.weight,
      targetSellingPrice: preset.target,
      estimatedAdSpendPerOrder: preset.ad,
      codReturnRatePercent: preset.cod,
      categoryHint: preset.cat,
      supplierUrl: preset.url,
      imageUrl: preset.img,
    })
    toast.success(`Loaded preset template: ${preset.name}`)
  }

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.productName.trim()) {
      toast.error("Please enter a product title")
      return
    }
    if (formData.supplierPriceBdt <= 0 || formData.targetSellingPrice <= 0) {
      toast.error("Please enter valid supplier price and selling price")
      return
    }

    setAnalyzing(true)
    try {
      const res = await api.post("/admin/dropshipping/ai-analyze", formData)
      setAnalysisResult(res.data)
      if (res.data?.engineUsed === 'AI_GEMINI') {
        toast.success("AI Analysis Complete (Powered by Google Gemini ✨)")
      } else {
        toast.success("Unit Economics & Viability Analysis Complete (Algorithmic ⚡)")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to analyze product")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleImportToStore = async () => {
    if (!analysisResult) return
    setImporting(true)
    try {
      const payload = {
        productName: analysisResult.productName,
        sellingPrice: analysisResult.targetSellingPrice,
        compareAtPrice: Math.round(analysisResult.targetSellingPrice * 1.35),
        supplierCost: analysisResult.supplierPriceBdt,
        estimatedShippingCost: analysisResult.costBreakdown?.shippingCost || 100,
        supplierName: 
          analysisResult.sourcePlatform === "SKYBUY_CHINA" ? "Skybuy China Air Cargo" :
          analysisResult.sourcePlatform === "RESELLING_BD" ? "BD Reselling Wholesale Hub" :
          "AliExpress / Global Sourcing",
        supplierUrl: analysisResult.supplierUrl,
        imageUrl: analysisResult.imageUrl,
        description: analysisResult.copywriting?.description || "",
        watchlistId: analysisResult.id,
      }

      const res = await api.post("/admin/dropshipping/import-product", payload)
      toast.success("🚀 Product successfully published live to your Storefront!")
      setAnalysisResult((prev: any) => ({ ...prev, importStatus: "IMPORTED" }))
      fetchWatchlist()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to import product to store")
    } finally {
      setImporting(false)
    }
  }

  // ==========================================
  // TAB 2: WATCHLIST STATE
  // ==========================================
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [loadingWatchlist, setLoadingWatchlist] = useState(false)

  const fetchWatchlist = async () => {
    setLoadingWatchlist(true)
    try {
      const res = await api.get("/admin/dropshipping/watchlist")
      setWatchlist(res.data || [])
    } catch (err: any) {
      console.error("Failed to load watchlist", err)
    } finally {
      setLoadingWatchlist(false)
    }
  }

  const handleDeleteWatchlistItem = async (id: string) => {
    try {
      await api.delete(`/admin/dropshipping/watchlist/${id}`)
      toast.success("Item removed from research watchlist")
      setWatchlist(prev => prev.filter(item => item.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete watchlist item")
    }
  }

  // ==========================================
  // TAB 3: DROPSHIP ORDERS QUEUE STATE
  // ==========================================
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [dispatchingId, setDispatchingId] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const res = await api.get("/admin/dropshipping/orders")
      setOrders(res.data || [])
    } catch (err: any) {
      console.error("Failed to load dropship orders", err)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleDispatchOrder = async (saleId: string) => {
    setDispatchingId(saleId)
    try {
      await api.patch(`/admin/dropshipping/orders/${saleId}/dispatch`, {
        supplierRef: `DSP-${Date.now().toString().slice(-6)}`,
        note: "Dispatched to third-party supplier for customer delivery",
      })
      toast.success("Order marked as DISPATCHED / ORDERED FROM SUPPLIER!")
      fetchOrders()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark order as dispatched")
    } finally {
      setDispatchingId(null)
    }
  }

  const handleCopyNote = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedNote(id)
    toast.success("Supplier Dispatch Note copied to clipboard!")
    setTimeout(() => setCopiedNote(null), 2500)
  }

  // Initial load
  useEffect(() => {
    if (activeTab === "watchlist") fetchWatchlist()
    if (activeTab === "orders") fetchOrders()
  }, [activeTab])

  // Overview metrics for Dropship Orders
  const orderMetrics = useMemo(() => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const totalSupplierCost = orders.reduce((sum, o) => sum + (Number(o.totalDropshipSupplierCost) || 0), 0)
    const netProfit = totalRevenue - totalSupplierCost
    return { totalOrders, totalRevenue, totalSupplierCost, netProfit }
  }, [orders])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-600 text-white rounded-xl shadow-sm text-lg">
              🚀
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Dropshipping & AI Product Intelligence Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Research winning products via <strong>Skybuy (China Air Cargo)</strong> & <strong>Local BD Resellers</strong>, calculate true landed COD costs, and manage 1-click supplier dispatches.
          </p>
        </div>

        {/* Tab Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("analyzer")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "analyzer"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            AI Product Analyzer
          </button>

          <button
            onClick={() => setActiveTab("watchlist")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "watchlist"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            Research Watchlist
            {watchlist.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                {watchlist.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "orders"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            Auto-Received Orders
            {orders.length > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px]">
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI PRODUCT ANALYZER & 1-CLICK IMPORT               */}
      {/* ========================================================= */}
      {activeTab === "analyzer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Input Form */}
          <div className="lg:col-span-5 space-y-5">
            {/* Presets Bar */}
            <div className="surface-elevated p-4 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ⚡ 1-Click Preset Winning Product Templates
              </span>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2 text-left rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all text-xs font-semibold text-slate-800 truncate"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleRunAnalysis} className="surface-elevated p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span>Product Sourcing Parameters</span>
                <span className="text-[11px] font-normal text-slate-400">Bangladesh Market Context</span>
              </h2>

              {/* Sourcing Platform Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Source Supplier Platform
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourcePlatform: "SKYBUY_CHINA" })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      formData.sourcePlatform === "SKYBUY_CHINA"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Plane className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>✈️ Skybuy (China Import)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourcePlatform: "RESELLING_BD" })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      formData.sourcePlatform === "RESELLING_BD"
                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Store className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>🇧🇩 Local Reselling (BD)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourcePlatform: "ALIEXPRESS" })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      formData.sourcePlatform === "ALIEXPRESS"
                        ? "bg-rose-50 border-rose-500 text-rose-900 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Globe className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>🌐 AliExpress Global</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourcePlatform: "LOCAL_WHOLESALE" })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      formData.sourcePlatform === "LOCAL_WHOLESALE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Package className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>🏬 Wholesale (Dhaka)</span>
                  </button>
                </div>
              </div>

              {/* Title & Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={e => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. Mini Thermal Bluetooth Pocket Printer"
                  className="control-input w-full text-xs font-semibold"
                />
              </div>

              {/* Supplier URL & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Supplier URL
                  </label>
                  <input
                    type="url"
                    value={formData.supplierUrl}
                    onChange={e => setFormData({ ...formData, supplierUrl: e.target.value })}
                    placeholder="https://skybuybd.com/item/..."
                    className="control-input w-full text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="control-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Price & Weight Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Wholesale (৳)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.supplierPriceBdt}
                    onChange={e => setFormData({ ...formData, supplierPriceBdt: parseFloat(e.target.value) || 0 })}
                    className="control-input w-full text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Weight (g)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={formData.weightGrams}
                    onChange={e => setFormData({ ...formData, weightGrams: parseFloat(e.target.value) || 0 })}
                    className="control-input w-full text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Sell Price (৳)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.targetSellingPrice}
                    onChange={e => setFormData({ ...formData, targetSellingPrice: parseFloat(e.target.value) || 0 })}
                    className="control-input w-full text-xs font-black text-indigo-700"
                  />
                </div>
              </div>

              {/* Ad Spend & COD Risk Sliders */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>FB Ad Cost/Order</span>
                    <span className="text-indigo-600">৳{formData.estimatedAdSpendPerOrder}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="500"
                    step="20"
                    value={formData.estimatedAdSpendPerOrder}
                    onChange={e => setFormData({ ...formData, estimatedAdSpendPerOrder: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>COD Return Rate</span>
                    <span className="text-rose-600">{formData.codReturnRatePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="1"
                    value={formData.codReturnRatePercent}
                    onChange={e => setFormData({ ...formData, codReturnRatePercent: Number(e.target.value) })}
                    className="w-full accent-rose-600"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={analyzing}
                className="w-full h-11 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {analyzing ? "Simulating BD Unit Economics & AI Scoring..." : "Run AI Sourcing & Margin Analysis"}
              </button>
            </form>
          </div>

          {/* Right: AI Intelligence Report */}
          <div className="lg:col-span-7 space-y-5">
            {!analysisResult && !analyzing && (
              <div className="surface-elevated p-12 text-center space-y-4 border-dashed border-2 border-slate-200">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-inner">
                  🧠
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">AI Product Intelligence Engine Idle</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select a winning preset template on the left or enter supplier product details to simulate air freight, COD return risks, net margins, and generate conversion copy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunAnalysis()}
                  className="control-button-primary h-9 px-4 text-xs font-semibold"
                >
                  Analyze Current Template Now
                </button>
              </div>
            )}

            {analyzing && (
              <div className="surface-elevated p-16 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Evaluating Bangladesh E-commerce Viability...</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Computing Skybuy air cargo rates, amortizing 2-way COD returns, and predicting Facebook ROAS...
                  </p>
                </div>
              </div>
            )}

            {analysisResult && !analyzing && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* 1. Score & Verdict Banner */}
                <div className={`p-6 rounded-3xl border shadow-xs text-white relative overflow-hidden ${
                  analysisResult.verdictLevel === 'WINNER' ? 'bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 border-emerald-600' :
                  analysisResult.verdictLevel === 'PROMISING' ? 'bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 border-amber-600' :
                  'bg-gradient-to-r from-rose-800 via-red-900 to-slate-900 border-rose-700'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {analysisResult.engineUsed === 'AI_GEMINI' ? (
                          <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-200 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                            <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" /> Google Gemini AI
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-200/90 bg-black/30 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                            <Layers className="w-3 h-3 text-emerald-300" /> Algorithmic Engine Active
                          </span>
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
                          AI Verdict & Viability Score
                        </span>
                      </div>
                      <h2 className="text-xl font-black tracking-tight">{analysisResult.verdict}</h2>
                      <p className="text-xs text-slate-200 mt-1 flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" /> {analysisResult.deliveryDaysText}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-300">Viability Score</p>
                        <p className="text-3xl font-black text-amber-300 leading-tight">
                          {analysisResult.score}<span className="text-xs text-slate-300 font-normal">/100</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Import CTA */}
                  <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-200">
                      Ready to launch? Publish this product directly to your live Storefront catalog.
                    </p>
                    <button
                      onClick={handleImportToStore}
                      disabled={importing || analysisResult.importStatus === "IMPORTED"}
                      className={`h-10 px-5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all ${
                        analysisResult.importStatus === "IMPORTED"
                          ? "bg-emerald-500 text-white cursor-default"
                          : "bg-white text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {analysisResult.importStatus === "IMPORTED" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" /> Live on Storefront
                        </>
                      ) : (
                        <>
                          <Store className="w-4 h-4 text-indigo-600" />
                          {importing ? "Importing to Store..." : "🚀 1-Click Add to Storefront"}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Bangladesh Unit Economics Grid */}
                <div className="surface-elevated p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Unit Economics Breakdown (Per Delivered Order)
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Selling Price</p>
                      <p className="text-base font-black text-slate-900 mt-0.5">
                        ৳{analysisResult.targetSellingPrice.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">Target retail</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Total Landed Cost</p>
                      <p className="text-base font-bold text-slate-800 mt-0.5">
                        ৳{analysisResult.costBreakdown.totalLandedCost.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">All costs + Ad + Risk</p>
                    </div>

                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">Net Profit / Order</p>
                      <p className={`text-base font-black mt-0.5 ${
                        analysisResult.profitability.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        ৳{analysisResult.profitability.netProfit.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-emerald-600">Net in-hand cash</p>
                    </div>

                    <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80">
                      <p className="text-[10px] font-bold text-indigo-800 uppercase">Net Margin (%)</p>
                      <p className="text-base font-black text-indigo-700 mt-0.5">
                        {analysisResult.profitability.profitMargin}%
                      </p>
                      <p className="text-[10px] text-indigo-600">Target 25%+ in BD</p>
                    </div>
                  </div>

                  {/* Micro Cost details */}
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/50 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>• Supplier Wholesale Cost:</span>
                      <strong className="text-slate-900">৳{analysisResult.costBreakdown.supplierCost}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Air Cargo & Local Courier ({analysisResult.weightGrams}g):</span>
                      <strong className="text-slate-900">৳{analysisResult.costBreakdown.shippingCost}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Packaging & Poly Mailer:</span>
                      <strong className="text-slate-900">৳{analysisResult.costBreakdown.packagingCost}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Gateway & COD Collection Fee (1.5%):</span>
                      <strong className="text-slate-900">৳{analysisResult.costBreakdown.gatewayFee}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Amortized Facebook Ad Spend:</span>
                      <strong className="text-slate-900">৳{analysisResult.costBreakdown.adSpend}</strong>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span>• COD Return Risk Buffer (Lost Courier + Ad):</span>
                      <strong>৳{analysisResult.costBreakdown.returnRiskCost}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. AI Strengths, Risks & Target Audience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="surface-elevated p-4 space-y-2 border-l-4 border-l-emerald-500">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Strengths
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {analysisResult.strengths?.map((s: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="surface-elevated p-4 space-y-2 border-l-4 border-l-rose-500">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Bangladesh Risk Alerts
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {analysisResult.risks?.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Generated Storefront Copy & Bangla Ad Hooks */}
                <div className="surface-elevated p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    Auto-Generated Copywriting & Ad Hooks
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/60">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                        Facebook Ad Hook (Bangla)
                      </span>
                      <p className="text-slate-800 font-medium">{analysisResult.copywriting?.fbAdHookBangla}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Product Description Preview
                      </span>
                      <div 
                        className="text-slate-700 space-y-1 max-h-32 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: analysisResult.copywriting?.description || "" }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RESEARCH WATCHLIST (COMPARISON MATRIX)             */}
      {/* ========================================================= */}
      {activeTab === "watchlist" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Analyzed Products Watchlist & Comparison ({watchlist.length})
            </h2>
            <button
              onClick={fetchWatchlist}
              disabled={loadingWatchlist}
              className="control-button-secondary h-9 px-3 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingWatchlist && (
            <div className="surface-elevated p-12 text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Loading research watchlist...</p>
            </div>
          )}

          {!loadingWatchlist && watchlist.length === 0 && (
            <div className="surface-elevated p-12 text-center space-y-3">
              <span className="text-3xl">📋</span>
              <h3 className="font-bold text-slate-800 text-sm">No Analyzed Products Saved Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Run an analysis in the AI Product Analyzer tab. Every analyzed product idea will automatically appear here for side-by-side comparison.
              </p>
              <button
                onClick={() => setActiveTab("analyzer")}
                className="control-button-primary h-9 px-4 text-xs font-semibold"
              >
                Go to AI Analyzer
              </button>
            </div>
          )}

          {!loadingWatchlist && watchlist.length > 0 && (
            <div className="surface-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3 text-right">Landed Cost</th>
                      <th className="px-4 py-3 text-right">Selling Price</th>
                      <th className="px-4 py-3 text-right">Net Profit</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {watchlist.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"}
                              alt={item.productName}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                              {item.supplierUrl && (
                                <a
                                  href={item.supplierUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                                >
                                  Supplier Link <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.sourcePlatform === 'SKYBUY_CHINA' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            item.sourcePlatform === 'RESELLING_BD' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.sourcePlatform === 'SKYBUY_CHINA' ? '✈️ Skybuy' :
                             item.sourcePlatform === 'RESELLING_BD' ? '🇧🇩 BD Reselling' :
                             '🌐 Global'}
                          </span>
                          <div className="mt-1">
                            {item.engineUsed === 'AI_GEMINI' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded">
                                <Sparkles className="w-2.5 h-2.5 text-cyan-600" /> Gemini AI
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                <Layers className="w-2.5 h-2.5 text-slate-500" /> Algorithmic
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                          ৳{item.totalLandedCost.toLocaleString()}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          ৳{item.targetSellingPrice.toLocaleString()}
                        </td>

                        <td className="px-4 py-3.5 text-right font-black text-emerald-700">
                          ৳{item.netProfit.toLocaleString()} ({item.profitMargin}%)
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
                            item.score >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            item.score >= 55 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {item.score}/100
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.importStatus === 'IMPORTED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.importStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.importStatus !== 'IMPORTED' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post("/admin/dropshipping/import-product", {
                                      productName: item.productName,
                                      sellingPrice: item.targetSellingPrice,
                                      supplierCost: item.supplierPriceBdt,
                                      estimatedShippingCost: item.rawAnalysis?.costBreakdown?.shippingCost || 100,
                                      supplierName: item.sourcePlatform === 'SKYBUY_CHINA' ? 'Skybuy China' : 'BD Reselling Hub',
                                      supplierUrl: item.supplierUrl,
                                      imageUrl: item.imageUrl,
                                      watchlistId: item.id,
                                    })
                                    toast.success("Imported to live store catalog!")
                                    fetchWatchlist()
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.message || "Import failed")
                                  }
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px]"
                              >
                                Import
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteWatchlistItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete from Watchlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: AUTO-RECEIVED DROPSHIP ORDERS QUEUE                */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="surface-elevated p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Received Dropship Orders</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{orderMetrics.totalOrders}</p>
            </div>

            <div className="surface-elevated p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Customer Revenue</span>
              <p className="text-2xl font-black text-slate-900 mt-1">৳{orderMetrics.totalRevenue.toLocaleString()}</p>
            </div>

            <div className="surface-elevated p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Wholesale Supplier Cost</span>
              <p className="text-2xl font-black text-amber-700 mt-1">৳{orderMetrics.totalSupplierCost.toLocaleString()}</p>
            </div>

            <div className="surface-elevated p-4 bg-emerald-50/50 border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Estimated Net Profit</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">৳{orderMetrics.netProfit.toLocaleString()}</p>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Automated Dropship Fulfillment Queue
            </h2>
            <button
              onClick={fetchOrders}
              disabled={loadingOrders}
              className="control-button-secondary h-9 px-3 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
            </button>
          </div>

          {loadingOrders && (
            <div className="surface-elevated p-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Checking incoming dropship orders...</p>
            </div>
          )}

          {!loadingOrders && orders.length === 0 && (
            <div className="surface-elevated p-12 text-center space-y-3">
              <span className="text-3xl">📦</span>
              <h3 className="font-bold text-slate-800 text-sm">No Pending Dropship Orders</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When customers purchase dropship items on your storefront, they will automatically appear here with 1-click supplier fulfillment links.
              </p>
            </div>
          )}

          {!loadingOrders && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="surface-elevated p-5 space-y-4 border-l-4 border-l-blue-600">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{order.saleNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          📦 Dropship Order
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleString()} • Recipient: <strong className="text-slate-800">{order.customer?.name}</strong> ({order.customer?.phone})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Order Value</p>
                        <p className="text-base font-black text-slate-900">৳{order.total.toLocaleString()}</p>
                      </div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="control-button-secondary h-9 px-3 text-xs font-semibold flex items-center gap-1"
                      >
                        Order Detail <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Items to Fulfill */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Supplier Sourcing & Items to Fulfill
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.dropshipItems?.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{item.productName}</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Wholesale Cost: ৳{item.unitSupplierCost.toLocaleString()}</span>
                            <span>Supplier: <strong className="text-slate-800">{item.supplierName}</strong></span>
                          </div>
                          {item.supplierUrl ? (
                            <a
                              href={item.supplierUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs mt-1 bg-white px-2 py-0.5 rounded border border-blue-200"
                            >
                              Open on Skybuy / Supplier Page <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No supplier link saved</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Shipping Address & Dispatch Note */}
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">
                        Customer Shipping Address: <span className="font-medium text-slate-800">{order.customer?.address}</span>
                      </span>
                      <button
                        onClick={() => handleCopyNote(order.dispatchNote, order.id)}
                        className="control-button-secondary h-8 px-2.5 text-[11px] font-semibold flex items-center gap-1.5 bg-white shadow-xs"
                      >
                        {copiedNote === order.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedNote === order.id ? "Copied Note" : "Copy Supplier Dispatch Sheet"}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleDispatchOrder(order.id)}
                      disabled={dispatchingId === order.id}
                      className="control-button-primary h-9 px-4 text-xs font-bold flex items-center gap-2 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      {dispatchingId === order.id ? "Updating Status..." : "Mark Ordered / Dispatched to Supplier"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../lib/api-client"
import { 
  Truck, Package, Search, ExternalLink, Printer, CheckCircle2, 
  Clock, AlertTriangle, ShieldCheck, RefreshCw, Send, Plus, 
  Settings, Key, Copy, Check, ChevronRight, CheckSquare, Square
} from "lucide-react"
import { toast } from "sonner"

export default function LogisticsCourierPage() {
  const [activeTab, setActiveTab] = useState<"unbooked" | "consignments" | "settings">("unbooked")
  const [loading, setLoading] = useState(false)
  const [unbookedOrders, setUnbookedOrders] = useState<any[]>([])
  const [consignments, setConsignments] = useState<any[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Thermal Label Modal
  const [selectedLabel, setSelectedLabel] = useState<any>(null)
  const [loadingLabel, setLoadingLabel] = useState(false)

  // Courier Config State
  const [config, setConfig] = useState({
    steadfastApiKey: "",
    steadfastSecretKey: "",
    pathaoClientId: "",
    pathaoClientSecret: "",
    pathaoStoreId: "",
    sandboxMode: true,
  })
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [unbookedRes, consignmentsRes, configRes] = await Promise.all([
        api.get("/admin/logistics/unbooked-orders"),
        api.get("/admin/logistics/consignments"),
        api.get("/admin/logistics/config"),
      ])
      setUnbookedOrders(unbookedRes.data || [])
      setConsignments(consignmentsRes.data || [])
      if (configRes.data) setConfig(configRes.data)
    } catch (err: any) {
      console.error("Logistics load error:", err)
      toast.error("Failed to load logistics data")
    } finally {
      setLoading(false)
    }
  }

  const handleBookSingle = async (order: any, provider: "STEADFAST" | "PATHAO") => {
    try {
      const res = await api.post("/admin/logistics/book-parcel", {
        saleId: order.saleId,
        courierProvider: provider,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        recipientAddress: order.customerAddress,
        cityZone: order.cityZone,
        codAmount: order.totalAmount,
        weightGrams: 500,
      })
      toast.success(res.data.message || `Booked with ${provider}`)
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to book with ${provider}`)
    }
  }

  const handleBulkBook = async (provider: "STEADFAST" | "PATHAO") => {
    if (selectedOrderIds.length === 0) {
      toast.error("Please select at least one order to bulk book")
      return
    }

    const selectedOrders = unbookedOrders.filter(o => selectedOrderIds.includes(o.saleId))
    const parcels = selectedOrders.map(o => ({
      saleId: o.saleId,
      courierProvider: provider,
      recipientName: o.customerName,
      recipientPhone: o.customerPhone,
      recipientAddress: o.customerAddress,
      cityZone: o.cityZone,
      codAmount: o.totalAmount,
      weightGrams: 500,
    }))

    try {
      const res = await api.post("/admin/logistics/bulk-book", { parcels })
      toast.success(`Bulk booking completed: ${res.data.successful} booked, ${res.data.failed} failed`)
      setSelectedOrderIds([])
      loadData()
    } catch (err: any) {
      toast.error("Bulk booking failed")
    }
  }

  const handleOpenLabel = async (consignmentId: string) => {
    setLoadingLabel(true)
    try {
      const res = await api.get(`/admin/logistics/label/${consignmentId}`)
      setSelectedLabel(res.data)
    } catch (err: any) {
      toast.error("Failed to load thermal label data")
    } finally {
      setLoadingLabel(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post("/admin/logistics/config", config)
      toast.success(res.data.message || "Courier configuration saved")
    } catch (err: any) {
      toast.error("Failed to save configuration")
    }
  }

  const handleTestConnection = async (provider: "STEADFAST" | "PATHAO") => {
    setTestingConnection(provider)
    try {
      const res = await api.post("/admin/logistics/test-connection", { provider })
      toast.success(`[${res.data.mode}] ${res.data.message}`)
    } catch (err: any) {
      toast.error("Connection test failed")
    } finally {
      setTestingConnection(null)
    }
  }

  const filteredConsignments = consignments.filter(c => 
    c.consignmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.recipientPhone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#04BBFD]/20 text-[#04BBFD] rounded-lg">
              <Truck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#04BBFD]">
              Nationwide Bangladesh Fulfillment
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Courier Logistics & Thermal Dispatch</h1>
          <p className="text-slate-400 text-xs mt-1">
            Steadfast & Pathao 1-click parcel booking, 4x6 thermal shipping labels, and live consignment tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("unbooked")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "unbooked"
              ? "border-[#04BBFD] text-[#04BBFD]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Unbooked Orders Queue ({unbookedOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("consignments")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "consignments"
              ? "border-[#04BBFD] text-[#04BBFD]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Consignments ({consignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-[#04BBFD] text-[#04BBFD]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Courier API Credentials & Sandbox</span>
        </button>
      </div>

      {/* ================= TAB 1: UNBOOKED ORDERS ================= */}
      {activeTab === "unbooked" && (
        <div className="space-y-4">
          {/* Bulk Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (selectedOrderIds.length === unbookedOrders.length) {
                    setSelectedOrderIds([])
                  } else {
                    setSelectedOrderIds(unbookedOrders.map(o => o.saleId))
                  }
                }}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#04BBFD]"
              >
                {selectedOrderIds.length === unbookedOrders.length && unbookedOrders.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-[#04BBFD]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All ({selectedOrderIds.length} selected)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleBulkBook("STEADFAST")}
                disabled={selectedOrderIds.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <span>🚀 Send to Steadfast</span>
              </button>
              <button
                onClick={() => handleBulkBook("PATHAO")}
                disabled={selectedOrderIds.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <span>🛵 Send to Pathao</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 w-10">#</th>
                    <th className="p-4">Order / Invoice</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Delivery Zone</th>
                    <th className="p-4">COD Collect Amount</th>
                    <th className="p-4 text-right">Quick Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unbookedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No pending unbooked orders found. All orders have been booked with couriers!
                      </td>
                    </tr>
                  ) : (
                    unbookedOrders.map((order) => {
                      const isSelected = selectedOrderIds.includes(order.saleId)
                      return (
                        <tr key={order.saleId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedOrderIds(prev => prev.filter(id => id !== order.saleId))
                                } else {
                                  setSelectedOrderIds(prev => [...prev, order.saleId])
                                }
                              }}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#04BBFD]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900">{order.saleNumber}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(order.saleDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{order.customerName}</div>
                            <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{order.customerAddress}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              order.cityZone === "INSIDE_DHAKA" 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-sky-50 text-sky-700 border border-sky-200"
                            }`}>
                              {order.cityZone === "INSIDE_DHAKA" ? "Inside Dhaka (৳70)" : "Outside Dhaka (৳130)"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-black text-sm text-slate-900">
                              ৳{order.totalAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleBookSingle(order, "STEADFAST")}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Steadfast
                            </button>
                            <button
                              onClick={() => handleBookSingle(order, "PATHAO")}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Pathao
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ACTIVE CONSIGNMENTS ================= */}
      {activeTab === "consignments" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Consignment ID, Customer Name or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none text-slate-800"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Consignment ID</th>
                    <th className="p-4">Provider & Mode</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">COD Collect</th>
                    <th className="p-4">Courier Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConsignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No consignments found. Book parcels from the Unbooked Orders tab.
                      </td>
                    </tr>
                  ) : (
                    filteredConsignments.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {c.consignmentId}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {new Date(c.bookedAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{c.courierProvider}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                              {c.mode}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{c.recipientName}</div>
                          <div className="text-[11px] text-slate-500">{c.recipientPhone}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.recipientAddress}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900">৳{c.codAmount.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">Fee: ৳{c.deliveryFee}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenLabel(c.consignmentId)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-[#04BBFD] text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Sticker</span>
                          </button>
                          <a
                            href={c.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Track</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SETTINGS & SANDBOX ================= */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs max-w-3xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Courier Gateway Integration</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle sandbox simulation mode or enter live production keys.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">Sandbox / Simulation Mode</span>
              <input
                type="checkbox"
                checked={config.sandboxMode}
                onChange={(e) => setConfig(prev => ({ ...prev, sandboxMode: e.target.checked }))}
                className="w-4 h-4 rounded text-[#04BBFD] focus:ring-[#04BBFD]"
              />
            </label>
          </div>

          {/* Steadfast */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Steadfast Courier API</h3>
              <button
                type="button"
                onClick={() => handleTestConnection("STEADFAST")}
                disabled={testingConnection === "STEADFAST"}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                {testingConnection === "STEADFAST" ? "Testing..." : "⚡ Test Connection"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="Enter Steadfast API Key"
                  value={config.steadfastApiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, steadfastApiKey: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#04BBFD]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Secret Key</label>
                <input
                  type="password"
                  placeholder="Enter Steadfast Secret Key"
                  value={config.steadfastSecretKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, steadfastSecretKey: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#04BBFD]"
                />
              </div>
            </div>
          </div>

          {/* Pathao */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pathao Courier API</h3>
              <button
                type="button"
                onClick={() => handleTestConnection("PATHAO")}
                disabled={testingConnection === "PATHAO"}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                {testingConnection === "PATHAO" ? "Testing..." : "⚡ Test Connection"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Client ID</label>
                <input
                  type="text"
                  placeholder="Pathao Client ID"
                  value={config.pathaoClientId}
                  onChange={(e) => setConfig(prev => ({ ...prev, pathaoClientId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#04BBFD]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Client Secret</label>
                <input
                  type="password"
                  placeholder="Pathao Client Secret"
                  value={config.pathaoClientSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, pathaoClientSecret: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#04BBFD]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Store ID</label>
                <input
                  type="text"
                  placeholder="Pathao Store ID"
                  value={config.pathaoStoreId}
                  onChange={(e) => setConfig(prev => ({ ...prev, pathaoStoreId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#04BBFD]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#04BBFD]/20 cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* ================= 4x6 INCH THERMAL LABEL MODAL ================= */}
      {selectedLabel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <h3 className="font-extrabold text-sm text-slate-900">4x6 Thermal Shipping Sticker Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#04BBFD] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Print Sticker
                </button>
                <button
                  onClick={() => setSelectedLabel(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Print Container (Standard 4x6 inch / 100x150mm layout) */}
            <div className="mt-4 p-5 border-2 border-dashed border-slate-400 rounded-2xl bg-white font-mono text-slate-900 printable-thermal-label">
              <div className="flex justify-between items-start border-b-2 border-black pb-3">
                <div>
                  <h4 className="font-black text-lg tracking-tight uppercase">{selectedLabel.storeName}</h4>
                  <p className="text-[11px]">Hotline: {selectedLabel.storePhone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-black text-white text-xs font-bold uppercase">
                    {selectedLabel.courierProvider}
                  </span>
                  <p className="text-[10px] mt-1">{selectedLabel.cityZone}</p>
                </div>
              </div>

              {/* Barcode Mock */}
              <div className="my-4 text-center py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="tracking-[6px] text-2xl font-black">{selectedLabel.barcodeValue}</div>
                <div className="text-[11px] font-bold text-slate-600">*{selectedLabel.consignmentId}*</div>
              </div>

              {/* Recipient Details */}
              <div className="border-2 border-black p-3 rounded-lg mb-3">
                <div className="text-[10px] font-bold uppercase text-slate-500">SHIP TO (RECIPIENT):</div>
                <div className="font-black text-base mt-0.5">{selectedLabel.recipientName}</div>
                <div className="font-bold text-sm text-black">{selectedLabel.recipientPhone}</div>
                <div className="text-xs mt-1 leading-snug">{selectedLabel.recipientAddress}</div>
              </div>

              {/* COD Box */}
              <div className="grid grid-cols-2 gap-2 border-2 border-black bg-slate-100 p-3 rounded-lg text-center">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">COLLECT ON DELIVERY</div>
                  <div className="text-2xl font-black text-black">৳{selectedLabel.codAmount.toLocaleString()}</div>
                </div>
                <div className="border-l-2 border-black pl-2">
                  <div className="text-[10px] font-bold uppercase text-slate-500">WEIGHT</div>
                  <div className="text-xl font-black text-black">{selectedLabel.weightGrams}g</div>
                </div>
              </div>

              <div className="text-[10px] mt-3 text-slate-500 text-center">
                {selectedLabel.note || "Please allow customer checking before cash collection."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

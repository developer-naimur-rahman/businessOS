"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../../lib/api-client"
import { 
  Bot, Send, MessageSquare, CheckCircle2, XCircle, AlertTriangle, 
  RefreshCw, ShieldCheck, Phone, Check, Smartphone, Layers
} from "lucide-react"
import { toast } from "sonner"

export default function OrderConfirmationBotPage() {
  const [loading, setLoading] = useState(false)
  const [queue, setQueue] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)

  // Webhook Simulator State
  const [simulatorPhone, setSimulatorPhone] = useState("01712345678")
  const [simulatorReply, setSimulatorReply] = useState("1")
  const [simulating, setSimulating] = useState(false)

  // Risk Check State
  const [riskData, setRiskData] = useState<any>(null)
  const [checkingRisk, setCheckingRisk] = useState(false)

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/automation/order-bot/queue")
      setQueue(res.data || [])
    } catch (err) {
      console.error("Failed to load bot queue:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendConfirmation = async (saleId: string) => {
    setTriggeringId(saleId)
    try {
      const res = await api.post("/admin/automation/order-bot/send-confirmation", {
        saleId,
        channel: "WHATSAPP",
      })
      toast.success(res.data.message || "Confirmation message sent")
      loadQueue()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to trigger confirmation")
    } finally {
      setTriggeringId(null)
    }
  }

  const handleSimulateReply = async (replyValue: string) => {
    setSimulating(true)
    try {
      const res = await api.post("/admin/automation/order-bot/webhook-reply", {
        saleId: selectedOrder?.saleId,
        customerPhone: simulatorPhone,
        replyText: replyValue,
      })
      toast.success(res.data.message || "Simulated reply processed")
      loadQueue()
    } catch (err: any) {
      toast.error("Simulation failed")
    } finally {
      setSimulating(false)
    }
  }

  const handleCheckRisk = async (phone: string) => {
    setCheckingRisk(true)
    try {
      const res = await api.get(`/admin/automation/order-bot/risk-check/${phone}`)
      setRiskData(res.data)
      toast.info(`Customer Risk Level: ${res.data.riskLevel}`)
    } catch (err) {
      toast.error("Failed to evaluate risk")
    } finally {
      setCheckingRisk(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Bot className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Interactive COD Verification Engine
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Automated WhatsApp & SMS Order Bot</h1>
          <p className="text-slate-400 text-xs mt-1">
            Zero-touch COD confirmation: customer replies "1" to auto-confirm or "2" to cancel.
          </p>
        </div>

        <button
          onClick={loadQueue}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Queue (Col 8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-slate-900">COD Verification Queue</h2>
            <span className="text-xs font-bold text-slate-500">
              Total Pending: {queue.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">COD Amount</th>
                  <th className="p-4">Bot Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No orders currently waiting for verification.
                    </td>
                  </tr>
                ) : (
                  queue.map((order) => {
                    const isSelected = selectedOrder?.saleId === order.saleId
                    return (
                      <tr 
                        key={order.saleId}
                        onClick={() => {
                          setSelectedOrder(order)
                          setSimulatorPhone(order.customerPhone)
                          handleCheckRisk(order.customerPhone)
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-sky-50/70" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-4 font-mono font-bold text-slate-900">{order.saleNumber}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{order.customerName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{order.customerPhone}</div>
                        </td>
                        <td className="p-4 font-extrabold text-slate-900">
                          ৳{order.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.botStatus === "CONFIRMED_1"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : order.botStatus === "CANCELLED_2"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {order.verificationBadge || order.botStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendConfirmation(order.saleId)
                            }}
                            disabled={triggeringId === order.saleId}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            {triggeringId === order.saleId ? "Sending..." : "⚡ Send Message"}
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

        {/* Webhook Reply Simulator & Risk Guard (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Risk Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Customer Risk Profile</span>
              </h3>
              {riskData && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  riskData.riskLevel === "LOW_RISK"
                    ? "bg-emerald-50 text-emerald-700"
                    : riskData.riskLevel === "MEDIUM_RISK"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
                }`}>
                  {riskData.riskLevel}
                </span>
              )}
            </div>

            {riskData ? (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Success:</span>
                    <span className="font-extrabold text-emerald-600">{riskData.deliverySuccessRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Past Orders:</span>
                    <span className="font-bold text-slate-800">{riskData.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Past Cancellations:</span>
                    <span className="font-bold text-rose-600">{riskData.cancelledOrders}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 font-medium italic">{riskData.recommendation}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select an order from the queue to evaluate risk.</p>
            )}
          </div>

          {/* Interactive Webhook Simulator */}
          <div className="bg-gradient-to-br from-slate-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-900 space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <Smartphone className="w-4 h-4" />
                <span>Webhook Reply Simulator</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Simulate customer replying on WhatsApp or SMS
              </p>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Customer Phone</label>
              <input
                type="text"
                value={simulatorPhone}
                onChange={(e) => setSimulatorPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleSimulateReply("1")}
                disabled={simulating}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <span className="text-base font-black">Press 1 (YES)</span>
                <span className="text-[10px] text-emerald-200">Confirm Order</span>
              </button>

              <button
                onClick={() => handleSimulateReply("2")}
                disabled={simulating}
                className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <span className="text-base font-black">Press 2 (NO)</span>
                <span className="text-[10px] text-rose-200">Cancel Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

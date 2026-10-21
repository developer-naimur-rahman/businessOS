"use client"
import React, { useState } from "react"
import { api } from "../../../../lib/api-client"
import { Search, Package, Clock, Truck, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function OrderTrackingPage() {
  const [identifier, setIdentifier] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState("")

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      toast.error("Please enter your Order ID or Sale Number.")
      return
    }

    setLoading(true)
    setError("")
    setOrder(null)

    try {
      const res = await api.post('/public/orders/track', {
        identifier: identifier.trim(),
        phone: phone.trim() || undefined,
      })
      setOrder(res.data)
      toast.success("Order details retrieved.")
    } catch (err: any) {
      const msg = err.response?.data?.message || "Order not found. Please verify the order reference and phone number."
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const isCancelled = order?.status === 'CANCELLED'
  const isDelivered = order?.status === 'COMPLETED'
  
  let activeStep = 1
  const latestLog = order?.timeline?.[order.timeline.length - 1]
  const fulfillment = latestLog?.fulfillmentStatus || order?.lines?.[0]?.fulfillmentStatus

  if (isDelivered) {
    activeStep = 4
  } else if (fulfillment === 'READY_FOR_PICKUP') {
    activeStep = 3
  } else if (fulfillment === 'PROCESSING') {
    activeStep = 2
  } else {
    activeStep = 1
  }

  return (
    <div className="max-w-[850px] mx-auto px-6 py-16 animate-in fade-in duration-500">
      
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
      </Link>

      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-2">Track Your Order</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Enter your order reference and the phone number used during checkout to view real-time fulfillment status.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs mb-10">
        <form onSubmit={handleTrack} className="space-y-4">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Order Reference / ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. SALE-2026-000001 or Order UUID"
                className="control-input h-12 w-full rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Customer Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01700000000"
                className="control-input h-12 w-full rounded-xl text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">Used to securely verify you own this order.</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="control-button-primary w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>Checking status...</>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Track Order Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tracking Results */}
      {order && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Order Header Summary */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-bold text-slate-900 text-lg">Order #{order.saleNumber}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                  order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                  order.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Customer: {order.customer?.name} ({order.customer?.phone}) • Date: {new Date(order.saleDate).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Amount</span>
              <span className="text-2xl font-bold text-slate-900">৳{Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Stepper (if not cancelled) */}
          {!isCancelled && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
              <h3 className="text-base font-semibold text-slate-900 mb-8">Fulfillment Progress</h3>
              <div className="relative flex items-center justify-between">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0" />
                <div 
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 -z-0" 
                  style={{ width: `${((activeStep - 1) / 3) * 100}%` }}
                />

                {[
                  { step: 1, label: 'Order Placed', icon: Package },
                  { step: 2, label: 'Processing', icon: Clock },
                  { step: 3, label: 'Dispatched / Ready', icon: Truck },
                  { step: 4, label: 'Delivered', icon: CheckCircle2 },
                ].map((s) => {
                  const isPast = activeStep >= s.step
                  const isCurrent = activeStep === s.step
                  const Icon = s.icon

                  return (
                    <div key={s.step} className="flex flex-col items-center relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 shadow-sm ${
                        isPast 
                          ? 'bg-emerald-500 text-white shadow-emerald-100' 
                          : 'bg-white border-2 border-slate-200 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-semibold mt-3 text-center ${
                        isCurrent ? 'text-slate-900' : isPast ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="bg-slate-50/80 rounded-3xl p-8 border border-slate-200/70">
              <h3 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> Status History & Audit Trail
              </h3>
              <div className="space-y-4">
                {order.timeline.map((entry: any, idx: number) => (
                  <div key={entry.id || idx} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm capitalize">
                          {entry.action?.replace(/_/g, ' ').toLowerCase() || 'Status Update'}
                        </span>
                        {entry.fulfillmentStatus && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {entry.fulfillmentStatus}
                          </span>
                        )}
                      </div>
                      {entry.note && (
                        <p className="text-xs text-slate-600 mt-1">{entry.note}</p>
                      )}
                      {entry.courier && (
                        <p className="text-xs font-medium text-blue-700 mt-1">
                          Courier: {entry.courier} {entry.trackingCode ? `• #${entry.trackingCode}` : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-3">
              Order Items
            </h3>
            <div className="divide-y divide-slate-100">
              {order.lines.map((l: any) => (
                <div key={l.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{l.productName}</p>
                    <p className="text-xs text-slate-500">Qty: {Number(l.quantity)} • SKU: {l.sku || 'N/A'}</p>
                  </div>
                  <span className="font-semibold text-slate-900">৳{Number(l.lineTotal).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}

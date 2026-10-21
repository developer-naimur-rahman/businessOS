"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "../../../../lib/api-client"
import { 
  CheckCircle2, ArrowRight, Package, Truck, Clock, 
  MapPin, AlertCircle, RefreshCw, Printer 
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { A4InvoiceTemplate } from "../../../../components/pos/A4InvoiceTemplate"

export default function OrderSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [tracking, setTracking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviewingLineId, setReviewingLineId] = useState<string | null>(null)

  const fetchOrderData = async () => {
    if (!params.id) return
    setLoading(true)
    try {
      // First try customer authenticated order track
      const trackRes = await api.get(`/public/orders/${params.id}/track`).catch(() => null)
      if (trackRes?.data) {
        setTracking(trackRes.data)
        setOrder(trackRes.data)
      } else {
        const res = await api.get(`/public/orders/${params.id}`)
        setOrder(res.data)
      }
    } catch (err: any) {
      console.error("Failed to load order", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderData()
  }, [params.id])

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-32 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading live order & tracking details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-32 text-center animate-in fade-in">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2 text-slate-900">Order not found</h1>
        <p className="text-slate-500 mb-6">We couldn't locate this order, or it may require guest verification.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/order/track" className="control-button-primary h-11 px-6 rounded-full inline-flex items-center text-sm">
            Track with Phone Verification
          </Link>
          <Link href="/" className="control-button-secondary h-11 px-6 rounded-full inline-flex items-center text-sm">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const orderNumber = order.saleNumber || order.invoiceNumber || order.id?.slice(0, 8)
  const isCancelled = order.status === 'CANCELLED'
  const isDelivered = order.status === 'COMPLETED'
  
  // Calculate current stage for the tracker
  // 1 = Placed, 2 = Processing, 3 = Shipped / Ready, 4 = Delivered
  let activeStep = 1
  const latestLog = tracking?.timeline?.[tracking.timeline.length - 1]
  const fulfillment = latestLog?.fulfillmentStatus || order.lines?.[0]?.fulfillmentStatus

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
      
      {/* Header Banner */}
      <div className="text-center mb-12">
        {isCancelled ? (
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
        ) : isDelivered ? (
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10" />
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-2">
          {isCancelled ? 'Order Cancelled' : isDelivered ? 'Order Delivered!' : 'Order Placed Successfully!'}
        </h1>
        <p className="text-base text-slate-500">
          Order Reference: <span className="font-semibold text-slate-900">{orderNumber}</span> • Placed on {new Date(order.saleDate || order.createdAt || Date.now()).toLocaleDateString()}
        </p>
      </div>

      {/* Progress Tracker (if not cancelled) */}
      {!isCancelled && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold text-slate-900">Order Progress</h2>
            <button 
              onClick={fetchOrderData}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
            </button>
          </div>

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

      {/* Status History / Audit Trail Timeline */}
      {tracking?.timeline && tracking.timeline.length > 0 && (
        <div className="bg-slate-50/80 rounded-3xl p-8 border border-slate-200/70 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" /> Status & Delivery Timeline
          </h2>
          <div className="space-y-6">
            {tracking.timeline.map((entry: any, idx: number) => (
              <div key={entry.id || idx} className="flex items-start gap-4 text-sm relative">
                {idx !== tracking.timeline.length - 1 && (
                  <div className="absolute left-[13px] top-6 bottom-[-24px] w-0.5 bg-slate-200" />
                )}
                <div className="w-7 h-7 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shrink-0 z-10">
                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                </div>
                <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-slate-900 capitalize">
                      {entry.action?.replace(/_/g, ' ').toLowerCase() || 'Status Update'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-slate-600 text-sm mt-1">{entry.note}</p>
                  )}
                  {entry.courier && (
                    <div className="mt-2 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                      Courier: {entry.courier} {entry.trackingCode ? `• Tracking: ${entry.trackingCode}` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Summary & Review Form */}
      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
        <h2 className="text-xl font-semibold mb-6 border-b border-slate-200 pb-4">Purchased Items</h2>
        
        <div className="space-y-4 mb-8">
          {(order.lines || []).map((line: any) => {
            const productName = line.productName || line.variant?.product?.name || line.product?.name || 'Product'
            const lineTotal = Number(line.lineTotal || (Number(line.unitPrice) * line.quantity) || 0)
            const productId = line.variant?.productId || line.productId

            return (
              <div key={line.id} className="border-b border-slate-200/60 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">{productName}</p>
                    <p className="text-sm text-slate-500">Qty: {Number(line.quantity)} × ৳{Number(line.unitPrice).toLocaleString()}</p>
                    {line.fulfillmentStatus && (
                      <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {line.fulfillmentStatus}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-semibold text-slate-900">৳{lineTotal.toLocaleString()}</div>
                    {productId && (
                      <button 
                        onClick={() => setReviewingLineId(reviewingLineId === line.id ? null : line.id)}
                        className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        {reviewingLineId === line.id ? 'Cancel Review' : 'Leave a Review'}
                      </button>
                    )}
                  </div>
                </div>
                
                {reviewingLineId === line.id && productId && (
                  <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault()
                        const form = e.target as HTMLFormElement
                        const rating = parseInt((form.elements.namedItem('rating') as HTMLSelectElement).value)
                        const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement).value
                        
                        try {
                          await api.post(`/public/catalog/products/${productId}/reviews`, { 
                            rating, 
                            orderId: order.id, 
                            comment 
                          })
                          toast.success('Review submitted successfully!')
                          setReviewingLineId(null)
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || 'Failed to submit review')
                        }
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase mb-1 block">Rating</label>
                        <select name="rating" required className="control-input w-full h-10 bg-slate-50">
                          <option value="5">5 - Excellent</option>
                          <option value="4">4 - Good</option>
                          <option value="3">3 - Average</option>
                          <option value="2">2 - Poor</option>
                          <option value="1">1 - Terrible</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase mb-1 block">Comment</label>
                        <textarea name="comment" className="control-input w-full h-20 py-2 resize-none bg-slate-50 text-sm" placeholder="What did you think of the product?"></textarea>
                      </div>
                      <button type="submit" className="control-button-primary w-full h-9 text-sm">Submit Review</button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-lg font-semibold">
          <span className="text-slate-900">Total</span>
          <span className="text-slate-900">৳{Number(order.total || order.totalAmount || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => window.print()}
          className="control-button-primary h-12 px-8 rounded-full inline-flex items-center text-sm shadow-sm gap-2"
        >
          <Printer className="w-4 h-4" /> Download / Print Invoice
        </button>
        <Link href="/account" className="control-button-secondary h-12 px-8 rounded-full inline-flex items-center text-sm">
          View My Account <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
        <Link href="/order/track" className="control-button-secondary h-12 px-8 rounded-full inline-flex items-center text-sm">
          Track Another Order
        </Link>
      </div>

      {/* Hidden print container: activates on window.print() */}
      <div className="hidden print:block">
        <A4InvoiceTemplate sale={order} />
      </div>

    </div>
  )
}

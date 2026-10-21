"use client"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "../../../../lib/api-client"
import { 
  ArrowLeft, Package, Clock, Truck, CheckCircle2, 
  AlertCircle, User, MapPin, Receipt, RefreshCw, Printer, ExternalLink 
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { A4InvoiceTemplate } from "../../../../components/pos/A4InvoiceTemplate"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Status Update state
  const [targetStatus, setTargetStatus] = useState<string>("DRAFT")
  const [targetFulfillment, setTargetFulfillment] = useState<string>("PROCESSING")
  const [courier, setCourier] = useState<string>("")
  const [trackingCode, setTrackingCode] = useState<string>("")
  const [note, setNote] = useState<string>("")

  const fetchOrder = useCallback(async () => {
    if (!params.id) return
    setLoading(true)
    try {
      const res = await api.get(`/sales/orders/${params.id}`)
      setOrder(res.data)
      setTargetStatus(res.data.status)
      const currentFulfillment = res.data.lines?.[0]?.fulfillmentStatus || 'QUEUED'
      setTargetFulfillment(currentFulfillment === 'QUEUED' ? 'PROCESSING' : currentFulfillment)
    } catch (err: any) {
      console.error("Failed to load order details", err)
      toast.error("Failed to load order: " + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    setUpdating(true)
    try {
      await api.patch(`/sales/orders/${order.id}/status`, {
        status: targetStatus,
        fulfillmentStatus: targetStatus === 'COMPLETED' ? 'COMPLETED' : targetStatus === 'CANCELLED' ? 'CANCELLED' : targetFulfillment,
        courier: courier.trim() || undefined,
        trackingCode: trackingCode.trim() || undefined,
        note: note.trim() || undefined,
      })

      toast.success("Order status updated successfully!")
      setNote("")
      fetchOrder()
    } catch (err: any) {
      toast.error("Status update failed: " + (err.response?.data?.message || err.message))
    } finally {
      setUpdating(false)
    }
  }

  const [verifyingPayment, setVerifyingPayment] = useState(false)

  const handleVerifyPayment = async () => {
    if (!order) return
    setVerifyingPayment(true)
    try {
      await api.patch(`/sales/orders/${order.id}/verify-payment`)
      toast.success("Payment marked as verified and paid!")
      fetchOrder()
    } catch (err: any) {
      toast.error("Failed to verify payment: " + (err.response?.data?.message || err.message))
    } finally {
      setVerifyingPayment(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-100 rounded-2xl"></div>
          <div className="h-40 bg-slate-100 rounded-2xl"></div>
          <div className="h-40 bg-slate-100 rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h1>
        <p className="text-slate-500 mb-6">The requested order could not be loaded.</p>
        <Link href="/admin/orders" className="control-button-primary h-10 px-6 rounded-lg text-sm inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Link>
      </div>
    )
  }

  const isCancelled = order.status === 'CANCELLED'
  const isCompleted = order.status === 'COMPLETED'
  const placedLog = order.auditLogs?.find((l: any) => l.action === 'ORDER_PLACED')
  const shippingAddress = (placedLog?.newData as any)?.shippingAddress || 'Store Pickup'
  const customerNotes = (placedLog?.newData as any)?.notes

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Top Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Orders List
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Order #{order.saleNumber || order.id?.slice(0, 8)}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isCompleted ? 'bg-emerald-100 text-emerald-800' :
              isCancelled ? 'bg-rose-100 text-rose-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {order.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
              order.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
              'bg-slate-200 text-slate-700'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {new Date(order.saleDate || order.createdAt).toLocaleString()} • Branch: {order.branch?.name || 'Main Branch'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="control-button-primary h-10 px-4 text-xs font-semibold flex items-center shadow-xs hover:shadow-md"
          >
            <Printer className="w-3.5 h-3.5 mr-2" /> Download / Print Invoice
          </button>
          <button 
            onClick={fetchOrder}
            className="control-button-secondary h-10 px-4 text-xs font-semibold flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer Card */}
        <div className="surface-elevated p-6">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <User className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Details</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-base">{order.customer?.name || 'Guest / Walk-in'}</h3>
            <p className="text-xs text-slate-600">Phone: <span className="font-medium text-slate-900">{order.customer?.phone || (placedLog?.newData as any)?.customerPhone || 'Not provided'}</span></p>
            <p className="text-xs text-slate-600">Email: <span className="font-medium text-slate-900">{order.customer?.email || 'Not provided'}</span></p>
          </div>
        </div>

        {/* Delivery / Shipping Card */}
        <div className="surface-elevated p-6">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Shipping & Destination</span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-600">Address:</p>
            <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              {shippingAddress}
            </p>
            {customerNotes && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Notes: {customerNotes}
              </p>
            )}
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="surface-elevated p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Receipt className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Financial Overview</span>
              </div>
              {/* Payment Method Badge */}
              {(() => {
                const paymentRef = order.payments?.[0]?.reference || ''
                const provider = (placedLog?.newData as any)?.paymentProvider || 
                  (paymentRef.includes('bKash') ? 'bKash' : paymentRef.includes('Nagad') ? 'Nagad' : paymentRef.includes('BANK') ? 'Bank Transfer' : order.payments?.[0]?.method || (placedLog?.newData as any)?.paymentMethod || 'CASH')
                
                const isBkash = provider === 'bKash' || paymentRef.includes('bKash')
                const isNagad = provider === 'Nagad' || paymentRef.includes('Nagad')
                const isBank = provider === 'BANK' || provider === 'Bank Transfer' || paymentRef.includes('BANK')

                return (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    isBkash ? 'bg-pink-50 text-[#E2136E] border-pink-200' :
                    isNagad ? 'bg-orange-50 text-[#F7941D] border-orange-200' :
                    isBank ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {provider}
                  </span>
                )
              })()}
            </div>

            {/* Payment Details (TrxID, Sender, Coupon) */}
            {(() => {
              const paymentRef = order.payments?.[0]?.reference || ''
              const sender = (placedLog?.newData as any)?.senderPhone || paymentRef.match(/Sender:\s*([^\s|]+)/)?.[1]
              const trx = (placedLog?.newData as any)?.transactionId || paymentRef.match(/TrxID:\s*([^\s|]+)/)?.[1]
              const coupon = (placedLog?.newData as any)?.couponCode

              return (
                <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5 text-xs">
                  {sender && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sender Phone:</span>
                      <span className="font-semibold text-slate-800">{sender}</span>
                    </div>
                  )}
                  {trx && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">TrxID:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {trx}
                      </span>
                    </div>
                  )}
                  {coupon && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coupon Code:</span>
                      <span className="font-bold text-emerald-700">{coupon}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">৳{Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount:</span>
                <span className="font-medium text-slate-900">৳{Number(order.discount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total:</span>
                <span>৳{Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* One-Click Mark Paid Button */}
          {order.paymentStatus !== 'PAID' && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={handleVerifyPayment}
                disabled={verifyingPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {verifyingPayment ? "Verifying..." : "Mark Payment Verified / Paid"}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Status Transition Control Panel */}
      {!isCancelled && (
        <div className="surface-elevated p-6 border-l-4 border-l-blue-600">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Update Order Status & Fulfillment
          </h2>

          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Overall Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="control-input h-10 w-full text-xs font-semibold bg-white"
                >
                  <option value="DRAFT">Pending Fulfillment (DRAFT)</option>
                  <option value="COMPLETED">Delivered & Closed (COMPLETED)</option>
                  <option value="CANCELLED">Cancel Order (Restore Inventory)</option>
                </select>
              </div>

              {targetStatus === 'DRAFT' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Fulfillment Milestone
                  </label>
                  <select
                    value={targetFulfillment}
                    onChange={(e) => setTargetFulfillment(e.target.value)}
                    className="control-input h-10 w-full text-xs font-semibold bg-white"
                  >
                    <option value="QUEUED">Queued for Processing</option>
                    <option value="PROCESSING">Processing & Packaging</option>
                    <option value="READY_FOR_PICKUP">Dispatched / Ready for Pickup</option>
                  </select>
                </div>
              )}

              {(targetFulfillment === 'READY_FOR_PICKUP' || targetStatus === 'COMPLETED') && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Courier / Service
                    </label>
                    <input
                      type="text"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      placeholder="e.g. Steadfast / Pathao / Rider"
                      className="control-input h-10 w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Consignment / Tracking #
                    </label>
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="e.g. TRK-98124"
                      className="control-input h-10 w-full text-xs"
                    />
                  </div>
                </>
              )}

            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Audit Trail Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={targetStatus === 'CANCELLED' ? "Reason for order cancellation (recorded in immutable audit log)..." : "Internal note for this status update..."}
                className="control-input h-10 w-full text-xs"
              />
            </div>

            {targetStatus === 'CANCELLED' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                ⚠️ Warning: Cancelling this order will automatically restore reserved stock to the warehouse and cancel any pending fulfillments.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updating}
                className={`h-10 px-6 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                  targetStatus === 'CANCELLED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {updating ? "Saving Update..." : "Apply Status Transition"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Ordered Line Items</h2>
          <span className="text-xs text-slate-500">{order.lines?.length || 0} line items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-semibold text-slate-600 px-4 py-3">Product Name</th>
                <th className="font-semibold text-slate-600 px-4 py-3">SKU</th>
                <th className="font-semibold text-slate-600 px-4 py-3 text-right">Unit Price</th>
                <th className="font-semibold text-slate-600 px-4 py-3 text-center">Qty</th>
                <th className="font-semibold text-slate-600 px-4 py-3 text-right">Line Total</th>
                <th className="font-semibold text-slate-600 px-4 py-3 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(order.lines || []).map((line: any) => {
                const product = line.variant?.product;
                const isDropship = Boolean(product?.isDropship);
                const supplierName = product?.supplierName;
                const supplierUrl = product?.supplierUrl;
                const supplierCost = product?.supplierCost;

                return (
                  <tr key={line.id} className={`hover:bg-slate-50/60 transition-colors ${isDropship ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{line.productNameSnapshot || product?.name || 'Product'}</span>
                          {isDropship && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                              📦 Dropship Item
                            </span>
                          )}
                        </div>
                        {isDropship && (
                          <div className="flex items-center gap-2.5 text-xs text-slate-600 font-normal mt-1 flex-wrap">
                            {supplierName && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                Supplier: <strong className="text-slate-900">{supplierName}</strong>
                              </span>
                            )}
                            {supplierUrl ? (
                              <a
                                href={supplierUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                              >
                                Fulfill from Supplier <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No supplier link provided</span>
                            )}
                            {supplierCost && (
                              <span className="text-slate-500 text-[11px]">
                                Wholesale Cost: ৳{Number(supplierCost).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {line.skuSnapshot || line.variant?.sku || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-right">
                      ৳{Number(line.unitPrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-semibold text-center">
                      {Number(line.quantity)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 text-right">
                      ৳{Number(line.lineTotal).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {line.fulfillmentStatus || 'QUEUED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status History & Audit Trail */}
      <div className="surface-elevated p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" /> Status History & Audit Trail
        </h2>
        {(!order.auditLogs || order.auditLogs.length === 0) ? (
          <p className="text-xs text-slate-400 py-4">No audit events recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {order.auditLogs.map((log: any, idx: number) => (
              <div key={log.id || idx} className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                    {(log.newData as any)?.status && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                        Status: {(log.newData as any).status}
                      </span>
                    )}
                    {(log.newData as any)?.fulfillmentStatus && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-800">
                        {(log.newData as any).fulfillmentStatus}
                      </span>
                    )}
                  </div>
                  {((log.newData as any)?.note || (log.newData as any)?.message) && (
                    <p className="text-xs text-slate-600 mt-1">
                      {(log.newData as any).note || (log.newData as any).message}
                    </p>
                  )}
                  {(log.newData as any)?.courier && (
                    <p className="text-xs font-semibold text-blue-700 mt-1">
                      Courier: {(log.newData as any).courier} {(log.newData as any).trackingCode ? `• #${(log.newData as any).trackingCode}` : ''}
                    </p>
                  )}
                  {log.user && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Performed by: {log.user.firstName ? `${log.user.firstName} ${log.user.lastName || ''}`.trim() : (log.user.name || log.user.email)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden print container: activates on window.print() */}
      <div className="hidden print:block">
        <A4InvoiceTemplate sale={order} />
      </div>

    </div>
  )
}

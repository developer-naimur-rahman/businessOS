"use client"
import React, { useEffect, useState, useCallback } from "react"
import { api } from "../../../lib/api-client"
import { 
  Search, Filter, Package, Truck, CheckCircle2, 
  AlertCircle, Clock, ChevronLeft, ChevronRight, Eye, RefreshCw, X
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Modal } from "../../../components/ui/modal"

export default function AdminOnlineOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 15

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL")

  // Quick Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("DRAFT")
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>("PROCESSING")
  const [courier, setCourier] = useState<string>("")
  const [trackingCode, setTrackingCode] = useState<string>("")
  const [statusNote, setStatusNote] = useState<string>("")
  const [updating, setUpdating] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit,
      }
      if (search.trim()) params.search = search.trim()
      if (statusFilter !== "ALL") params.status = statusFilter
      if (paymentFilter !== "ALL") params.paymentStatus = paymentFilter

      const res = await api.get('/sales/orders', { params })
      if (res.data) {
        setOrders(res.data.items || [])
        setTotal(res.data.total || 0)
        setTotalPages(res.data.totalPages || 1)
      }
    } catch (err: any) {
      console.error("Failed to load online orders", err)
      toast.error("Failed to load orders: " + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, paymentFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleOpenStatusModal = (order: any) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    const currentFulfillment = order.lines?.[0]?.fulfillmentStatus || 'QUEUED'
    setFulfillmentStatus(currentFulfillment === 'QUEUED' ? 'PROCESSING' : currentFulfillment)
    setCourier("")
    setTrackingCode("")
    setStatusNote("")
    setIsUpdateModalOpen(true)
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    setUpdating(true)
    try {
      await api.patch(`/sales/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        fulfillmentStatus: newStatus === 'COMPLETED' ? 'COMPLETED' : newStatus === 'CANCELLED' ? 'CANCELLED' : fulfillmentStatus,
        courier: courier.trim() || undefined,
        trackingCode: trackingCode.trim() || undefined,
        note: statusNote.trim() || undefined,
      })

      toast.success(`Order #${selectedOrder.saleNumber} status updated to ${newStatus}`)
      setIsUpdateModalOpen(false)
      fetchOrders()
    } catch (err: any) {
      toast.error("Failed to update status: " + (err.response?.data?.message || err.message))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Online Order Management</h1>
          <p className="text-slate-500">Track, fulfill, and manage storefront customer orders and shipments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOrders}
            className="control-button-secondary h-10 px-4 flex items-center text-sm shadow-xs"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
          <Link href="/admin/sales" className="control-button-secondary h-10 px-4 flex items-center text-sm">
            All Sales History
          </Link>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{total}</div>
        </div>
        <div className="surface-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Active / Pending</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {orders.filter(o => o.status === 'DRAFT').length} <span className="text-xs font-normal text-slate-500">on this page</span>
          </div>
        </div>
        <div className="surface-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Fulfilled / Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            {orders.filter(o => o.status === 'COMPLETED').length} <span className="text-xs font-normal text-slate-500">on this page</span>
          </div>
        </div>
        <div className="surface-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Cancelled</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-900">
            {orders.filter(o => o.status === 'CANCELLED').length} <span className="text-xs font-normal text-slate-500">on this page</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search order #, customer, phone..." 
            className="control-input pl-9 h-10 w-full text-sm"
          />
          {search && (
            <button 
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Chips */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {['ALL', 'DRAFT', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === st 
                    ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st === 'DRAFT' ? 'Pending' : st === 'COMPLETED' ? 'Delivered' : 'Cancelled'}
              </button>
            ))}
          </div>

          {/* Payment Status Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="control-input h-9 text-xs rounded-lg px-2.5 bg-white border border-slate-200"
          >
            <option value="ALL">All Payments</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
          </select>

        </div>
      </div>

      {/* Orders Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-semibold text-slate-600 px-4 py-3">Order Number</th>
                <th className="font-semibold text-slate-600 px-4 py-3">Date</th>
                <th className="font-semibold text-slate-600 px-4 py-3">Customer</th>
                <th className="font-semibold text-slate-600 px-4 py-3">Items</th>
                <th className="font-semibold text-slate-600 px-4 py-3 text-right">Total Amount</th>
                <th className="font-semibold text-slate-600 px-4 py-3">Payment</th>
                <th className="font-semibold text-slate-600 px-4 py-3">Order Status</th>
                <th className="font-semibold text-slate-600 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-5 bg-slate-100 rounded-md w-full"></div>
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No orders found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const itemsCount = order.lines?.length || 0
                  const isDraft = order.status === 'DRAFT'
                  const isCompleted = order.status === 'COMPLETED'
                  const isOrderCancelled = order.status === 'CANCELLED'

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <Link href={`/admin/orders/${order.id}`} className="hover:text-blue-600 underline-offset-2 hover:underline">
                          {order.saleNumber || `#${order.id.slice(0, 8)}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {new Date(order.saleDate || order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 line-clamp-1">{order.customer?.name || 'Walk-in / Guest'}</div>
                        <div className="text-xs text-slate-400">{order.customer?.phone || 'No phone'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 text-right whitespace-nowrap">
                        ৳{Number(order.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          order.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' :
                          isOrderCancelled ? 'bg-rose-100 text-rose-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {isCompleted ? 'Delivered' : isDraft ? 'Pending' : 'Cancelled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {!isOrderCancelled && (
                            <button
                              onClick={() => handleOpenStatusModal(order)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Status
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/70 text-xs text-slate-500 bg-slate-50/30">
          <span>
            Showing {orders.length} of {total} orders
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Quick Status Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          title={`Update Status: Order #${selectedOrder.saleNumber}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Order Lifecycle State
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="control-input h-10 w-full text-sm bg-white"
              >
                <option value="DRAFT">Pending Fulfillment (DRAFT)</option>
                <option value="COMPLETED">Completed / Delivered (COMPLETED)</option>
                <option value="CANCELLED">Cancel Order (Restores Stock)</option>
              </select>
            </div>

            {newStatus === 'DRAFT' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Fulfillment Milestone
                </label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value)}
                  className="control-input h-10 w-full text-sm bg-white"
                >
                  <option value="QUEUED">Queued for Processing</option>
                  <option value="PROCESSING">Processing / Packing</option>
                  <option value="READY_FOR_PICKUP">Dispatched / Ready for Pickup</option>
                </select>
              </div>
            )}

            {(fulfillmentStatus === 'READY_FOR_PICKUP' || newStatus === 'COMPLETED') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Courier Service
                  </label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g. Steadfast / Pathao"
                    className="control-input h-10 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Tracking Code / Consignment #
                  </label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="e.g. TRK-8921"
                    className="control-input h-10 w-full text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Audit Note / Reason
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={newStatus === 'CANCELLED' ? "Reason for cancellation (required for audit)..." : "Notes recorded in audit log..."}
                className="control-input w-full p-2.5 text-sm resize-none rounded-xl"
              />
            </div>

            {newStatus === 'CANCELLED' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                ⚠️ Warning: Cancelling this order will automatically restore reserved inventory stock to the warehouse and cancel any pending fulfillments. This action is recorded in the audit log.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="control-button-secondary h-10 px-4 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className={`h-10 px-5 text-xs font-semibold text-white rounded-lg shadow-sm ${
                  newStatus === 'CANCELLED' 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {updating ? "Saving..." : "Confirm Status Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}

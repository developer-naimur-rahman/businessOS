"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Search, Filter, Receipt, MoreHorizontal, FileText, Eye } from "lucide-react"
import Link from "next/link"
import { Modal } from "../../../components/ui/modal"

export default function AdminSalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewSale = async (id: string) => {
    try {
      const res = await api.get(`/sales/${id}`)
      setSelectedSale(res.data)
      setIsModalOpen(true)
    } catch (err) {
      console.error("Failed to load sale details", err)
    }
  }

  useEffect(() => {
    async function fetchSales() {
      try {
        const res = await api.get('/sales')
        setSales(res.data)
      } catch (err) {
        console.error("Failed to load sales", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Sales History</h1>
          <p className="text-slate-500">View immutable historical sales, receipts, and order statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/pos" className="control-button-primary shadow-sm h-10 px-4 flex items-center">
            Open POS
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search receipt number or customer..." 
            className="control-input pl-9 h-10 w-full"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="control-button-secondary h-10 px-3 w-full md:w-auto">
            <Filter className="w-4 h-4 mr-2 text-slate-500" /> Filter
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-medium text-slate-500 px-4 py-3">Receipt</th>
                <th className="font-medium text-slate-500 px-4 py-3">Date & Time</th>
                <th className="font-medium text-slate-500 px-4 py-3">Customer</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-center">Payment</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right">Total Amount</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading sales history...</td></tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No sales history found</p>
                    <p className="text-slate-400 text-sm">Completed orders from the POS will appear here.</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale: any) => (
                  <tr key={sale.id} className="table-row-refined group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200/50">
                          <FileText className="w-4 h-4" />
                        </div>
                        <p className="font-semibold text-slate-900 font-mono text-xs">{sale.saleNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p className="font-medium text-slate-900">{new Date(sale.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500">{new Date(sale.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      {sale.customer ? (
                        <p className="font-medium text-slate-900">{sale.customer.name}</p>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Walk-in Customer</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                        sale.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        sale.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                      ৳{Number(sale.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleViewSale(sale.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Receipt ${selectedSale?.saleNumber || ''}`}
        footer={
          <button onClick={() => setIsModalOpen(false)} className="control-button-secondary h-10 px-4">Close</button>
        }
      >
        {selectedSale && (
          <div className="space-y-4 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-medium">{new Date(selectedSale.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-medium">{selectedSale.customer ? selectedSale.customer.name : 'Walk-in'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-medium">{selectedSale.paymentStatus}</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">Items</h4>
              <div className="space-y-2">
                {selectedSale.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.product?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{item.quantity} x ৳{Number(item.unitPrice).toLocaleString()}</p>
                    </div>
                    <span className="font-medium text-slate-900">৳{Number(item.subtotal).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-end">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-lg font-semibold text-slate-900 tabular-nums">৳{Number(selectedSale.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

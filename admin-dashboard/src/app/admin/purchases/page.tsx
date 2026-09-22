'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, FileText, CheckCircle2, ChevronRight, PackageOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { api } from '../../../lib/api-client'

export default function PurchasesPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const res = await api.get('/purchases')
      setPurchases(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredPurchases = purchases.filter((p: any) => 
    statusFilter === 'ALL' ? true : p.status === statusFilter
  )

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Purchases & Goods Receipt</h1>
          <p className="text-slate-500 mt-2">Manage purchase orders and receive inventory from suppliers.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/purchases/new')}
          className="control-button-primary h-12 px-6 shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5 mr-2" /> New Purchase Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 border-b border-slate-200">
        {['ALL', 'DRAFT', 'COMPLETED'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === status 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {status === 'ALL' ? 'All Purchases' : status === 'DRAFT' ? 'Drafts (Pending)' : 'Completed (Received)'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="surface-elevated overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading purchases...</div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <PackageOpen className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Purchases Found</h3>
            <p className="text-slate-500 max-w-md">You haven't created any purchase orders yet. Start by creating a new one to receive inventory.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-medium text-slate-500 px-6 py-4">PO Number / ID</th>
                <th className="font-medium text-slate-500 px-6 py-4">Date</th>
                <th className="font-medium text-slate-500 px-6 py-4">Supplier</th>
                <th className="font-medium text-slate-500 px-6 py-4">Warehouse</th>
                <th className="font-medium text-slate-500 px-6 py-4 text-right">Total</th>
                <th className="font-medium text-slate-500 px-6 py-4 text-center">Status</th>
                <th className="font-medium text-slate-500 px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((p: any) => (
                <tr key={p.id} className="table-row-refined group hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/admin/purchases/${p.id}`)}>
                  <td className="px-6 py-4 font-mono text-slate-900 font-medium">#{p.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(p.purchaseDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{p.supplier?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-slate-600">{p.warehouse?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-right tabular-nums font-semibold text-slate-900">
                    ৳{Number(p.total).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {p.status === 'COMPLETED' ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</>
                      ) : (
                        <><FileText className="w-3 h-3 mr-1" /> Draft</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

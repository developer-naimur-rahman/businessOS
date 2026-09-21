"use client"
import React, { useState, useEffect } from "react"
import { api } from "../../../../lib/api-client"
import { Button } from "../../../../components/ui/button"
import { ArrowLeft, User, FileText, Activity } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<any>(null)
  const [ledger, setLedger] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ledger")
  
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [customerRes, ledgerRes] = await Promise.all([
        api.get(`/business-core/customers/${params.id}`),
        api.get(`/business-core/customers/${params.id}/ledger`)
      ])
      setCustomer(customerRes.data)
      setLedger(ledgerRes.data)
    } catch (error) {
      console.error("Failed to fetch customer data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>
  if (!customer) return <div className="p-8 text-center text-destructive">Customer not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/admin/customers")} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Customer Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="solid-elevated p-6 bg-white space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
              <p className="text-sm text-slate-500">Customer ID: {customer.id.substring(0, 8)}</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">Contact Info</p>
                <p className="text-slate-500">{customer.phone || 'No phone'}</p>
                <p className="text-slate-500">{customer.email || 'No email'}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">Created: {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Ledger & Activities */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary Cards */}
          {ledger && (
            <div className="grid grid-cols-3 gap-4">
              <div className="solid-elevated p-4 bg-white">
                <p className="text-sm text-slate-500 font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">৳{ledger.summary.totalSales.toLocaleString()}</p>
              </div>
              <div className="solid-elevated p-4 bg-white">
                <p className="text-sm text-slate-500 font-medium">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">৳{ledger.summary.totalPaid.toLocaleString()}</p>
              </div>
              <div className="solid-elevated p-4 bg-white">
                <p className="text-sm text-slate-500 font-medium">Outstanding (AR)</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">৳{ledger.summary.outstanding.toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="solid-elevated bg-white">
            <div className="border-b border-slate-100">
              <div className="flex gap-6 px-6">
                <button 
                  onClick={() => setActiveTab('ledger')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ledger' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Ledger Entries
                  </div>
                </button>
              </div>
            </div>
            
            <div className="p-0">
              {activeTab === 'ledger' && ledger && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Ref</th>
                        <th className="px-6 py-3 font-medium text-right">Debit (Sale)</th>
                        <th className="px-6 py-3 font-medium text-right">Credit (Paid)</th>
                        <th className="px-6 py-3 font-medium text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledger.entries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                            No ledger entries found.
                          </td>
                        </tr>
                      ) : (
                        ledger.entries.map((entry: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-slate-600">
                              {new Date(entry.date).toLocaleDateString()}
                              <span className="text-xs text-slate-400 block">{new Date(entry.date).toLocaleTimeString()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                entry.type === 'SALE' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {entry.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-900 font-medium">
                              {entry.type === 'SALE' ? (
                                <a href={`/admin/sales/${entry.saleId}`} className="hover:underline text-indigo-600">
                                  {entry.reference}
                                </a>
                              ) : (
                                entry.reference
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600 tabular-nums">
                              {entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-right text-emerald-600 font-medium tabular-nums">
                              {entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums">
                              ৳{entry.runningBalance.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

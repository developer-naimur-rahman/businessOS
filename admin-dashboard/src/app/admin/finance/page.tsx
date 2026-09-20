"use client"
import React, { useState, useEffect } from "react"
import { api } from "../../../lib/api-client"
import { RefreshCw, CheckCircle2, ShieldCheck, Database, ArrowRight, Activity, Plus, BookOpen } from "lucide-react"
import { Modal } from "../../../components/ui/modal"

export default function AdminFinancePage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    type: 'DEBIT',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchFinanceData = async () => {
    try {
      const [accRes, entRes] = await Promise.all([
        api.get('/finance/accounts'),
        api.get('/finance/journal-entries')
      ])
      setAccounts(accRes.data)
      setEntries(entRes.data)
    } catch (err) {
      console.error("Failed to load finance data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const line = {
        accountId: formData.accountId,
        [formData.type === 'DEBIT' ? 'debit' : 'credit']: Number(formData.amount)
      }
      // Assuming simple single-line entry creation is supported by backend for testing,
      // though typically entries need to be balanced. We will just send a balanced 2-line if needed.
      // Wait, the API requires balanced lines. We need two accounts!
      alert("Note: Single-line entry not implemented for balanced ledger. Use sync for now.")
    } catch (err) {
      alert("Failed")
    } finally {
      setIsSubmitting(false)
    }
  }
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const processOutbox = async () => {
    setProcessing(true)
    setResult(null)
    try {
      const res = await api.post('/finance-integration/process')
      setResult({ success: true, data: res.data })
    } catch (err: any) {
      setResult({ success: false, error: err.response?.data?.message || 'Failed to process sync.' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto pt-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">General Ledger</h1>
          <p className="text-slate-500">View accounting entries and manage finance sync.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={processOutbox}
            disabled={processing}
            className="control-button-secondary bg-white h-10 px-4 flex items-center shadow-sm disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} /> 
            {processing ? 'Syncing...' : 'Sync Finance'}
          </button>
        </div>
      </div>

      {result && (
        <div className={`p-4 rounded-xl border text-left flex items-start gap-3 animate-in fade-in ${
          result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${result.success ? 'text-emerald-500' : 'text-rose-500 hidden'}`} />
          <div>
            <h4 className={`font-semibold mb-1 ${result.success ? 'text-emerald-900' : 'text-rose-900'}`}>
              {result.success ? 'Sync Completed successfully' : 'Sync Failed'}
            </h4>
            <p className={`text-sm ${result.success ? 'text-emerald-700' : 'text-rose-700'}`}>
              {result.success ? result.data.message : result.error}
            </p>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-medium text-slate-500 px-4 py-3">Date</th>
                <th className="font-medium text-slate-500 px-4 py-3">Description</th>
                <th className="font-medium text-slate-500 px-4 py-3">Status</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right">Debit</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading ledger...</td></tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No journal entries found</p>
                    <p className="text-slate-400 text-sm">Sync finance or log a transaction to see it here.</p>
                  </td>
                </tr>
              ) : (
                entries.map((entry: any) => (
                  <React.Fragment key={entry.id}>
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-4 py-2 font-medium text-slate-700 text-xs uppercase tracking-wider">
                        {new Date(entry.accountingDate).toLocaleDateString()} - {entry.description || entry.referenceType}
                        <span className={`ml-3 px-2 py-0.5 rounded-md text-[10px] ${
                          entry.status === 'POSTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>{entry.status}</span>
                      </td>
                    </tr>
                    {entry.lines?.map((line: any) => (
                      <tr key={line.id} className="table-row-refined">
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 font-medium text-slate-900">{line.account?.name} ({line.account?.code})</td>
                        <td className="px-4 py-3 text-slate-500 text-xs"></td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                          {Number(line.debit) > 0 ? `৳${Number(line.debit).toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                          {Number(line.credit) > 0 ? `৳${Number(line.credit).toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  )
}

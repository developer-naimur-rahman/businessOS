"use client"
import React, { useState } from "react"
import { api } from "../../../lib/api-client"
import { RefreshCw, CheckCircle2, ShieldCheck, Database, ArrowRight, Activity } from "lucide-react"

export default function AdminFinanceIntegrationPage() {
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
      <div className="text-center pb-8 border-b border-slate-200/80">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
          <Database className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">Finance Sync Engine</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Manually trigger the Outbox Pattern processor to safely replicate operational data into the immutable accounting ledger.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 shadow-sm text-center">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-12 opacity-70">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-slate-500" />
            </div>
            <span className="text-sm font-medium text-slate-600">Operational DB</span>
            <span className="text-xs text-slate-400 mt-1">Pending Outbox Events</span>
          </div>
          
          <div className="hidden md:flex justify-center">
            <ArrowRight className="w-8 h-8 text-slate-300" />
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-slate-500" />
            </div>
            <span className="text-sm font-medium text-slate-600">Accounting Ledger</span>
            <span className="text-xs text-slate-400 mt-1">Immutable Finance Data</span>
          </div>
        </div>

        <button 
          onClick={processOutbox}
          disabled={processing}
          className="control-button-primary h-14 px-8 rounded-full text-lg mx-auto flex items-center shadow-md hover:shadow-lg disabled:opacity-70"
        >
          {processing ? (
            <><RefreshCw className="w-5 h-5 mr-3 animate-spin" /> Processing Sync...</>
          ) : (
            <><RefreshCw className="w-5 h-5 mr-3" /> Trigger Manual Sync</>
          )}
        </button>

        {result && (
          <div className={`mt-8 p-4 rounded-2xl border text-left flex items-start gap-3 max-w-lg mx-auto animate-in fade-in ${
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
      </div>

    </div>
  )
}

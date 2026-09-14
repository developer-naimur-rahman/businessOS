"use client"
import React, { useState } from "react"
import { Button } from "../../../../components/ui/button"
import { ArrowRightLeft, CheckCircle2, AlertCircle, RefreshCw, Server } from "lucide-react"

export default function FinanceIntegrationPage() {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(new Date().toISOString())

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setLastSync(new Date().toISOString())
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Integration</h1>
          <p className="text-sm text-slate-500 mt-1">Manage synchronization between operational events and the general ledger</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-elevated p-6 rounded-3xl md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Integration Engine</h2>
              <p className="text-sm text-slate-500">Currently running in Auto-Sync mode</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-slate-700">Sales Module Connected</span>
              </div>
              <span className="text-sm text-slate-500">Real-time</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-slate-700">Inventory Module Connected</span>
              </div>
              <span className="text-sm text-slate-500">Real-time</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-slate-700">Payroll Integration</span>
              </div>
              <span className="text-sm text-slate-500">Not configured</span>
            </div>
          </div>
        </div>

        <div className="glass-elevated p-6 rounded-3xl flex flex-col">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Sync Status</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${syncing ? 'bg-primary/20 text-primary animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <RefreshCw className={`w-8 h-8 ${syncing ? 'animate-spin' : ''}`} />
            </div>
            
            <div>
              <p className="font-semibold text-slate-900">{syncing ? 'Synchronizing Events...' : 'All Events Synced'}</p>
              <p className="text-xs text-slate-500 mt-1">
                Last sync: {new Date(lastSync).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <Button 
            className="w-full mt-6 bg-slate-900 text-white hover:bg-slate-800 interaction-bounce"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Force Sync Now'}
          </Button>
        </div>
      </div>

      <div className="solid-elevated p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
          <Server className="w-5 h-5 text-slate-400" /> Recent Event Logs
        </div>
        <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto h-48 overflow-y-auto">
          <div className="space-y-2">
            <p>[{new Date().toISOString()}] INFO: Engine listening for Outbox events...</p>
            <p className="text-slate-400">[{new Date(Date.now() - 5000).toISOString()}] Processing EVENT_SALE_COMPLETED (ID: 8092)</p>
            <p>[{new Date(Date.now() - 4900).toISOString()}] OK: Generated Double-Entry Journal SL-1001</p>
            <p className="text-slate-400">[{new Date(Date.now() - 32000).toISOString()}] Processing EVENT_STOCK_ADJUST (ID: 8091)</p>
            <p>[{new Date(Date.now() - 31800).toISOString()}] OK: Generated Double-Entry Journal INV-990</p>
          </div>
        </div>
      </div>
    </div>
  )
}

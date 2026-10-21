'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Calculator, CircleDollarSign, Calendar, CheckCircle2, AlertTriangle, 
  ArrowDownRight, ArrowUpRight, Lock, Unlock, RefreshCw, Smartphone, 
  Receipt, Banknote, Coins, FileText, Loader2, Save, HelpCircle, History
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../lib/api-client'

interface CashRegisterSummary {
  date: string
  openingBalance: number
  totalCashSales: number
  cashSalesCount: number
  totalMobileBanking: number
  mobileBankingCount: number
  totalBankPayments: number
  bankCount: number
  totalCashExpenses: number
  cashExpensesCount: number
  totalOtherExpenses: number
  expectedClosingBalance: number
  isClosed: boolean
  closingData: any | null
  todayExpenses: Array<{
    id: string
    amount: number
    category: string
    paymentMethod: string
    description: string
    receiptRef?: string
  }>
}

interface RegisterHistoryItem {
  id: string
  date: string
  openingBalance: number
  totalCashSales: number
  totalMobileBanking: number
  totalCashExpenses: number
  expectedClosingBalance: number
  actualCountedCash: number
  variance: number
  notes: string
  closedAt: string
  closedByName: string
}

const DENOMINATIONS = [
  { value: 1000, label: '৳1,000 Note' },
  { value: 500, label: '৳500 Note' },
  { value: 200, label: '৳200 Note' },
  { value: 100, label: '৳100 Note' },
  { value: 50, label: '৳50 Note' },
  { value: 20, label: '৳20 Note' },
  { value: 10, label: '৳10 Note' },
  { value: 5, label: '৳5 / Coins' },
]

export default function CashRegisterPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [closingRegister, setClosingRegister] = useState(false)
  const [history, setHistory] = useState<RegisterHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Opening Float Modal State
  const [isFloatModalOpen, setIsFloatModalOpen] = useState(false)
  const [floatInput, setFloatInput] = useState<string>('0')
  const [savingFloat, setSavingFloat] = useState(false)

  // Denominations State
  const [counts, setCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
  })

  // Direct cash count toggle (for quick reconciliation without denomination breakdown)
  const [useDirectCount, setUseDirectCount] = useState(false)
  const [directCountInput, setDirectCountInput] = useState<string>('')

  // Closing Notes
  const [closingNotes, setClosingNotes] = useState('')

  useEffect(() => {
    fetchRegisterSummary(selectedDate)
    fetchHistory()
  }, [selectedDate])

  const fetchRegisterSummary = async (date: string) => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/cash-register/summary?date=${date}`)
      if (res.data) {
        setSummary(res.data)
        setFloatInput(String(res.data.openingBalance || 0))

        // If closed, populate previous closing counts if available
        if (res.data.isClosed && res.data.closingData) {
          const cd = res.data.closingData
          if (cd.denominationBreakdown) {
            const newCounts: Record<number, number> = { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0 }
            for (const [k, v] of Object.entries(cd.denominationBreakdown)) {
              newCounts[Number(k)] = Number(v) || 0
            }
            setCounts(newCounts)
          }
          if (cd.actualCountedCash !== undefined) {
            setDirectCountInput(String(cd.actualCountedCash))
          }
          if (cd.notes) {
            setClosingNotes(cd.notes)
          }
        } else {
          setClosingNotes('')
        }
      }
    } catch (err: any) {
      console.warn('Failed to load cash register summary', err)
      toast.error('Could not load cash register summary.')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const res = await api.get('/admin/cash-register/history')
      if (Array.isArray(res.data)) {
        setHistory(res.data)
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingHistory(false)
    }
  }

  // Calculate total counted cash
  const denominationTotal = useMemo(() => {
    return Object.entries(counts).reduce((sum, [denom, count]) => {
      return sum + Number(denom) * (Number(count) || 0)
    }, 0)
  }, [counts])

  const actualCountedCash = useMemo(() => {
    if (useDirectCount) {
      return parseFloat(directCountInput) || 0
    }
    return denominationTotal
  }, [useDirectCount, directCountInput, denominationTotal])

  // Variance calculation
  const variance = useMemo(() => {
    const expected = summary?.expectedClosingBalance || 0
    return actualCountedCash - expected
  }, [actualCountedCash, summary?.expectedClosingBalance])

  const handleDenominationChange = (denom: number, value: string) => {
    const parsed = Math.max(0, parseInt(value, 10) || 0)
    setCounts(prev => ({
      ...prev,
      [denom]: parsed,
    }))
  }

  const handleSetOpeningFloat = async (e: React.FormEvent) => {
    e.preventDefault()
    const floatNum = parseFloat(floatInput)
    if (isNaN(floatNum) || floatNum < 0) {
      toast.error('Please enter a valid starting float amount.')
      return
    }

    try {
      setSavingFloat(true)
      const res = await api.post('/admin/cash-register/opening', {
        date: selectedDate,
        openingBalance: floatNum,
      })
      if (res.data?.success) {
        toast.success(res.data.message || 'Opening float updated.')
        setIsFloatModalOpen(false)
        fetchRegisterSummary(selectedDate)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update float.')
    } finally {
      setSavingFloat(false)
    }
  }

  const handleCloseRegister = async () => {
    if (!summary) return

    if (!window.confirm(`Are you sure you want to close and lock the cash register for ${selectedDate}?\n\nExpected: ৳${summary.expectedClosingBalance.toLocaleString()}\nCounted: ৳${actualCountedCash.toLocaleString()}\nVariance: ${variance >= 0 ? '+' : ''}৳${variance.toLocaleString()}`)) {
      return
    }

    try {
      setClosingRegister(true)
      const res = await api.post('/admin/cash-register/close', {
        date: selectedDate,
        openingBalance: summary.openingBalance,
        totalCashSales: summary.totalCashSales,
        totalMobileBanking: summary.totalMobileBanking,
        totalCashExpenses: summary.totalCashExpenses,
        expectedClosingBalance: summary.expectedClosingBalance,
        actualCountedCash,
        variance,
        denominationBreakdown: counts,
        notes: closingNotes.trim(),
      })

      if (res.data?.success) {
        toast.success(res.data.message || 'Register closed and day locked.')
        fetchRegisterSummary(selectedDate)
        fetchHistory()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to close register.')
    } finally {
      setClosingRegister(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Date Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                  Cash Register & Daily Till
                </h1>
                {summary && (
                  summary.isClosed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      Day Locked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Register Active
                    </span>
                  )
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Daily cash drawer reconciliation, POS cash sales verification, and denomination balance audit.
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs self-start lg:self-auto">
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDate === new Date().toISOString().split('T')[0]
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date()
              d.setDate(d.getDate() - 1)
              setSelectedDate(d.toISOString().split('T')[0])
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            Yesterday
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => fetchRegisterSummary(selectedDate)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh summary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Register Locked Banner if already closed */}
      {summary?.isClosed && summary.closingData && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Register Reconciled & Closed for {summary.date}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Closed by {summary.closingData.closedByName || 'Store Cashier'} on{' '}
                {new Date(summary.closingData.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                {summary.closingData.notes && ` Note: "${summary.closingData.notes}"`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Final Variance</div>
              <div className={`text-base font-extrabold ${summary.closingData.variance === 0 ? 'text-emerald-400' : summary.closingData.variance > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {summary.closingData.variance >= 0 ? '+' : ''}৳{summary.closingData.variance.toLocaleString()}
              </div>
            </div>
            <div className="text-right pl-4 border-l border-white/10">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Counted</div>
              <div className="text-base font-extrabold text-white">
                ৳{summary.closingData.actualCountedCash.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Opening Float */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative group">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Opening Float</span>
            {!summary?.isClosed && (
              <button
                onClick={() => setIsFloatModalOpen(true)}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>
          <div className="text-2xl font-black text-slate-900">
            ৳{(summary?.openingBalance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Starting drawer cash</div>
        </div>

        {/* Card 2: Cash In */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> (+) Cash Sales
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {summary?.cashSalesCount || 0} sales
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ৳{(summary?.totalCashSales || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Counter & POS cash in</div>
        </div>

        {/* Card 3: Mobile Banking In */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> (+) bKash/Nagad
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {summary?.mobileBankingCount || 0} trx
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600">
            ৳{(summary?.totalMobileBanking || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Digital wallet receipts</div>
        </div>

        {/* Card 4: Cash Expenses Out */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> (-) Cash Expenses
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
              {summary?.cashExpensesCount || 0} items
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600">
            ৳{(summary?.totalCashExpenses || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Paid out from till</div>
        </div>

        {/* Card 5: Expected in Till */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              (=) Expected Cash
            </span>
            <Calculator className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ৳{(summary?.expectedClosingBalance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Should be physically in drawer</div>
        </div>
      </div>

      {/* Main Reconciliation Workspace: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Physical Cash Count Calculator */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-slate-700" />
                Physical Till Cash Count
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Count Bangladeshi Taka notes and coins physically present in the drawer.
              </p>
            </div>

            {/* Direct Total toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseDirectCount(!useDirectCount)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 cursor-pointer"
              >
                {useDirectCount ? 'Switch to Note Breakdown' : 'Enter Total Amount Directly'}
              </button>
            </div>
          </div>

          {useDirectCount ? (
            /* Direct Total Input */
            <div className="py-6 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Total Physical Cash Counted in Till (BDT ৳)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-lg">৳</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={summary?.isClosed}
                  value={directCountInput}
                  onChange={(e) => setDirectCountInput(e.target.value)}
                  placeholder="e.g. 92496"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white pl-10 pr-4 py-3.5 rounded-2xl text-xl font-black text-slate-900 outline-none transition-all disabled:opacity-60"
                />
              </div>
              <p className="text-xs text-slate-400">
                Tip: Use denomination breakdown below if you prefer counting note-by-note.
              </p>
            </div>
          ) : (
            /* Denomination Counter Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DENOMINATIONS.map(({ value, label }) => {
                const count = counts[value] || 0
                const subtotal = value * count
                return (
                  <div
                    key={value}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors"
                  >
                    <div className="w-28 shrink-0">
                      <div className="text-xs font-bold text-slate-900">{label}</div>
                      <div className="text-[11px] text-slate-400 font-medium">৳{value.toLocaleString()} each</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <span className="text-xs text-slate-400 mr-2">x</span>
                        <input
                          type="number"
                          min="0"
                          disabled={summary?.isClosed}
                          value={count === 0 ? '' : count}
                          onChange={(e) => handleDenominationChange(value, e.target.value)}
                          placeholder="0"
                          className="w-16 text-center font-bold text-sm bg-white border border-slate-200 rounded-xl py-1.5 focus:border-slate-900 outline-none disabled:opacity-60"
                        />
                      </div>
                      <div className="w-20 text-right font-extrabold text-sm text-slate-900 font-mono">
                        ৳{subtotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Calculator Bottom Summary */}
          <div className="p-4 rounded-2xl bg-slate-100/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Total Counted Cash:
            </span>
            <span className="text-xl font-black text-slate-900">
              ৳{actualCountedCash.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right Column (5 cols): Reconciliation & Variance Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-slate-700" />
              Reconciliation Summary
            </h3>

            {/* Expected vs Counted Comparison */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-500 font-medium">Expected in Drawer:</span>
                <span className="font-bold text-slate-900">
                  ৳{(summary?.expectedClosingBalance || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-500 font-medium">Physically Counted:</span>
                <span className="font-extrabold text-slate-900">
                  ৳{actualCountedCash.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Variance:</span>
                <span className={`text-xl font-black ${
                  variance === 0 
                    ? 'text-emerald-600' 
                    : variance > 0 
                    ? 'text-blue-600' 
                    : 'text-rose-600'
                }`}>
                  {variance >= 0 ? '+' : ''}৳{variance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Variance Status Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              variance === 0
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : variance > 0
                ? 'bg-blue-50/80 border-blue-200 text-blue-800'
                : 'bg-rose-50/80 border-rose-200 text-rose-800'
            }`}>
              {variance === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${variance > 0 ? 'text-blue-600' : 'text-rose-600'}`} />
              )}
              <div className="text-xs leading-relaxed">
                {variance === 0 ? (
                  <>
                    <strong>Drawer Balanced!</strong> Physical cash matches expected POS and expense transactions perfectly.
                  </>
                ) : variance > 0 ? (
                  <>
                    <strong>Cash Surplus (+৳{variance.toLocaleString()}):</strong> There is more cash in drawer than recorded transactions. Check for untracked cash sales or tips.
                  </>
                ) : (
                  <>
                    <strong>Cash Shortage (-৳{Math.abs(variance).toLocaleString()}):</strong> Cash drawer is short compared to system expectation. Check for unrecorded cash expenses or change errors.
                  </>
                )}
              </div>
            </div>

            {/* Notes field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Closing Notes / Drawer Explanation
              </label>
              <textarea
                rows={3}
                disabled={summary?.isClosed}
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Optional notes regarding discrepancy or shift handover..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white p-3 rounded-xl text-xs text-slate-800 outline-none transition-all disabled:opacity-60"
              />
            </div>

            {/* Action Button */}
            {!summary?.isClosed ? (
              <button
                type="button"
                onClick={handleCloseRegister}
                disabled={closingRegister || loading}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {closingRegister ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Locking Register...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Close Register & Lock Day
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 text-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                ✓ Cash register has been locked for {summary.date}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Cash Outflows Table for Date */}
      {summary?.todayExpenses && summary.todayExpenses.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                Cash Outflows Paid From Drawer Today
              </h3>
              <p className="text-xs text-slate-400">Expenses deducted directly from the till</p>
            </div>
            <span className="text-sm font-extrabold text-rose-600">
              -৳{summary.totalCashExpenses.toLocaleString()} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Receipt Ref</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.todayExpenses.filter(e => e.paymentMethod === 'CASH').map((exp) => (
                  <tr key={exp.id}>
                    <td className="py-3 px-4 font-bold text-slate-800">{exp.category}</td>
                    <td className="py-3 px-4">{exp.description}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{exp.receiptRef || '—'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                      -৳{exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past Till Closings Audit Trail */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Recent Cash Register Closures
            </h3>
            <p className="text-xs text-slate-400">Audit trail of reconciled drawers</p>
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No register closures logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Cash Sales</th>
                  <th className="py-2.5 px-4">Drawer Out</th>
                  <th className="py-2.5 px-4">Expected</th>
                  <th className="py-2.5 px-4">Counted</th>
                  <th className="py-2.5 px-4">Variance</th>
                  <th className="py-2.5 px-4">Closed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.date}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">+৳{item.totalCashSales.toLocaleString()}</td>
                    <td className="py-3 px-4 text-rose-600 font-semibold">-৳{item.totalCashExpenses.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold">৳{item.expectedClosingBalance.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">৳{item.actualCountedCash.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        item.variance === 0 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : item.variance > 0 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {item.variance >= 0 ? '+' : ''}৳{item.variance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.closedByName || 'Cashier'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Set Opening Float Modal */}
      {isFloatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Set Opening Drawer Float</h3>
              <button
                onClick={() => setIsFloatModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSetOpeningFloat} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Opening Float (৳) for {selectedDate}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={floatInput}
                    onChange={(e) => setFloatInput(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white pl-9 pr-4 py-2.5 rounded-xl text-base font-bold text-slate-900 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cash left in till from previous day or deposited as start float.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFloatModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFloat}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingFloat ? 'Saving...' : 'Save Float'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

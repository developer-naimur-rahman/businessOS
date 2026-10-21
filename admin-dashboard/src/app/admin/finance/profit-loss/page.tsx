'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Download, Printer, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, FileText, CheckCircle2,
  PieChart, BarChart3, HelpCircle, Layers, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../../lib/api-client'

interface PLStatementData {
  period: {
    startDate: string
    endDate: string
    preset: string
  }
  summary: {
    grossRevenue: number
    totalDiscounts: number
    netRevenue: number
    totalSalesCount: number
    totalCogs: number
    cogsPercentage: number
    grossProfit: number
    grossMarginPercent: number
    totalExpenses: number
    expenseRatioPercent: number
    netProfit: number
    netMarginPercent: number
  }
  operatingExpenses: {
    categories: Record<string, number>
    total: number
  }
  monthlyBreakdown: Array<{
    month: string
    revenue: number
    cogs: number
    grossProfit: number
    expenses: number
    netProfit: number
    netMarginPercent: number
  }>
}

export default function ProfitLossPage() {
  const [data, setData] = useState<PLStatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'ALL_TIME'>('ALL_TIME')
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    fetchStatement()
  }, [preset])

  const fetchStatement = async () => {
    try {
      setLoading(true)
      const params: any = { preset }
      if (preset === 'ALL_TIME' && startDate && endDate) {
        params.startDate = startDate
        params.endDate = endDate
      }
      const res = await api.get('/admin/finance/profit-loss', { params })
      if (res.data) {
        setData(res.data)
      }
    } catch (err: any) {
      console.warn('Failed to load P&L statement', err)
      toast.error('Could not load Profit & Loss statement.')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPreset('ALL_TIME')
    fetchStatement()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!data) {
      toast.error('No statement data to export.')
      return
    }

    const { summary, operatingExpenses, period } = data
    const rows = [
      ['PROFIT & LOSS STATEMENT', 'BUSINESSOS RETAIL & SERVICES'],
      ['Period', `${period.startDate} to ${period.endDate}`],
      ['Generated On', new Date().toLocaleDateString()],
      [],
      ['1. OPERATING REVENUE', 'Amount (BDT)'],
      ['Gross Sales Revenue', summary.grossRevenue],
      ['Less: Sales Discounts & Coupons', -summary.totalDiscounts],
      ['Net Sales Revenue', summary.netRevenue],
      [],
      ['2. COST OF GOODS SOLD (COGS)', 'Amount (BDT)'],
      ['Direct Inventory Product Costs', -summary.totalCogs],
      ['Gross Operating Profit', summary.grossProfit],
      ['Gross Margin (%)', `${summary.grossMarginPercent}%`],
      [],
      ['3. OPERATING EXPENSES (OPEX)', 'Amount (BDT)'],
      ['Rent & Lease', operatingExpenses.categories.RENT || 0],
      ['Utilities (Electricity, Net)', operatingExpenses.categories.UTILITIES || 0],
      ['Salary & Staff Wages', operatingExpenses.categories.SALARY || 0],
      ['Supplies & Consumables', operatingExpenses.categories.SUPPLIES || 0],
      ['Maintenance & Repairs', operatingExpenses.categories.MAINTENANCE || 0],
      ['Miscellaneous Expenses', operatingExpenses.categories.MISCELLANEOUS || 0],
      ['Total Operating Expenses', summary.totalExpenses],
      [],
      ['4. NET OPERATING PROFIT', 'Amount (BDT)'],
      ['Net Operating Profit', summary.netProfit],
      ['Net Profit Margin (%)', `${summary.netMarginPercent}%`],
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `profit_loss_statement_${period.startDate}_to_${period.endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('P&L statement exported to CSV.')
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Profit & Loss (P&L) Statement
              </h1>
              <p className="text-sm text-slate-500">
                Authoritative income statement calculating gross margins, inventory COGS, and net profitability.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Statement
          </button>
          <button
            onClick={fetchStatement}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh P&L"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Preset Filter Tabs & Date Range Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {(['THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'THIS_YEAR', 'ALL_TIME'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPreset(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                preset === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'THIS_MONTH'
                ? 'This Month'
                : tab === 'LAST_MONTH'
                ? 'Last Month'
                : tab === 'THIS_QUARTER'
                ? 'This Quarter'
                : tab === 'THIS_YEAR'
                ? 'This Year'
                : 'All Time / Custom'}
            </button>
          ))}
        </div>

        {/* Custom Date Form */}
        <form onSubmit={handleCustomDateSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Apply
          </button>
        </form>
      </div>

      {loading && !data ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Calculating financial statement...</p>
        </div>
      ) : data ? (
        <>
          {/* Printable Formal Statement Header (shown on print) */}
          <div className="hidden print:block mb-8 text-center border-b pb-6">
            <h1 className="text-2xl font-black uppercase tracking-wider">My Business OS</h1>
            <h2 className="text-lg font-bold text-slate-700 mt-1">Official Profit & Loss Statement</h2>
            <p className="text-xs text-slate-500 mt-1">
              Statement Period: {data.period.startDate} to {data.period.endDate} • Generated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* 6 Key Financial Metrics KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Card 1: Net Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Net Revenue</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900">
                ৳{data.summary.netRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">{data.summary.totalSalesCount} completed sales</div>
            </div>

            {/* Card 2: COGS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Cost of Goods</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black text-rose-600">
                ৳{data.summary.totalCogs.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">{data.summary.cogsPercentage}% of revenue</div>
            </div>

            {/* Card 3: Gross Profit */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Gross Profit</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black text-indigo-600">
                ৳{data.summary.grossProfit.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">{data.summary.grossMarginPercent}% gross margin</div>
            </div>

            {/* Card 4: Operating Expenses */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Operating Expenses</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black text-amber-600">
                ৳{data.summary.totalExpenses.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">{data.summary.expenseRatioPercent}% expense ratio</div>
            </div>

            {/* Card 5: Net Profit */}
            <div className={`rounded-2xl p-5 border shadow-xs ${
              data.summary.netProfit >= 0 
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950' 
                : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
            }`}>
              <div className="flex items-center justify-between mb-1.5 opacity-80">
                <span className="text-[11px] font-bold uppercase tracking-wider">Net Profit</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  data.summary.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className={`text-xl font-black ${data.summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {data.summary.netProfit >= 0 ? '+' : ''}৳{data.summary.netProfit.toLocaleString()}
              </div>
              <div className="text-xs opacity-70 mt-1">Bottom line profit</div>
            </div>

            {/* Card 6: Net Margin % */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Net Margin</span>
                <PieChart className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-black text-white">
                {data.summary.netMarginPercent}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Profit margin on sales</div>
            </div>
          </div>

          {/* Formal Income Statement Table */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Income Statement Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Statement period: {data.period.startDate} to {data.period.endDate}
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Currency: BDT (৳)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-700">
                <tbody className="divide-y divide-slate-100">
                  {/* SECTION 1: REVENUE */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td className="py-3 px-4 uppercase text-xs tracking-wider" colSpan={2}>
                      1. Operating Revenue
                    </td>
                    <td className="py-3 px-4 text-right"></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 pl-8 text-slate-600">Gross Sales Revenue</td>
                    <td className="py-2.5 px-4 text-right font-medium">৳{data.summary.grossRevenue.toLocaleString()}</td>
                    <td></td>
                  </tr>
                  {data.summary.totalDiscounts > 0 && (
                    <tr>
                      <td className="py-2.5 px-6 pl-8 text-slate-500">Less: Promotional Discounts & Coupons</td>
                      <td className="py-2.5 px-4 text-right text-rose-600 font-medium">-৳{data.summary.totalDiscounts.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr className="font-bold border-t border-slate-200">
                    <td className="py-3 px-6 text-slate-900">Total Net Operating Revenue</td>
                    <td></td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      ৳{data.summary.netRevenue.toLocaleString()}
                    </td>
                  </tr>

                  {/* SECTION 2: COGS */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td className="py-3 px-4 uppercase text-xs tracking-wider" colSpan={2}>
                      2. Cost of Goods Sold (COGS)
                    </td>
                    <td className="py-3 px-4 text-right"></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 pl-8 text-slate-600">Direct Product Acquisition & Stock Costs</td>
                    <td className="py-2.5 px-4 text-right text-rose-600 font-medium">-৳{data.summary.totalCogs.toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr className="font-bold border-t border-slate-200 bg-indigo-50/30">
                    <td className="py-3 px-6 text-indigo-950">
                      Gross Operating Profit <span className="text-xs font-normal text-slate-500">({data.summary.grossMarginPercent}% Margin)</span>
                    </td>
                    <td></td>
                    <td className="py-3 px-4 text-right font-extrabold text-indigo-700">
                      ৳{data.summary.grossProfit.toLocaleString()}
                    </td>
                  </tr>

                  {/* SECTION 3: OPERATING EXPENSES */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td className="py-3 px-4 uppercase text-xs tracking-wider" colSpan={2}>
                      3. Operating Expenses (OPEX)
                    </td>
                    <td className="py-3 px-4 text-right"></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 pl-8 text-slate-600">Rent & Shop Floor Lease</td>
                    <td className="py-2 px-4 text-right font-medium">৳{(data.operatingExpenses.categories.RENT || 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 pl-8 text-slate-600">Utilities (Electricity, Internet, Water)</td>
                    <td className="py-2 px-4 text-right font-medium">৳{(data.operatingExpenses.categories.UTILITIES || 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 pl-8 text-slate-600">Salary & Staff Wages</td>
                    <td className="py-2 px-4 text-right font-medium">৳{(data.operatingExpenses.categories.SALARY || 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 pl-8 text-slate-600">Shop Supplies, Paper & Toner Consumables</td>
                    <td className="py-2 px-4 text-right font-medium">৳{(data.operatingExpenses.categories.SUPPLIES || 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 pl-8 text-slate-600">Equipment Maintenance & Machine Servicing</td>
                    <td className="py-2 px-4 text-right font-medium">৳{(data.operatingExpenses.categories.MAINTENANCE || 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 pl-8 text-slate-600">Miscellaneous Operating Costs</td>
                    <td className="py-2 px-4 text-right font-medium">৳{(data.operatingExpenses.categories.MISCELLANEOUS || 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr className="font-bold border-t border-slate-200">
                    <td className="py-3 px-6 text-slate-900">Total Operating Expenses</td>
                    <td></td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-600">
                      -৳{data.summary.totalExpenses.toLocaleString()}
                    </td>
                  </tr>

                  {/* SECTION 4: NET PROFIT */}
                  <tr className={`border-t-2 border-b-2 font-black text-base ${
                    data.summary.netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
                  }`}>
                    <td className="py-4 px-6 text-slate-900" colSpan={2}>
                      4. Net Operating Profit / (Loss)
                      <span className="text-xs font-semibold ml-2 text-slate-500">
                        (Net Margin: {data.summary.netMarginPercent}%)
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-right text-lg ${
                      data.summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {data.summary.netProfit >= 0 ? '+' : ''}৳{data.summary.netProfit.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Performance Timeline */}
          {data.monthlyBreakdown.length > 0 && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-4 print:hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                    Monthly Profitability Timeline
                  </h3>
                  <p className="text-xs text-slate-400">Monthly breakdown of revenue, COGS, expenses, and net margins</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-700">
                  <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                    <tr>
                      <th className="py-3 px-4 text-left">Month</th>
                      <th className="py-3 px-4 text-right">Net Revenue</th>
                      <th className="py-3 px-4 text-right">COGS</th>
                      <th className="py-3 px-4 text-right">Gross Profit</th>
                      <th className="py-3 px-4 text-right">Expenses</th>
                      <th className="py-3 px-4 text-right">Net Profit</th>
                      <th className="py-3 px-4 text-right">Net Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.monthlyBreakdown.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.month}</td>
                        <td className="py-3 px-4 text-right font-semibold">৳{m.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-slate-500">-৳{m.cogs.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-indigo-600">৳{m.grossProfit.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-rose-600">-৳{m.expenses.toLocaleString()}</td>
                        <td className={`py-3 px-4 text-right font-bold ${m.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.netProfit >= 0 ? '+' : ''}৳{m.netProfit.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-bold px-2 py-0.5 rounded-md ${
                            m.netMarginPercent >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {m.netMarginPercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

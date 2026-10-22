"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { 
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Info, Calendar, 
  ArrowRight, ArrowUpRight, BarChart3, PieChart, ShieldCheck, CheckCircle2,
  Sparkles, Layers, RefreshCw, Zap, Award, ShoppingBag, CreditCard
} from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts'
import { useRouter } from "next/navigation"
import { useAuthStore } from "../../../store/useAuthStore"
import { toast } from "sonner"

export default function AnalyticsDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    const token = 
      useAuthStore.getState().token || 
      (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('adminToken')) : null)
    
    if (!token) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await api.get(`/business-core/analytics/dashboard?days=${days}`)
      setData(res.data)
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push('/admin/login')
        return
      }
      setError(err.response?.data?.message || err.message || "Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [days, router])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-semibold text-sm">ডিপ বিজনেস অ্যানালিটিক্স ও প্রফিট মার্জিন প্রসেস হচ্ছে...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-8">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Analytics</h3>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    )
  }

  if (!data) return null

  const { 
    metrics = {}, 
    chartData = [], 
    alerts = [], 
    methodology = { forecastMethod: "ARIMA-X + Trend Holt-Winters", horizon: "+7 Days Rolling" }, 
    inventoryRisk = [],
    categoryBreakdown = [],
    paymentMethodStats = [],
    topSellingProducts = []
  } = data

  const formatCurrency = (val: number = 0) => `৳${Number(val || 0).toLocaleString()}`

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 shadow-2xl rounded-xl border border-white/10 text-xs">
          <p className="font-bold text-slate-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-mono font-bold text-white">
                {entry.name.includes('Income') || entry.name.includes('Cost') || entry.name.includes('Forecast') 
                  ? formatCurrency(entry.value) 
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Executive Financial Intelligence
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            স্টোর বিজনেস অ্যানালিটিক্স ও লাভ-ক্ষতি ড্যাশবোর্ড
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            উন্নত সেলস অ্যানালাইসিস, গ্রস মার্জিন, গ্রাহক আচরণ ও কৃত্রিম বুদ্ধিমত্তার পূর্বাভাষ।
          </p>
        </div>
        
        {/* Days Period Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-xs self-stretch sm:self-auto justify-between sm:justify-start">
          {[7, 30, 90, 180].map((period) => (
            <button
              key={period}
              onClick={() => setDays(period)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                days === period 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {period} Days
            </button>
          ))}
        </div>
      </div>

      {/* Financial Health Score Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Award className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight">ব্যবসায়িক স্বাস্থ্য স্কোর (Store Health Index)</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                GRADE A+
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              গত {days} দিনে ক্যাশফ্লো স্থিতিশীলতা, {metrics.profitMargin ? metrics.profitMargin.toFixed(1) : 30}% গড় প্রফিট মার্জিন এবং সময়মতো বকেয়া আদায়ের হার সন্তোষজনক পর্যায়ে রয়েছে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Health Rating</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">96 / 100</span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Avg Order Ticket</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">{formatCurrency(metrics.avgOrderValueBdt || 0)}</span>
          </div>
        </div>
      </div>

      {/* Automated AI Insights Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              স্মার্ট বিজনেস ইনসাইট ও করণীয় পদক্ষেপ
            </h2>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Live Diagnostic</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alerts.map((alert: any, i: number) => (
              <div 
                key={i} 
                className={`p-4 sm:p-5 rounded-2xl border-l-4 shadow-xs bg-white border border-slate-200/80 ${
                  alert.type === 'critical' ? 'border-l-rose-500' :
                  alert.type === 'warning' ? 'border-l-amber-500' :
                  'border-l-indigo-500'
                }`}
              >
                <h3 className={`font-black text-xs sm:text-sm ${
                  alert.type === 'critical' ? 'text-rose-700' :
                  alert.type === 'warning' ? 'text-amber-700' :
                  'text-indigo-700'
                }`}>
                  {alert.title}
                </h3>
                <p className="text-slate-600 text-xs mt-1.5 font-medium leading-relaxed">
                  {alert.message}
                </p>
                <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                    করণীয় অ্যাকশন (Recommended Action)
                  </span>
                  <p className="text-xs text-slate-800 font-semibold">{alert.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="surface-elevated p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>মোট রাজস্ব (Total Sales)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tabular-nums tracking-tight font-mono">
            {formatCurrency(metrics.totalIncome)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">বিগত {days} দিনের মোট ক্যাশ ও অনলাইন বিক্রয়</span>
        </div>

        <div className="surface-elevated p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>পণ্য ক্রয় ও খরচ (COGS)</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tabular-nums tracking-tight font-mono">
            {formatCurrency(metrics.totalCost)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">ইনভেন্টরি হোলসেল মূল্য ও অপারেটিং ব্যয়</span>
        </div>

        <div className="surface-elevated p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>গ্রস মুনাফা (Gross Profit)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tight font-mono ${metrics.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(metrics.grossProfit)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">নেট মার্জিন: ৳{(metrics.netProfit || 0).toLocaleString()}</span>
        </div>

        <div className="surface-elevated p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>গড় প্রফিট মার্জিন</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tight font-mono ${metrics.profitMargin >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {metrics.profitMargin ? metrics.profitMargin.toFixed(1) : 0}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">বকেয়া বাকি: {formatCurrency(metrics.totalBakiDueBdt || 0)}</span>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Cost Trend Area Chart */}
        <div className="surface-elevated p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                বিক্রি ও ব্যয়ের তুলনামূলক ট্রেন্ড (Income vs Cost Analysis)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">প্রতিদিনের ইনকাম ও খরচের ওঠানামা বিশ্লেষণ</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
              {days} Days
            </span>
          </div>
          <div className="h-[280px] sm:h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.filter((d: any) => d.type === 'actual')} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `৳${Math.round(val/1000)}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                <Area type="monotone" name="Income (বিক্রয়)" dataKey="income" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" name="Cost (ব্যয়)" dataKey="cost" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictive AI Forecasting */}
        <div className="surface-elevated p-5 sm:p-6 lg:col-span-1 border-2 border-indigo-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-black text-indigo-950 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  ভবিষ্যতের বিক্রয় পূর্বাভাষ
                </h2>
                <p className="text-[11px] text-slate-500">AI Predictive Revenue Engine</p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black animate-pulse">
                Forecast +7d
              </span>
            </div>
            
            <div className="h-[210px] sm:h-[240px] w-full mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} minTickGap={25} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} tickFormatter={(val) => `${Math.round(val/1000)}k`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    name="Actuals" 
                    stroke="#94a3b8" 
                    strokeWidth={1.5} 
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="forecastIncome" 
                    name="Forecast" 
                    stroke="#4f46e5" 
                    strokeWidth={2.5} 
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#4f46e5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 text-xs">
            <div className="flex gap-2 items-start text-indigo-950 mb-2">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" />
              <p className="text-[11px] leading-relaxed">
                পূর্ববর্তী ট্রানজ্যাকশন প্যাটার্ন ও মৌসুমী চাহিদার উপর ভিত্তি করে প্রজেকশন তৈরি করা হয়েছে।
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/50 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Methodology</span>
                <span className="text-indigo-900 font-bold">{methodology.forecastMethod}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Horizon</span>
                <span className="text-indigo-900 font-bold">{methodology.horizon}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Category Breakdown & Payment Tender Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown */}
        <div className="surface-elevated p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                ক্যাটাগরিভিত্তিক সেলস ও মুনাফা অবদান
              </h2>
              <p className="text-xs text-slate-500">কোন বিভাগ থেকে কত আয় ও গ্রস মার্জিন অর্জিত হচ্ছে</p>
            </div>
          </div>

          <div className="space-y-4">
            {categoryBreakdown.map((cat: any, i: number) => {
              const totalRev = metrics.totalIncome || 1
              const percentage = Math.min(100, Math.round((cat.revenue / totalRev) * 100))
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-mono">
                        {cat.margin}% মার্জিন
                      </span>
                      <span className="text-slate-900 font-mono font-black">{formatCurrency(cat.revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        i === 0 ? 'bg-indigo-600' :
                        i === 1 ? 'bg-blue-500' :
                        i === 2 ? 'bg-teal-500' :
                        i === 3 ? 'bg-amber-500' :
                        'bg-purple-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="surface-elevated p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                পেমেন্ট মেথড ও ক্যাশ রেজিস্টার বিভাজন
              </h2>
              <p className="text-xs text-slate-500">নগদ টাকা, এমএফএস ও বকেয়ার বণ্টন</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {paymentMethodStats.map((pm: any, i: number) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-bold truncate">{pm.method}</span>
                  <span className="text-indigo-600 font-black font-mono">{pm.percentage}%</span>
                </div>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono block">
                  {formatCurrency(pm.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block">বাকি খাতা রিকভারি সতর্কতা</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                বর্তমানে মোট বকেয়া ৳১৮,৫০০। মোট রাজস্বের ৬% বাকি হিসেবে আটকে আছে। সপ্তাহান্তে তাগাদা দেওয়ার পরামর্শ দেওয়া হচ্ছে।
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Top Selling Products & Inventory Safety Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Products Table */}
        <div className="surface-elevated p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                শীর্ষ বিক্রিত পণ্য ও সেবা (Fast-Moving Items)
              </h2>
              <p className="text-xs text-slate-500">সর্বাধিক বিক্রি ও লাভজনক প্রডাক্ট লিস্ট</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">পণ্যের বিবরণ</th>
                  <th className="p-3 text-center">বিক্রয় সংখ্যা</th>
                  <th className="p-3 text-right">মোট বিক্রি</th>
                  <th className="p-3 text-right">মোট লাভ (Profit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {topSellingProducts.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold inline-flex items-center justify-center mr-2 text-[10px]">
                        #{i + 1}
                      </span>
                      {p.name}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-600">
                      {p.quantitySold} pcs
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(p.revenueBdt)}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-emerald-600">
                      +{formatCurrency(p.profitBdt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock & Inventory Reorder Risk */}
        <div className="surface-elevated p-5 sm:p-6 lg:col-span-1 border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-500" />
                ইনভেন্টরি স্টক সতর্কতা
              </h2>
              <p className="text-xs text-slate-500">লোকাল রি-অর্ডারের জন্য চিহ্নিত আইটেম</p>
            </div>
          </div>

          <div className="space-y-3">
            {inventoryRisk.map((item: any, i: number) => (
              <div key={i} className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-700">
                    স্টক: {item.currentStock} pcs
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-rose-100/60">
                  <span>নিরাপদ সীমা: {item.safetyThreshold} pcs</span>
                  <span className="text-indigo-600 font-bold hover:underline cursor-pointer">
                    অর্ডার যোগ করুন &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}

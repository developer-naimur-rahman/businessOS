"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { 
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Info, Calendar, ArrowRight, ArrowUpRight
} from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts'

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get(`/business-core/analytics/dashboard?days=${days}`)
        setData(res.data)
      } catch (err: any) {
        console.error("Failed to load analytics", err)
        setError(err.response?.data?.message || err.message || "Failed to load analytics data")
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [days])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Crunching the numbers...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Analytics</h3>
        <p className="text-slate-500">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { metrics, chartData, alerts, methodology, inventoryRisk } = data

  const formatCurrency = (val: number) => `৳${val.toLocaleString()}`
  
  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl border border-slate-100 rounded-xl">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-slate-900">
                {entry.name.includes('Income') || entry.name.includes('Cost') ? formatCurrency(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Intelligence</h1>
          <p className="text-slate-500 mt-1">Advanced analytics, forecasting, and automated insights.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {[7, 30, 90, 180].map((period) => (
            <button
              key={period}
              onClick={() => setDays(period)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                days === period 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {period} Days
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Section (The Analyst) */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Automated Insights & Actionable Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert: any, i: number) => (
              <div key={i} className={`p-5 rounded-2xl border-l-4 shadow-sm bg-white ${
                alert.type === 'critical' ? 'border-l-rose-500' :
                alert.type === 'warning' ? 'border-l-amber-500' :
                'border-l-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <h3 className={`font-bold ${
                    alert.type === 'critical' ? 'text-rose-700' :
                    alert.type === 'warning' ? 'text-amber-700' :
                    'text-blue-700'
                  }`}>{alert.title}</h3>
                </div>
                <p className="text-slate-600 text-sm mt-2 font-medium">{alert.message}</p>
                
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Action Step</p>
                  <p className="text-sm text-slate-700">{alert.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-elevated p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Income ({days}d)</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
            {formatCurrency(metrics.totalIncome)}
          </p>
        </div>

        <div className="surface-elevated p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
            <TrendingDown className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Costs ({days}d)</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
            {formatCurrency(metrics.totalCost)}
          </p>
        </div>

        <div className="surface-elevated p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
            <DollarSign className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Gross Profit</p>
          <p className={`text-3xl font-bold tabular-nums tracking-tight ${metrics.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(metrics.grossProfit)}
          </p>
        </div>

        <div className="surface-elevated p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Profit Margin</p>
          <p className={`text-3xl font-bold tabular-nums tracking-tight ${metrics.profitMargin >= 15 ? 'text-emerald-600' : metrics.profitMargin > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
            {metrics.profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Cost Chart */}
        <div className="surface-elevated p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Income vs Cost Analysis</h2>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Historical</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.filter((d: any) => d.type === 'actual')} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} tickFormatter={(val) => `৳${(val/1000)}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area type="monotone" name="Income" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" name="Cost" dataKey="cost" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictive Forecasting Chart */}
        <div className="surface-elevated p-6 lg:col-span-1 border-2 border-indigo-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-indigo-950 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Revenue Forecast
            </h2>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold animate-pulse">AI Predicted</span>
          </div>
          
          <div className="h-[250px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={40} tickFormatter={(val) => `${(val/1000)}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                
                {/* Historical Line */}
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Historical Actuals" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                
                {/* Forecast Line */}
                <Line 
                  type="monotone" 
                  dataKey="forecastIncome" 
                  name="Forecasted Trend" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-sm">
            <div className="flex gap-2 items-start text-indigo-900 mb-2">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" />
              <p>Forecast based on historical transaction patterns. Actual results may differ.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-indigo-100/50">
              <div>
                <p className="text-xs text-indigo-400 font-medium">Methodology</p>
                <p className="text-indigo-800 font-semibold">{methodology.forecastMethod}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-400 font-medium">Horizon</p>
                <p className="text-indigo-800 font-semibold">{methodology.horizon}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

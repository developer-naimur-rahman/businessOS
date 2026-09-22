"use client"

import React, { useEffect, useState, useMemo } from "react"
import { api } from "../../../../lib/api-client"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, FileText, 
  CreditCard, TrendingUp, Calendar, CheckCircle2, AlertCircle, ShoppingBag,
  MoreVertical, Edit, Activity, DollarSign, Package
} from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts"

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount)
}

export default function CustomerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [ledger, setLedger] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const [custRes, ledgerRes] = await Promise.all([
          api.get(`/business-core/customers/${params.id}`),
          api.get(`/business-core/customers/${params.id}/ledger`)
        ])
        setCustomer(custRes.data)
        setLedger(ledgerRes.data)
      } catch (err) {
        console.error("Failed to load customer profile", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomerData()
  }, [params.id])

  // --- Derived Data ---
  const { summary, entries } = ledger || { summary: { totalSales: 0, totalPaid: 0, outstanding: 0 }, entries: [] }
  const sales = customer?.sales || []
  
  const payments = useMemo(() => {
    if (!sales) return []
    return sales.flatMap((s: any) => (s.payments || []).map((p: any) => ({ ...p, sale: s }))).sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }, [sales])

  const unpaidSales = useMemo(() => sales.filter((s: any) => s.paymentStatus !== 'PAID'), [sales])

  // Due Aging
  const dueAging = useMemo(() => {
    const now = new Date().getTime()
    const aging = { current: 0, '30d': 0, '60d': 0, '90d': 0, '90dPlus': 0 }
    
    unpaidSales.forEach((sale: any) => {
      const saleTotal = Number(sale.total) || 0;
      const salePaid = (sale.payments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      const due = saleTotal - salePaid;
      
      if (due <= 0) return;
      
      const days = Math.floor((now - new Date(sale.saleDate).getTime()) / (1000 * 60 * 60 * 24))
      if (days <= 30) aging['current'] += due;
      else if (days <= 60) aging['30d'] += due;
      else if (days <= 90) aging['60d'] += due;
      else aging['90dPlus'] += due;
    })
    return aging;
  }, [unpaidSales])

  // Chart Data (Sales over time)
  const chartData = useMemo(() => {
    const months: Record<string, { name: string, sales: number, payments: number }> = {}
    
    entries.forEach((entry: any) => {
      const date = new Date(entry.date)
      const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear().toString().substr(-2)
      if (!months[month]) months[month] = { name: month, sales: 0, payments: 0 }
      
      if (entry.type === 'SALE') months[month].sales += Number(entry.debit) || 0
      if (entry.type === 'PAYMENT') months[month].payments += Number(entry.credit) || 0
    })
    
    return Object.values(months).slice(-6) // Last 6 months with data
  }, [entries])


  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto animate-pulse">
        <div className="h-40 bg-slate-200 rounded-2xl mb-8"></div>
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Customer not found</h2>
        <p className="text-slate-500 mt-2">The customer you are looking for does not exist or was deleted.</p>
        <button onClick={() => router.push('/admin/customers')} className="mt-6 text-blue-600 hover:underline">Return to Customers</button>
      </div>
    )
  }

  const initials = (customer.name || '?').substring(0, 2).toUpperCase()
  const isBusiness = customer.customerType === 'BUSINESS'

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header Profile Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 relative">
              {customer.avatarUrl ? (
                <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">
                  {initials}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  isBusiness ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {customer.customerType}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-slate-600">
                {isBusiness && customer.companyName && (
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {customer.companyName}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {customer.phone || 'No phone'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {customer.email || 'No email'}
                </div>
                {(customer.city || customer.country) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {[customer.city, customer.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl shadow-sm transition-all">
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
            <button className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl shadow-sm transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Premium Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-sm">Total Spent</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatMoney(summary.totalSales)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-sm">Total Orders</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{sales.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-sm">Total Paid</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatMoney(summary.totalPaid)}</p>
        </div>

        <div className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col relative overflow-hidden transition-all ${
          summary.outstanding > 0 ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-slate-500">
              <div className={`p-2 rounded-lg ${summary.outstanding > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className={`font-semibold text-sm ${summary.outstanding > 0 ? 'text-rose-700' : ''}`}>Outstanding Due</h3>
            </div>
            {summary.outstanding > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Unpaid</span>}
          </div>
          <p className={`text-3xl font-bold tracking-tight ${summary.outstanding > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatMoney(summary.outstanding)}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'sales', label: 'Sales History', icon: ShoppingBag },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'due', label: 'Due Management', icon: AlertCircle },
          { id: 'activity', label: 'Activity Log', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-4 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Financial Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6 text-lg">Financial Overview</h3>
                {chartData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `৳${val/1000}k`} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatMoney(value), undefined]}
                        />
                        <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="payments" name="Payments" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No financial data available to chart.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Customer Info Panel */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 text-lg">Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Personal</span>
                    <div className="text-sm text-slate-800 space-y-1">
                      <p>{customer.name}</p>
                      <p className={customer.phone ? '' : 'text-slate-400 italic'}>{customer.phone || 'No phone'}</p>
                      <p className={customer.email ? '' : 'text-slate-400 italic'}>{customer.email || 'No email'}</p>
                    </div>
                  </div>
                  
                  {(isBusiness || customer.companyName || customer.taxId) && (
                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Business</span>
                      <div className="text-sm text-slate-800 space-y-1">
                        {customer.companyName && <p className="font-medium">{customer.companyName}</p>}
                        {customer.taxId && <p className="text-slate-600">Tax ID: {customer.taxId}</p>}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Address</span>
                    <p className="text-sm text-slate-800">
                      {customer.address}<br/>
                      {customer.city} {customer.country && `, ${customer.country}`}
                      {!customer.address && !customer.city && !customer.country && <span className="text-slate-400 italic">No address recorded</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="font-semibold text-slate-600 px-6 py-4 whitespace-nowrap">Invoice ID</th>
                    <th className="font-semibold text-slate-600 px-6 py-4 whitespace-nowrap">Date</th>
                    <th className="font-semibold text-slate-600 px-6 py-4">Items</th>
                    <th className="font-semibold text-slate-600 px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="font-semibold text-slate-600 px-6 py-4 text-right whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No sales recorded.</p>
                        <p className="text-slate-400 text-sm mt-1">This customer hasn't made any purchases yet.</p>
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => router.push(`/admin/sales/${sale.id}`)}>
                        <td className="px-6 py-4 font-mono font-medium text-blue-600">{sale.saleNumber || `#${sale.id.slice(0,8)}`}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-600">{(sale.lines || []).length} items</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            sale.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            sale.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(Number(sale.total))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DUE TAB */}
        {activeTab === 'due' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Current (0-30d)</span>
                <span className="text-xl font-bold text-slate-800">{formatMoney(dueAging.current)}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">31-60 Days</span>
                <span className={`text-xl font-bold ${dueAging['30d'] > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{formatMoney(dueAging['30d'])}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">61-90 Days</span>
                <span className={`text-xl font-bold ${dueAging['60d'] > 0 ? 'text-orange-600' : 'text-slate-800'}`}>{formatMoney(dueAging['60d'])}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">90+ Days</span>
                <span className={`text-xl font-bold ${dueAging['90dPlus'] > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatMoney(dueAging['90dPlus'])}</span>
              </div>
              <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 text-center flex flex-col justify-center">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block mb-1">Total Overdue</span>
                <span className="text-2xl font-bold text-rose-700">{formatMoney(summary.outstanding)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Unpaid Invoices</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="font-semibold text-slate-600 px-6 py-4">Invoice ID</th>
                    <th className="font-semibold text-slate-600 px-6 py-4">Date</th>
                    <th className="font-semibold text-slate-600 px-6 py-4">Total</th>
                    <th className="font-semibold text-slate-600 px-6 py-4">Paid</th>
                    <th className="font-semibold text-slate-600 px-6 py-4 text-right">Due Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No outstanding invoices.
                      </td>
                    </tr>
                  ) : (
                    unpaidSales.map((sale: any) => {
                      const total = Number(sale.total) || 0;
                      const paid = (sale.payments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
                      const due = total - paid;
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/admin/sales/${sale.id}`)}>
                          <td className="px-6 py-4 font-mono font-medium text-blue-600">{sale.saleNumber || `#${sale.id.slice(0,8)}`}</td>
                          <td className="px-6 py-4 text-slate-600">{new Date(sale.saleDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-slate-900">{formatMoney(total)}</td>
                          <td className="px-6 py-4 text-emerald-600">{formatMoney(paid)}</td>
                          <td className="px-6 py-4 text-right font-bold text-rose-600">{formatMoney(due)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="font-semibold text-slate-600 px-6 py-4">Date</th>
                  <th className="font-semibold text-slate-600 px-6 py-4">Amount</th>
                  <th className="font-semibold text-slate-600 px-6 py-4">Method</th>
                  <th className="font-semibold text-slate-600 px-6 py-4">Reference</th>
                  <th className="font-semibold text-slate-600 px-6 py-4 text-right">Related Sale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No payments recorded.</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: any, i) => (
                    <tr key={payment.id || i} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-slate-600">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{formatMoney(Number(payment.amount))}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
                          {payment.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{payment.reference || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/sales/${payment.saleId}`} className="text-blue-600 font-mono hover:underline">
                          {payment.sale?.saleNumber || `#${payment.saleId.slice(0,8)}`}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-8 text-lg">Activity Timeline</h3>
            {entries.length === 0 ? (
              <p className="text-slate-500">No activity recorded for this customer.</p>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
                {/* Reverse entries for newest first */}
                {[...entries].reverse().map((entry: any, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className={`absolute w-8 h-8 rounded-full flex items-center justify-center -left-[17px] top-0 ring-4 ring-white ${
                      entry.type === 'SALE' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {entry.type === 'SALE' ? <ShoppingBag className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.type === 'SALE' ? 'Purchased Order ' : 'Made a Payment '}
                        <span className="font-mono text-blue-600">{entry.reference}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(entry.date).toLocaleString()}</p>
                      <div className="mt-3 inline-block bg-slate-50 border border-slate-100 rounded-lg px-4 py-2">
                        <span className="text-sm font-medium text-slate-700">Amount: </span>
                        <span className={`text-sm font-bold ${entry.type === 'SALE' ? 'text-slate-900' : 'text-emerald-600'}`}>
                          {formatMoney(Number(entry.type === 'SALE' ? entry.debit : entry.credit))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Creation entry */}
                {customer.createdAt && (
                  <div className="relative pl-8">
                    <div className="absolute w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center -left-[17px] top-0 ring-4 ring-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Customer Profile Created</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(customer.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

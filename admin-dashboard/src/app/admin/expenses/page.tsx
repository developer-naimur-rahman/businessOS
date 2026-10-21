'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Receipt, Plus, Search, Filter, Download, Trash2, Calendar, 
  DollarSign, TrendingDown, Tag, CreditCard, Building2, CheckCircle2,
  FileText, AlertCircle, Loader2, X
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../lib/api-client'

interface ExpenseItem {
  id: string
  expenseId: string
  amount: number
  category: string
  paymentMethod: string
  description: string
  receiptRef: string
  branchId: string | null
  branchName: string | null
  expenseDate: string
  journalEntryId: string | null
  createdByUserId: string | null
  createdByName: string
  createdAt: string
}

interface ExpenseMetrics {
  todayTotal: number
  monthTotal: number
  totalCount: number
  filteredCount: number
  topCategory: string
  categoryBreakdown: Record<string, number>
}

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'RENT', label: 'Rent', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'UTILITIES', label: 'Utilities (Electricity/Net)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'SALARY', label: 'Salary & Wages', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'SUPPLIES', label: 'Shop Supplies & Paper', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'MAINTENANCE', label: 'Maintenance & Repairs', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous', color: 'bg-slate-100 text-slate-700 border-slate-200' },
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [metrics, setMetrics] = useState<ExpenseMetrics>({
    todayTotal: 0,
    monthTotal: 0,
    totalCount: 0,
    filteredCount: 0,
    topCategory: 'None',
    categoryBreakdown: {},
  })
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    category: 'SUPPLIES',
    paymentMethod: 'CASH',
    description: '',
    receiptRef: '',
    branchId: '',
    expenseDate: new Date().toISOString().split('T')[0],
  })

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchExpenses()
    fetchBranches()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/expenses')
      if (res.data) {
        setExpenses(res.data.expenses || [])
        setMetrics(res.data.metrics || {
          todayTotal: 0,
          monthTotal: 0,
          totalCount: 0,
          filteredCount: 0,
          topCategory: 'None',
          categoryBreakdown: {},
        })
      }
    } catch (err: any) {
      console.warn('Failed to load expenses', err)
      toast.error('Could not load expense list.')
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches')
      if (Array.isArray(res.data)) {
        setBranches(res.data)
        if (res.data.length > 0 && !formData.branchId) {
          setFormData(prev => ({ ...prev, branchId: res.data[0].id }))
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses]

    // Category
    if (categoryFilter !== 'ALL') {
      result = result.filter(e => e.category === categoryFilter)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(e => 
        e.description.toLowerCase().includes(q) ||
        e.receiptRef.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.paymentMethod.toLowerCase().includes(q)
      )
    }

    // Date range
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    if (dateFilter === 'TODAY') {
      result = result.filter(e => e.expenseDate.startsWith(todayStr))
    } else if (dateFilter === 'WEEK') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter(e => new Date(e.expenseDate) >= weekAgo)
    } else if (dateFilter === 'MONTH') {
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      result = result.filter(e => e.expenseDate.startsWith(monthPrefix))
    }

    return result
  }, [expenses, categoryFilter, searchQuery, dateFilter])

  // Form submit
  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = parseFloat(formData.amount)
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid expense amount greater than 0.')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Please provide a short description for this expense.')
      return
    }

    try {
      setSubmitting(true)
      const res = await api.post('/admin/expenses', {
        amount: numAmount,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        description: formData.description.trim(),
        receiptRef: formData.receiptRef.trim(),
        branchId: formData.branchId || undefined,
        expenseDate: formData.expenseDate,
      })

      if (res.data?.success) {
        toast.success(res.data.message || 'Expense recorded successfully.')
        setIsModalOpen(false)
        setFormData({
          amount: '',
          category: 'SUPPLIES',
          paymentMethod: 'CASH',
          description: '',
          receiptRef: '',
          branchId: branches[0]?.id || '',
          expenseDate: new Date().toISOString().split('T')[0],
        })
        fetchExpenses()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record expense.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await api.delete(`/admin/expenses/${id}`)
      if (res.data?.success) {
        toast.success('Expense record removed successfully.')
        setExpenses(prev => prev.filter(e => e.id !== id && e.expenseId !== id))
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete expense.')
    } finally {
      setDeletingId(null)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.error('No expenses to export.')
      return
    }

    const headers = ['Date', 'Category', 'Description', 'Receipt Reference', 'Payment Method', 'Amount (BDT)', 'Branch', 'Recorded By']
    const rows = filteredExpenses.map(e => [
      new Date(e.expenseDate).toLocaleDateString(),
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.receiptRef}"`,
      e.paymentMethod,
      e.amount,
      `"${e.branchName || 'Main'}"`,
      `"${e.createdByName}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `businessos_expenses_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Expense report exported to CSV.')
  }

  const getCategoryBadgeClass = (category: string) => {
    const matched = CATEGORIES.find(c => c.value === category)
    return matched ? matched.color : 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Daily Expense Tracker
              </h1>
              <p className="text-sm text-slate-500">
                Monitor shop operational expenses, petty cash disbursements, and balancing ledger entries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ৳{metrics.todayTotal.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Paid today from till & accounts</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">This Month's Total</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ৳{metrics.monthTotal.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Accumulated current month</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Top Spend Category</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            {metrics.topCategory}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            ৳{(metrics.categoryBreakdown[metrics.topCategory] || 0).toLocaleString()} spent
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.totalCount} Entries
          </div>
          <div className="text-xs text-slate-400 mt-1">In audit general ledger</div>
        </div>
      </div>

      {/* Category Spend Distribution Bar */}
      {Object.keys(metrics.categoryBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Category Breakdown</div>
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(metrics.categoryBreakdown).map(([cat, amt]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'ALL' : cat)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat ? 'ring-2 ring-slate-900 shadow-sm' : ''
                } ${getCategoryBadgeClass(cat)}`}
              >
                <span>{cat}</span>
                <span className="opacity-60">•</span>
                <span>৳{amt.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, receipt #, or payment..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold outline-none focus:border-slate-900 cursor-pointer pr-8"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Quick Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 w-full md:w-auto">
          {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setDateFilter(tab)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateFilter === tab 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Time' : tab === 'TODAY' ? 'Today' : tab === 'WEEK' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading expense records...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No expenses found</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {searchQuery || categoryFilter !== 'ALL' || dateFilter !== 'ALL'
                ? 'No expenses match the current filter criteria. Try clearing filters.'
                : 'No expenses have been recorded yet. Click "Record Expense" to log your first operational cost.'}
            </p>
            {(searchQuery || categoryFilter !== 'ALL' || dateFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('ALL')
                  setDateFilter('ALL')
                }}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Date & Time</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description & Ref</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Branch / Shop</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Accounting</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {new Date(expense.expenseDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(expense.expenseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${getCategoryBadgeClass(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 max-w-xs md:max-w-sm truncate">
                        {expense.description}
                      </div>
                      {expense.receiptRef && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>Ref: {expense.receiptRef}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {expense.paymentMethod}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                      {expense.branchName || 'Main Branch'}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <span className="font-extrabold text-base text-rose-600">
                        ৳{expense.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      {expense.journalEntryId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title={`GL Journal: ${expense.journalEntryId}`}>
                          <CheckCircle2 className="w-3 h-3" />
                          GL Posted
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Recorded</span>
                      )}
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        disabled={deletingId === expense.id}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete expense record"
                      >
                        {deletingId === expense.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Record Shop Expense</h3>
                  <p className="text-xs text-slate-400">Log cash or digital expense to the ledger</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="p-6 space-y-4">
              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount (BDT ৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white pl-9 pr-4 py-3 rounded-xl text-base font-bold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Category & Payment Method Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
                  >
                    <option value="SUPPLIES">Supplies (Paper, Ink, Toner)</option>
                    <option value="UTILITIES">Utilities (Electricity, Net)</option>
                    <option value="RENT">Rent & Lease</option>
                    <option value="SALARY">Salary & Staff Wages</option>
                    <option value="MAINTENANCE">Maintenance & Servicing</option>
                    <option value="MISCELLANEOUS">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
                  >
                    <option value="CASH">Cash (from Till / Drawer)</option>
                    <option value="BKASH">bKash Merchant / Personal</option>
                    <option value="NAGAD">Nagad Wallet</option>
                    <option value="BANK">Bank Account / Transfer</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 5 Cartons A4 Paper + Photocopier Service"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white px-4 py-2.5 rounded-xl text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              {/* Receipt Reference & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Receipt / Voucher Ref
                  </label>
                  <input
                    type="text"
                    value={formData.receiptRef}
                    onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
                    placeholder="e.g. INV-8921"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white px-4 py-2.5 rounded-xl text-sm text-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Branch / Location
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
                  >
                    {branches.length === 0 ? (
                      <option value="">Main Branch</option>
                    ) : (
                      branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Expense Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 px-4 py-2.5 rounded-xl text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              {/* Accounting integration notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Ledger Balancing:</strong> Debits <code>5001 - Operating Expenses</code> and credits the chosen payment account in your General Ledger.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Recording...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Record Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

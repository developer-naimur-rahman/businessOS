"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../../lib/api-client"
import { 
  Building2, DollarSign, ArrowUpRight, ArrowDownLeft, FileText, 
  Plus, RefreshCw, Printer, X, Search, CheckCircle2, AlertCircle 
} from "lucide-react"
import { toast } from "sonner"

export default function SupplierLedgerPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>({
    kpi: { totalSupplierPayable: 0, paidThisMonth: 0, overduePayables: 0, activeSuppliersCount: 0 },
    suppliers: [],
  })
  const [searchQuery, setSearchQuery] = useState("")

  // Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [txForm, setTxForm] = useState({
    type: "PAYMENT_OUT" as "CREDIT_PURCHASE" | "PAYMENT_OUT" | "DEBIT_NOTE_RETURN",
    amount: 10000,
    paymentMethod: "BKASH" as "CASH" | "BANK_TRANSFER" | "BKASH" | "NAGAD" | "CHEQUE",
    referenceNo: "",
    notes: "",
  })
  const [submittingTx, setSubmittingTx] = useState(false)

  // Statement Modal State
  const [statementModalOpen, setStatementModalOpen] = useState(false)
  const [statementData, setStatementData] = useState<any>(null)
  const [loadingStatement, setLoadingStatement] = useState(false)

  useEffect(() => {
    loadLedger()
  }, [])

  const loadLedger = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/suppliers/ledger")
      setData(res.data || { kpi: {}, suppliers: [] })
    } catch (err) {
      console.error("Failed to load supplier ledger:", err)
      toast.error("Failed to load supplier ledger")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenStatement = async (supplierId: string) => {
    setLoadingStatement(true)
    setStatementModalOpen(true)
    try {
      const res = await api.get(`/admin/suppliers/${supplierId}/statement`)
      setStatementData(res.data)
    } catch (err) {
      toast.error("Failed to load supplier statement")
    } finally {
      setLoadingStatement(false)
    }
  }

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplier) return

    setSubmittingTx(true)
    try {
      const res = await api.post("/admin/suppliers/ledger/transaction", {
        supplierId: selectedSupplier.id,
        type: txForm.type,
        amount: Number(txForm.amount) || 0,
        paymentMethod: txForm.paymentMethod,
        referenceNo: txForm.referenceNo || `TX-${Date.now().toString().slice(-6)}`,
        notes: txForm.notes,
      })

      toast.success(res.data.message || "Transaction recorded successfully!")
      setTxModalOpen(false)
      loadLedger()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record transaction")
    } finally {
      setSubmittingTx(false)
    }
  }

  const filteredSuppliers = (data.suppliers || []).filter((s: any) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Accounts Payable & Khata Management
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Supplier & Vendor Ledger</h1>
          <p className="text-slate-400 text-xs mt-1">
            Double-entry supplier statements, credit purchases, payments via bKash/Bank, and aging payables.
          </p>
        </div>

        <button
          onClick={loadLedger}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Supplier Payable</div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            ৳{(data.kpi?.totalSupplierPayable || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">মোট বাকি / দেনা</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Paid This Month</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ৳{(data.kpi?.paidThisMonth || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">চলতি মাসে পরিশোধ</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">30+ Days Overdue</div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            ৳{(data.kpi?.overduePayables || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">জরুরি পরিশোধযোগ্য</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Suppliers</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {data.kpi?.activeSuppliersCount || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">সক্রিয় ভেন্ডর</div>
        </div>
      </div>

      {/* Search & Supplier Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none text-slate-800"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Supplier</th>
                <th className="p-4">Total Purchases</th>
                <th className="p-4">Total Paid</th>
                <th className="p-4">Net Payable (বাকি)</th>
                <th className="p-4">Aging Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{s.code} • {s.phone || "No Phone"}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-800">
                    ৳{s.totalPurchases.toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-emerald-600">
                    ৳{s.totalPaid.toLocaleString()}
                  </td>
                  <td className="p-4 font-black text-sm text-rose-600">
                    ৳{s.netPayable.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.agingCategory === "30+_DAYS_OVERDUE"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : s.agingCategory === "16-30_DAYS"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {s.agingCategory.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedSupplier(s)
                        setTxForm({ ...txForm, type: "PAYMENT_OUT" })
                        setTxModalOpen(true)
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      💸 Pay Now
                    </button>
                    <button
                      onClick={() => handleOpenStatement(s.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      📄 Khata / Statement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {txModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Record Supplier Transaction</h3>
                <p className="text-xs text-slate-500 font-bold">{selectedSupplier.name}</p>
              </div>
              <button
                onClick={() => setTxModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Transaction Type</label>
                <select
                  value={txForm.type}
                  onChange={(e: any) => setTxForm({ ...txForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                >
                  <option value="PAYMENT_OUT">Payment Out (টাকা পরিশোধ — Decreases Payable)</option>
                  <option value="CREDIT_PURCHASE">Credit Purchase (বাকিতে মাল ক্রয় — Increases Payable)</option>
                  <option value="DEBIT_NOTE_RETURN">Debit Note / Return (মাল ফেরত সমন্বয়)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Amount (৳)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900"
                />
              </div>

              {txForm.type === "PAYMENT_OUT" && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Payment Method</label>
                  <select
                    value={txForm.paymentMethod}
                    onChange={(e: any) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="BKASH">bKash Merchant / Personal</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="BANK_TRANSFER">Bank Wire / BEFTN</option>
                    <option value="CASH">Cash Drawer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. TrxID / Invoice Reference"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTx}
                className="w-full py-3 bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#04BBFD]/20 cursor-pointer disabled:opacity-50"
              >
                {submittingTx ? "Recording..." : "Record Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Full Statement / Khata Modal */}
      {statementModalOpen && statementData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Supplier Khata Statement</h3>
                <p className="text-xs text-slate-500 font-bold">{statementData.supplier?.name} (Net Payable: ৳{statementData.currentBalance?.toLocaleString()})</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5 inline mr-1" />
                  Print
                </button>
                <button
                  onClick={() => setStatementModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Reference / Description</th>
                    <th className="p-3">Credit (মাল ক্রয়)</th>
                    <th className="p-3">Debit (পরিশোধ)</th>
                    <th className="p-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(statementData.statement || []).map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{row.reference}</div>
                        <div className="text-[11px] text-slate-500">{row.description}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {row.credit > 0 ? `৳${row.credit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        {row.debit > 0 ? `৳${row.debit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3 font-black text-slate-900 text-right">
                        ৳{row.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

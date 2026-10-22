"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../lib/api-client"
import { 
  RotateCcw, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, 
  Plus, RefreshCw, Search, ArrowRightLeft, DollarSign, Package 
} from "lucide-react"
import { toast } from "sonner"

export default function ReturnsRmaPage() {
  const [loading, setLoading] = useState(false)
  const [rmaList, setRmaList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Create RMA Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    customerName: "Kamrul Islam",
    customerPhone: "01812345678",
    productSkuOrName: "TWS Wireless Earbuds Pro",
    quantity: 1,
    returnType: "REFUND" as "REFUND" | "EXCHANGE" | "STORE_CREDIT",
    reasonCode: "DEFECTIVE_DAMAGED" as any,
    customerNotes: "Left earbud sound distorted",
    refundAmount: 1490,
  })
  const [submittingCreate, setSubmittingCreate] = useState(false)

  // QC Inspection Modal
  const [qcModalOpen, setQcModalOpen] = useState(false)
  const [selectedRma, setSelectedRma] = useState<any>(null)
  const [qcForm, setQcForm] = useState({
    qcStatus: "PASSED_RESTOCK" as "PASSED_RESTOCK" | "FAILED_DAMAGED_QUARANTINE" | "RETURN_TO_DROPSHIP_SUPPLIER",
    resolutionAction: "ISSUE_BKASH_REFUND" as any,
    inspectorNotes: "Item checked by warehouse technician. Verified original seal and parts intact.",
  })
  const [submittingQc, setSubmittingQc] = useState(false)

  useEffect(() => {
    loadRma()
  }, [])

  const loadRma = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/returns")
      setRmaList(res.data || [])
    } catch (err) {
      console.error("Failed to load RMA list:", err)
      toast.error("Failed to load returns list")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRma = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingCreate(true)
    try {
      const res = await api.post("/admin/returns", createForm)
      toast.success(res.data.message || "RMA Ticket created successfully")
      setCreateModalOpen(false)
      loadRma()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create RMA")
    } finally {
      setSubmittingCreate(false)
    }
  }

  const handleProcessQc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRma) return

    setSubmittingQc(true)
    try {
      const res = await api.patch(`/admin/returns/${selectedRma.rmaNumber}/process-qc`, qcForm)
      toast.success(res.data.message || "QC inspection recorded successfully")
      setQcModalOpen(false)
      loadRma()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process QC")
    } finally {
      setSubmittingQc(false)
    }
  }

  const filteredList = rmaList.filter(r => 
    r.rmaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customerPhone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Quality Control & Reverse Logistics
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Smart Return, Exchange & QC Center</h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage customer return merchandise authorizations (RMA), QC grading, automated inventory restock, and refunds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#04BBFD] hover:bg-[#03a0d9] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Return Ticket</span>
          </button>
          <button
            onClick={loadRma}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by RMA #, Customer Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none text-slate-800"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">RMA Number</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Returned Item & Qty</th>
                <th className="p-4">Reason Code</th>
                <th className="p-4">QC Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No return tickets found. Click "New Return Ticket" to initiate an RMA.
                  </td>
                </tr>
              ) : (
                filteredList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {r.rmaNumber}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{r.customerName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{r.customerPhone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{r.productSkuOrName}</div>
                      <div className="text-[11px] text-slate-500">Qty: {r.quantity} • Value: ৳{(r.refundAmount || 0).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.reasonCode}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.qcStatus === "PASSED_RESTOCK"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : r.qcStatus === "FAILED_DAMAGED_QUARANTINE"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {r.qcStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {r.resolutionStatus === "RESOLVED" ? (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRma(r)
                            setQcModalOpen(true)
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-[#04BBFD] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          🔍 QC Inspection
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create RMA Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Create New Return / RMA Ticket</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRma} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.customerName}
                    onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={createForm.customerPhone}
                    onChange={(e) => setCreateForm({ ...createForm, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Product Name / SKU</label>
                <input
                  type="text"
                  required
                  value={createForm.productSkuOrName}
                  onChange={(e) => setCreateForm({ ...createForm, productSkuOrName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Return Type</label>
                  <select
                    value={createForm.returnType}
                    onChange={(e: any) => setCreateForm({ ...createForm, returnType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="REFUND">Cash / bKash Refund</option>
                    <option value="EXCHANGE">Exchange Item</option>
                    <option value="STORE_CREDIT">Loyalty Points Credit</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Reason Code</label>
                  <select
                    value={createForm.reasonCode}
                    onChange={(e: any) => setCreateForm({ ...createForm, reasonCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="DEFECTIVE_DAMAGED">Defective / Damaged</option>
                    <option value="SIZE_MISMATCH">Size / Color Mismatch</option>
                    <option value="WRONG_ITEM_SENT">Wrong Item Sent</option>
                    <option value="CHANGED_MIND">Customer Changed Mind</option>
                    <option value="COURIER_UNDELIVERED_RETURN">Courier Undelivered Return</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Customer Problem Description</label>
                <textarea
                  rows={2}
                  value={createForm.customerNotes}
                  onChange={(e) => setCreateForm({ ...createForm, customerNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submittingCreate}
                className="w-full py-3 bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                {submittingCreate ? "Creating..." : "Submit Return Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QC Grading Modal */}
      {qcModalOpen && selectedRma && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">QC Inspection & Resolution</h3>
                <p className="text-xs text-slate-500 font-bold">{selectedRma.rmaNumber} • {selectedRma.productSkuOrName}</p>
              </div>
              <button
                onClick={() => setQcModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessQc} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quality Control Verdict</label>
                <select
                  value={qcForm.qcStatus}
                  onChange={(e: any) => setQcForm({ ...qcForm, qcStatus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                >
                  <option value="PASSED_RESTOCK">✅ QC Passed → Auto-Restock to Warehouse</option>
                  <option value="FAILED_DAMAGED_QUARANTINE">⚠️ QC Failed → Quarantine / Write-off Loss</option>
                  <option value="RETURN_TO_DROPSHIP_SUPPLIER">📦 Return to Dropship Supplier (Skybuy/China)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Resolution Action</label>
                <select
                  value={qcForm.resolutionAction}
                  onChange={(e: any) => setQcForm({ ...qcForm, resolutionAction: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                >
                  <option value="ISSUE_BKASH_REFUND">Disburse bKash Refund (৳{selectedRma.refundAmount})</option>
                  <option value="ISSUE_CASH_REFUND">Issue Cash Refund from Drawer</option>
                  <option value="DISPATCH_EXCHANGE_ITEM">Dispatch Exchange Parcel</option>
                  <option value="CREDITED_TO_LOYALTY_WALLET">Credit to Customer Loyalty Points</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Technician Notes</label>
                <textarea
                  rows={2}
                  value={qcForm.inspectorNotes}
                  onChange={(e) => setQcForm({ ...qcForm, inspectorNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={submittingQc}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                {submittingQc ? "Processing..." : "Complete QC & Execute Disposition"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"
import React, { useState, useEffect } from "react"
import { api } from "../../../../lib/api-client"
import { Button } from "../../../../components/ui/button"
import { ArrowLeft, Printer, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SaleReceiptPage({ params }: { params: { id: string } }) {
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [paymentReference, setPaymentReference] = useState("")
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  
  const router = useRouter()

  useEffect(() => {
    fetchSale()
  }, [])

  const fetchSale = async () => {
    try {
      const res = await api.get(`/sales/${params.id}`)
      setSale(res.data)
    } catch (error) {
      console.error("Failed to fetch sale", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReceivePayment = async () => {
    setPaymentError("")
    const amount = Number(paymentAmount)
    if (amount <= 0) {
      setPaymentError("Amount must be greater than zero.")
      return
    }

    setSubmittingPayment(true)
    try {
      await api.post(`/sales/${params.id}/payments`, {
        amount,
        method: paymentMethod,
        reference: paymentReference,
        paymentDate: new Date().toISOString()
      })
      setShowPaymentModal(false)
      setPaymentAmount("")
      setPaymentReference("")
      fetchSale() // Reload sale
    } catch (error: any) {
      setPaymentError(error.response?.data?.message || "Payment failed")
    } finally {
      setSubmittingPayment(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading receipt...</div>
  if (!sale) return <div className="p-8 text-center text-destructive">Receipt not found</div>

  const totalPaid = sale.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
  const outstanding = Math.max(0, Number(sale.total) - totalPaid)
  const canReceivePayment = sale.status === 'COMPLETED' && outstanding > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.push("/admin/sales")} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
        </Button>
        <div className="flex gap-2">
          {canReceivePayment && (
            <Button onClick={() => setShowPaymentModal(true)} className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm interaction-bounce">
              <CreditCard className="w-4 h-4 mr-2" /> Receive Payment
            </Button>
          )}
          <Button onClick={() => window.print()} className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm interaction-bounce">
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
        </div>
      </div>

      <div className="solid-elevated p-8 bg-white print:p-0 print:border-none print:shadow-none">
        {/* Receipt Header */}
        <div className="text-center mb-8 border-b border-dashed border-slate-300 pb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MY BUSINESS OS</h1>
          <p className="text-sm text-slate-500 mt-1">Store Receipt</p>
          
          <div className="mt-6 flex flex-col gap-1 text-sm text-slate-600">
            <p><strong>Receipt #:</strong> {sale.saleNumber}</p>
            <p><strong>Date:</strong> {new Date(sale.createdAt).toLocaleString()}</p>
            <p><strong>Cashier:</strong> {sale.createdByUserId}</p>
            <p><strong>Status:</strong> {sale.status} / {sale.paymentStatus}</p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm text-slate-600 mb-8">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 text-left font-semibold">Item</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Price</th>
              <th className="py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.lines?.map((line: any) => (
              <tr key={line.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 text-slate-900">{line.variant?.product?.name || line.productId}</td>
                <td className="py-3 text-right tabular-nums">{Number(line.quantity)}</td>
                <td className="py-3 text-right tabular-nums">৳{Number(line.unitPrice).toLocaleString()}</td>
                <td className="py-3 text-right tabular-nums font-medium text-slate-900">৳{Number(line.lineTotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums">৳{Number(sale.subtotal).toLocaleString()}</span>
          </div>
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-rose-500">
              <span>Discount</span>
              <span className="tabular-nums">- ৳{Number(sale.discount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200 mt-2">
            <span>Total</span>
            <span className="tabular-nums">৳{Number(sale.total).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600 mt-2">
            <span>Paid</span>
            <span className="tabular-nums">৳{totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 mt-1">
            <span>Outstanding</span>
            <span className="tabular-nums text-rose-600">৳{outstanding.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment History */}
        {sale.payments && sale.payments.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-200 no-print">
            <h3 className="font-semibold text-slate-900 mb-4">Payment History</h3>
            <div className="space-y-3 text-sm">
              {sale.payments.map((p: any) => (
                <div key={p.id} className="flex justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
                  <div>
                    <div className="font-medium text-slate-900">{p.method}</div>
                    <div className="text-slate-500 text-xs">{new Date(p.paymentDate).toLocaleString()}</div>
                    {p.reference && <div className="text-slate-400 text-xs mt-1">Ref: {p.reference}</div>}
                  </div>
                  <div className="font-medium text-emerald-600">
                    ৳{Number(p.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center text-xs text-slate-400 border-t border-dashed border-slate-300 pt-8">
          <p>Thank you for your business!</p>
          <p className="mt-1">Generated by My Business OS</p>
        </div>
      </div>

      {/* Receive Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Receive Payment</h2>
            
            <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Outstanding Balance:</span>
                <span className="font-semibold text-rose-600">৳{outstanding.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (৳)</label>
                <input 
                  type="number" 
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="0.00"
                  max={outstanding}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                  <option value="MOBILE_BANKING">Mobile Banking</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference (Optional)</label>
                <input 
                  type="text" 
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Txn ID, Check #, etc."
                />
              </div>

              {paymentError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {paymentError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)} disabled={submittingPayment}>
                Cancel
              </Button>
              <Button onClick={handleReceivePayment} disabled={submittingPayment} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {submittingPayment ? "Processing..." : "Receive Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, FileText, Download, Edit, CreditCard, Box } from 'lucide-react'

export default function PurchaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [purchase, setPurchase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'CASH',
    reference: '',
    paymentDate: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    fetchPurchase()
  }, [])

  const fetchPurchase = async () => {
    try {
      const res = await fetch(`/api/purchases/${params.id}`)
      if (res.ok) {
        setPurchase(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!confirm('Are you sure you want to complete this purchase? This will update inventory and cannot be undone.')) return
    
    setCompleting(true)
    try {
      const res = await fetch(`/api/purchases/${params.id}/complete`, { method: 'POST' })
      if (res.ok) {
        fetchPurchase()
      } else {
        const err = await res.json()
        alert(err.message || 'Failed to complete purchase')
      }
    } catch (e) {
      alert('Error completing purchase')
    } finally {
      setCompleting(false)
    }
  }

  const handleAddPayment = async (e: any) => {
    e.preventDefault()
    setAddingPayment(true)
    try {
      const res = await fetch(`/api/purchases/${params.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentForm,
          paymentDate: new Date(paymentForm.paymentDate).toISOString()
        })
      })
      if (res.ok) {
        fetchPurchase()
        setPaymentForm({
          ...paymentForm,
          amount: 0,
          reference: ''
        })
      } else {
        const err = await res.json()
        alert(err.message || 'Failed to add payment')
      }
    } catch (e) {
      alert('Error adding payment')
    } finally {
      setAddingPayment(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-400">Loading purchase details...</div>
  if (!purchase) return <div className="p-12 text-center text-red-500">Purchase not found</div>

  const isCompleted = purchase.status === 'COMPLETED'
  const totalPaid = (purchase.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const balanceDue = Number(purchase.total) - totalPaid

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">PO #{purchase.id.slice(0, 8)}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                {purchase.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Created {new Date(purchase.purchaseDate).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="control-button-secondary h-11 px-4 shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </button>
          
          {!isCompleted && (
            <button 
              onClick={handleComplete}
              disabled={completing}
              className="control-button-primary h-11 px-6 shadow-md"
            >
              <Box className="w-4 h-4 mr-2" /> {completing ? 'Processing...' : 'Complete & Receive Goods'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="surface-elevated p-6 grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Supplier</div>
              <div className="font-medium text-slate-900">{purchase.supplier?.name}</div>
              <div className="text-sm text-slate-600 mt-1">{purchase.supplier?.email || purchase.supplier?.phone}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Destination</div>
              <div className="font-medium text-slate-900">{purchase.warehouse?.name}</div>
              <div className="text-sm text-slate-600 mt-1">{purchase.branch?.name || 'Primary Branch'}</div>
            </div>
          </div>

          <div className="surface-elevated overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Purchase Lines</h3>
              {!isCompleted && (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                  <Edit className="w-3 h-3 mr-1" /> Edit Lines
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200/70">
                  <tr>
                    <th className="font-medium text-slate-500 px-6 py-3">Product</th>
                    <th className="font-medium text-slate-500 px-6 py-3 text-right">Qty</th>
                    <th className="font-medium text-slate-500 px-6 py-3 text-right">Cost</th>
                    <th className="font-medium text-slate-500 px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchase.lines.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{l.productNameSnapshot}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{l.skuSnapshot}</div>
                      </td>
                      <td className="px-6 py-4 text-right">{l.quantity}</td>
                      <td className="px-6 py-4 text-right">৳{Number(l.unitCost).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right tabular-nums font-medium text-slate-900">
                        ৳{Number(l.lineTotal).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right font-medium text-slate-600">Subtotal</td>
                    <td className="px-6 py-4 text-right tabular-nums font-semibold text-slate-900">
                      ৳{Number(purchase.subtotal).toLocaleString()}
                    </td>
                  </tr>
                  {Number(purchase.totalDiscount) > 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-2 text-right text-slate-500">Discount</td>
                      <td className="px-6 py-2 text-right tabular-nums text-red-600">
                        -৳{Number(purchase.totalDiscount).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right font-bold text-slate-900 text-lg border-t border-slate-200">Total</td>
                    <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900 text-lg border-t border-slate-200">
                      ৳{Number(purchase.total).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
        </div>

        {/* Right Col - Payments */}
        <div className="space-y-6">
          <div className="surface-elevated p-6">
            <h3 className="font-bold text-slate-900 flex items-center mb-6">
              <CreditCard className="w-5 h-5 mr-2 text-slate-400" /> Payments
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Purchase</span>
                <span className="font-semibold text-slate-900">৳{Number(purchase.total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Paid</span>
                <span className="font-semibold text-emerald-600">৳{totalPaid.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-medium text-slate-900">Balance Due</span>
                <span className={`font-bold text-lg ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ৳{balanceDue.toLocaleString()}
                </span>
              </div>
            </div>

            {purchase.payments?.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">History</h4>
                {purchase.payments.map((p: any) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{p.method}</div>
                      <div className="text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString()} • {p.reference || 'No ref'}</div>
                    </div>
                    <div className="font-medium text-slate-900">৳{Number(p.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            {isCompleted && balanceDue > 0 && (
              <form onSubmit={handleAddPayment} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                <h4 className="text-sm font-medium text-slate-900">Add Payment</h4>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Amount</label>
                  <input required type="number" min="0.01" max={balanceDue} step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} className="control-input w-full h-10" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Method</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="control-input w-full h-10 bg-white">
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="MOBILE_BANKING">Mobile Banking (bKash/Nagad)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Reference (Optional)</label>
                  <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} className="control-input w-full h-10" placeholder="e.g. TrxID or Check No." />
                </div>
                <button type="submit" disabled={addingPayment || paymentForm.amount <= 0 || paymentForm.amount > balanceDue} className="control-button-primary w-full h-10 mt-2">
                  {addingPayment ? 'Processing...' : 'Record Payment'}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

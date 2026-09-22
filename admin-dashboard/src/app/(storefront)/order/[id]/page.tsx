"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "../../../../lib/api-client"
import { CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function OrderSuccessPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviewingLineId, setReviewingLineId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get(`/public/orders/${params.id}`)
        setOrder(res.data)
      } catch (err) {
        console.error("Failed to load order", err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchOrder()
  }, [params.id])

  if (loading) {
    return <div className="max-w-[800px] mx-auto px-6 py-32 text-center animate-pulse">Loading order details...</div>
  }

  if (!order) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-32 text-center">
        <h1 className="text-2xl font-semibold mb-4">Order not found</h1>
        <Link href="/" className="text-blue-600 hover:underline">Return to Home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 py-20 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-4">Order Successful!</h1>
        <p className="text-lg text-slate-500">
          Thank you for your purchase. Your order number is <span className="font-semibold text-slate-900">{order.invoiceNumber}</span>.
        </p>
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
        <h2 className="text-xl font-semibold mb-6 border-b border-slate-200 pb-4">Order Summary</h2>
        <div className="space-y-4 mb-8">
          {order.lines.map((line: any) => (
            <div key={line.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{line.variant?.product?.name || line.product?.name || 'Product'}</p>
                  <p className="text-sm text-slate-500">Qty: {line.quantity}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="font-medium">৳{(Number(line.unitPrice) * line.quantity).toLocaleString()}</div>
                  {line.variant?.productId && (
                    <button 
                      onClick={() => setReviewingLineId(reviewingLineId === line.id ? null : line.id)}
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                      {reviewingLineId === line.id ? 'Cancel Review' : 'Leave a Review'}
                    </button>
                  )}
                </div>
              </div>
              
              {reviewingLineId === line.id && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const rating = parseInt((form.elements.namedItem('rating') as HTMLSelectElement).value);
                      const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement).value;
                      
                      try {
                        await api.post(`/public/catalog/products/${line.variant.productId}/reviews`, { 
                          rating, 
                          orderId: order.id, 
                          comment 
                        });
                        alert('Review submitted successfully!');
                        setReviewingLineId(null);
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Failed to submit review');
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-xs font-semibold text-slate-700 uppercase mb-1 block">Rating</label>
                      <select name="rating" required className="control-input w-full h-10 bg-slate-50">
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Terrible</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 uppercase mb-1 block">Comment</label>
                      <textarea name="comment" className="control-input w-full h-20 py-2 resize-none bg-slate-50" placeholder="What did you think?"></textarea>
                    </div>
                    <button type="submit" className="control-button-primary w-full h-9 text-sm">Submit Review</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-lg font-semibold">
          <span>Total Paid</span>
          <span>৳{Number(order.totalAmount).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/account" className="control-button-primary h-12 px-8 rounded-full inline-flex items-center">
          View My Account <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  )
}

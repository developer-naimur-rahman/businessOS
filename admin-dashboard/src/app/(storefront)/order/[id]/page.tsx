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
            <div key={line.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-900">{line.product?.name}</p>
                <p className="text-sm text-slate-500">Qty: {line.quantity}</p>
              </div>
              <div className="font-medium">৳{(Number(line.unitPrice) * line.quantity).toLocaleString()}</div>
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

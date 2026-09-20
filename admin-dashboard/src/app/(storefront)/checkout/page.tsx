"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, ShieldCheck, CheckCircle2 } from "lucide-react"
import { useCartStore } from "../../../store/useCartStore"
import { useCustomerAuthStore } from "../../../store/useCustomerAuthStore"
import { api } from "../../../lib/api-client"

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const subtotal = useCartStore((state) => state.totalPrice())
  
  const { customer, isAuthenticated, login } = useCustomerAuthStore()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const tax = subtotal * 0.05
  const total = subtotal + tax

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (authMode === 'login') {
        const res = await api.post('/public/auth/login', { email, password })
        login(res.data.access_token, res.data.customer)
      } else {
        const res = await api.post('/public/auth/register', { email, password, name, phone })
        login(res.data.access_token, res.data.customer)
      }
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const res = await api.post('/public/orders/checkout', {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        paymentMethod: 'CASH',
        paymentAmount: total
      })
      clearCart()
      router.push(`/order/${res.data.id}`)
    } catch (err: any) {
      alert("Failed to place order: " + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500">
      
      <Link href="/cart" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Cart
      </Link>

      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Checkout</h1>
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <Lock className="w-4 h-4" /> Secure SSL Encrypted
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Checkout Form */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Step 1: Authentication */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${isAuthenticated ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                {isAuthenticated ? <CheckCircle2 className="w-5 h-5" /> : 1}
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Customer Identity</h2>
            </div>
            
            {!isAuthenticated ? (
              <form onSubmit={handleAuth} className="space-y-4">
                {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
                
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="control-input h-12 w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="control-input h-12 w-full mt-1" />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="control-input h-12 w-full mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="control-input h-12 w-full mt-1" />
                </div>
                
                <div className="pt-2">
                  <button type="submit" disabled={loading} className="control-button-primary w-full h-12 rounded-lg">
                    {loading ? "Processing..." : authMode === 'login' ? "Login to Continue" : "Create Account & Continue"}
                  </button>
                </div>
                
                <div className="text-center text-sm text-slate-500 mt-4">
                  {authMode === 'login' ? (
                    <>Don't have an account? <button type="button" onClick={() => setAuthMode('register')} className="text-blue-600 font-semibold">Register</button></>
                  ) : (
                    <>Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-blue-600 font-semibold">Login</button></>
                  )}
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-medium text-slate-900">Signed in as {customer?.name}</p>
                <p className="text-slate-500 text-sm">{customer?.email}</p>
                {step === 1 && (
                  <button onClick={() => setStep(2)} className="mt-4 control-button-secondary h-10 px-6 rounded-lg text-sm">
                    Continue to Payment
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Payment */}
          <div className={`space-y-6 ${step < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">2</div>
              <h2 className="text-xl font-semibold text-slate-900">Payment</h2>
            </div>
            {step >= 2 && (
              <div className="space-y-4">
                <div className="p-4 border-2 border-emerald-500 rounded-xl bg-emerald-50/50 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-4 border-emerald-500 bg-white"></div>
                    <span className="font-semibold text-emerald-900">Cash / Pay at Store</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 sticky top-28">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Order Details</h2>
            
            <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xs text-slate-400">
                    No Img
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 line-clamp-1">{item.name}</h4>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-medium text-slate-900">৳{(item.price * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-sm mb-6 pt-6 border-t border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900 tabular-nums">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (5%)</span>
                <span className="font-medium text-slate-900 tabular-nums">৳{tax.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 mb-8">
              <div className="flex justify-between items-end">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-2xl font-semibold text-slate-900 tabular-nums">৳{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              disabled={step < 2 || loading} 
              onClick={handlePlaceOrder}
              className={`control-button-primary w-full h-14 rounded-full text-base flex justify-center interactive-item shadow-md hover:shadow-lg ${step < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
            
          </div>
        </div>

      </div>
    </div>
  )
}

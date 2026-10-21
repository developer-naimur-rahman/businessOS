"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, Lock, ShieldCheck, CheckCircle2, 
  Smartphone, CreditCard, Banknote, Tag, X, Copy, Check 
} from "lucide-react"
import { useCartStore } from "../../../store/useCartStore"
import { useCustomerAuthStore } from "../../../store/useCustomerAuthStore"
import { api } from "../../../lib/api-client"
import { toast } from "sonner"

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const subtotal = useCartStore((state) => state.totalPrice())
  const appliedCoupon = useCartStore((state) => state.appliedCoupon)
  const applyCoupon = useCartStore((state) => state.applyCoupon)
  
  const { customer, isAuthenticated, login } = useCustomerAuthStore()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [deliveryZone, setDeliveryZone] = useState<'savar' | 'dhaka' | 'outside' | 'pickup'>('savar')
  const [customerNotes, setCustomerNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Multi-Payment selection
  const [paymentOption, setPaymentOption] = useState<'COD' | 'bKash' | 'Nagad' | 'BANK'>('COD')
  const [senderPhone, setSenderPhone] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [copiedNumber, setCopiedNumber] = useState(false)

  // Promo code input
  const [couponInput, setCouponInput] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  // Delivery charge calculation
  const deliveryCharge = deliveryZone === 'pickup' ? 0 : deliveryZone === 'outside' ? 120 : 60
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const discountedSubtotal = Math.max(0, subtotal - discount)
  const tax = Math.round(discountedSubtotal * 0.05)
  const grandTotal = discountedSubtotal + deliveryCharge + tax

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  useEffect(() => {
    if (customer) {
      if (customer.phone && !phone) setPhone(customer.phone)
      if (customer.name && !name) setName(customer.name)
    }
  }, [customer])

  const handleCopyMerchantNumber = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedNumber(true)
    toast.success("Merchant number copied to clipboard!")
    setTimeout(() => setCopiedNumber(false), 2000)
  }

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

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return

    setValidatingCoupon(true)
    try {
      const res = await api.post('/public/coupons/validate', {
        code: couponInput.trim().toUpperCase(),
        subtotal: subtotal,
      })

      if (res.data.valid) {
        applyCoupon({
          code: res.data.code,
          type: res.data.type,
          value: res.data.value,
          discountAmount: res.data.discountAmount,
        })
        toast.success(res.data.message || "Coupon applied successfully!")
        setCouponInput("")
      } else {
        toast.error(res.data.message || "Invalid coupon code.")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to validate coupon.")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    applyCoupon(null)
    toast.info("Coupon removed.")
  }

  const handlePlaceOrder = async () => {
    // Validate manual payment details
    if (paymentOption === 'bKash' || paymentOption === 'Nagad' || paymentOption === 'BANK') {
      const cleanPhone = senderPhone.trim()
      const cleanTrx = transactionId.trim()

      if (!cleanPhone) {
        toast.error(`Please provide the ${paymentOption} sender phone number.`)
        return
      }
      if (cleanPhone.length < 11) {
        toast.error("Please enter a valid 11-digit mobile number.")
        return
      }
      if (!cleanTrx) {
        toast.error(`Please provide the Transaction ID (TrxID) for verification.`)
        return
      }
    }

    setLoading(true)
    try {
      const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      
      const paymentMethod = paymentOption === 'COD' 
        ? 'CASH' 
        : paymentOption === 'BANK' 
        ? 'BANK' 
        : 'MOBILE_BANKING'

      const paymentProvider = (paymentOption === 'bKash' || paymentOption === 'Nagad') 
        ? paymentOption 
        : undefined

      const res = await api.post('/public/orders/checkout', {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        paymentMethod,
        paymentProvider,
        senderPhone: senderPhone.trim() || undefined,
        transactionId: transactionId.trim() || undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: discount,
        shippingAddress: deliveryZone === 'pickup' 
          ? 'Store Pickup (Hemayetpur, Savar, Dhaka)' 
          : `${shippingAddress.trim()} [Zone: ${deliveryZone}]`,
        customerPhone: phone || customer?.phone || senderPhone.trim() || undefined,
        customerNotes: customerNotes.trim() || undefined,
        idempotencyKey,
      })

      clearCart()
      toast.success('Order placed successfully!')
      router.push(`/order/${res.data.id}`)
    } catch (err: any) {
      toast.error("Failed to place order: " + (err.response?.data?.message || err.message))
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
        
        {/* Checkout Steps Form */}
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
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="control-input h-12 w-full mt-1" placeholder="e.g. Tanvir Ahmed" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone Number</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="control-input h-12 w-full mt-1" placeholder="017XXXXXXXX" />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="control-input h-12 w-full mt-1" placeholder="name@domain.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="control-input h-12 w-full mt-1" placeholder="••••••••" />
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{customer?.name}</p>
                  <p className="text-slate-500 text-xs">{customer?.email} {customer?.phone ? `• ${customer.phone}` : ''}</p>
                </div>
                {step === 1 && (
                  <button onClick={() => setStep(2)} className="control-button-primary h-9 px-4 rounded-lg text-xs">
                    Continue to Details
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Delivery & Shipping */}
          <div className={`space-y-6 ${step < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">2</div>
              <h2 className="text-xl font-semibold text-slate-900">Delivery Information</h2>
            </div>
            
            {step >= 2 && (
              <div className="space-y-5">
                {/* Delivery Zone Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                    Delivery Area / Shipping Zone
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'savar', label: 'Inside Savar', fee: '৳60' },
                      { id: 'dhaka', label: 'Dhaka City', fee: '৳60' },
                      { id: 'outside', label: 'Outside Dhaka', fee: '৳120' },
                      { id: 'pickup', label: 'Store Pickup', fee: 'FREE' },
                    ].map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setDeliveryZone(zone.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          deliveryZone === zone.id 
                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900">{zone.label}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${zone.fee === 'FREE' ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {zone.fee}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {deliveryZone !== 'pickup' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Full Delivery Address
                    </label>
                    <textarea
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="House/Holding no., Road, Block/Area, City, Landmark"
                      className="control-input w-full p-3 text-sm resize-none rounded-xl"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Contact Phone for Courier
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="control-input h-11 w-full text-sm rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Special Order Notes / Printing Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Specific delivery timing, gate instructions, paper requirements, etc."
                    className="control-input h-11 w-full text-sm rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Multi-Payment Method Selection */}
          <div className={`space-y-6 ${step < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">3</div>
              <h2 className="text-xl font-semibold text-slate-900">Payment Method</h2>
            </div>

            {step >= 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* COD */}
                  <div 
                    onClick={() => setPaymentOption('COD')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentOption === 'COD' 
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Cash on Delivery (COD)</span>
                      <span className="text-xs text-slate-500 leading-tight block mt-0.5">Pay in cash when order arrives or at pickup</span>
                    </div>
                  </div>

                  {/* bKash */}
                  <div 
                    onClick={() => setPaymentOption('bKash')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentOption === 'bKash' 
                        ? 'border-[#E2136E] bg-pink-50/40 ring-2 ring-[#E2136E]/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#E2136E]/10 text-[#E2136E] flex items-center justify-center shrink-0 mt-0.5 font-black text-sm">
                      bK
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">bKash Payment</span>
                      <span className="text-xs text-slate-500 leading-tight block mt-0.5">Send money / Merchant payment via bKash App</span>
                    </div>
                  </div>

                  {/* Nagad */}
                  <div 
                    onClick={() => setPaymentOption('Nagad')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentOption === 'Nagad' 
                        ? 'border-[#F7941D] bg-orange-50/40 ring-2 ring-[#F7941D]/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#F7941D]/10 text-[#F7941D] flex items-center justify-center shrink-0 mt-0.5 font-black text-sm">
                      নগদ
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Nagad Payment</span>
                      <span className="text-xs text-slate-500 leading-tight block mt-0.5">Send money / Merchant payment via Nagad App</span>
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div 
                    onClick={() => setPaymentOption('BANK')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentOption === 'BANK' 
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Bank / Card Transfer</span>
                      <span className="text-xs text-slate-500 leading-tight block mt-0.5">Direct Dutch-Bangla / City Bank transfer</span>
                    </div>
                  </div>

                </div>

                {/* bKash Instructions & Form */}
                {paymentOption === 'bKash' && (
                  <div className="bg-pink-50/60 rounded-2xl p-5 border border-pink-200 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E2136E]"></span>
                          bKash Payment Instructions
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Go to your bKash App &gt; Select <strong>Send Money</strong> or <strong>Make Payment</strong>:
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#E2136E] bg-pink-100 px-3 py-1 rounded-full">
                        Amount: ৳{grandTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-pink-100">
                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase">bKash Merchant/Personal Number</p>
                        <p className="text-base font-bold text-slate-900 tracking-wider">01712-345678</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyMerchantNumber("01712345678")}
                        className="control-button-secondary h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedNumber ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                          Your bKash Number (Sender) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="e.g. 017XXXXXXXX"
                          className="control-input h-11 w-full text-sm rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                          bKash Transaction ID (TrxID) *
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. BKA8291XYZ"
                          className="control-input h-11 w-full text-sm rounded-xl bg-white uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Nagad Instructions & Form */}
                {paymentOption === 'Nagad' && (
                  <div className="bg-orange-50/60 rounded-2xl p-5 border border-orange-200 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F7941D]"></span>
                          Nagad Payment Instructions
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Go to your Nagad App &gt; Select <strong>Send Money</strong> or <strong>Merchant Pay</strong>:
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#F7941D] bg-orange-100 px-3 py-1 rounded-full">
                        Amount: ৳{grandTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-orange-100">
                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase">Nagad Merchant/Personal Number</p>
                        <p className="text-base font-bold text-slate-900 tracking-wider">01712-345678</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyMerchantNumber("01712345678")}
                        className="control-button-secondary h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedNumber ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                          Your Nagad Number (Sender) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="e.g. 018XXXXXXXX"
                          className="control-input h-11 w-full text-sm rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                          Nagad Transaction ID (TrxID) *
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. NAG98321XYZ"
                          className="control-input h-11 w-full text-sm rounded-xl bg-white uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Instructions */}
                {paymentOption === 'BANK' && (
                  <div className="bg-blue-50/60 rounded-2xl p-5 border border-blue-200 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Corporate Bank Account Details</h4>
                        <p className="text-xs text-slate-600 mt-1">Transfer via NPSB / BEFTN / Online Banking:</p>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                        Amount: ৳{grandTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-blue-100 text-xs space-y-1 text-slate-700">
                      <p><strong>Bank:</strong> City Bank PLC / Dutch-Bangla Bank</p>
                      <p><strong>Account Name:</strong> BusinessOS Retail & Digital Printing</p>
                      <p><strong>Account Number:</strong> 109-120-459821</p>
                      <p><strong>Branch:</strong> Savar Branch, Dhaka</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                          Sender Account / Reference Phone *
                        </label>
                        <input
                          type="text"
                          required
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="Account No. or Phone"
                          className="control-input h-11 w-full text-sm rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                          Bank Reference / Transaction ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Bank deposit / transaction ref"
                          className="control-input h-11 w-full text-sm rounded-xl bg-white uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 sticky top-28 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Order Details</h2>
            
            <div className="space-y-4 mb-6 max-h-[35vh] overflow-y-auto pr-2 divide-y divide-slate-100">
              {items.map(item => (
                <div key={item.productId} className="flex gap-4 pt-3 first:pt-0">
                  <div className="w-14 h-14 bg-slate-200 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xs text-slate-400">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Item</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-slate-500">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                  </div>
                  <div className="font-semibold text-slate-900 text-sm tabular-nums">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Promo Code Box */}
            <div className="py-4 border-t border-slate-200">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" /> Apply Promo Code
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 font-mono">{appliedCoupon.code}</span>
                      <span className="text-[11px] text-emerald-700 block">
                        Saved ৳{discount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="w-6 h-6 rounded-full hover:bg-emerald-200/60 text-emerald-800 flex items-center justify-center transition-colors"
                    title="Remove coupon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="e.g. WELCOME10, FLAT100"
                    className="control-input h-10 text-xs flex-1 rounded-xl uppercase font-mono"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon || !couponInput.trim()}
                    className="control-button-secondary h-10 px-4 rounded-xl text-xs font-semibold shrink-0"
                  >
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                </form>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 text-sm py-4 border-t border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900 tabular-nums">৳{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span className="tabular-nums">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  {deliveryCharge === 0 ? 'FREE' : `৳${deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (5%)</span>
                <span className="font-medium text-slate-900 tabular-nums">৳{tax.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 mb-8">
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-semibold text-slate-900 block">Grand Total</span>
                  <span className="text-[11px] text-slate-400">Includes VAT and Delivery</span>
                </div>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button 
              disabled={step < 2 || loading} 
              onClick={handlePlaceOrder}
              className={`control-button-primary w-full h-14 rounded-full text-base flex items-center justify-center gap-2 interactive-item shadow-md hover:shadow-lg ${step < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "Placing Order..." : paymentOption === 'COD' ? "Confirm Cash on Delivery" : `Confirm & Pay with ${paymentOption}`}
            </button>
            
          </div>
        </div>

      </div>
    </div>
  )
}

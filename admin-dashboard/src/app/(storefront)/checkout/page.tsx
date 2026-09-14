"use client"
import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Lock, ShieldCheck, CheckCircle2 } from "lucide-react"

export default function CheckoutPage() {
  const [step, setStep] = useState(1)

  // Demo cart state 
  const subtotal = 15500
  const tax = subtotal * 0.05
  const total = subtotal + tax

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
          
          {/* Step 1: Customer Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">1</div>
              <h2 className="text-xl font-semibold text-slate-900">Customer Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">First Name</label>
                <input type="text" className="control-input h-12 w-full" placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Last Name</label>
                <input type="text" className="control-input h-12 w-full" placeholder="Doe" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
                <input type="email" className="control-input h-12 w-full" placeholder="john@example.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone Number</label>
                <input type="tel" className="control-input h-12 w-full" placeholder="+880 1..." />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery */}
          <div className="space-y-6 opacity-50 pointer-events-none">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-semibold text-sm">2</div>
              <h2 className="text-xl font-semibold text-slate-900">Delivery Details</h2>
            </div>
          </div>

          {/* Step 3: Payment */}
          <div className="space-y-6 opacity-50 pointer-events-none">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-semibold text-sm">3</div>
              <h2 className="text-xl font-semibold text-slate-900">Payment</h2>
            </div>
          </div>

        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 sticky top-28">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Order Details</h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-lg shrink-0 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 line-clamp-1">Premium Ergonomic Keyboard</h4>
                  <p className="text-sm text-slate-500">Qty: 1</p>
                </div>
                <div className="font-medium text-slate-900">৳12,500</div>
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-lg shrink-0 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1562564055-71e051d33c19?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 line-clamp-1">Business Card Printing</h4>
                  <p className="text-sm text-slate-500">Qty: 2</p>
                </div>
                <div className="font-medium text-slate-900">৳3,000</div>
              </div>
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
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-medium text-slate-500">Calculated next step</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 mb-8">
              <div className="flex justify-between items-end">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-2xl font-semibold text-slate-900 tabular-nums">৳{total.toLocaleString()}</span>
              </div>
            </div>

            {/* As per master prompt: "If backend checkout/order functionality does not exist yet: Build the visual checkout architecture but clearly separate unsupported operations. Do not fake an order being created." */}
            <button className="control-button-primary w-full h-14 rounded-full text-base flex justify-center opacity-50 cursor-not-allowed">
              Continue to Delivery
            </button>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed font-medium">
                Checkout processing is temporarily disabled while we upgrade our payment infrastructure. Please contact support to place an order.
              </p>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}

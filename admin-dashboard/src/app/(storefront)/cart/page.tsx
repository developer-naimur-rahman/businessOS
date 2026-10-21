"use client"
import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag, CheckCircle2, X } from "lucide-react"
import { MediaImage } from "../../../components/ui/media-image"
import { useCartStore } from "../../../store/useCartStore"
import { api } from "../../../lib/api-client"
import { toast } from "sonner"

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const appliedCoupon = useCartStore((state) => state.appliedCoupon)
  const applyCoupon = useCartStore((state) => state.applyCoupon)

  const [couponInput, setCouponInput] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const subtotal = useCartStore((state) => state.totalPrice())
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const discountedSubtotal = Math.max(0, subtotal - discount)
  const tax = Math.round(discountedSubtotal * 0.05)
  const total = discountedSubtotal + tax

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

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500">
      
      <Link href="/products" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
      </Link>

      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-12">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-32 bg-slate-50 rounded-3xl border border-slate-100">
          <ShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-6" />
          <h2 className="text-2xl font-medium text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/products" className="control-button-primary rounded-full px-8 h-12 inline-flex items-center">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-6">
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-slate-200 text-sm font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            <div className="space-y-6 md:space-y-0 md:divide-y md:divide-slate-100">
              {items.map(item => (
                <div key={item.productId} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6 items-center">
                  
                  {/* Product Info */}
                  <div className="col-span-1 md:col-span-6 flex items-center gap-4">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/50">
                      <MediaImage asset={item.imageUrl} fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 text-lg leading-tight mb-1">{item.name}</h3>
                      <p className="text-slate-500 font-medium">৳{item.price.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="col-span-1 md:col-span-3 flex items-center md:justify-center mt-4 md:mt-0">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium text-slate-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price & Remove */}
                  <div className="col-span-1 md:col-span-3 flex items-center justify-between md:justify-end mt-4 md:mt-0">
                    <p className="font-semibold text-lg text-slate-900 tabular-nums md:hidden">
                      Total: ৳{(item.price * item.quantity).toLocaleString()}
                    </p>
                    <p className="hidden md:block font-semibold text-lg text-slate-900 tabular-nums">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </p>
                    <button 
                      onClick={() => removeItem(item.productId)}
                      className="w-10 h-10 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all md:ml-4 shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 sticky top-28 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Order Summary</h2>
              
              {/* Promo code box */}
              <div className="pb-5 mb-5 border-b border-slate-200">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" /> Have a Promo Code?
                </label>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-900 font-mono">{appliedCoupon.code}</span>
                        <span className="text-[11px] text-emerald-700 block">
                          -৳{discount.toLocaleString()} discount
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

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900 tabular-nums">৳{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Discount</span>
                    <span className="tabular-nums">-৳{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Tax (5%)</span>
                  <span className="font-medium text-slate-900 tabular-nums">৳{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-medium text-slate-500">Calculated at checkout</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">৳{total.toLocaleString()}</span>
                </div>
              </div>

              <Link href="/checkout" className="control-button-primary w-full h-14 rounded-full text-base flex items-center justify-center interactive-item shadow-md hover:shadow-lg">
                Proceed to Checkout
              </Link>
              
              <p className="text-center text-xs text-slate-400 mt-4">
                Secure checkout powered by BusinessOS
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

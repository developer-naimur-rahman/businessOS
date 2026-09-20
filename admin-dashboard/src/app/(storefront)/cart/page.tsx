"use client"
import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { MediaImage } from "../../../components/ui/media-image"
import { useCartStore } from "../../../store/useCartStore"

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  const subtotal = useCartStore((state) => state.totalPrice())
  const tax = subtotal * 0.05 // 5% demo tax
  const total = subtotal + tax


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
                      <MediaImage asset={null} fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-multiply" />
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
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 sticky top-28">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 text-sm mb-6">
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
                  <span className="font-medium text-slate-500">Calculated at checkout</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-semibold text-slate-900 tabular-nums">৳{total.toLocaleString()}</span>
                </div>
              </div>

              <Link href="/checkout" className="control-button-primary w-full h-14 rounded-full text-base flex justify-center interactive-item shadow-md hover:shadow-lg">
                Proceed to Checkout
              </Link>
              
              <p className="text-center text-xs text-slate-400 mt-4">
                Secure checkout powered by My Business OS
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

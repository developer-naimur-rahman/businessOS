"use client"
import React from "react"

export default function ShippingPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-20 animate-in fade-in duration-500">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">Shipping Policy</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-slate-600 leading-relaxed">
          We offer standard and express shipping options. All orders are processed within 1-2 business days.
        </p>
      </div>
    </div>
  )
}

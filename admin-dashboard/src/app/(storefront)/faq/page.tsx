"use client"
import React from "react"

export default function FAQPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-20 animate-in fade-in duration-500">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">Frequently Asked Questions</h1>
      <div className="space-y-6 mt-12 max-w-3xl">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-lg text-slate-900 mb-2">How long does shipping take?</h3>
          <p className="text-slate-600">Standard shipping typically takes 3-5 business days depending on your location.</p>
        </div>
      </div>
    </div>
  )
}

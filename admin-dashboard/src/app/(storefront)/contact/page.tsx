"use client"
import React from "react"

export default function ContactPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-20 animate-in fade-in duration-500">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">Contact Us</h1>
      <p className="text-lg text-slate-500 max-w-2xl mb-12">
        Have a question or need assistance? Our team is here to help you.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
          <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
          <p className="text-slate-600 mb-2">Email: support@mybusinessos.com</p>
          <p className="text-slate-600 mb-2">Phone: +880 1234 567890</p>
          <p className="text-slate-600">Address: 123 Commerce St, Suite 100</p>
        </div>
      </div>
    </div>
  )
}

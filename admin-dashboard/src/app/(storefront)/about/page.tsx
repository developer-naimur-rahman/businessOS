"use client"
import React from "react"

export default function AboutPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-20 animate-in fade-in duration-500">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">About Us</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-slate-600 leading-relaxed mb-6">
          We are committed to providing premium products and services with uncompromising quality and attention to detail.
        </p>
      </div>
    </div>
  )
}

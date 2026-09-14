"use client"
import React from "react"
import Link from "next/link"

export default function FeaturedPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-20 animate-in fade-in duration-500 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">Featured Collections</h1>
      <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
        Discover our most popular products and services curated just for you.
      </p>
      <Link href="/services" className="control-button-primary h-12 px-8 text-base">
        Explore Services
      </Link>
    </div>
  )
}

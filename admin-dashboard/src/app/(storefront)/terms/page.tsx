import React from "react"
import Link from "next/link"
import { ArrowLeft, FileCheck, AlertCircle, Scale, ShieldAlert } from "lucide-react"

export const metadata = {
  title: "Terms of Service — My Business OS",
  description: "Read the terms and conditions governing the use of our services and products.",
}

export default function TermsOfServicePage() {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500">
      <Link 
        href="/" 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-14 shadow-sm space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 text-[#04BBFD] text-xs font-semibold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5" /> Legal Agreement
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500">Effective Date: October 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#04BBFD]" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the My Business OS storefront, making an online order, or utilizing our print and digital services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#04BBFD]" /> 2. Ordering & Payment
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>All prices listed on the storefront are in Bangladeshi Taka (৳ BDT) and inclusive of applicable baseline charges unless specified.</li>
              <li>Order placement creates a binding purchase request. Orders are fulfilled subject to stock and operational availability.</li>
              <li>Payment must be made in full via accepted payment methods (such as cash on delivery or approved mobile payments).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#04BBFD]" /> 3. Printing & Custom Services
            </h2>
            <p>
              When uploading files for custom printing, photography, or digital design:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>You warrant that you own or have the appropriate copyright license to print the submitted materials.</li>
              <li>We reserve the right to decline printing materials that violate copyright law, public decency, or local regulations.</li>
              <li>Custom printed items cannot be cancelled or returned once production has commenced.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Cancellations and Refunds</h2>
            <p>
              Physical goods may be inspected upon delivery. In the event of defective or incorrect items, claims must be reported within 24 hours of receipt. For custom services, please consult our staff before production begins.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Limitation of Liability</h2>
            <p>
              My Business OS is not liable for indirect, incidental, or consequential damages resulting from delays in delivery caused by courier disruptions, force majeure, or customer file submission errors.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

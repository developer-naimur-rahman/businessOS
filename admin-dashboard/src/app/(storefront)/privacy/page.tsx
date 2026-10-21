import React from "react"
import Link from "next/link"
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — My Business OS",
  description: "Learn how we protect your personal information and maintain your privacy.",
}

export default function PrivacyPolicyPage() {
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
            <Shield className="w-3.5 h-3.5" /> Privacy & Security
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500">Last updated: October 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#04BBFD]" /> 1. Information We Collect
            </h2>
            <p>
              When you use My Business OS storefront or services, we collect information necessary to process your orders and provide an optimal customer experience:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Personal Identification:</strong> Name, phone number, email address, and shipping address.</li>
              <li><strong>Order Data:</strong> Items purchased, custom printing instructions, file attachments, and transaction records.</li>
              <li><strong>Account Credentials:</strong> Securely hashed passwords and session authentication tokens.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#04BBFD]" /> 2. How We Use Your Information
            </h2>
            <p>We use your information exclusively for the following business purposes:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Fulfilling customer orders, printing jobs, and scheduled service deliveries.</li>
              <li>Communicating status updates, invoices, delivery timelines, and support inquiries.</li>
              <li>Protecting against fraud and maintaining system security.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#04BBFD]" /> 3. Data Protection & File Privacy
            </h2>
            <p>
              Any digital files, documents, or photographs uploaded for our printing or digital services are treated with strict confidentiality. Files are only accessible to designated print technicians for production purposes and are securely retained in accordance with our data storage policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Sharing with Third Parties</h2>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information. We only share necessary delivery information (such as your address and phone number) with verified logistics and delivery partners to complete order delivery.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to request data correction or deletion, please reach out via our{" "}
              <Link href="/contact" className="text-[#04BBFD] hover:underline font-medium">Contact Us</Link> page.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

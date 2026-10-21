"use client"
import React, { useState } from "react"
import Link from "next/link"
import { 
  MapPin, Phone, Mail, Clock, MessageSquare, Send, 
  CheckCircle2, ArrowRight, ShieldCheck, Printer, Laptop 
} from "lucide-react"
import { api } from "../../../lib/api-client"
import { toast } from "sonner"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("General Inquiry")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error("Please fill in your name, contact phone, and message.")
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/public/contact', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      })

      if (res.data.success) {
        toast.success(res.data.message || "Message sent successfully!")
        setSubmitted(true)
        setName("")
        setPhone("")
        setEmail("")
        setMessage("")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit message. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-400/10 pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center">
          <span className="inline-block bg-sky-500/20 text-[#04BBFD] border border-sky-500/30 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Customer Support & Consultation
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Get in Touch With Us
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Need high-volume digital printing, IT hardware consultation, computer servicing, or quick storefront assistance? Our team is available 7 days a week.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 -mt-8 relative z-20">
        
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-sky-50 text-[#04BBFD] rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Store Location</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Main Road, Hemayetpur Bus Stand,<br />
              Savar, Dhaka 1340, Bangladesh
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Phone & WhatsApp</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Support: +880 1712-345678<br />
              WhatsApp: +880 1812-345678
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Email Support</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              General: support@businessos.com<br />
              Printing: print@businessos.com
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Business Hours</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Saturday – Thursday: 9:00 AM – 10:00 PM<br />
              Friday: 2:30 PM – 10:00 PM
            </p>
          </div>

        </div>

        {/* Contact Form & Studio Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Send an Inquiry</h2>
              <p className="text-slate-500 text-sm mt-1">
                Fill out the form below. We typically respond within 30 minutes during working hours.
              </p>
            </div>

            {submitted ? (
              <div className="py-12 text-center bg-emerald-50 rounded-2xl border border-emerald-200 p-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Message Sent Successfully!</h3>
                <p className="text-sm text-emerald-700 max-w-md mx-auto mb-6">
                  Thank you for reaching out. One of our specialists will call or message you promptly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="control-button-primary h-10 px-6 rounded-full text-xs font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tanvir Hossain"
                      className="control-input h-12 w-full text-sm rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="control-input h-12 w-full text-sm rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tanvir@example.com"
                      className="control-input h-12 w-full text-sm rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="control-input h-12 w-full text-sm rounded-xl bg-white"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Bulk Printing & Photocopy">Bulk Printing & Photocopy</option>
                      <option value="Computer Hardware & Repair">Computer Hardware & Repair</option>
                      <option value="Order Tracking & Delivery">Order Tracking & Delivery</option>
                      <option value="Photography & Studio">Photography & Studio</option>
                      <option value="Corporate / Institution Supply">Corporate / Institution Supply</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Your Message / Requirements *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your requirement, quantity, deadline, or question in detail..."
                    className="control-input w-full p-4 text-sm rounded-xl resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="control-button-primary w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending Inquiry..." : "Submit Message"}
                </button>
              </form>
            )}
          </div>

          {/* Quick Connect Callout & Service Guarantees */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct WhatsApp Callout */}
            <div className="bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 rounded-3xl p-8 border border-[#25D366]/30">
              <span className="text-xs font-bold uppercase tracking-wider text-[#128C7E] block mb-2">
                Fastest Response
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chat with us on WhatsApp</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Send your print files, document requirements, or query directly to our studio operators for instant price quotes and proofs.
              </p>
              <a
                href="https://wa.me/8801712345678"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm px-6 py-3 rounded-full inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Open WhatsApp (+880 1712-345678)
              </a>
            </div>

            {/* In-Store Capabilities */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-base">In-Store Services Available</h4>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#04BBFD] flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 text-xs">High-Speed Digital Printing</h5>
                  <p className="text-slate-500 text-xs mt-0.5">Color & B/W document printing, spiral binding, laminating up to A3.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 text-xs">Computer Diagnostics & Servicing</h5>
                  <p className="text-slate-500 text-xs mt-0.5">Hardware upgrades, SSD installations, OS setup, and peripherals.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 text-xs">Corporate & Institutional Supply</h5>
                  <p className="text-slate-500 text-xs mt-0.5">Bulk stationery, office reams, and corporate gifts with VAT invoice.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

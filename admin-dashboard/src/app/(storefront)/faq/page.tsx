"use client"
import React, { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ChevronDown, HelpCircle, ArrowRight, MessageSquare, Phone } from "lucide-react"

interface FAQItem {
  id: string
  category: 'orders' | 'printing' | 'delivery' | 'payments' | 'returns'
  question: string
  answer: string
}

const FAQS: FAQItem[] = [
  // Online Orders
  {
    id: "ord-1",
    category: "orders",
    question: "How do I place an order online?",
    answer: "Browse our products or services catalog, choose your item specifications, and click 'Add to Cart'. When you are ready, proceed to checkout where you can log in, register, or order as a guest. Enter your delivery address, select your payment method (Cash on Delivery, bKash, Nagad, or Bank Transfer), and confirm your order."
  },
  {
    id: "ord-2",
    category: "orders",
    question: "How can I track my order status in real time?",
    answer: "You can track your order at any time by visiting /order/track or opening the link sent upon order completion. Enter your Invoice/Sale Number (e.g. SALE-2026-000040) along with your verified phone number to view live processing, courier dispatch, and delivery stages."
  },
  {
    id: "ord-3",
    category: "orders",
    question: "Can I modify or cancel my order after placing it?",
    answer: "If your order has not yet entered 'PROCESSING' status, you can request modifications or cancellation by contacting our support team via WhatsApp (+880 1712-345678) or calling our Hemayetpur store. Orders that have already been printed or dispatched with a courier cannot be cancelled."
  },

  // Custom Printing & Photocopy
  {
    id: "print-1",
    category: "printing",
    question: "What file formats do you accept for custom printing?",
    answer: "We accept PDF (recommended for highest vector clarity), AI, PSD, CDR, TIFF, and high-resolution JPEG/PNG files (at least 300 DPI). You can upload files directly through our Printing Studio (/printing) or email them to print@businessos.com."
  },
  {
    id: "print-2",
    category: "printing",
    question: "What types of binding and paper stocks are available?",
    answer: "We stock 70 GSM, 80 GSM, 100 GSM offset papers, 120–300 GSM art cards, matte paper, sticker paper, and transparent films. Binding options include plastic spiral binding, wire-o binding, hard-cover thesis book binding, saddle stitching, and thermal lamination."
  },
  {
    id: "print-3",
    category: "printing",
    question: "What is the turnaround time for bulk photocopying and printing?",
    answer: "Standard document jobs up to 1,000 pages are typically completed within 2 to 4 hours. Bulk jobs exceeding 5,000 copies or custom bound thesis projects are delivered within 24 hours. Express rush service is available upon request at our physical store counter."
  },

  // Delivery & Shipping
  {
    id: "del-1",
    category: "delivery",
    question: "What are your delivery charges and zones?",
    answer: "Inside Savar and Hemayetpur municipality: ৳60 (Standard 24-48 hours delivery). Greater Dhaka City: ৳60 (24-48 hours). All Districts Outside Dhaka: ৳120 via courier (48-72 hours). Store Pickup at our Hemayetpur branch is completely FREE of delivery charges."
  },
  {
    id: "del-2",
    category: "delivery",
    question: "Can I pick up my order directly from your store?",
    answer: "Yes! At checkout, select 'Store Pickup' under Delivery Zone. Your order will be prepared and ready at our Hemayetpur, Savar counter. You will receive an SMS notification when it is ready for collection."
  },
  {
    id: "del-3",
    category: "delivery",
    question: "Which courier partners do you use for delivery?",
    answer: "We partner with leading reliable logistics providers including Steadfast Courier, RedX, Paperfly, and Sundarban Courier Service. Full tracking codes are assigned and visible on your tracking timeline once dispatched."
  },

  // Payments (bKash, Nagad, COD)
  {
    id: "pay-1",
    category: "payments",
    question: "How do I pay using bKash or Nagad?",
    answer: "At checkout, select bKash or Nagad. You will see our official Merchant/Personal payment number (01712-345678). Open your bKash or Nagad app, complete 'Send Money' or 'Merchant Payment' for the exact order total, and enter your 11-digit sender phone number and the Transaction ID (TrxID) into the checkout form. Our billing team will verify it promptly."
  },
  {
    id: "pay-2",
    category: "payments",
    question: "Is Cash on Delivery (COD) available for all products?",
    answer: "Yes, Cash on Delivery is available for all standard retail products, stationery, and computer peripherals across Bangladesh. However, customized digital printing jobs (custom banners, t-shirts, personalized documents) require a partial or full bKash/Nagad advance payment before production commences."
  },
  {
    id: "pay-3",
    category: "payments",
    question: "How do I use a promo or coupon code?",
    answer: "Enter your coupon code (such as WELCOME10 for 10% off or FLAT100 for ৳100 off on orders over ৳1,000) in the 'Apply Promo Code' box inside your Cart or Checkout page, then click 'Apply'. The discount is deducted instantly from your payable total."
  },

  // Returns, Refunds & Warranty
  {
    id: "ret-1",
    category: "returns",
    question: "What is your return and exchange policy?",
    answer: "We offer a 7-day hassle-free replacement policy for retail hardware, computer peripherals, and unopened stationery items if you receive a damaged, malfunctioning, or incorrect product. Custom printed materials cannot be returned unless there is a verifiable manufacturing defect or spelling discrepancy caused by our printing team."
  },
  {
    id: "ret-2",
    category: "returns",
    question: "How long does a refund take if an order is cancelled?",
    answer: "Once an order cancellation and refund is approved by our admin, payments made through bKash, Nagad, or Bank Transfer are refunded within 24 to 48 business hours to the original sender account."
  },
  {
    id: "ret-3",
    category: "returns",
    question: "Do computer accessories and electronic items have warranties?",
    answer: "Yes! All computer components, SSDs, RAM, routers, and branded peripherals carry official manufacturer or importer warranties ranging from 1 year to lifetime depending on the brand. Original VAT invoice and warranty sticker are provided with each order."
  }
]

export default function FAQPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [openId, setOpenId] = useState<string | null>("ord-1")

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "orders", label: "Online Orders" },
    { id: "printing", label: "Printing Studio" },
    { id: "delivery", label: "Delivery & Shipping" },
    { id: "payments", label: "bKash & Payments" },
    { id: "returns", label: "Returns & Warranty" },
  ]

  const filteredFaqs = useMemo(() => {
    return FAQS.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory
      const q = search.toLowerCase().trim()
      const matchSearch = !q || 
        item.question.toLowerCase().includes(q) || 
        item.answer.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [search, activeCategory])

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-400/10 pointer-events-none" />
        <div className="max-w-[1000px] mx-auto px-6 relative z-10 text-center">
          <span className="inline-block bg-sky-500/20 text-[#04BBFD] border border-sky-500/30 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Help Center & Knowledge Base
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Find answers to common questions about online orders, digital printing turnaround, bKash payments, and delivery timelines.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions (e.g. bKash, delivery time, printing)..."
              className="w-full bg-white text-slate-900 pl-12 pr-4 py-3.5 rounded-full text-sm font-medium outline-none focus:ring-4 focus:ring-[#04BBFD]/20 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 mt-10">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion FAQ List */}
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No matching questions found</h3>
            <p className="text-slate-500 text-sm mb-6">
              Try searching with different terms or check all categories.
            </p>
            <button
              onClick={() => { setSearch(""); setActiveCategory("all"); }}
              className="control-button-primary h-10 px-6 rounded-full text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200"
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-base">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Still Have Questions Box */}
        <div className="mt-16 bg-gradient-to-r from-sky-50 to-blue-50 rounded-3xl p-8 border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Still have questions?</h3>
            <p className="text-sm text-slate-600">
              Can't find the answer you're looking for? Reach out directly to our store team.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="control-button-primary h-11 px-6 rounded-full text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" /> Contact Support
            </Link>
            <a
              href="tel:+8801712345678"
              className="control-button-secondary h-11 px-6 rounded-full text-xs font-semibold inline-flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> Call Store
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

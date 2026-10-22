"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  ShoppingBag, 
  RotateCcw, 
  Plus, 
  Check, 
  ExternalLink, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  Flame,
  Bot,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { useCartStore } from "../../store/useCartStore"

interface ProductRecommendation {
  id: string
  name: string
  price: number
  compareAtPrice?: number | null
  imageUrl?: string | null
  category?: string | null
  sku?: string | null
}

interface ChatMessage {
  id: string
  sender: "ai" | "user"
  text: string
  timestamp: string
  recommendedProducts?: ProductRecommendation[]
  suggestedQuestions?: string[]
  engineUsed?: string
}

const STARTER_PROMPTS = [
  { label: "ডেলিভারি চার্জ কত?", icon: Truck, prompt: "ঢাকার ভেতরে এবং বাইরে ডেলিভারি চার্জ কত এবং কত দিন সময় লাগে?" },
  { label: "ক্যাশ অন ডেলিভারি (COD)", icon: CreditCard, prompt: "আপনাদের কি ক্যাশ অন ডেলিভারি (COD) সুবিধা আছে? অর্ডার করার নিয়ম কি?" },
  { label: "জনপ্রিয় প্রোডাক্ট দেখান", icon: Flame, prompt: "আপনাদের দোকানের সেরা এবং জনপ্রিয় প্রোডাক্টগুলো দেখান।" },
  { label: "ওয়ারেন্টি ও রিটার্ন পলিসি", icon: ShieldCheck, prompt: "প্রোডাক্টে সমস্যা থাকলে রিটার্ন বা রিপ্লেসমেন্ট পলিসি কি?" },
]

export default function CustomerAiAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hasNewBadge, setHasNewBadge] = useState(true)
  const [showTooltip, setShowTooltip] = useState(true)
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({})

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-greeting",
      sender: "ai",
      text: "আসসালামু আলাইকুম! 👋 আমি আপনার **AI Shopping Assistant**। আমাদের যেকোনো প্রোডাক্টের স্টক, স্পেসিফিকেশন, দেশজুড়ে ক্যাশ অন ডেলিভারি (COD), কিংবা ডেলিভারি চার্জ সম্পর্কে যে কোনো কিছু জানতে পারেন। আমি আপনাকে সেরা প্রোডাক্ট বেছে নিতে সাহায্য করব!",
      timestamp: "Just now",
      suggestedQuestions: [
        "ঢাকার ভেতরে ডেলিভারি চার্জ কত?",
        "আপনাদের বেস্ট সেলিং গ্যাজেটগুলো কি কি?",
        "ক্যাশ অন ডেলিভারিতে অর্ডার করব কিভাবে?",
      ],
      engineUsed: "AI_GEMINI",
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const addItemToCart = useCartStore((state) => state.addItem)

  useEffect(() => {
    setMounted(true)
    // Auto-hide the initial tooltip after 8 seconds
    const timer = setTimeout(() => setShowTooltip(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false)
      setHasNewBadge(false)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        inputRef.current?.focus()
      }, 150)
    }
  }, [isOpen, messages])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/storefront/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to get AI response")
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply || "ধন্যবাদ আপনার বার্তার জন্য! আমাদের টিম আপনার সাথে খুব দ্রুত যোগাযোগ করবে।",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        recommendedProducts: data.recommendedProducts || [],
        suggestedQuestions: data.suggestedQuestions || [],
        engineUsed: data.engineUsed || "AI_GEMINI",
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      console.error("Storefront AI error:", err)
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "দুঃখিত, ইন্টারনেট বা সার্ভার সমস্যার কারণে তাৎক্ষণিক উত্তর পেতে সমস্যা হচ্ছে। ডেলিভারি সংক্রান্ত তথ্য: ঢাকা ৮০৳ (২৪-৪৮ঘণ্টা), ঢাকার বাইরে ১৫০৳ (৪৮-৭২ঘণ্টা)। সরাসরি সাপোর্টের জন্য নিচে WhatsApp-এ নক দিতে পারেন!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedQuestions: ["ডেলিভারি চার্জ কত?", "ক্যাশ অন ডেলিভারি নিয়ম"],
        engineUsed: "FALLBACK_ENGINE",
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: ProductRecommendation) => {
    addItemToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      type: "PRODUCT",
      imageUrl: product.imageUrl,
    })

    setAddedProductIds((prev) => ({ ...prev, [product.id]: true }))
    toast.success(`"${product.name}" কার্টে যোগ করা হয়েছে!`, {
      description: `মূল্য: ৳${product.price.toLocaleString()}`,
    })

    setTimeout(() => {
      setAddedProductIds((prev) => ({ ...prev, [product.id]: false }))
    }, 2500)
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: `initial-greeting-${Date.now()}`,
        sender: "ai",
        text: "চ্যাট হিস্ট্রি রিসেট করা হয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি? পণ্য বা ডেলিভারি নিয়ে যে কোনো প্রশ্ন জিজ্ঞাসা করুন!",
        timestamp: "Just now",
        suggestedQuestions: [
          "ঢাকার ভেতরে ডেলিভারি চার্জ কত?",
          "আপনাদের বেস্ট সেলিং গ্যাজেটগুলো কি কি?",
          "ক্যাশ অন ডেলিভারিতে অর্ডার করব কিভাবে?",
        ],
        engineUsed: "AI_GEMINI",
      },
    ])
    toast.info("চ্যাট রিসেট করা হয়েছে")
  }

  if (!mounted) return null

  return (
    <>
      {/* ================= FLOATING LAUNCHER BUTTON & TOOLTIP ================= */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2 select-none">
        {/* Friendly speech bubble tooltip */}
        {showTooltip && !isOpen && (
          <div className="relative bg-slate-900 text-white text-xs font-medium py-2 px-3.5 rounded-2xl shadow-xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[240px] flex items-center justify-between gap-2">
            <span>👋 কোনো পণ্য খুঁজছেন বা প্রশ্ন আছে? আমাকে জিজ্ঞাসা করুন!</span>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-full"
              aria-label="Close tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {/* Tooltip triangle pointer */}
            <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-700/80" />
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AI Shopping Assistant"
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-sky-950 text-white pl-3.5 pr-4.5 py-3 rounded-full shadow-2xl shadow-indigo-900/30 border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          {/* Pulsing beacon glow */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#04BBFD]"></span>
          </span>

          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-inner">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs tracking-wide bg-gradient-to-r from-white via-sky-200 to-indigo-200 bg-clip-text text-transparent">
                AI Shopping Concierge
              </span>
              {hasNewBadge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-500/30 text-sky-300 rounded-full border border-sky-400/30">
                  New
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 font-medium leading-none mt-0.5">
              Ask in বাংলা / English
            </p>
          </div>
        </button>
      </div>

      {/* ================= CHAT PANEL MODAL ================= */}
      {isOpen && (
        <div className="fixed bottom-22 left-4 sm:left-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-h-[82vh] h-[640px] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-indigo-950/20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-indigo-900/40 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#04BBFD]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                {/* Active status ring */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white tracking-tight">
                    Smart AI Concierge
                  </h3>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  লাইভ ক্যাটালগ ও ডেলিভারি হেল্প
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={handleResetChat}
                title="চ্যাট রিসেট করুন"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Reset chat history"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="বন্ধ করুন"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Starter Chips */}
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {STARTER_PROMPTS.map((prompt, idx) => {
              const Icon = prompt.icon
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt.prompt)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 hover:border-sky-300 text-slate-700 hover:text-[#04BBFD] text-xs font-semibold rounded-full border border-slate-200/90 shadow-xs whitespace-nowrap transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  <Icon className="w-3.5 h-3.5 text-sky-500" />
                  <span>{prompt.label}</span>
                </button>
              )
            })}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai"

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAi ? "items-start" : "items-end"} space-y-1`}
                >
                  <div className="flex items-end gap-2 max-w-[88%]">
                    {isAi && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 mb-1 shadow-sm">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl ${
                        isAi
                          ? "bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-bl-xs"
                          : "bg-gradient-to-r from-sky-600 to-[#04BBFD] text-white shadow-md shadow-sky-500/15 rounded-br-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line text-[13px] leading-relaxed">
                        {msg.text}
                      </p>

                      {/* Engine Tag */}
                      {isAi && msg.engineUsed && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            {msg.engineUsed === "AI_GEMINI" ? (
                              <>
                                <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Powered by Gemini AI
                              </>
                            ) : (
                              <>
                                <Bot className="w-2.5 h-2.5 text-slate-500" /> Storefront Smart Rule
                              </>
                            )}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommended Products Carousel / List */}
                  {isAi && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="w-full mt-2 space-y-2 pl-8">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#04BBFD]" />
                        <span>প্রস্তাবিত পণ্যসমূহ ({msg.recommendedProducts.length}):</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.recommendedProducts.map((product) => {
                          const isAdded = !!addedProductIds[product.id]

                          return (
                            <div
                              key={product.id}
                              className="bg-white rounded-xl p-2.5 border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition-all flex items-center gap-3 group"
                            >
                              {/* Product Thumbnail */}
                              <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <ShoppingBag className="w-6 h-6 text-slate-400" />
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/products/${product.id}`}
                                  target="_blank"
                                  className="font-bold text-xs text-slate-900 hover:text-[#04BBFD] truncate block transition-colors"
                                  title={product.name}
                                >
                                  {product.name}
                                </Link>

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-extrabold text-slate-900">
                                    ৳{product.price.toLocaleString()}
                                  </span>
                                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                                    <span className="text-[11px] text-slate-400 line-through">
                                      ৳{product.compareAtPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 1-Click Add to Cart Button */}
                              <button
                                onClick={() => handleAddToCart(product)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                                  isAdded
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-900 hover:bg-[#04BBFD] text-white shadow-xs"
                                }`}
                                title="কার্টে যোগ করুন"
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>যোগ হয়েছে</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {isAi && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="w-full mt-2 pl-8 flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSendMessage(q)}
                          disabled={loading}
                          className="text-[11px] font-medium bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer text-left disabled:opacity-50"
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#04BBFD] animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">
                    AI উত্তর তৈরি করছে এবং ক্যাটালগ যাচাই করছে...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="প্রোডাক্ট বা ডেলিভারি নিয়ে জিজ্ঞাসা করুন..."
                disabled={loading}
                className="flex-1 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-900 px-4 py-2.5 rounded-full text-xs sm:text-sm outline-none border border-transparent focus:border-[#04BBFD] focus:ring-2 focus:ring-[#04BBFD]/20 transition-all placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                aria-label="Send message"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-md shadow-sky-500/20 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
              <span>বাংলা, English বা বাংলিশে লিখুন</span>
              <a
                href="https://wa.me/8801712345678?text=Hello%20BusinessOS%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
              >
                WhatsApp সাপোর্ট
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

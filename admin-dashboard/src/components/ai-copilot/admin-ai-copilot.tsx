"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
  Sparkles, X, Send, Bot, User, ArrowRight, TrendingUp, 
  DollarSign, Package, ExternalLink, RefreshCw, Layers, CheckCircle2 
} from "lucide-react"
import { toast } from "sonner"
import { api } from "../../lib/api-client"

interface ChatMessage {
  id: string
  sender: "user" | "copilot"
  text: string
  actionType?: 'DROPSHIP_ANALYZE' | 'VIEW_FINANCE' | 'VIEW_REGISTER' | 'VIEW_POS' | 'NONE'
  actionData?: any
  suggestions?: string[]
  timestamp: string
}

export function AdminAiCopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const isPos = pathname?.includes("/admin/pos")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: "👋 আসসালামু আলাইকুম! আমি BusinessOS AI Co-Pilot। আপনার ড্রপশিপিং রিসার্চ, স্টোর সেলস রিপোর্ট, প্রফিট-লস এবং ক্যাশ রেজিস্টার পরিচালনায় সাহায্য করতে প্রস্তুত। নিচে ক্লিক করুন বা যেকোনো প্রশ্ন লিখুন!",
      suggestions: [
        "📊 আজকের সেলস ও প্রফিট কত?",
        "🔗 প্রোডাক্ট লিংক থেকে অটো-রিসার্চ করো",
        "💵 ক্যাশ রেজিস্টার ব্যালেন্স কত?",
        "📣 ফেসবুক অ্যাডের ভাইরাল বাংলা হুক লেখো",
      ],
      timestamp: "এখন",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput("")
    setLoading(true)

    // Check if query is a URL
    const isUrl = /^https?:\/\//i.test(query)

    try {
      if (isUrl) {
        // Direct product extraction from URL
        const res = await api.post("/admin/dropshipping/extract-from-url", { url: query })
        const data = res.data
        const copilotMsg: ChatMessage = {
          id: "copilot-" + Date.now(),
          sender: "copilot",
          text: `🎯 লিংক থেকে প্রোডাক্ট পাওয়া গেছে: **${data.productName}**!\n- আনুমানিক পাইকারি খরচ: ৳${data.supplierPriceBdt}\n- সাজেস্টেড সেলস প্রাইস: ৳${data.targetSellingPrice}\n- প্ল্যাটফর্ম: ${data.sourcePlatform}`,
          actionType: "DROPSHIP_ANALYZE",
          actionData: data,
          suggestions: [
            "এই প্রোডাক্ট ড্রপশিপিং পেজে অ্যানালাইসিস করো",
            "অন্য একটি লিংক অ্যানালাইজ করো",
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, copilotMsg])
      } else {
        // Natural language Co-Pilot conversation - query intelligent retail AI snapshot
        let replyText = ""
        let actionType: any = "NONE"
        let actionData: any = null
        let suggestions: string[] = []

        try {
          const res = await api.post("/admin/ai-copilot/ask", { query })
          replyText = res.data?.answer || res.data?.reply || "আপনার কমান্ড প্রসেস করা হয়েছে।"
          actionType = res.data?.actionType || "NONE"
          actionData = res.data?.metricsSnapshot
          suggestions = res.data?.suggestions || []
        } catch {
          // Fallback to dropshipping copilot
          const fallbackRes = await api.post("/admin/dropshipping/ai-copilot", { message: query })
          replyText = fallbackRes.data?.reply || "আপনার কমান্ড প্রসেস করা হয়েছে।"
          actionType = fallbackRes.data?.actionType || "NONE"
          actionData = fallbackRes.data?.actionData
          suggestions = fallbackRes.data?.suggestions || []
        }

        const copilotMsg: ChatMessage = {
          id: "copilot-" + Date.now(),
          sender: "copilot",
          text: replyText,
          actionType,
          actionData,
          suggestions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, copilotMsg])
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "copilot",
          text: "দুঃখিত, কমান্ডটি প্রসেস করতে সাময়িক সমস্যা হয়েছে। আপনি মেন্যু থেকে সরাসরি পেজগুলোতে ভিজিট করতে পারেন।",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (actionType?: string, actionData?: any) => {
    if (actionType === "VIEW_FINANCE") {
      router.push("/admin/finance/profit-loss")
      setIsOpen(false)
      toast.info("Navigated to P&L Profit & Loss Statement")
    } else if (actionType === "VIEW_REGISTER") {
      router.push("/admin/cash-register")
      setIsOpen(false)
      toast.info("Navigated to Daily Cash Register")
    } else if (actionType === "VIEW_POS") {
      router.push("/admin/pos")
      setIsOpen(false)
      toast.info("Navigated to Retail POS")
    } else if (actionType === "DROPSHIP_ANALYZE") {
      router.push("/admin/dropshipping")
      setIsOpen(false)
      toast.info("Navigated to Dropshipping AI Research Corner")
    } else if (actionType === "VIEW_SERVICE_APPLICATIONS" || actionType === "VIEW_PAYMENTS") {
      router.push("/admin/service-jobs")
      setIsOpen(false)
      toast.info("Navigated to Service Jobs & Applications")
    } else if (actionType === "VIEW_SCHEDULING") {
      router.push("/admin/service-scheduling")
      setIsOpen(false)
      toast.info("Navigated to Service Scheduling & Appointments")
    }
  }

  return (
    <>
      {/* Floating Co-Pilot Launcher */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white p-3 sm:p-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20 group ${
          isPos
            ? "bottom-4 left-4 md:left-72 shadow-indigo-900/30"
            : "bottom-5 right-5 sm:bottom-6 sm:right-6"
        }`}
        aria-label="Open AI Co-Pilot"
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-900"></span>
        </div>
        <span className="text-[11px] sm:text-xs font-black tracking-wide hidden sm:inline pr-1">
          AI Co-Pilot
        </span>
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full sm:w-[440px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                    BusinessOS AI Co-Pilot
                    <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      Gemini 3.5 Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">Autonomous & Manual Store Manager</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Context Strip */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
              <span className="font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Connected to Real-Time Store Database
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                Hybrid AI Active
              </span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/40">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "copilot" && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-none shadow-xs font-medium"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Action button if Co-Pilot suggests navigation */}
                    {m.actionType && m.actionType !== "NONE" && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => handleActionClick(m.actionType, m.actionData)}
                          className="w-full h-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
                        >
                          {m.actionType === "VIEW_FINANCE" && "📊 View P&L Financial Statement"}
                          {m.actionType === "VIEW_REGISTER" && "💵 Open Daily Cash Register"}
                          {m.actionType === "VIEW_POS" && "🛒 Open Retail POS Cashier"}
                          {m.actionType === "DROPSHIP_ANALYZE" && "🚀 Run AI Dropship Analysis"}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Quick suggestion pills */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {m.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(sug)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors font-medium text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}

                    <span
                      className={`block text-[9px] mt-1.5 text-right ${
                        m.sender === "user" ? "text-indigo-200" : "text-slate-400"
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {m.sender === "user" && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 items-center text-xs text-slate-500">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    <span>AI Co-Pilot is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Co-Pilot or paste any product link..."
                className="flex-1 h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

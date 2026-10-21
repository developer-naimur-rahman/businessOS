"use client"

import React, { useState, useEffect } from "react"
import { useAuthStore } from "../../../store/useAuthStore"
import { useRouter } from "next/navigation"
import { api } from "../../../lib/api-client"
import { toast } from "sonner"
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound, User, Eye, EyeOff, Sparkles, Store } from "lucide-react"

interface DemoUser {
  role: string
  label: string
  email: string
  password: string
  pin: string
  badgeColor: string
}

const DEMO_ACCOUNTS: DemoUser[] = [
  { role: "admin", label: "Super Admin", email: "admin@demo.local", password: "password", pin: "5825825825iW.", badgeColor: "bg-purple-100 text-purple-700 border-purple-200" },
  { role: "manager", label: "Store Manager", email: "manager@demo.local", password: "password", pin: "manager1", badgeColor: "bg-blue-100 text-blue-700 border-blue-200" },
  { role: "sales", label: "POS Cashier", email: "sales@demo.local", password: "password", pin: "sales123", badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { role: "inventory", label: "Stock Keeper", email: "inventory@demo.local", password: "password", pin: "inv12345", badgeColor: "bg-amber-100 text-amber-700 border-amber-200" },
  { role: "staff", label: "Counter Staff", email: "staff@demo.local", password: "password", pin: "staff123", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" }
]

export default function AdminLogin() {
  const [activeTab, setActiveTab] = useState<"email" | "pin">("email")
  
  // Email Form State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  // PIN Form State
  const [pin, setPin] = useState("")
  
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  const fetchProfile = useAuthStore((state) => state.fetchProfile)
  const router = useRouter()

  // If already authenticated with valid user, redirect to workspace
  useEffect(() => {
    const { token, user } = useAuthStore.getState()
    const storedToken = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('access_token')) : null
    if ((token || storedToken) && user) {
      router.replace("/admin")
    }
  }, [router])

  // Email & Password Login Handler
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Please enter your staff email address")
      return
    }
    if (!password) {
      setError("Please enter your password")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password: password
      })
      
      const token = res.data.access_token || res.data.token
      if (token) {
        setToken(token)
        if (res.data.user) {
          setUser(res.data.user)
        }
        await fetchProfile()
        const userName = res.data.user?.firstName || "Staff Member"
        toast.success(`Welcome back, ${userName}!`)

        // Smart route: if Cashier/Sales, take directly to POS
        if (email.includes("sales") || email.includes("cashier")) {
          router.replace("/admin/pos")
        } else {
          router.replace("/admin")
        }
      } else {
        throw new Error("No authorization token returned")
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid email or password"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Quick PIN Login Handler
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) {
      setError("Please enter your security PIN or staff code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await api.post('/auth/admin-pin-login', { pin: pin.trim() })
      const token = res.data.access_token || res.data.token

      if (token) {
        setToken(token)
        if (res.data.user) {
          setUser(res.data.user)
        }
        await fetchProfile()
        const userName = res.data.user?.firstName || "Staff"
        toast.success(`Terminal unlocked for ${userName}!`)

        // If cashier PIN was used, take straight to POS
        if (pin === "sales123" || pin === "cashier123" || pin === "5678") {
          router.replace("/admin/pos")
        } else {
          router.replace("/admin")
        }
      } else {
        throw new Error("No authorization token returned")
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid Security PIN"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Quick Demo Account Pre-filler
  const handleSelectDemoAccount = (acc: DemoUser) => {
    if (activeTab === "email") {
      setEmail(acc.email)
      setPassword(acc.password)
    } else {
      setPin(acc.pin)
    }
    setError("")
    toast.info(`Selected ${acc.label} credentials`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[430px] p-6 sm:p-8 bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-900 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg text-white">
            <Store className="w-7 h-7 text-sky-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">BusinessOS Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">Unified Retail, Physical Shop & Admin Portal</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setActiveTab("email"); setError("") }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "email" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Staff Email Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("pin"); setError("") }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "pin" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Quick PIN / POS
          </button>
        </div>

        {/* Mode 1: Email & Password Form */}
        {activeTab === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Staff Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition-all text-slate-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. staff@demo.local"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition-all text-slate-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-semibold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  Sign In to Workspace <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode 2: Quick PIN Form */}
        {activeTab === "pin" && (
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Cashier PIN / Security Code
                </span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">e.g. sales123, 5678, manager1</span>
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 text-center text-xl tracking-[0.3em] font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition-all text-slate-900"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoFocus
              />
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-semibold text-center mt-2">
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/20 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Unlocking Terminal...
                </span>
              ) : (
                <>
                  Unlock Workspace / POS <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Demo Switcher Quick Chips */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Demo Staff Switcher
            </span>
            <span className="text-[10px] text-slate-400">Click to fill</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemoAccount(acc)}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-200/80 hover:border-indigo-300 bg-slate-50/70 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {acc.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {activeTab === "email" ? acc.email.split("@")[0] : `PIN: ${acc.pin}`}
                  </p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${acc.badgeColor}`}>
                  {acc.role.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-5 text-center">
          <a href="/" className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
            &larr; Return to Storefront
          </a>
        </div>
      </div>
    </div>
  )
}

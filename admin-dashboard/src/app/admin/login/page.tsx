"use client"

import React, { useState, useEffect } from "react"
import { useAuthStore } from "../../../store/useAuthStore"
import { useRouter } from "next/navigation"
import { api } from "../../../lib/api-client"
import { toast } from "sonner"
import { Lock, ArrowRight, ShieldCheck } from "lucide-react"

export default function AdminLogin() {
  const [pin, setPin] = useState("5825825825iW.")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  const fetchProfile = useAuthStore((state) => state.fetchProfile)
  const router = useRouter()

  // If already authenticated with valid user, redirect to dashboard
  useEffect(() => {
    const { token, user } = useAuthStore.getState()
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if ((token || storedToken) && user) {
      router.replace("/admin")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) {
      setError("Please enter your security PIN")
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
        // Verify profile and permissions
        await fetchProfile()
        toast.success("Workspace unlocked successfully!")
        router.replace("/admin")
      } else {
        throw new Error("No authorization token returned")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Invalid Security PIN")
      toast.error(err.response?.data?.message || "Invalid PIN. Access denied.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-[380px] p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md text-white">
            <Lock className="w-6 h-6 text-[#04BBFD]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">BusinessOS Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">Enter your master PIN or password to proceed</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Security PIN / Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 text-center text-lg tracking-[0.25em] font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition-all"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              autoFocus
            />
            {error && <p className="text-xs text-rose-600 font-semibold mt-1.5 text-center">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Unlocking...
              </span>
            ) : (
              <>
                Access Workspace <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-100 pt-5">
          <a href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            &larr; Return to Storefront
          </a>
        </div>
      </div>
    </div>
  )
}

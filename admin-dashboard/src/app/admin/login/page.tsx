"use client"
import React, { useState } from "react"
import { useAuthStore } from "../../../store/useAuthStore"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === "5825825825iW.") {
      setUser({ userId: "1", organizationId: "1", roleIds: [], permissions: [] })
      setToken("dummy_token")
      router.push("/admin")
    } else {
      setError("Invalid PIN")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfb]">
      <div className="w-full max-w-[360px] p-8 surface-elevated mx-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl">OS</span>
          </div>
          <h1 className="text-title-1 mb-1">My Business OS</h1>
          <p className="text-body-subtle">Enter your PIN to access the workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Security PIN</label>
            <input
              type="password"
              className="control-input text-center text-xl tracking-[0.5em] font-mono h-12"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
            {error && <p className="text-sm text-destructive font-medium mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="control-button-primary w-full h-11 text-base mt-2 interactive-item"
          >
            Access Workspace
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
            &larr; Return to Storefront
          </a>
        </div>
      </div>
    </div>
  )
}

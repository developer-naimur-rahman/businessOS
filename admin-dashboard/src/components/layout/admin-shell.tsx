"use client"

import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "../../store/useAuthStore"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, token, isHydrated, fetchProfile } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isLoginRoute = pathname === "/admin/login"

  const [effectiveToken, setEffectiveToken] = useState<string | null>(token)

  useEffect(() => {
    setMounted(true)
    const stored = typeof window !== 'undefined' 
      ? (localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('adminToken')) 
      : null
    setEffectiveToken(token || stored)
  }, [token])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  // Authentication check and verification
  useEffect(() => {
    if (!mounted) return

    // If on login route, no need to check or redirect
    if (isLoginRoute) {
      setAuthChecking(false)
      return
    }

    // If no token exists at all, immediately redirect to login without flashing dashboard
    if (!effectiveToken) {
      setAuthChecking(false)
      router.replace("/admin/login")
      return
    }

    // If token exists but user profile is missing, verify with /auth/me
    if (effectiveToken && !user) {
      fetchProfile()
        .then(() => {
          setAuthChecking(false)
        })
        .catch(() => {
          setAuthChecking(false)
          router.replace("/admin/login")
        })
    } else {
      setAuthChecking(false)
    }
  }, [mounted, effectiveToken, user, isLoginRoute, router, fetchProfile])

  // If on login page, render full screen directly without sidebar
  if (isLoginRoute) {
    return <div className="min-h-screen bg-slate-50">{children}</div>
  }

  // Prevent ANY dashboard flash while mounting or checking authentication (consistent static text prevents SSR hydration mismatch)
  if (!mounted || authChecking || !effectiveToken || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-semibold mt-4 text-xs tracking-wider uppercase">
          Authenticating Workspace...
        </p>
      </div>
    )
  }

  const isPosRoute = pathname === "/admin/pos"
  const isDesignStudioEditor = pathname.startsWith("/admin/design-studio/") && pathname !== "/admin/design-studio"

  // Standard Admin Layout - Linear-inspired Composition
  return (
    <div className="layout-shell">
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0 md:border-l border-slate-200 bg-white overflow-hidden">
        <Header 
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        <main className={`flex-1 overflow-y-auto custom-scrollbar ${isPosRoute || isDesignStudioEditor ? '' : 'p-4 sm:p-8'}`}>
          <div className={isPosRoute || isDesignStudioEditor ? 'h-full' : 'max-w-[1200px] mx-auto'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

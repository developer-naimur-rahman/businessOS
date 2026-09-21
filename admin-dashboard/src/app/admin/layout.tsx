"use client"

import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "../../store/useAuthStore"
import { Sidebar } from "../../components/layout/sidebar"
import { Header } from "../../components/layout/header"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !user && pathname !== "/admin/login") {
      router.push("/admin/login")
    }
  }, [user, mounted, pathname, router])

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>
  }

  // If on the login page or POS (which takes over the screen), render without Sidebar
  const isFullscreenRoute = pathname === "/admin/login"

  if (isFullscreenRoute) {
    return <div className="min-h-screen bg-slate-50">{children}</div>
  }

  const isPosRoute = pathname === "/admin/pos"
  const isDesignStudioEditor = pathname.startsWith("/admin/design-studio/") && pathname !== "/admin/design-studio"

  // Standard Admin Layout - Linear-inspired Composition
  // A clean layout shell, fixed sidebar, and a scrollable main area
  return (
    <div className="layout-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 border-l border-slate-200 bg-white overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-y-auto custom-scrollbar ${isPosRoute || isDesignStudioEditor ? '' : 'p-8'}`}>
          <div className={isPosRoute || isDesignStudioEditor ? 'h-full' : 'max-w-[1200px] mx-auto'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

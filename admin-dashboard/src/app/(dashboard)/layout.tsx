"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "../../store/useAuthStore"
import { Sidebar } from "../../components/layout/sidebar"
import { Header } from "../../components/layout/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { token, user, fetchProfile } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auth Guard
  useEffect(() => {
    if (!token) {
      router.push("/login")
    } else if (!user) {
      fetchProfile()
    }
  }, [token, user, fetchProfile, router])

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  if (!isMounted) {
    return <div className="h-full w-full bg-muted/30 flex items-center justify-center">Loading...</div>
  }

  if (!token) {
    return null // Or a loading spinner
  }

  return (
    <div className="flex h-full w-full bg-muted/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative z-50 flex w-72 max-w-[calc(100%-3rem)] flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex w-0 flex-1 flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

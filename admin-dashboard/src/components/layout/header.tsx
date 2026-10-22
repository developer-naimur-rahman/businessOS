"use client"

import React, { useState, useEffect } from "react"
import { useAuthStore } from "../../store/useAuthStore"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, Search, Bell, Menu } from "lucide-react"
import { Button } from "../ui/button"
import { GlobalSearchModal } from "./GlobalSearchModal"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  // Global ⌘K or Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

  // Create a clean readable title based on pathname
  const getPageTitle = () => {
    if (pathname === "/admin") return "Workspace"
    const path = pathname.split("/").pop()
    if (!path) return "Workspace"
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ")
  }

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200/60 bg-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">{getPageTitle()}</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Desktop Spotlight Search Trigger */}
          <button 
            type="button"
            onClick={() => setSearchOpen(true)}
            className="relative hidden md:flex items-center h-8 w-64 bg-slate-100/70 hover:bg-slate-200/60 border border-slate-200/80 hover:border-slate-300 transition-all rounded-xl pl-8 pr-2.5 text-xs text-slate-500 font-medium group cursor-pointer justify-between"
            title="Global Search & Spotlight (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors absolute left-2.5" />
            <span className="truncate">Search pages, items, jobs...</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-white rounded-md border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search Trigger Icon */}
          <button 
            type="button"
            onClick={() => setSearchOpen(true)}
            className="md:hidden w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
            title="Search (⌘K)"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <Bell className="w-[18px] h-[18px]" />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[13px] font-medium text-slate-900 leading-tight">
              {user?.firstName || 'Admin'} {user?.lastName || ''}
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold uppercase tracking-wider">
              {user?.email ? user.email.split('@')[0] : 'Staff'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="w-8 h-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>

    <GlobalSearchModal 
      isOpen={searchOpen} 
      onClose={() => setSearchOpen(false)} 
    />
  </>
  )
}

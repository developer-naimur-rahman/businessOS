"use client"

import React from "react"
import { useAuthStore } from "../../store/useAuthStore"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, Search, Bell, Menu } from "lucide-react"
import { Button } from "../ui/button"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

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
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-8 w-64 bg-slate-100/50 border border-transparent hover:border-slate-200 focus:border-slate-300 focus:bg-white transition-all rounded-md pl-9 pr-3 text-sm focus:outline-none"
          />
        </div>
        
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
  )
}

"use client"

import React from "react"
import { useAuthStore } from "../../store/useAuthStore"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, Search, Bell } from "lucide-react"
import { Button } from "../ui/button"

export function Header() {
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
    <header className="h-14 flex items-center justify-between px-8 border-b border-slate-200/60 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-4">
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
          <div className="flex flex-col items-end">
            <span className="text-[13px] font-medium text-slate-900 leading-tight">{user?.name || 'Admin'}</span>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">{user?.role || 'Staff'}</span>
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

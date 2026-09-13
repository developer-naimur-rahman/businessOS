"use client"
import React from "react"
import { useAuthStore } from "../../store/useAuthStore"
import { Bell, Search, Menu, LogOut, User } from "lucide-react"
import { Button } from "../ui/button"

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore()

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email || "Admin"

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        
        {/* Search Placeholder */}
        <div className="hidden sm:flex items-center text-muted-foreground bg-muted rounded-md px-3 py-1.5 text-sm w-64 border border-transparent focus-within:border-ring focus-within:bg-background transition-colors">
          <Search className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate">Search (Coming soon...)</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
        </Button>
        
        <div className="flex items-center space-x-3 border-l pl-4">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium leading-none">{displayName}</span>
            <span className="text-xs text-muted-foreground mt-1">{user?.email || "Super Admin"}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Log out" className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

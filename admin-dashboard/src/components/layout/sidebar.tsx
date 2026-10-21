"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, ShoppingCart, Users, Settings, 
  Package, Boxes, Store, Factory, ArrowRightLeft,
  TerminalSquare, TrendingUp, X, GitBranch, Warehouse,
  ShoppingBag, Sliders, Truck, MessageSquare,
  Receipt, CircleDollarSign
} from "lucide-react"

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  const groups = [
    {
      label: "Workspace",
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
        { name: "Point of Sale", href: "/admin/pos", icon: TerminalSquare },
      ]
    },
    {
      label: "Finance & Accounts",
      items: [
        { name: "Profit & Loss (P&L)", href: "/admin/finance/profit-loss", icon: TrendingUp },
        { name: "Daily Expenses", href: "/admin/expenses", icon: Receipt },
        { name: "Cash Register / Till", href: "/admin/cash-register", icon: CircleDollarSign },
        { name: "GL & Finance Sync", href: "/admin/finance", icon: ArrowRightLeft },
      ]
    },
    {
      label: "Sales & Orders",
      items: [
        { name: "Online Orders", href: "/admin/orders", icon: Truck },
        { name: "Sales History", href: "/admin/sales", icon: ShoppingCart },
        { name: "Customers", href: "/admin/customers", icon: Users },
        { name: "Purchases & PO", href: "/admin/purchases", icon: ShoppingBag },
      ]
    },
    {
      label: "Catalog & Inventory",
      items: [
        { name: "Products", href: "/admin/products", icon: Package },
        { name: "Services", href: "/admin/services", icon: Package },
        { name: "Service Price List", href: "/admin/services/price-list", icon: Sliders },
        { name: "Store Categories", href: "/admin/categories", icon: Package },
        { name: "Units", href: "/admin/units", icon: Package },
        { name: "Stock Levels", href: "/admin/inventory", icon: Boxes },
        { name: "Suppliers", href: "/admin/suppliers", icon: Factory },
      ]
    },
    {
      label: "Operations & Platform",
      items: [
        { name: "Branches", href: "/admin/branches", icon: GitBranch },
        { name: "Warehouses", href: "/admin/warehouses", icon: Warehouse },
        { name: "Storefront CMS", href: "/admin/storefront", icon: Store },
        { name: "Reviews Moderation", href: "/admin/reviews", icon: MessageSquare },
        { name: "Design Studio", href: "/admin/design-studio", icon: Store },
        { name: "Media Library", href: "/admin/media", icon: Store },
      ]
    }
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50/80 border-r border-slate-200/80">
      <div className="h-14 flex items-center justify-between px-5 border-b border-slate-200/60">
        <div className="flex items-center">
          <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <span className="text-white font-extrabold text-[11px]">OS</span>
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">My Business OS</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar py-5 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin")
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    data-active={isActive}
                    onClick={onClose}
                    className="sidebar-item"
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-slate-200/60">
        <Link 
          href="/admin/settings"
          data-active={pathname.startsWith("/admin/settings")}
          onClick={onClose}
          className="sidebar-item"
        >
          <Settings className={`w-[18px] h-[18px] ${pathname.startsWith("/admin/settings") ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={2} />
          <span>System Settings</span>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 flex-shrink-0 hidden md:flex flex-col h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Modal Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onClose} 
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}

"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, ShoppingCart, Users, Settings, 
  Package, Boxes, Store, Factory, ArrowRightLeft,
  TerminalSquare
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const groups = [
    {
      label: "Workspace",
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Point of Sale", href: "/admin/pos", icon: TerminalSquare },
      ]
    },
    {
      label: "Sales & Fulfillment",
      items: [
        { name: "Sales History", href: "/admin/sales", icon: ShoppingCart },
        { name: "Customers", href: "/admin/customers", icon: Users },
      ]
    },
    {
      label: "Inventory & Supply",
      items: [
        { name: "Products", href: "/admin/products", icon: Package },
        { name: "Service Price List", href: "/admin/services/price-list", icon: Package },
        { name: "Categories", href: "/admin/categories", icon: Package },
        { name: "Units", href: "/admin/units", icon: Package },
        { name: "Stock Levels", href: "/admin/inventory", icon: Boxes },
        { name: "Suppliers", href: "/admin/suppliers", icon: Factory },
      ]
    },
    {
      label: "Platform",
      items: [
        { name: "Design Studio", href: "/admin/design-studio", icon: Store },
        { name: "Media Library", href: "/admin/media", icon: Store },
        { name: "Finance Sync", href: "/admin/finance", icon: ArrowRightLeft },
      ]
    }
  ]

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-slate-50/50">
      <div className="h-14 flex items-center px-6 border-b border-transparent">
        <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center mr-3 shadow-sm">
          <span className="text-white font-bold text-[10px]">OS</span>
        </div>
        <span className="font-semibold text-sm tracking-tight text-slate-900">My Business OS</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
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
                    className="sidebar-item"
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                    {item.name}
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
          className="sidebar-item"
        >
          <Settings className={`w-[18px] h-[18px] ${pathname.startsWith("/admin/settings") ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={2} />
          System Settings
        </Link>
      </div>
    </aside>
  )
}

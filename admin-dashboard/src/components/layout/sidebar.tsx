"use client"
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../../lib/utils"
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Tags, 
  Truck, 
  Box, 
  Store, 
  ArrowRightLeft, 
  Banknote, 
  CreditCard, 
  Link as LinkIcon, 
  Building2, 
  Settings 
} from "lucide-react"

const navigation = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Sales",
    items: [
      { name: "POS / Sales", href: "/sales", icon: ShoppingCart },
      { name: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/products", icon: Package },
      { name: "Categories", href: "/categories", icon: Tags },
      { name: "Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    title: "Inventory",
    items: [
      { name: "Stock", href: "/inventory", icon: Box, exact: true },
      { name: "Warehouses", href: "/warehouses", icon: Store },
      { name: "Movements", href: "/inventory/movements", icon: ArrowRightLeft },
    ],
  },
  {
    title: "Finance",
    items: [
      { name: "Accounts", href: "/finance/accounts", icon: Banknote },
      { name: "Transactions", href: "/finance/transactions", icon: CreditCard },
      { name: "Integration", href: "/finance/integration", icon: LinkIcon },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Branches", href: "/branches", icon: Building2 },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <span className="text-lg font-bold tracking-tight text-primary">My Business OS</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-4">
          {navigation.map((group) => (
            <div key={group.title}>
              <h4 className="mb-2 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-4 w-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                        )}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

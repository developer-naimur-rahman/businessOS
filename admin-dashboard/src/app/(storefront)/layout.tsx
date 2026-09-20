"use client"
import React, { useState } from "react"
import Link from "next/link"
import { Search, ShoppingBag, Menu, User } from "lucide-react"
import { useCartStore } from "../../store/useCartStore"
import { useCustomerAuthStore } from "../../store/useCustomerAuthStore"

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const cartItemsCount = useCartStore((state) => state.totalItems())
  const { isAuthenticated } = useCustomerAuthStore()

  // Simple scroll effect for header
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm" 
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs tracking-wider">MB</span>
              </div>
              <span className="font-semibold text-lg tracking-tight hidden sm:block">My Business</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="/products" className="text-slate-600 hover:text-slate-900 transition-colors">Products</Link>
              <Link href="/services" className="text-slate-600 hover:text-slate-900 transition-colors">Services</Link>
              <Link href="/about" className="text-slate-600 hover:text-slate-900 transition-colors">About Us</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link href={isAuthenticated ? "/account" : "/checkout"} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/cart" className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            <button className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="pt-20">
        {children}
      </main>
      
      <footer className="bg-slate-50 border-t border-slate-200 mt-24 py-16">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-[8px]">MB</span>
              </div>
              <span className="font-semibold tracking-tight">My Business</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Providing premium products and services with uncompromising quality and attention to detail.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-6">Shop</h4>
            <ul className="space-y-4 text-slate-500">
              <li><Link href="/products" className="hover:text-slate-900 transition-colors">All Products</Link></li>
              <li><Link href="/new" className="hover:text-slate-900 transition-colors">New Arrivals</Link></li>
              <li><Link href="/featured" className="hover:text-slate-900 transition-colors">Featured</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-6">Support</h4>
            <ul className="space-y-4 text-slate-500">
              <li><Link href="/contact" className="hover:text-slate-900 transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-slate-900 transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-slate-900 transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-6">Connect</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a href="#" className="hover:text-slate-900 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Facebook</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

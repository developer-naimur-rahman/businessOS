"use client"
import React, { useState } from "react"
import Link from "next/link"
import { Search, ShoppingBag, Menu, User, ChevronDown, Flame } from "lucide-react"
import { useCartStore } from "../../store/useCartStore"
import { useCustomerAuthStore } from "../../store/useCustomerAuthStore"

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const cartItemsCount = useCartStore((state) => state.totalItems())
  const { isAuthenticated } = useCustomerAuthStore()

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-2' : 'bg-white py-4'}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm tracking-wider">MB</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors hidden sm:block">My Business</span>
          </Link>

          {/* Global Search */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search for products, categories, brands..." 
                className="w-full bg-slate-100 hover:bg-slate-200 focus:bg-white text-slate-900 px-6 py-3.5 rounded-full border border-transparent focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <button className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-100 rounded-full">
              <Search className="w-5 h-5" />
            </button>
            
            <Link href="/account" className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="hidden lg:block text-sm leading-tight">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Welcome</p>
                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{isAuthenticated ? 'My Account' : 'Sign In / Register'}</p>
              </div>
            </Link>

            <div className="w-px h-8 bg-slate-200 hidden lg:block mx-2"></div>

            <Link href="/cart" className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-sm leading-tight">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Your Cart</p>
                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">৳0.00</p>
              </div>
            </Link>
            
            <button className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="hidden lg:flex max-w-[1400px] mx-auto px-6 mt-4 gap-8">
          <Link href="/categories" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-indigo-700 transition-colors">
            <Menu className="w-4 h-4" /> All Categories
          </Link>
          <nav className="flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="/products" className="hover:text-indigo-600 transition-colors">Shop</Link>
            <Link href="/services" className="hover:text-indigo-600 transition-colors">Services</Link>
            <Link href="/products?category=new" className="hover:text-indigo-600 transition-colors flex items-center gap-1">New Arrivals <Flame className="w-4 h-4 text-rose-500" /></Link>
            <Link href="/campaigns" className="hover:text-indigo-600 transition-colors">Campaigns</Link>
            <Link href="/about" className="hover:text-indigo-600 transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">Support</Link>
          </nav>
        </div>
      </header>
      
      <main className="pt-[140px] lg:pt-[170px]">
        {children}
      </main>
      
      <footer className="bg-slate-950 text-slate-300 pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <span className="text-white font-bold text-sm tracking-wider">MB</span>
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white">My Business</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8 max-w-sm">
                The ultimate e-commerce destination for premium products. We deliver excellence with every order.
              </p>
              <div className="flex gap-4">
                {['Facebook', 'Twitter', 'Instagram', 'YouTube'].map(social => (
                  <a key={social} href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors">
                    {social[0]}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Shop Categories</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="hover:text-white transition-colors">Electronics & Gadgets</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Fashion & Apparel</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Home & Living</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Health & Beauty</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Sports & Outdoors</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Customer Care</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="hover:text-white transition-colors">Track Your Order</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Return Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Shipping Information</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center & FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-indigo-400">📍</span>
                  <span>123 Business Avenue, Tech District, City 1000</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-400">📞</span>
                  <span>+880 1234-567890</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-400">✉️</span>
                  <span>support@mybusiness.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} My Business OS. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingBag, Menu, User, ChevronDown, Flame } from "lucide-react"
import { useCartStore } from "../../store/useCartStore"
import { useCustomerAuthStore } from "../../store/useCustomerAuthStore"

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const cartItemsCount = useCartStore((state) => state.totalItems())
  const { isAuthenticated } = useCustomerAuthStore()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#04BBFD] selection:text-white">
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-2' : 'bg-white py-4'}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 bg-[#04BBFD] rounded-xl flex items-center justify-center shadow-lg shadow-[#04BBFD]/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm tracking-wider">MB</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-[#04BBFD] transition-colors hidden sm:block">My Business</span>
          </Link>

          {/* Global Search */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search for products, categories, brands..." 
                className="w-full bg-slate-100 hover:bg-slate-200 focus:bg-white text-slate-900 px-6 py-3.5 rounded-full border border-transparent focus:border-[#04BBFD] focus:ring-4 focus:ring-[#04BBFD]/10 transition-all outline-none"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#04BBFD] text-white rounded-full flex items-center justify-center hover:bg-[#03a0d9] transition-colors shadow-md">
                
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <button className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-100 rounded-full">
              <Search className="w-5 h-5" />
            </button>
            
            <Link href="/account" className="flex items-center gap-3 text-slate-700 hover:text-[#04BBFD] transition-colors group">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="hidden lg:block text-sm leading-tight">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Welcome</p>
                <p className="font-bold text-slate-900 group-hover:text-[#04BBFD] transition-colors">{isAuthenticated ? 'My Account' : 'Sign In / Register'}</p>
              </div>
            </Link>

            <div className="w-px h-8 bg-slate-200 hidden lg:block mx-2"></div>

            <Link href="/cart" className="flex items-center gap-3 text-slate-700 hover:text-[#04BBFD] transition-colors group">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                {mounted && cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-sm leading-tight">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Your Cart</p>
                <p className="font-bold text-slate-900 group-hover:text-[#04BBFD] transition-colors">৳0.00</p>
              </div>
            </Link>
            
            <button className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="hidden lg:flex max-w-[1400px] mx-auto px-6 mt-4 gap-8">
          <Link href="/categories" className="flex items-center gap-2 bg-[#04BBFD] text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-[#03a0d9] transition-colors">
            <Menu className="w-4 h-4" /> All Categories
          </Link>
          <nav className="flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="/" className="hover:text-[#04BBFD] transition-colors">Home</Link>
            <Link href="/products" className="hover:text-[#04BBFD] transition-colors">Products</Link>
            <Link href="/services" className="hover:text-[#04BBFD] transition-colors">Services</Link>
            <Link href="/printing" className="hover:text-[#04BBFD] transition-colors">Printing</Link>
          </nav>
        </div>
      </header>
      
      <main className="pt-[140px] lg:pt-[170px]">
        {children}
      </main>
      
      <footer className="bg-slate-950 text-slate-300 pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-10 h-10 bg-[#04BBFD] rounded-xl flex items-center justify-center shadow-lg shadow-[#04BBFD]/20">
                  <span className="text-white font-bold text-sm tracking-wider">MB</span>
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white">My Business</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8 max-w-sm">
                Your trusted partner for computer, printing, photography, and digital services in Bangladesh.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Products</h4>
              <ul className="space-y-4">
                <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/products?category=stationery" className="hover:text-white transition-colors">Stationery</Link></li>
                <li><Link href="/products?category=electronics" className="hover:text-white transition-colors">Electronics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Services</h4>
              <ul className="space-y-4">
                <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
                <li><Link href="/printing" className="hover:text-white transition-colors">Printing</Link></li>
                <li><Link href="/services?category=photography" className="hover:text-white transition-colors">Photography</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Help & Support</h4>
              <ul className="space-y-4">
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
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

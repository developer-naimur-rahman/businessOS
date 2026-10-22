"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Search, ShoppingBag, Menu, User, X, ChevronRight, Printer, Sparkles, Phone, HelpCircle, Heart, Mail, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useCartStore } from "../../store/useCartStore"
import { useWishlistStore } from "../../store/useWishlistStore"
import { useCustomerAuthStore } from "../../store/useCustomerAuthStore"
import CustomerAiAssistant from "../storefront/customer-ai-assistant"

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false)

  const cartItemsCount = useCartStore((state) => state.totalItems())
  const cartTotalPrice = useCartStore((state) => state.totalPrice())
  const wishlistCount = useWishlistStore((state) => state.totalItems())
  const { isAuthenticated } = useCustomerAuthStore()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
  }, [pathname])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setMobileSearchOpen(false)
    }
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) {
      toast.error("Please enter your email address.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newsletterEmail.trim())) {
      toast.error("Please enter a valid email address.")
      return
    }

    try {
      setSubmittingNewsletter(true)
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to subscribe to newsletter.")
      }

      toast.success(data.message || "Successfully subscribed to our newsletter!")
      setNewsletterEmail("")
    } catch (err: any) {
      toast.error(err.message || "Unable to subscribe. Please try again.")
    } finally {
      setSubmittingNewsletter(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#04BBFD] selection:text-white">
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-2' : 'bg-white py-3 sm:py-4'}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 bg-[#04BBFD] rounded-xl flex items-center justify-center shadow-lg shadow-[#04BBFD]/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-sm tracking-wider">MB</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-[#04BBFD] transition-colors hidden sm:block">My Business</span>
          </Link>

          {/* Desktop Global Search */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, services, stationery, computer items..." 
                className="w-full bg-slate-100 hover:bg-slate-200/80 focus:bg-white text-slate-900 pl-5 pr-14 py-3 rounded-full border border-transparent focus:border-[#04BBFD] focus:ring-4 focus:ring-[#04BBFD]/10 transition-all outline-none text-sm"
              />
              <button 
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#04BBFD] text-white rounded-full flex items-center justify-center hover:bg-[#03a0d9] transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-5 shrink-0">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              aria-label="Toggle search"
            >
              <Search className="w-4 h-4" />
            </button>
            
            {/* Customer Account */}
            <Link href="/account" className="flex items-center gap-2.5 text-slate-700 hover:text-[#04BBFD] transition-colors group">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                <User className="w-5 h-5 text-slate-600 group-hover:text-[#04BBFD]" />
              </div>
              <div className="hidden lg:block text-left text-sm leading-tight">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Welcome</p>
                <p className="font-bold text-slate-900 group-hover:text-[#04BBFD] transition-colors">
                  {isAuthenticated ? 'My Account' : 'Sign In'}
                </p>
              </div>
            </Link>

            {/* Wishlist Button */}
            <Link href="/wishlist" className="flex items-center gap-2.5 text-slate-700 hover:text-rose-500 transition-colors group" title="My Wishlist">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                  <Heart className="w-5 h-5 text-slate-600 group-hover:text-rose-500" />
                </div>
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <div className="hidden xl:block text-left text-sm leading-tight">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Saved</p>
                <p className="font-bold text-slate-900 group-hover:text-rose-500 transition-colors">
                  Wishlist
                </p>
              </div>
            </Link>

            <div className="w-px h-8 bg-slate-200 hidden lg:block mx-1"></div>

            {/* Cart Button */}
            <Link href="/cart" className="flex items-center gap-2.5 text-slate-700 hover:text-[#04BBFD] transition-colors group">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                  <ShoppingBag className="w-5 h-5 text-slate-600 group-hover:text-[#04BBFD]" />
                </div>
                {mounted && cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-left text-sm leading-tight">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Your Cart</p>
                <p className="font-bold text-slate-900 group-hover:text-[#04BBFD] transition-colors tabular-nums">
                  ৳{mounted ? cartTotalPrice.toLocaleString() : '0'}
                </p>
              </div>
            </Link>
            
            {/* Mobile Hamburger Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#04BBFD] bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Overlay Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pt-3 pb-2 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, services..." 
                autoFocus
                className="w-full bg-slate-100 text-slate-900 pl-4 pr-12 py-2.5 rounded-full text-sm outline-none border border-slate-200 focus:border-[#04BBFD]"
              />
              <button 
                type="submit" 
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#04BBFD] text-white rounded-full flex items-center justify-center"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Desktop Sub-Navigation Bar */}
        <div className="hidden lg:flex max-w-[1400px] mx-auto px-6 mt-3 pt-3 border-t border-slate-100/80 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/categories" 
              className="flex items-center gap-2 bg-[#04BBFD] text-white px-5 py-2 rounded-full font-semibold text-xs tracking-wider uppercase hover:bg-[#03a0d9] transition-all shadow-sm shadow-[#04BBFD]/20"
            >
              <Menu className="w-3.5 h-3.5" /> All Categories
            </Link>
            <nav className="flex items-center gap-7 font-medium text-sm text-slate-600">
              <Link 
                href="/" 
                className={`transition-colors py-1 ${pathname === '/' ? 'text-[#04BBFD] font-semibold border-b-2 border-[#04BBFD]' : 'hover:text-[#04BBFD]'}`}
              >
                Home
              </Link>
              <Link 
                href="/products" 
                className={`transition-colors py-1 ${pathname === '/products' ? 'text-[#04BBFD] font-semibold border-b-2 border-[#04BBFD]' : 'hover:text-[#04BBFD]'}`}
              >
                Products
              </Link>
              <Link 
                href="/services" 
                className={`transition-colors py-1 ${pathname === '/services' ? 'text-[#04BBFD] font-semibold border-b-2 border-[#04BBFD]' : 'hover:text-[#04BBFD]'}`}
              >
                Services
              </Link>
              <Link 
                href="/printing" 
                className={`transition-colors py-1 flex items-center gap-1.5 ${pathname === '/printing' ? 'text-[#04BBFD] font-semibold border-b-2 border-[#04BBFD]' : 'hover:text-[#04BBFD]'}`}
              >
                <Printer className="w-3.5 h-3.5" /> Printing Studio
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <Link 
              href="/upload-print" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-all border border-indigo-200"
              title="পেনড্রাইভ ছাড়া দ্রুত ফাইল প্রিন্ট ড্রপ"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Print Drop</span>
            </Link>
            <Link 
              href="/track" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all border border-slate-200"
              title="সার্ভিস বা অর্ডারের লাইভ ট্র্যাকিং"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Track Job</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 mx-1 hidden xl:block" />
            <Link href="/faq" className="hover:text-slate-900 transition-colors text-slate-500 hidden xl:block">Help & FAQ</Link>
            <span className="text-slate-400 hidden xl:block">•</span>
            <Link href="/contact" className="hover:text-slate-900 transition-colors text-slate-500 hidden xl:block">Support</Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[65px] bottom-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm ml-auto h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation Menu</span>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  <Link 
                    href="/" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-50 font-medium text-base transition-colors"
                  >
                    <span>Home</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link 
                    href="/products" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-50 font-medium text-base transition-colors"
                  >
                    <span>Products Catalog</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link 
                    href="/services" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-50 font-medium text-base transition-colors"
                  >
                    <span>Professional Services</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link 
                    href="/printing" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-sky-50 text-[#04BBFD] font-semibold text-base transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Printer className="w-4 h-4" /> Printing Studio
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#04BBFD]" />
                  </Link>
                  <Link 
                    href="/upload-print" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50/80 text-indigo-700 font-bold text-base transition-colors border border-indigo-100"
                  >
                    <span className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-indigo-600" /> Print Drop Express
                    </span>
                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                  </Link>
                  <Link 
                    href="/track" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100/80 text-slate-800 font-bold text-base transition-colors border border-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-slate-600" /> Track Order & Service
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link 
                    href="/categories" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-50 font-medium text-base transition-colors"
                  >
                    <span>All Categories</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link 
                    href="/wishlist" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-50 font-medium text-base transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" /> Saved Wishlist
                    </span>
                    <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-xs font-bold">
                      {wishlistCount}
                    </span>
                  </Link>
                  <Link 
                    href="/cart" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-50 font-medium text-base transition-colors"
                  >
                    <span>Shopping Cart</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">
                      {cartItemsCount}
                    </span>
                  </Link>
                  <Link 
                    href="/account" 
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-50 font-medium text-base transition-colors"
                  >
                    <span>My Account</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </nav>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-4">Support & Info</p>
                  <Link href="/faq" className="block px-4 py-2 text-sm text-slate-600 hover:text-[#04BBFD]">Frequently Asked Questions</Link>
                  <Link href="/contact" className="block px-4 py-2 text-sm text-slate-600 hover:text-[#04BBFD]">Contact Us</Link>
                  <Link href="/privacy" className="block px-4 py-2 text-sm text-slate-600 hover:text-[#04BBFD]">Privacy Policy</Link>
                  <Link href="/terms" className="block px-4 py-2 text-sm text-slate-600 hover:text-[#04BBFD]">Terms of Service</Link>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
                My Business OS • Quality Retail & Digital Services
              </div>
            </div>
          </div>
        )}
      </header>
      
      <main className="pt-[110px] sm:pt-[130px] lg:pt-[150px]">
        {children}
      </main>
      
      <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Newsletter Subscription Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 rounded-3xl p-8 md:p-10 mb-16 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-[#04BBFD]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#04BBFD]/20 text-[#04BBFD] mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Special Offers & Updates
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Subscribe to Our Newsletter
                </h3>
                <p className="text-slate-400 text-sm md:text-base mt-2">
                  Stay updated with our latest retail products, exclusive discounts, print service offers, and tech tips.
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="w-full lg:max-w-md flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-[#04BBFD] text-white pl-12 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-500 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingNewsletter}
                  className="bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-[#04BBFD]/25 hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {submittingNewsletter ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Subscribing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Subscribe
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-10 h-10 bg-[#04BBFD] rounded-xl flex items-center justify-center shadow-lg shadow-[#04BBFD]/20">
                  <span className="text-white font-bold text-sm tracking-wider">MB</span>
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white">My Business</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8 max-w-sm">
                Your trusted partner for computer, printing, photocopy, photography, stationery, and digital services in Bangladesh.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Products</h4>
              <ul className="space-y-4">
                <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/products?category=stationery" className="hover:text-white transition-colors">Stationery & Office</Link></li>
                <li><Link href="/products?category=electronics" className="hover:text-white transition-colors">Computer Accessories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Services</h4>
              <ul className="space-y-4">
                <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
                <li><Link href="/printing" className="hover:text-white transition-colors">Printing Studio</Link></li>
                <li><Link href="/services?category=photography" className="hover:text-white transition-colors">Studio Photography</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Help & Support</h4>
              <ul className="space-y-4">
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} My Business OS. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Storefront Customer AI Shopping Assistant */}
      <CustomerAiAssistant />

      {/* Floating WhatsApp Live Chat Button */}
      <a
        href="https://wa.me/8801712345678?text=Hello%20BusinessOS,%20I%20have%20an%20inquiry%20regarding..."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl shadow-[#25D366]/40 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <svg 
          className="w-5 h-5 fill-current" 
          viewBox="0 0 24 24"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span className="font-bold text-sm tracking-wide">Chat on WhatsApp</span>
      </a>
    </div>
  )
}

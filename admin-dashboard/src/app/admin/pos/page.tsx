"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Search, ShoppingCart, UserCircle, Plus, Minus, Trash2, CreditCard, ScanLine } from "lucide-react"

export default function AdminPOSPage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [branchId, setBranchId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const [productsRes, branchesRes] = await Promise.all([
          api.get('/business-core/products'),
          api.get('/operational-structure/branches')
        ])
        setProducts(productsRes.data.filter((p: any) => p.isActive))
        if (branchesRes.data.length > 0) {
          setBranchId(branchesRes.data[0].id)
        }
      } catch (err) {
        console.error("Failed to load catalog", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQ }
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0)
  const tax = subtotal * 0.05
  const total = subtotal + tax

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCheckout = async (paymentMethod: 'CASH' | 'CARD') => {
    if (cart.length === 0 || !branchId) return;
    setIsProcessing(true)
    try {
      await api.post('/sales/complete-direct', {
        branchId,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.sellingPrice)
        })),
        paymentMethod,
        paymentAmount: total
      })
      alert("Sale completed successfully!")
      setCart([])
    } catch (err) {
      alert("Failed to process sale")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* Left Area: Product Selection */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* POS Header / Search */}
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search products or scan barcode..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200/80 rounded-xl text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              autoFocus
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories (Demo) */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 shrink-0">
          {['All Items', 'Computers', 'Printing', 'Photography', 'Accessories'].map((cat, idx) => (
            <button key={idx} className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              idx === 0 ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className="surface-elevated aspect-square flex flex-col items-center justify-center text-center p-4 hover:border-slate-300 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {/* Fallback visual since backend lacks images */}
                    <span className="font-semibold text-slate-400 text-xl">{product.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                  <p className="text-emerald-600 font-medium">৳{Number(product.sellingPrice).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Cart & Checkout */}
      <div className="w-full md:w-96 lg:w-[400px] bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col h-full shrink-0 overflow-hidden">
        
        {/* Customer Assignment */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <button className="w-full h-12 bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors">
            <UserCircle className="w-5 h-5 mr-2" /> Assign Customer
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 items-start group">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm leading-tight mb-1 pr-4">{item.name}</h4>
                    <p className="text-emerald-600 font-medium text-sm">৳{Number(item.sellingPrice).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-rose-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Payment */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900 tabular-nums">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax (5%)</span>
              <span className="font-medium text-slate-900 tabular-nums">৳{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-slate-200/80 mt-2">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight">৳{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleCheckout('CARD')} 
              disabled={isProcessing || cart.length === 0} 
              className="h-14 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors flex flex-col items-center justify-center"
            >
              <CreditCard className="w-5 h-5 mb-1" />
              <span className="text-[11px] uppercase tracking-wider">Card</span>
            </button>
            <button 
              onClick={() => handleCheckout('CASH')} 
              disabled={isProcessing || cart.length === 0}
              className="h-14 bg-emerald-600 text-white rounded-xl font-semibold shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-colors flex flex-col items-center justify-center"
            >
              <span className="text-lg leading-none mb-0.5">{isProcessing ? "..." : "Pay"}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">Cash</span>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  )
}

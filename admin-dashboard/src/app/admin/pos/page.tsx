"use client"
import React, { useEffect, useState, useRef, useMemo } from "react"
import { api } from "../../../lib/api-client"
import { Search, ShoppingCart, UserCircle, Plus, Minus, CreditCard, ScanLine, Trash2 } from "lucide-react"
import { POSSuccessModal } from "../../../components/pos/POSSuccessModal"
import { ReceiptTemplate } from "../../../components/pos/ReceiptTemplate"
import { A4InvoiceTemplate } from "../../../components/pos/A4InvoiceTemplate"
import { VariantSelectorModal } from "../../../components/pos/VariantSelectorModal"
import { stringToColor } from "../../../lib/colorUtils"

export default function AdminPOSPage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All Items")
  const [isProcessing, setIsProcessing] = useState(false)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [warehouseId, setWarehouseId] = useState<string | null>(null)
  
  // Checkout & Print State
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [printMode, setPrintMode] = useState<'NONE' | 'RECEIPT' | 'A4'>('NONE')
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<any>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const [productsRes, branchesRes, warehousesRes] = await Promise.all([
          api.get('/business-core/products', { params: { pageSize: 1000 } }), // Fetch enough for POS
          api.get('/operational-structure/branches'),
          api.get('/operational-structure/warehouses')
        ])
        const productItems = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data.items || [])
        setProducts(productItems.filter((p: any) => p.isActive))
        if (branchesRes.data.length > 0) {
          const firstBranch = branchesRes.data[0]
          setBranchId(firstBranch.id)
          const branchWarehouse = warehousesRes.data.find((w: any) => w.branchId === firstBranch.id)
          if (branchWarehouse) {
            setWarehouseId(branchWarehouse.id)
          } else if (warehousesRes.data.length > 0) {
             setWarehouseId(warehousesRes.data[0].id)
          }
        }
      } catch (err) {
        console.error("Failed to load catalog", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with Ctrl+K or /
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Escape to close modal / clear search
      if (e.key === 'Escape') {
        if (completedSale) {
           handleNewSale()
        } else if (searchQuery) {
           setSearchQuery('')
           searchInputRef.current?.blur()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [completedSale, searchQuery])

  // Trigger browser print when printMode changes
  useEffect(() => {
    if (printMode !== 'NONE') {
      // Small timeout to allow DOM to render the specific template before printing
      setTimeout(() => {
        window.print()
        // Reset print mode after print dialog closes (some browsers block JS during print, some don't, so we reset immediately after triggering)
        setPrintMode('NONE')
      }, 100)
    }
  }, [printMode])


  const handleProductClick = (product: any) => {
    const activeVariants = product.variants?.filter((v: any) => v.status === 'ACTIVE') || []
    if (activeVariants.length === 1) {
      addToCart(activeVariants[0], product)
    } else {
      setSelectedProductForVariants(product)
    }
  }

  const addToCart = (variant: any, product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id)
      if (existing) {
        return prev.map(item => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      const price = Number(variant.posPrice || variant.retailPrice || product.sellingPrice || 0)
      const attrs = variant.attributes?.map((a: any) => a.attributeValue?.value).join(' / ')
      const name = attrs ? `${product.name} - ${attrs}` : product.name
      
      return [...prev, { 
        variantId: variant.id, 
        productId: product.id, 
        name, 
        sku: variant.sku, 
        sellingPrice: price, 
        quantity: 1 
      }]
    })
  }

  const updateQuantity = (variantId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        const newQ = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQ }
      }
      return item
    }))
  }

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId))
  }

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0)
  const tax = 0 // Backend currently doesn't support tax on sales
  const total = subtotal + tax

  // Memoized categories extraction
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => {
       if (p.category?.name) cats.add(p.category.name)
    })
    return ['All Items', ...Array.from(cats)]
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = activeCategory === 'All Items' || p.category?.name === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, activeCategory])


  const handleCheckout = async (paymentMethod: 'CASH' | 'CARD') => {
    if (cart.length === 0 || !branchId || !warehouseId) {
      alert("Missing branch or warehouse selection.");
      return;
    }
    setIsProcessing(true)
    try {
      const response = await api.post('/sales/complete-direct', {
        branchId,
        warehouseId,
        lines: cart.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          discount: 0
        })),
        payments: [{
          method: paymentMethod,
          amount: total
        }]
      })
      
      // Inject product names into the sale lines for the invoice renderer since backend only returns productId
      const enrichedSale = {
        ...response.data,
        lines: response.data.lines.map((line: any) => {
          const product = cart.find(p => p.variantId === line.variantId)
          return {
            ...line,
            productName: product?.name || line.productNameSnapshot || 'Unknown Product',
            productCode: product?.sku || line.skuSnapshot
          }
        })
      }
      
      setCompletedSale(enrichedSale)
    } catch (err: any) {
      console.error("Sale error:", err.response?.data || err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to process sale";
      alert(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNewSale = () => {
    setCart([])
    setCompletedSale(null)
    setSearchQuery('')
  }

  return (
    <>
      {/* Hidden Print Portals */}
      {completedSale && (
        <div className="hidden print:block">
          {printMode === 'RECEIPT' && <ReceiptTemplate sale={completedSale} />}
          {printMode === 'A4' && <A4InvoiceTemplate sale={completedSale} />}
        </div>
      )}

      {/* Main POS Workspace - hidden during print */}
      <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row animate-in fade-in duration-500 print:hidden bg-slate-50/50 -mx-4 -mb-4 md:mx-0 md:mb-0">
        
        {/* Left Area: Product Selection */}
        <div className="flex-1 flex flex-col h-full overflow-hidden px-4 md:px-0 md:pl-6 pt-6">
          
          {/* POS Header / Search */}
          <div className="flex items-center gap-4 mb-4 shrink-0">
            <div className="relative flex-1 group">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search products or scan barcode (Press '/' to focus)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    const query = searchQuery.trim().toLowerCase();
                    for (const product of products) {
                      if (!product.isActive) continue;
                      const variants = product.variants?.filter((v: any) => v.status === 'ACTIVE') || [];
                      for (const variant of variants) {
                        if (
                          variant.sku?.toLowerCase() === query || 
                          variant.barcodes?.some((b: any) => b.barcode.toLowerCase() === query)
                        ) {
                          addToCart(variant, product);
                          setSearchQuery('');
                          return;
                        }
                      }
                    }
                  }
                }}
                className="w-full h-14 pl-12 pr-12 bg-white border border-slate-200 rounded-2xl text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                autoFocus
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <ScanLine className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4 shrink-0 -mx-4 px-4 md:mx-0 md:px-0 custom-scrollbar">
            {categories.map((cat, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm border ${
                activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="aspect-square bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-slate-500">No products found</p>
                <p className="text-sm">Try a different search term or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => {
                  const colors = stringToColor(product.name);
                  return (
                    <button 
                      key={product.id} 
                      onClick={() => handleProductClick(product)}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm aspect-square flex flex-col items-center justify-center text-center p-4 hover:border-indigo-300 hover:shadow-md transition-all group active:scale-[0.97]"
                    >
                      <div 
                        className="w-16 h-16 rounded-full mb-3 flex items-center justify-center group-hover:-translate-y-1 transition-transform shadow-inner"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        <span className="font-bold text-2xl tracking-tighter">{product.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 text-[13px] mb-1 line-clamp-2 leading-tight px-1">{product.name}</h3>
                      <p className="text-indigo-600 font-bold text-sm tracking-tight mt-auto">৳{Number(product.sellingPrice).toLocaleString()}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Cart & Checkout */}
        <div className="w-full md:w-96 lg:w-[400px] bg-white border-l border-slate-200/80 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] flex flex-col h-full shrink-0 overflow-hidden z-10 relative">
          
          {/* Customer Assignment */}
          <div className="p-4 border-b border-slate-100 bg-white shrink-0">
            <button className="w-full h-12 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors font-medium">
              <UserCircle className="w-5 h-5 mr-2" /> Assign Customer
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <ShoppingCart className="w-16 h-16 opacity-10" />
                <p className="font-medium text-slate-500">Cart is empty</p>
                <p className="text-sm text-center px-8">Tap products on the left or scan a barcode to begin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.variantId} className="bg-white border border-slate-100 rounded-xl p-3 flex gap-3 items-start group shadow-sm hover:border-indigo-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-1 truncate">{item.name}</h4>
                      <p className="text-indigo-600 font-semibold text-sm">৳{Number(item.sellingPrice).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-9 shadow-inner">
                          <button onClick={() => updateQuantity(item.variantId, -1)} className="w-9 h-full flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-slate-800 tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.variantId, 1)} className="w-9 h-full flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.variantId)} 
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Payment */}
          <div className="p-5 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.03)] relative z-20">
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-700 tabular-nums">৳{subtotal.toLocaleString()}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span className="font-semibold text-slate-700 tabular-nums">৳{tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-3 border-t border-slate-100 mt-3">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-1">Total</span>
                <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">৳{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleCheckout('CARD')} 
                disabled={isProcessing || cart.length === 0} 
                className="h-16 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all flex flex-col items-center justify-center active:scale-[0.98]"
              >
                <CreditCard className="w-6 h-6 mb-1 text-slate-500" />
                <span className="text-[11px] uppercase tracking-wider">Card</span>
              </button>
              <button 
                onClick={() => handleCheckout('CASH')} 
                disabled={isProcessing || cart.length === 0}
                className="h-16 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-700/40 disabled:opacity-50 transition-all flex flex-col items-center justify-center relative overflow-hidden active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                  </span>
                ) : (
                  <>
                    <span className="text-xl leading-none mb-0.5 tracking-tight">Pay</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-90">Cash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {completedSale && (
        <POSSuccessModal 
          sale={completedSale} 
          onNewSale={handleNewSale}
          onPrintThermal={() => setPrintMode('RECEIPT')}
          onPrintA4={() => setPrintMode('A4')}
        />
      )}

      {/* Variant Selector Modal */}
      <VariantSelectorModal 
        product={selectedProductForVariants}
        isOpen={!!selectedProductForVariants}
        onClose={() => setSelectedProductForVariants(null)}
        onSelect={addToCart}
      />
    </>
  )
}

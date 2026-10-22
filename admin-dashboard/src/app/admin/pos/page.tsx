"use client"
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { api } from "../../../lib/api-client"
import { 
  Search, ShoppingCart, UserCircle, Plus, Minus, CreditCard, ScanLine, 
  Trash2, PauseCircle, FolderOpen, Split, Monitor, Zap, Check, X,
  Banknote, Smartphone, Receipt, ArrowRight, ShieldCheck, Clock
} from "lucide-react"
import { POSSuccessModal } from "../../../components/pos/POSSuccessModal"
import { ReceiptTemplate } from "../../../components/pos/ReceiptTemplate"
import { A4InvoiceTemplate } from "../../../components/pos/A4InvoiceTemplate"
import { VariantSelectorModal } from "../../../components/pos/VariantSelectorModal"
import { stringToColor } from "../../../lib/colorUtils"
import { toast } from "sonner"

export default function AdminPOSPage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All Items")
  const [isProcessing, setIsProcessing] = useState(false)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [warehouseId, setWarehouseId] = useState<string | null>(null)
  
  // Held Carts / Bills State
  const [heldOrders, setHeldOrders] = useState<any[]>([])
  const [isHeldDrawerOpen, setIsHeldDrawerOpen] = useState(false)
  const [holdNoteInput, setHoldNoteInput] = useState("")
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false)

  // Cash Tender Modal & Cart Discount State
  const [isCashModalOpen, setIsCashModalOpen] = useState(false)
  const [cashTendered, setCashTendered] = useState<string>("")
  const [cashDiscount, setCashDiscount] = useState<number>(0)
  const [cashShortfallMode, setCashShortfallMode] = useState<'DISCOUNT' | 'BAKI'>('DISCOUNT')
  const [cashBakiPhone, setCashBakiPhone] = useState<string>("")
  const [cartDiscount, setCartDiscount] = useState<number>(0)

  // Split Payment Modal State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [splitCash, setSplitCash] = useState<string>("")
  const [splitMobile, setSplitMobile] = useState<string>("")
  const [splitMobileRef, setSplitMobileRef] = useState<string>("")
  const [splitBank, setSplitBank] = useState<string>("")
  const [splitBaki, setSplitBaki] = useState<string>("")
  const [splitCustomerPhone, setSplitCustomerPhone] = useState<string>("")


  // Checkout & Print State
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [printMode, setPrintMode] = useState<'NONE' | 'RECEIPT' | 'A4'>('NONE')
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<any>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  // Initialize Broadcast Channel for Second Display
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcastChannelRef.current = new BroadcastChannel('pos_customer_display')
      }
    } catch {
      // BroadcastChannel unsupported or blocked
    }
    return () => {
      broadcastChannelRef.current?.close()
    }
  }, [])

  // Sync Cart State to Second Customer Display
  const broadcastDisplayState = useCallback((customStatus?: string, customQr = false) => {
    const subtotalAmt = cart.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0)
    const statePayload = {
      items: cart.map(item => ({
        variantId: item.variantId,
        productName: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        total: item.sellingPrice * item.quantity
      })),
      subtotal: subtotalAmt,
      discount: 0,
      grandTotal: subtotalAmt,
      status: customStatus || (cart.length > 0 ? 'ACTIVE_BILLING' : 'IDLE_PROMO'),
      paymentQrMode: customQr,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem('pos_customer_display_state', JSON.stringify(statePayload))
      broadcastChannelRef.current?.postMessage(statePayload)
      // Fire-and-forget sync to backend
      api.post('/admin/pos/live-display-state', statePayload).catch(() => {})
    } catch {
      // Ignore
    }
  }, [cart])

  // Sync whenever cart changes
  useEffect(() => {
    broadcastDisplayState()
    // Local offline recovery caching
    try {
      localStorage.setItem('pos_active_cart', JSON.stringify(cart))
    } catch {
      // Ignore
    }
  }, [cart, broadcastDisplayState])

  // Initial Load Catalog & Restore Offline Cart & Fetch Held Orders
  useEffect(() => {
    async function fetchCatalogAndInit() {
      try {
        const productsRes = await api.get('/business-core/products', { params: { pageSize: 1000 } })
        const productItems = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data.items || [])
        setProducts(productItems.filter((p: any) => p.isActive))
        
        try {
          const branchesRes = await api.get('/operational-structure/branches')
          const warehousesRes = await api.get('/operational-structure/warehouses')
          
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
        } catch (orgErr) {
          console.warn("Failed to load branches/warehouses", orgErr)
        }

        // Restore offline cart if available
        try {
          const savedCart = localStorage.getItem('pos_active_cart')
          if (savedCart) {
            const parsed = JSON.parse(savedCart)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCart(parsed)
              toast.info(`Restored ${parsed.length} items from previous session.`)
            }
          }
        } catch {
          // Ignore
        }

        // Fetch Held Orders
        fetchHeldOrders()
      } catch (err) {
        console.error("Failed to load catalog", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalogAndInit()
  }, [])

  const fetchHeldOrders = async () => {
    try {
      const res = await api.get('/sales/hold-orders')
      if (res.data?.success && Array.isArray(res.data.data)) {
        setHeldOrders(res.data.data)
      }
    } catch {
      // Offline fallback for held orders
      try {
        const localHeld = localStorage.getItem('pos_local_held_orders')
        if (localHeld) setHeldOrders(JSON.parse(localHeld))
      } catch {
        // Ignore
      }
    }
  }

  // Audio feedback synthesizer for barcode scanner
  const playScanBeep = (isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      if (isSuccess) {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime) // High pleasant chime (A5)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.12)
      } else {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(300, ctx.currentTime) // Low warning beep
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      }
    } catch {
      // AudioContext blocked
    }
  }

  // Fast Barcode & SKU Processing Engine
  const processBarcodeScan = async (rawCode: string) => {
    const code = rawCode.trim()
    if (!code) return

    const lower = code.toLowerCase()

    // 1. Search in-memory products first (instant 0ms response)
    for (const product of products) {
      if (!product.isActive) continue
      const variants = product.variants?.filter((v: any) => v.status === 'ACTIVE') || []
      for (const variant of variants) {
        if (
          variant.sku?.toLowerCase() === lower ||
          variant.barcodes?.some((b: any) => b.barcode.toLowerCase() === lower) ||
          (product.code && product.code.toLowerCase() === lower)
        ) {
          addToCart(variant, product)
          playScanBeep(true)
          toast.success(`Scanned: ${product.name} (SKU: ${variant.sku})`)
          setSearchQuery('')
          return true
        }
      }
    }

    // 2. Query backend fast barcode API if not loaded in memory
    try {
      const res = await api.get(`/public/catalog/barcodes/${encodeURIComponent(code)}`)
      if (res.data?.found && res.data.variant && res.data.product) {
        const { variant, product } = res.data
        addToCart(variant, product)
        playScanBeep(true)
        toast.success(`Scanned: ${res.data.name || product.name}`)
        setSearchQuery('')
        return true
      }
    } catch {
      // Non-blocking
    }

    playScanBeep(false)
    toast.error(`Barcode / SKU "${code}" not found in catalog.`)
    return false
  }

  // Subtotal & Totals
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0)
  }, [cart])
  const tax = 0
  const netTotal = Math.max(0, subtotal - cartDiscount)
  const total = netTotal

  // Hold Current Cart (F4)
  const handleHoldCart = async () => {
    if (cart.length === 0) {
      toast.warning("Cannot hold an empty cart.")
      return
    }

    const note = holdNoteInput.trim() || `Customer Hold (${cart.length} items)`
    try {
      const res = await api.post('/sales/hold-orders', {
        note,
        items: cart
      })
      if (res.data?.success) {
        toast.success(`Bill parked successfully: ${res.data.holdOrder.holdNumber}`)
        setCart([])
        setIsHoldModalOpen(false)
        setHoldNoteInput("")
        fetchHeldOrders()
        broadcastDisplayState('IDLE_PROMO')
      }
    } catch {
      // Local fallback
      const localHold = {
        id: `HOLD-LOCAL-${Date.now()}`,
        holdNumber: `HOLD-${Math.floor(1000 + Math.random() * 9000)}`,
        note,
        items: cart,
        total,
        itemCount: cart.length,
        createdAt: new Date().toISOString()
      }
      const updated = [localHold, ...heldOrders]
      setHeldOrders(updated)
      localStorage.setItem('pos_local_held_orders', JSON.stringify(updated))
      setCart([])
      setIsHoldModalOpen(false)
      setHoldNoteInput("")
      toast.success("Bill held locally (offline mode).")
      broadcastDisplayState('IDLE_PROMO')
    }
  }

  // Recall a Held Order
  const handleRecallOrder = async (order: any) => {
    if (cart.length > 0) {
      toast.warning("Please complete or hold current active cart before recalling another.")
      return
    }

    setCart(order.items || [])
    toast.success(`Recalled hold bill #${order.holdNumber}`)
    setIsHeldDrawerOpen(false)

    // Remove from server or local
    try {
      await api.delete(`/sales/hold-orders/${order.id}`)
      fetchHeldOrders()
    } catch {
      const updated = heldOrders.filter(h => h.id !== order.id)
      setHeldOrders(updated)
      localStorage.setItem('pos_local_held_orders', JSON.stringify(updated))
    }
  }

  // Keyboard Shortcuts Listener (F2, F4, F6, F8, F9, Esc)
  useEffect(() => {
    let scanBuffer = ''
    let lastKeyTime = Date.now()

    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Focus Search / Barcode Gun
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
        toast.info("Search focused (F2)")
        return
      }

      // F4: Hold Bill
      if (e.key === 'F4') {
        e.preventDefault()
        if (cart.length > 0) {
          setIsHoldModalOpen(true)
        } else {
          toast.warning("Cart is empty (F4)")
        }
        return
      }

      // F6: Recall Held Bills Drawer
      if (e.key === 'F6') {
        e.preventDefault()
        fetchHeldOrders()
        setIsHeldDrawerOpen(prev => !prev)
        return
      }

      // F8: Split Payment Modal
      if (e.key === 'F8') {
        e.preventDefault()
        if (cart.length > 0) {
          setSplitCash(total.toString())
          setSplitMobile("")
          setSplitBank("")
          setSplitBaki("")
          setIsSplitModalOpen(true)
          broadcastDisplayState('SHOW_PAYMENT_QR', true)
        } else {
          toast.warning("Cart is empty (F8)")
        }
        return
      }

      // F9: Open Cash Tender & Change Modal
      if (e.key === 'F9') {
        e.preventDefault()
        if (cart.length > 0 && !isProcessing) {
          openCashModal()
        }
        return
      }

      // Ctrl+K or /: Focus search
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement !== searchInputRef.current)) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      // Escape to close modals or reset
      if (e.key === 'Escape') {
        if (completedSale) {
          handleNewSale()
        } else if (isCashModalOpen) {
          setIsCashModalOpen(false)
          broadcastDisplayState('ACTIVE_BILLING', false)
        } else if (isSplitModalOpen) {
          setIsSplitModalOpen(false)
          broadcastDisplayState('ACTIVE_BILLING', false)
        } else if (isHoldModalOpen) {
          setIsHoldModalOpen(false)
        } else if (isHeldDrawerOpen) {
          setIsHeldDrawerOpen(false)
        } else if (searchQuery) {
          setSearchQuery('')
          searchInputRef.current?.blur()
        }
        return
      }

      const now = Date.now()
      const diff = now - lastKeyTime
      lastKeyTime = now

      const isInput = document.activeElement === searchInputRef.current

      if (e.key === 'Enter') {
        if (scanBuffer.length >= 2 && (diff < 120 || isInput)) {
          e.preventDefault()
          processBarcodeScan(scanBuffer)
          scanBuffer = ''
          return
        }
        scanBuffer = ''
      } else if (e.key.length === 1) {
        if (diff > 120 && !isInput) {
          scanBuffer = e.key
        } else {
          scanBuffer += e.key
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [completedSale, searchQuery, products, cart, total, isProcessing, isCashModalOpen, isSplitModalOpen, isHoldModalOpen, isHeldDrawerOpen, broadcastDisplayState])


  // Trigger browser print when printMode changes
  useEffect(() => {
    if (printMode !== 'NONE') {
      setTimeout(() => {
        window.print()
        setPrintMode('NONE')
      }, 100)
    }
  }, [printMode])

  const handleProductClick = (product: any) => {
    const activeVariants = (product.variants || []).filter((v: any) => v.status === 'ACTIVE' || !v.status)
    if (activeVariants.length === 1) {
      addToCart(activeVariants[0], product)
    } else if (activeVariants.length === 0) {
      // Single/Standard product without separate variants
      const standardVariant = {
        id: product.id,
        sku: product.code || product.sku || `SKU-${product.id.slice(0, 8)}`,
        retailPrice: Number(product.sellingPrice || 0),
        posPrice: Number(product.sellingPrice || 0),
        status: 'ACTIVE',
        attributes: []
      }
      addToCart(standardVariant, product)
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

  // Categories extraction
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

  // Split Payment Calculations
  const numCash = parseFloat(splitCash) || 0
  const numMobile = parseFloat(splitMobile) || 0
  const numBank = parseFloat(splitBank) || 0
  const numBaki = parseFloat(splitBaki) || 0
  const totalTendered = numCash + numMobile + numBank + numBaki
  const changeToReturn = Math.max(0, totalTendered - total)
  const remainingDue = Math.max(0, total - totalTendered)

  // Standard Checkout (Card or Direct Cash)
  const handleCheckout = async (paymentMethod: 'CASH' | 'CARD') => {
    if (cart.length === 0 || !branchId || !warehouseId) {
      toast.warning("Missing branch or warehouse selection.")
      return
    }
    setIsProcessing(true)
    try {
      const response = await api.post('/sales/complete-direct', {
        branchId,
        warehouseId,
        discount: cartDiscount,
        lines: cart.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          discount: 0
        })),
        payments: [{
          method: paymentMethod === 'CARD' ? 'BANK' : paymentMethod,
          amount: total,
          reference: paymentMethod === 'CARD' ? 'Card POS Terminal' : undefined,
        }]
      })
      
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
      
      toast.success("Sale completed successfully")
      setCompletedSale(enrichedSale)
      setCart([])
      setCartDiscount(0)
      localStorage.removeItem('pos_active_cart')
      broadcastDisplayState('THANK_YOU', false)
    } catch (err: any) {
      console.error("Sale error:", err.response?.data || err)
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to process sale"
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Open Cash Payment Modal
  const openCashModal = () => {
    if (cart.length === 0) {
      toast.warning("কার্ট খালি! পণ্য যোগ করুন।")
      return
    }
    setCashTendered(total.toString())
    setCashDiscount(cartDiscount)
    setCashShortfallMode('DISCOUNT')
    setIsCashModalOpen(true)
    broadcastDisplayState('SHOW_PAYMENT_QR', true)
  }

  // Confirm Cash Sale (with custom tender, discount, round-off, change, or baki)
  const handleCashCheckoutConfirm = async () => {
    if (cart.length === 0 || !branchId || !warehouseId) {
      toast.warning("Missing branch or warehouse selection.")
      return
    }

    const tendered = parseFloat(cashTendered) || 0
    let effectiveDiscount = cartDiscount
    let cashPaid = tendered
    let bakiAmount = 0

    if (tendered < total) {
      const shortfall = total - tendered
      if (cashShortfallMode === 'DISCOUNT') {
        // Customer gives e.g. 2 taka less -> apply shortfall as discount
        effectiveDiscount += shortfall
        cashPaid = tendered
      } else {
        // Record as Baki
        bakiAmount = shortfall
        cashPaid = tendered
      }
    } else {
      // Overpayment: cash payment covers total, change is tendered - total
      cashPaid = total
    }

    const finalGrandTotal = Math.max(0, subtotal - effectiveDiscount)

    setIsProcessing(true)
    try {
      const paymentsPayload: any[] = []
      if (cashPaid > 0) {
        paymentsPayload.push({
          method: 'CASH',
          amount: cashPaid,
          reference: tendered > total ? `Cash tendered: ৳${tendered}, change: ৳${tendered - total}` : undefined
        })
      }
      if (bakiAmount > 0) {
        paymentsPayload.push({
          method: 'OTHER',
          amount: bakiAmount,
          reference: `Customer Baki Due ${cashBakiPhone ? `(Phone: ${cashBakiPhone})` : ''}`
        })
      }

      if (paymentsPayload.length === 0) {
        paymentsPayload.push({ method: 'CASH', amount: finalGrandTotal })
      }

      const response = await api.post('/sales/complete-direct', {
        branchId,
        warehouseId,
        discount: effectiveDiscount,
        lines: cart.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          discount: 0
        })),
        payments: paymentsPayload
      })

      const enrichedSale = {
        ...response.data,
        cashTendered: tendered,
        changeGiven: Math.max(0, tendered - total),
        customerPhone: cashBakiPhone,
        lines: response.data.lines.map((line: any) => {
          const product = cart.find(p => p.variantId === line.variantId)
          return {
            ...line,
            productName: product?.name || line.productNameSnapshot || 'Unknown Product',
            productCode: product?.sku || line.skuSnapshot
          }
        })
      }

      toast.success(
        tendered > total 
          ? `নগদ বিক্রয় সফল! গ্রাহককে ফেরত দিন: ৳${(tendered - total).toLocaleString()}`
          : "নগদ বিক্রয় সফলভাবে সম্পন্ন হয়েছে!"
      )
      setCompletedSale(enrichedSale)
      setCart([])
      setCartDiscount(0)
      setIsCashModalOpen(false)
      localStorage.removeItem('pos_active_cart')
      broadcastDisplayState('THANK_YOU', false)
    } catch (err: any) {
      console.error("Cash sale error:", err.response?.data || err)
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to process cash sale"
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
    } finally {
      setIsProcessing(false)
    }
  }


  // Split Payment Submission
  const handleSplitCheckout = async () => {
    if (cart.length === 0 || !branchId || !warehouseId) {
      toast.warning("Cannot checkout with empty cart.")
      return
    }

    if (totalTendered < total) {
      toast.error(`Insufficient payment! Still remaining ৳${remainingDue.toLocaleString()}`)
      return
    }

    setIsProcessing(true)
    try {
      const paymentsPayload: any[] = []
      
      // Calculate adjusted cash (deduct change given)
      const effectiveCash = Math.max(0, numCash - changeToReturn)
      if (effectiveCash > 0) {
        paymentsPayload.push({
          method: 'CASH',
          amount: effectiveCash
        })
      }
      if (numMobile > 0) {
        paymentsPayload.push({
          method: 'MOBILE_BANKING',
          amount: numMobile,
          reference: splitMobileRef ? `Mobile: ${splitMobileRef}` : 'bKash/Nagad'
        })
      }
      if (numBank > 0) {
        paymentsPayload.push({
          method: 'BANK',
          amount: numBank,
          reference: 'POS Card/Bank Terminal'
        })
      }
      if (numBaki > 0) {
        paymentsPayload.push({
          method: 'OTHER',
          amount: numBaki,
          reference: `Customer Baki Due ${splitCustomerPhone ? `(Phone: ${splitCustomerPhone})` : ''}`
        })
      }

      // Safeguard if effectiveCash rounded to 0
      if (paymentsPayload.length === 0) {
        paymentsPayload.push({ method: 'CASH', amount: total })
      }

      const response = await api.post('/sales/complete-direct', {
        branchId,
        warehouseId,
        discount: cartDiscount,
        lines: cart.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          discount: 0
        })),
        payments: paymentsPayload
      })


      const enrichedSale = {
        ...response.data,
        customerPhone: splitCustomerPhone,
        lines: response.data.lines.map((line: any) => {
          const product = cart.find(p => p.variantId === line.variantId)
          return {
            ...line,
            productName: product?.name || line.productNameSnapshot || 'Unknown Product',
            productCode: product?.sku || line.skuSnapshot
          }
        })
      }

      toast.success("Split payment sale processed successfully!")
      setCompletedSale(enrichedSale)
      setCart([])
      localStorage.removeItem('pos_active_cart')
      setIsSplitModalOpen(false)
      broadcastDisplayState('THANK_YOU', false)
    } catch (err: any) {
      console.error("Split Sale error:", err.response?.data || err)
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to process split sale"
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNewSale = () => {
    setCart([])
    setCompletedSale(null)
    setSearchQuery('')
    localStorage.removeItem('pos_active_cart')
    broadcastDisplayState('IDLE_PROMO')
  }

  // Open secondary pole/tablet display in separate window
  const launchCustomerDisplay = () => {
    if (typeof window !== 'undefined') {
      window.open('/admin/pos/customer-display', 'BusinessOS_Customer_Display', 'width=1100,height=750,menubar=no,toolbar=no')
    }
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

      {/* Main POS Workspace */}
      <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row animate-in fade-in duration-500 print:hidden bg-slate-50/50 -mx-4 -mb-4 md:mx-0 md:mb-0">
        
        {/* Left Area: Product Selection */}
        <div className="flex-1 flex flex-col h-full overflow-hidden px-4 md:px-0 md:pl-6 pt-4">
          
          {/* Top Quick Actions Bar (F-Keys, Hold, Recall, Second Display) */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-slate-600">
              <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-700 font-mono">F2: Search</span>
              <button 
                onClick={() => {
                  if (cart.length > 0) setIsHoldModalOpen(true)
                  else toast.warning("Cart is empty to hold.")
                }}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg flex items-center font-semibold transition-colors border border-amber-200"
              >
                <PauseCircle className="w-3.5 h-3.5 mr-1" /> F4: Hold Bill
              </button>
              <button 
                onClick={() => {
                  fetchHeldOrders()
                  setIsHeldDrawerOpen(true)
                }}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg flex items-center font-semibold transition-colors border border-indigo-200"
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1" /> F6: Held Bills ({heldOrders.length})
              </button>
              <button 
                onClick={() => {
                  if (cart.length > 0) {
                    setSplitCash(total.toString())
                    setSplitMobile("")
                    setSplitBank("")
                    setSplitBaki("")
                    setIsSplitModalOpen(true)
                    broadcastDisplayState('SHOW_PAYMENT_QR', true)
                  } else toast.warning("Cart is empty.")
                }}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg flex items-center font-semibold transition-colors border border-purple-200"
              >
                <Split className="w-3.5 h-3.5 mr-1" /> F8: Split Tender
              </button>
            </div>

            <button 
              onClick={launchCustomerDisplay}
              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center transition-colors shadow-xs"
              title="Launch secondary customer-facing pole display"
            >
              <Monitor className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Launch Customer Display
            </button>
          </div>

          {/* POS Header / Search */}
          <div className="flex items-center gap-3 mb-3 shrink-0">
            <div className="relative flex-1 group">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Scan barcode gun or type product / SKU (Press F2 or '/' to focus)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    e.preventDefault();
                    processBarcodeScan(searchQuery.trim());
                  }
                }}
                className="w-full h-13 pl-12 pr-12 bg-white border border-slate-200 rounded-2xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                autoFocus
              />
              <button 
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    processBarcodeScan(searchQuery.trim());
                  } else {
                    searchInputRef.current?.focus();
                    toast.info("Scanner Ready: Scan barcode with your USB barcode gun or type code above.");
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                title="Scan barcode"
              >
                <ScanLine className="w-5 h-5" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Scanner Armed</span>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-3 shrink-0 -mx-4 px-4 md:mx-0 md:px-0 custom-scrollbar">
            {categories.map((cat, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs border ${
                activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div key={i} className="aspect-square bg-white rounded-2xl shadow-xs border border-slate-100 animate-pulse"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-semibold text-slate-500">No products found</p>
                <p className="text-xs">Try a different search term or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map(product => {
                  const colors = stringToColor(product.name);
                  return (
                    <button 
                      key={product.id} 
                      onClick={() => handleProductClick(product)}
                      className="bg-white rounded-2xl border border-slate-100 shadow-xs aspect-square flex flex-col items-center justify-center text-center p-3 hover:border-indigo-300 hover:shadow-md transition-all group active:scale-[0.97]"
                    >
                      <div 
                        className="w-13 h-13 rounded-2xl mb-2 flex items-center justify-center group-hover:-translate-y-1 transition-transform shadow-inner"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        <span className="font-bold text-xl tracking-tighter">{product.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 text-[12px] mb-1 line-clamp-2 leading-tight px-1">{product.name}</h3>
                      <p className="text-indigo-600 font-black text-xs tracking-tight mt-auto">৳{Number(product.sellingPrice).toLocaleString()}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Cart & Checkout */}
        <div className="w-full md:w-96 lg:w-[410px] bg-white border-l border-slate-200/80 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] flex flex-col h-full shrink-0 overflow-hidden z-10 relative">
          
          {/* Cart Header / Customer info */}
          <div className="p-3.5 border-b border-slate-100 bg-white shrink-0 flex items-center justify-between">
            <div className="flex items-center text-sm font-bold text-slate-800">
              <ShoppingCart className="w-4 h-4 mr-2 text-indigo-600" />
              Active Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
            </div>
            {cart.length > 0 && (
              <button 
                onClick={() => {
                  if (confirm("Clear active cart?")) {
                    setCart([])
                    localStorage.removeItem('pos_active_cart')
                    broadcastDisplayState('IDLE_PROMO')
                  }
                }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar bg-slate-50/40">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                <ShoppingCart className="w-14 h-14 opacity-10" />
                <p className="font-semibold text-slate-500 text-sm">Cart is empty</p>
                <p className="text-xs text-center px-8 text-slate-400">Scan barcodes or click items to start billing. Press F2 to search.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cart.map(item => (
                  <div key={item.variantId} className="bg-white border border-slate-100 rounded-xl p-2.5 flex gap-2.5 items-start group shadow-xs hover:border-indigo-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 text-xs leading-tight mb-1 truncate">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-bold text-xs">৳{Number(item.sellingPrice).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.sku})</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8 shadow-inner">
                          <button onClick={() => updateQuantity(item.variantId, -1)} className="w-8 h-full flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-800 tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.variantId, 1)} className="w-8 h-full flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.variantId)} 
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Payment Actions */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.03)] relative z-20">
            <div className="space-y-2 mb-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-semibold text-slate-700 tabular-nums">৳{subtotal.toLocaleString()}</span>
              </div>

              {/* Discount / Round-off Adjustment (Editable & Quick Buttons) */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    ছাড় / ডিসকাউন্ট (Discount):
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-mono text-xs">৳</span>
                    <input 
                      type="number"
                      min="0"
                      max={subtotal}
                      value={cartDiscount === 0 ? '' : cartDiscount}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(subtotal, parseFloat(e.target.value) || 0))
                        setCartDiscount(val)
                      }}
                      placeholder="0"
                      className="w-16 px-1.5 py-0.5 text-right font-bold bg-white border border-slate-300 rounded text-amber-700 outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                    />
                  </div>
                </div>
                {/* Quick 2 taka / 5 taka discount presets */}
                <div className="flex items-center gap-1 justify-end pt-0.5">
                  <span className="text-[10px] text-slate-400 mr-0.5">Quick:</span>
                  <button 
                    type="button"
                    onClick={() => setCartDiscount(prev => Math.min(subtotal, prev + 2))}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
                    title="কাস্টমার ২ টাকা কম দিলে"
                  >
                    -৳2
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCartDiscount(prev => Math.min(subtotal, prev + 5))}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
                  >
                    -৳5
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const rem = subtotal % 10
                      setCartDiscount(rem > 0 ? rem : 0)
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
                    title="রাউন্ড অফ (শেষের টাকা বাদ দিন)"
                  >
                    Round
                  </button>
                  {cartDiscount > 0 && (
                    <button 
                      type="button"
                      onClick={() => setCartDiscount(0)}
                      className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-[10px] font-bold text-rose-600 hover:bg-rose-100"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-end pt-1.5 border-t border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] mb-0.5">Grand Total</span>
                <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">৳{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Button Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => {
                  setSplitCash(total.toString())
                  setSplitMobile("")
                  setSplitBank("")
                  setSplitBaki("")
                  setIsSplitModalOpen(true)
                  broadcastDisplayState('SHOW_PAYMENT_QR', true)
                }}
                disabled={isProcessing || cart.length === 0}
                className="h-14 bg-purple-50 border-2 border-purple-200 rounded-2xl font-bold text-purple-700 shadow-xs hover:bg-purple-100 disabled:opacity-50 transition-all flex flex-col items-center justify-center active:scale-[0.98]"
              >
                <Split className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] uppercase tracking-wider">Split (F8)</span>
              </button>

              <button 
                onClick={() => handleCheckout('CARD')} 
                disabled={isProcessing || cart.length === 0} 
                className="h-14 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all flex flex-col items-center justify-center active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4 mb-0.5 text-slate-500" />
                <span className="text-[10px] uppercase tracking-wider">Card/Bank</span>
              </button>

              <button 
                onClick={openCashModal} 
                disabled={isProcessing || cart.length === 0}
                className="h-14 bg-emerald-600 text-white rounded-2xl font-bold shadow-md shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-50 transition-all flex flex-col items-center justify-center relative overflow-hidden active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></span>
                  </span>
                ) : (
                  <>
                    <span className="text-base leading-none mb-0.5 tracking-tight font-black flex items-center gap-1">
                      <Banknote className="w-4 h-4" /> Pay Cash
                    </span>
                    <span className="text-[9px] uppercase tracking-wider opacity-90 font-mono">(F9)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Held Bills Drawer (F6) */}
      {isHeldDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-96 max-w-full bg-white h-full shadow-2xl flex flex-col p-5 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-lg">Held Bills / Carts</h3>
              </div>
              <button 
                onClick={() => setIsHeldDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
              {heldOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                  <PauseCircle className="w-12 h-12 opacity-20 mb-2" />
                  <p className="font-semibold text-slate-600">No Held Bills</p>
                  <p className="text-xs">Press F4 while billing to park active carts here.</p>
                </div>
              ) : (
                heldOrders.map((h: any) => (
                  <div key={h.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {h.holdNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mb-2 line-clamp-2">{h.note || 'No note'}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Items: {h.itemCount || h.items?.length || 0}</span>
                        <p className="text-sm font-black text-slate-900">৳{Number(h.total || 0).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => handleRecallOrder(h)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center"
                      >
                        Recall Bill <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hold Bill Modal (F4) */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-6 h-6 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-lg">Hold / Park Current Bill</h3>
              </div>
              <button onClick={() => setIsHoldModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Park this cart to attend to the next customer in line. You can recall it anytime by pressing F6.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Note / Customer Identification</label>
              <input 
                type="text" 
                placeholder="e.g. Customer checking ATM / brother bringing cash"
                value={holdNoteInput}
                onChange={(e) => setHoldNoteInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleHoldCart()
                }}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsHoldModalOpen(false)} 
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleHoldCart} 
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20"
              >
                Confirm Hold (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Payment Calculator Modal (F8) */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Split className="w-5 h-5" /> Split Tender Payment
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">Collect multi-method tenders (Cash + bKash + Card + Baki)</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-purple-200 block font-bold">Total Payable</span>
                <span className="text-2xl font-black tabular-nums">৳{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Tender Inputs */}
              <div className="grid grid-cols-2 gap-3">
                {/* Cash */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Banknote className="w-4 h-4 text-emerald-600" /> Cash (৳)
                  </label>
                  <input 
                    type="number"
                    placeholder="0"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="w-full text-base font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 outline-none tabular-nums"
                  />
                </div>

                {/* Mobile Banking */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Smartphone className="w-4 h-4 text-pink-600" /> bKash / Nagad (৳)
                  </label>
                  <input 
                    type="number"
                    placeholder="0"
                    value={splitMobile}
                    onChange={(e) => setSplitMobile(e.target.value)}
                    className="w-full text-base font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 outline-none tabular-nums"
                  />
                  <input 
                    type="text"
                    placeholder="TrxID (optional)"
                    value={splitMobileRef}
                    onChange={(e) => setSplitMobileRef(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 mt-1.5 outline-none"
                  />
                </div>

                {/* Card / Bank */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-4 h-4 text-blue-600" /> Card / Bank POS (৳)
                  </label>
                  <input 
                    type="number"
                    placeholder="0"
                    value={splitBank}
                    onChange={(e) => setSplitBank(e.target.value)}
                    className="w-full text-base font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 outline-none tabular-nums"
                  />
                </div>

                {/* Baki / Due */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Receipt className="w-4 h-4 text-amber-600" /> Baki / Due Ledger (৳)
                  </label>
                  <input 
                    type="number"
                    placeholder="0"
                    value={splitBaki}
                    onChange={(e) => setSplitBaki(e.target.value)}
                    className="w-full text-base font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 outline-none tabular-nums"
                  />
                  <input 
                    type="text"
                    placeholder="Customer Phone (for Taqada)"
                    value={splitCustomerPhone}
                    onChange={(e) => setSplitCustomerPhone(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 mt-1.5 outline-none"
                  />
                </div>
              </div>

              {/* Calculator Summary */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-purple-900 font-semibold">
                  <span>Total Tendered:</span>
                  <span className="tabular-nums font-bold">৳{totalTendered.toLocaleString()}</span>
                </div>
                {changeToReturn > 0 && (
                  <div className="flex justify-between text-sm font-black text-emerald-700 pt-1 border-t border-purple-200/60">
                    <span>Change to Return (ফেরত দিন):</span>
                    <span className="tabular-nums">৳{changeToReturn.toLocaleString()}</span>
                  </div>
                )}
                {remainingDue > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-purple-200/60">
                    <div className="flex justify-between text-sm font-black text-rose-700">
                      <span>Remaining Balance:</span>
                      <span className="tabular-nums">৳{remainingDue.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCartDiscount(prev => prev + remainingDue)
                        toast.success(`৳${remainingDue} ডিসকাউন্ট হিসেবে সমন্বয় করা হলো!`)
                      }}
                      className="self-end px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors"
                    >
                      ✓ Apply ৳{remainingDue} as Discount (ছাড় দিন)
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => {
                    setIsSplitModalOpen(false)
                    broadcastDisplayState('ACTIVE_BILLING', false)
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel (Esc)
                </button>
                <button 
                  onClick={handleSplitCheckout}
                  disabled={isProcessing || totalTendered < total}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 flex items-center"
                >
                  {isProcessing ? "Processing..." : "Complete Split Payment (Enter)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Tender & Change Modal (F9) */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Banknote className="w-6 h-6" /> নগদ ক্যাশ গ্রহণ (Cash Tender)
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">টাকার পরিমাণ এডিট করুন ও ফেরত হিসাব দেখুন</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-emerald-200 block font-bold">Total Bill</span>
                <span className="text-2xl font-black tabular-nums">৳{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Tender Amount Input */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <label className="text-xs font-black text-emerald-900 flex items-center justify-between mb-1.5">
                  <span>গ্রাহক কত টাকা দিয়েছেন? (Cash Received)</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">এডিটেবল</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xl font-bold text-emerald-700">৳</span>
                  <input 
                    type="number"
                    autoFocus
                    placeholder={total.toString()}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCashCheckoutConfirm()
                      }
                    }}
                    className="w-full text-2xl font-black bg-white border-2 border-emerald-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none tabular-nums"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setCashTendered(total.toString())}
                    className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    সঠিক: ৳{total}
                  </button>
                  {[50, 100, 500, 1000].filter(n => n >= total || total <= n * 1.5).map(note => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setCashTendered(note.toString())}
                      className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-100"
                    >
                      ৳{note}
                    </button>
                  ))}
                  {/* Quick 2 taka less button */}
                  {total > 2 && (
                    <button
                      type="button"
                      onClick={() => setCashTendered((total - 2).toString())}
                      className="px-2.5 py-1 bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 hover:bg-amber-200"
                      title="গ্রাহক ২ টাকা কম দিলে"
                    >
                      ২ টাকা কম (৳{total - 2})
                    </button>
                  )}
                </div>
              </div>

              {/* Status Calculations (Change to return OR Shortfall discount) */}
              {(() => {
                const tenderedNum = parseFloat(cashTendered) || 0
                if (tenderedNum > total) {
                  const change = tenderedNum - total
                  return (
                    <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl flex justify-between items-center text-emerald-950">
                      <div>
                        <span className="text-xs font-bold block">গ্রাহককে ফেরত দিন (Change to Return):</span>
                        <span className="text-[11px] text-emerald-700">ক্যাশ ড্রয়ার থেকে ফেরত দিন</span>
                      </div>
                      <span className="text-2xl font-black text-emerald-700 tabular-nums">৳{change.toLocaleString()}</span>
                    </div>
                  )
                }

                if (tenderedNum < total && tenderedNum > 0) {
                  const shortfall = total - tenderedNum
                  return (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-900">
                          গ্রাহক ৳{shortfall} কম দিয়েছেন:
                        </span>
                        <span className="text-sm font-black text-amber-700">৳{shortfall} কম</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCashShortfallMode('DISCOUNT')}
                          className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
                            cashShortfallMode === 'DISCOUNT'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          ✓ ছাড় দিন (Discount ৳{shortfall})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashShortfallMode('BAKI')}
                          className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
                            cashShortfallMode === 'BAKI'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          বাকি রাখুন (Due ৳{shortfall})
                        </button>
                      </div>

                      {cashShortfallMode === 'BAKI' && (
                        <input
                          type="text"
                          placeholder="কাস্টমার ফোন নম্বর (বাকি খাতার জন্য)"
                          value={cashBakiPhone}
                          onChange={(e) => setCashBakiPhone(e.target.value)}
                          className="w-full text-xs bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 outline-none mt-1"
                        />
                      )}
                    </div>
                  )
                }

                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-semibold text-slate-500">
                    সঠিক পরিমাণ টাকা গ্রহণ করা হচ্ছে
                  </div>
                )
              })()}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCashModalOpen(false)
                    broadcastDisplayState('ACTIVE_BILLING', false)
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  বাতিল (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleCashCheckoutConfirm}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isProcessing ? "সম্পন্ন হচ্ছে..." : "ক্যাশ বিক্রয় সম্পন্ন করুন (Enter)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


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

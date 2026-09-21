'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, Package, ArrowLeft, Trash2, Search } from 'lucide-react'

export default function NewPurchasePage() {
  const router = useRouter()
  
  const [suppliers, setSuppliers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([]) // Or Variants
  
  const [form, setForm] = useState({
    supplierId: '',
    warehouseId: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
  })
  
  const [lines, setLines] = useState<{variantId: string, quantity: number, unitCost: number, product: any, variant: any}[]>([])
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [suppRes, wareRes, prodRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/warehouses'),
        fetch('/api/products')
      ])
      
      if (suppRes.ok) setSuppliers(await suppRes.json())
      if (wareRes.ok) setWarehouses(await wareRes.json())
      if (prodRes.ok) {
        // Only get physical products, and flatten variants for easy selection
        const allProducts = await prodRes.json()
        const physicalProducts = allProducts.filter((p:any) => p.type === 'PRODUCT')
        const flatVariants = physicalProducts.flatMap((p:any) => 
          (p.variants || []).map((v:any) => ({ product: p, variant: v }))
        )
        setProducts(flatVariants)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddLine = (productVariant: any) => {
    const existing = lines.find(l => l.variantId === productVariant.variant.id)
    if (existing) {
      setLines(lines.map(l => l.variantId === productVariant.variant.id ? {...l, quantity: l.quantity + 1} : l))
    } else {
      setLines([...lines, {
        variantId: productVariant.variant.id,
        quantity: 1,
        unitCost: Number(productVariant.variant.costPrice || 0),
        product: productVariant.product,
        variant: productVariant.variant
      }])
    }
  }

  const handleUpdateLine = (variantId: string, field: string, value: number) => {
    setLines(lines.map(l => l.variantId === variantId ? {...l, [field]: value} : l))
  }

  const handleRemoveLine = (variantId: string) => {
    setLines(lines.filter(l => l.variantId !== variantId))
  }

  const handleSaveDraft = async () => {
    if (!form.supplierId || !form.warehouseId || lines.length === 0) {
      alert("Please select a supplier, warehouse, and add at least one item.")
      return
    }

    setLoading(true)
    try {
      const payload = {
        supplierId: form.supplierId,
        warehouseId: form.warehouseId,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        lines: lines.map(l => ({
          variantId: l.variantId,
          quantity: l.quantity,
          unitCost: l.unitCost
        }))
      }

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/admin/purchases/${data.id}`)
      } else {
        const err = await res.json()
        alert(err.message || "Failed to create purchase")
      }
    } catch (e) {
      console.error(e)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const subtotal = lines.reduce((sum, l) => sum + (l.quantity * l.unitCost), 0)

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Purchase Order</h1>
            <p className="text-slate-500 text-sm">Create a draft purchase order to receive inventory</p>
          </div>
        </div>
        <button 
          onClick={handleSaveDraft}
          disabled={loading}
          className="control-button-primary h-11 px-6 shadow-md disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save as Draft'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details & Cart */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="surface-elevated p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Supplier</label>
              <select 
                value={form.supplierId} 
                onChange={e => setForm({...form, supplierId: e.target.value})}
                className="control-input w-full h-10 mt-1 bg-white"
              >
                <option value="">Select Supplier...</option>
                {suppliers.filter((s:any) => s.status === 'ACTIVE').map((s:any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Destination Warehouse</label>
              <select 
                value={form.warehouseId} 
                onChange={e => setForm({...form, warehouseId: e.target.value})}
                className="control-input w-full h-10 mt-1 bg-white"
              >
                <option value="">Select Warehouse...</option>
                {warehouses.filter((w:any) => w.isActive).map((w:any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Purchase Date</label>
              <input 
                type="date" 
                value={form.purchaseDate}
                onChange={e => setForm({...form, purchaseDate: e.target.value})}
                className="control-input w-full h-10 mt-1"
              />
            </div>
          </div>

          <div className="surface-elevated p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-slate-400" /> Order Lines
            </h2>
            
            {lines.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-500">No items added to this purchase yet.</p>
                <p className="text-xs text-slate-400 mt-1">Select items from the product list on the right.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200/70">
                    <tr>
                      <th className="font-medium text-slate-500 px-4 py-3">Product (SKU)</th>
                      <th className="font-medium text-slate-500 px-4 py-3 text-right">Qty</th>
                      <th className="font-medium text-slate-500 px-4 py-3 text-right">Unit Cost</th>
                      <th className="font-medium text-slate-500 px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((l) => (
                      <tr key={l.variantId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">{l.product.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{l.variant.sku}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input 
                            type="number" 
                            min="1"
                            value={l.quantity}
                            onChange={e => handleUpdateLine(l.variantId, 'quantity', parseInt(e.target.value) || 1)}
                            className="control-input w-20 h-8 text-right"
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input 
                            type="number" 
                            min="0" step="0.01"
                            value={l.unitCost}
                            onChange={e => handleUpdateLine(l.variantId, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="control-input w-24 h-8 text-right"
                          />
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-900">
                          ৳{(l.quantity * l.unitCost).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => handleRemoveLine(l.variantId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {lines.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-slate-500 mb-1">Subtotal</div>
                  <div className="text-2xl font-bold text-slate-900">৳{subtotal.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Product Selector */}
        <div className="space-y-6">
          <div className="surface-elevated flex flex-col h-[calc(100vh-12rem)]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search products/SKU..."
                  className="control-input pl-9 w-full h-10 bg-white"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {products.map((item: any) => (
                  <button 
                    key={item.variant.id}
                    onClick={() => handleAddLine(item)}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group flex items-start justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{item.product.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.variant.sku}</div>
                      <div className="text-xs text-slate-400 mt-1">Curr WAC: ৳{item.variant.costPrice}</div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}

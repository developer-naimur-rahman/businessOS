"use client"
import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { api } from "../../../../lib/api-client"
import { 
  ArrowLeft, Save, Sparkles, TrendingUp, AlertTriangle, 
  CheckCircle2, DollarSign, Truck, ExternalLink, HelpCircle 
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminNewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'PRODUCT',
    costPrice: 0,
    sellingPrice: 0,
    isActive: true,
    imageUrl: '',
    categoryId: '',
    isDropship: false,
    supplierName: '',
    supplierUrl: '',
    supplierCost: 0,
    estimatedShippingCost: 0,
  })

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/business-core/categories')
        setCategories(res.data || [])
      } catch (err) {
        console.error("Failed to load categories", err)
      }
    }
    loadCategories()
  }, [])

  // Inline Profit Calculator Widget logic
  const profitAnalysis = useMemo(() => {
    const sp = Number(formData.sellingPrice) || 0
    const sc = Number(formData.supplierCost) || 0
    const ship = Number(formData.estimatedShippingCost) || 0
    const gatewayFeeRate = 0.015 // 1.5% payment gateway fee
    const gatewayFee = sp * gatewayFeeRate
    const totalCost = sc + ship + gatewayFee
    const netProfit = sp - totalCost
    const margin = sp > 0 ? (netProfit / sp) * 100 : 0
    const breakEven = (sc + ship) / (1 - gatewayFeeRate)
    const recPrice = (sc + ship) / (1 - gatewayFeeRate - 0.35)

    return {
      totalCost,
      gatewayFee,
      netProfit,
      margin,
      breakEven: Math.max(0, breakEven),
      recPrice: Math.max(0, recPrice),
    }
  }, [formData.sellingPrice, formData.supplierCost, formData.estimatedShippingCost])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("Please enter a product name")
      return
    }
    if (Number(formData.sellingPrice) <= 0) {
      toast.error("Please enter a valid selling price greater than 0")
      return
    }

    setLoading(true)
    try {
      const submitData: any = {
        ...formData,
        categoryId: formData.categoryId || null,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        supplierCost: formData.isDropship ? (Number(formData.supplierCost) || 0) : null,
        estimatedShippingCost: formData.isDropship ? (Number(formData.estimatedShippingCost) || 0) : null,
        supplierName: formData.isDropship ? (formData.supplierName?.trim() || null) : null,
        supplierUrl: formData.isDropship ? (formData.supplierUrl?.trim() || null) : null,
      }

      await api.post('/business-core/products', submitData)
      toast.success("Product created successfully with dropshipping metadata")
      router.push('/admin/products')
    } catch (err: any) {
      console.error("Failed to create product", err)
      toast.error(err.response?.data?.message || "Failed to create product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 bg-white rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Product</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure inventory, dropshipping sourcing, and profit analytics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="control-button-primary h-11 px-6 text-sm font-bold flex items-center shadow-md hover:shadow-lg gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? "Creating..." : "Save Product"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="surface-elevated p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            General Product Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Premium Magnetic Wireless Power Bank 10000mAh"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="control-input w-full text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                SKU / Item Code
              </label>
              <input
                type="text"
                placeholder="e.g. ELEC-PB-001"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                className="control-input w-full text-sm font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="control-input w-full text-sm bg-white"
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Product Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/images/product.jpg"
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                className="control-input w-full text-sm"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide a detailed description of the product features, specs, and guarantee..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="control-input w-full text-sm resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                Product is Active & Available for Sale
              </label>
            </div>
          </div>
        </div>

        {/* Pricing & Regular Cost */}
        <div className="surface-elevated p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Retail Pricing & Standard Cost</span>
            <span className="text-xs font-normal text-slate-500">All prices in BDT (৳)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Selling / Retail Price (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.sellingPrice || ''}
                  onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                  className="control-input w-full pl-8 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Internal Standard Cost Price (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice || ''}
                  onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  className="control-input w-full pl-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Dropshipping & Sourcing Section */}
        <div className="surface-elevated p-6 space-y-5 border-l-4 border-l-amber-500 bg-amber-50/10">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Dropshipping & Sourcing Intelligence
                </h2>
                <p className="text-xs text-slate-500">
                  Enable third-party supplier fulfillment and real-time margin analytics.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs">
              <input
                type="checkbox"
                id="isDropship"
                checked={formData.isDropship}
                onChange={e => setFormData({ ...formData, isDropship: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-amber-900">Is this a Dropship Product?</span>
            </label>
          </div>

          {formData.isDropship && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Supplier Name / Source
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AliExpress Seller / Daraz Wholesale / Taobao Agent"
                    value={formData.supplierName}
                    onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                    className="control-input w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Supplier Product Link (URL)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://aliexpress.com/item/100500..."
                      value={formData.supplierUrl}
                      onChange={e => setFormData({ ...formData, supplierUrl: e.target.value })}
                      className="control-input w-full text-sm pr-9"
                    />
                    {formData.supplierUrl && (
                      <a
                        href={formData.supplierUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                        title="Open Supplier Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Wholesale Sourcing Cost (৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.supplierCost || ''}
                      onChange={e => setFormData({ ...formData, supplierCost: parseFloat(e.target.value) || 0 })}
                      className="control-input w-full pl-8 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Estimated Shipping Cost (৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.estimatedShippingCost || ''}
                      onChange={e => setFormData({ ...formData, estimatedShippingCost: parseFloat(e.target.value) || 0 })}
                      className="control-input w-full pl-8 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Inline Profit Calculator Widget */}
              <div className="p-4 bg-gradient-to-br from-white to-amber-50/50 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Product Profit & Sourcing Cost Analyzer
                    </span>
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                    profitAnalysis.margin >= 30 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    profitAnalysis.margin > 0 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {profitAnalysis.margin >= 30 ? '🔥 High Margin' : profitAnalysis.margin > 0 ? '⚠️ Moderate Margin' : '🚨 Negative Margin'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Net Profit</p>
                    <p className={`text-base font-black mt-0.5 ${profitAnalysis.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ৳{profitAnalysis.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Per unit sold</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Profit Margin</p>
                    <p className={`text-base font-black mt-0.5 ${profitAnalysis.margin >= 25 ? 'text-emerald-700' : profitAnalysis.margin > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {profitAnalysis.margin.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Net margin rate</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Break-Even Price</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      ৳{profitAnalysis.breakEven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">At 1.5% gateway fee</p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                    <p className="text-[10px] uppercase font-bold text-emerald-800">Safe Target Price</p>
                    <p className="text-base font-black text-emerald-700 mt-0.5">
                      ৳{profitAnalysis.recPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Target 35% margin</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-amber-200/40">
                  <span>
                    Wholesale: ৳{(Number(formData.supplierCost) || 0).toLocaleString()} + Shipping: ৳{(Number(formData.estimatedShippingCost) || 0).toLocaleString()} + Gateway (1.5%): ৳{profitAnalysis.gatewayFee.toFixed(2)}
                  </span>
                  <span className="font-semibold text-slate-700">
                    Total Unit Cost: ৳{profitAnalysis.totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  <strong>Warehouse Inventory Bypass:</strong> Orders containing this item will not deduct local warehouse stock. The supplier order link will be provided directly in customer order fulfillment.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/products"
            className="control-button-secondary h-11 px-6 text-sm font-semibold flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="control-button-primary h-11 px-8 text-sm font-bold flex items-center shadow-md hover:shadow-lg gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Creating Product..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  )
}

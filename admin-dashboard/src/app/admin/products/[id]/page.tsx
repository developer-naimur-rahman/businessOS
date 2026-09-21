"use client"
import React, { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "../../../../lib/api-client"
import { 
  ArrowLeft, Package, Archive, Edit, Activity, Barcode, 
  Image as ImageIcon, Box, Layers, Tag, ChevronDown, Check
} from "lucide-react"
import { MediaImage } from "../../../../components/ui/media-image"
import { Modal } from "../../../../components/ui/modal"
import Link from "next/link"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit Variant Modal State
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<any>(null)
  const [variantForm, setVariantForm] = useState({
    sku: '', costPrice: 0, retailPrice: 0, posPrice: 0, isActive: true
  })

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/business-core/products/${productId}`)
      setProduct(res.data)
      
      if (res.data.media && res.data.media.length > 0) {
        setSelectedImage(res.data.media[0].assetUrl)
      }

      // Fetch inventory balances by productId
      const invRes = await api.get(`/inventory/balances`, { params: { productId } })
      setInventory(invRes.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleOpenVariantModal = (variant: any) => {
    setEditingVariant(variant)
    setVariantForm({
      sku: variant.sku || '',
      costPrice: Number(variant.costPrice || 0),
      retailPrice: Number(variant.retailPrice || 0),
      posPrice: Number(variant.posPrice || 0),
      isActive: variant.isActive
    })
    setIsVariantModalOpen(true)
  }

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.patch(`/business-core/variants/${editingVariant.id}`, variantForm)
      setIsVariantModalOpen(false)
      fetchProduct()
    } catch (err) {
      alert("Failed to save variant")
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this product? This action cannot be fully undone.')) return
    try {
      await api.delete(`/business-core/products/${productId}`)
      router.push('/admin/products')
    } catch (err) {
      alert("Failed to archive product")
    }
  }

  // Calculate total inventory
  const inventoryByVariant = useMemo(() => {
    const map = new Map<string, any[]>()
    inventory.forEach(inv => {
      if (!map.has(inv.variantId)) map.set(inv.variantId, [])
      map.get(inv.variantId)!.push(inv)
    })
    return map
  }, [inventory])

  if (loading) {
    return (
      <div className="flex flex-col space-y-8 animate-pulse">
        <div className="h-12 w-1/3 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-200 rounded-xl"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 mb-6">{error || "The product you're looking for doesn't exist or you don't have access."}</p>
        <Link href="/admin/products" className="control-button-primary h-10 px-6">
          Back to Catalog
        </Link>
      </div>
    )
  }

  const allBarcodes = product.variants?.flatMap((v: any) => v.barcodes || []) || []

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin/products" className="mt-1 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                product.isActive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {product.type}
              </span>
            </div>
            <p className="text-slate-500 font-mono text-sm">{product.code || 'NO-CODE'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleArchive} className="control-button-secondary h-10 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200">
            <Archive className="w-4 h-4 mr-2" /> Archive
          </button>
          <button className="control-button-primary shadow-sm h-10 px-4">
            <Edit className="w-4 h-4 mr-2" /> Edit Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Overview, Media, Variants) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Media Gallery */}
          <div className="surface-elevated p-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2 text-slate-400" /> Media Gallery
            </h3>
            
            {product.media && product.media.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image with Hover Zoom on Desktop */}
                <div 
                  className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200/50 flex items-center justify-center cursor-zoom-in group"
                  onMouseEnter={() => setIsHoveringImage(true)}
                  onMouseLeave={() => setIsHoveringImage(false)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    setMousePos({ x, y })
                  }}
                >
                  <MediaImage 
                    fallbackUrl={selectedImage || ''}
                    asset={null}
                    className={`max-w-full max-h-full object-contain transition-transform duration-200 ${isHoveringImage ? 'scale-150' : 'scale-100'}`}
                    style={isHoveringImage ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : {}}
                  />
                </div>
                {/* Thumbnails */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {product.media.map((m: any) => (
                    <button 
                      key={m.id}
                      onClick={() => setSelectedImage(m.assetUrl)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === m.assetUrl ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <MediaImage asset={null} fallbackUrl={m.assetUrl} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No media attached to this product.</p>
              </div>
            )}
          </div>

          {/* Variants Table */}
          <div className="surface-elevated overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center">
                <Layers className="w-4 h-4 mr-2 text-slate-400" /> Variants
              </h3>
            </div>
            
            {product.variants && product.variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200/70">
                    <tr>
                      <th className="font-medium text-slate-500 px-6 py-3">SKU</th>
                      <th className="font-medium text-slate-500 px-6 py-3">Attributes</th>
                      <th className="font-medium text-slate-500 px-6 py-3 text-right">Cost</th>
                      <th className="font-medium text-slate-500 px-6 py-3 text-right">Price</th>
                      <th className="font-medium text-slate-500 px-6 py-3 text-right">Stock</th>
                      <th className="font-medium text-slate-500 px-6 py-3 text-center">Status</th>
                      <th className="font-medium text-slate-500 px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.variants.map((variant: any) => {
                      const stockRecords = inventoryByVariant.get(variant.id) || []
                      const totalStock = stockRecords.reduce((sum, r) => sum + Number(r.quantity), 0)
                      
                      return (
                        <tr key={variant.id} className="table-row-refined group hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono text-slate-900">{variant.sku}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {variant.attributes && variant.attributes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {variant.attributes.map((attr: any) => (
                                  <span key={attr.attributeValue.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                    {attr.attributeValue.attribute?.name}: {attr.attributeValue.value}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Default</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums text-slate-600">
                            ৳{Number(variant.costPrice || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums font-medium text-slate-900">
                            ৳{Number(variant.retailPrice || product.sellingPrice).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums">
                            {product.type === 'SERVICE' ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <span className={`font-semibold ${totalStock > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {totalStock}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              variant.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {variant.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleOpenVariantModal(variant)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-500">No variants exist for this product.</p>
              </div>
            )}
          </div>

          {/* Barcodes Section */}
          <div className="surface-elevated p-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <Barcode className="w-4 h-4 mr-2 text-slate-400" /> Barcodes
            </h3>
            {allBarcodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allBarcodes.map((bc: any) => (
                  <div key={bc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="font-mono text-sm text-slate-900">{bc.barcode}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{product.variants?.find((v:any) => v.id === bc.variantId)?.sku || 'Variant'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-sm">
                No barcodes assigned to any variants.
              </div>
            )}
          </div>

        </div>
        
        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Overview */}
          <div className="surface-elevated p-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <Package className="w-4 h-4 mr-2 text-slate-400" /> Overview
            </h3>
            
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500 mb-1">Category</dt>
                <dd className="font-medium text-slate-900">{product.category?.name || 'Uncategorized'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Unit</dt>
                <dd className="font-medium text-slate-900">{product.unit?.name || 'Pieces'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Description</dt>
                <dd className="text-slate-700 leading-relaxed">{product.description || 'No description provided.'}</dd>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <dt className="text-slate-500 mb-2">Visibility</dt>
                <dd className="space-y-2">
                  <div className="flex items-center text-slate-700">
                    <Check className={`w-4 h-4 mr-2 ${product.isOnlineVisible ? 'text-emerald-500' : 'text-slate-300'}`} />
                    Online Storefront
                  </div>
                  <div className="flex items-center text-slate-700">
                    <Check className={`w-4 h-4 mr-2 ${product.isPosVisible ? 'text-emerald-500' : 'text-slate-300'}`} />
                    Point of Sale (POS)
                  </div>
                </dd>
              </div>
            </dl>
          </div>

          {/* Inventory Breakdown */}
          {product.type === 'PRODUCT' && (
            <div className="surface-elevated p-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                <Box className="w-4 h-4 mr-2 text-slate-400" /> Inventory Summary
              </h3>
              
              {inventory.length > 0 ? (
                <div className="space-y-4">
                  {/* Group inventory by warehouse */}
                  {Array.from(inventory.reduce((map, inv) => {
                    const wName = inv.warehouse?.name || inv.warehouseId || 'Unknown Warehouse'
                    if (!map.has(wName)) map.set(wName, 0)
                    map.set(wName, map.get(wName) + Number(inv.quantity))
                    return map
                  }, new Map<string, number>()).entries()).map((entry: any, idx: number) => {
                    const wName = entry[0]
                    const qty = entry[1]
                    return (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-600">{wName}</span>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">{qty}</span>
                    </div>
                  )})}
                  <div className="pt-2 flex items-center justify-between font-bold text-slate-900">
                    <span>Total Stock</span>
                    <span className="tabular-nums">
                      {inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500 text-sm">
                  Inventory data unavailable or 0 stock across all warehouses.
                </div>
              )}
            </div>
          )}

          {/* Sales/Activity Placeholder */}
          <div className="surface-elevated p-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-slate-400" /> Sales & Activity
            </h3>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 text-center">
              <Tag className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Coming in Phase 4</p>
              <p className="text-xs text-slate-500 mt-1">Detailed sales analytics and movement history will be available here.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Variant Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title="Edit Variant"
        footer={
          <>
            <button onClick={() => setIsVariantModalOpen(false)} className="control-button-secondary h-10 px-4">Cancel</button>
            <button onClick={handleSaveVariant} className="control-button-primary h-10 px-6">Save</button>
          </>
        }
      >
        <form onSubmit={handleSaveVariant} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">SKU</label>
            <input required value={variantForm.sku} onChange={e => setVariantForm({...variantForm, sku: e.target.value})} type="text" className="control-input w-full h-10 mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Cost Price</label>
              <input disabled type="number" value={variantForm.costPrice} className="control-input w-full h-10 mt-1 bg-slate-50 text-slate-500 cursor-not-allowed" title="Cost Price (WAC) is managed by the system via Purchases." />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Retail Price</label>
              <input required type="number" min="0" step="0.01" value={variantForm.retailPrice} onChange={e => setVariantForm({...variantForm, retailPrice: parseFloat(e.target.value) || 0})} className="control-input w-full h-10 mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">POS Price</label>
            <input required type="number" min="0" step="0.01" value={variantForm.posPrice} onChange={e => setVariantForm({...variantForm, posPrice: parseFloat(e.target.value) || 0})} className="control-input w-full h-10 mt-1" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="vIsActive" checked={variantForm.isActive} onChange={e => setVariantForm({...variantForm, isActive: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
            <label htmlFor="vIsActive" className="text-sm font-medium text-slate-700">Active</label>
          </div>
        </form>
      </Modal>

    </div>
  )
}

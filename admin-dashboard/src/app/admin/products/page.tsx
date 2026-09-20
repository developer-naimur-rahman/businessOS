"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Plus, Search, Filter, MoreHorizontal, Package, Edit, Trash2 } from "lucide-react"
import { MediaImage } from "../../../components/ui/media-image"
import { Modal } from "../../../components/ui/modal"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', type: 'PRODUCT', 
    costPrice: 0, sellingPrice: 0, isActive: true, imageUrl: ''
  })

  const fetchProducts = async () => {
    try {
      const res = await api.get('/business-core/products')
      setProducts(res.data)
    } catch (err) {
      console.error("Failed to load products", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleOpenModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        code: product.code || '',
        description: product.description || '',
        type: product.type,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        isActive: product.isActive,
        imageUrl: product.imageUrl || ''
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '', code: '', description: '', type: 'PRODUCT', 
        costPrice: 0, sellingPrice: 0, isActive: true, imageUrl: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await api.put(`/business-core/products/${editingProduct.id}`, formData)
      } else {
        await api.post('/business-core/products', formData)
      }
      setIsModalOpen(false)
      fetchProducts()
    } catch (err) {
      alert("Failed to save product")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Products</h1>
          <p className="text-slate-500">Manage your catalog, pricing, and classifications.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenModal()} className="control-button-primary shadow-sm h-10 px-4">
            <Plus className="w-4 h-4 mr-2" /> New Product
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="control-input pl-9 h-10 w-full"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="control-button-secondary h-10 px-3 w-full md:w-auto">
            <Filter className="w-4 h-4 mr-2 text-slate-500" /> Filter
          </button>
        </div>
      </div>



      {/* Products Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-medium text-slate-500 px-4 py-3 w-12"></th>
                <th className="font-medium text-slate-500 px-4 py-3">Product Name</th>
                <th className="font-medium text-slate-500 px-4 py-3">Category</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right">Selling Price</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-center">Status</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading catalog...</td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No products found</p>
                    <p className="text-slate-400 text-sm">Create your first product to get started.</p>
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="table-row-refined group">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200/50">
                        <MediaImage 
                          asset={null} 
                          fallbackUrl={product.imageUrl || "https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=100&auto=format&fit=crop"} 
                          className="w-full h-full object-cover mix-blend-multiply opacity-50"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{product.code || 'NO-SKU'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{product.category?.name || 'Uncategorized'}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                      ৳{Number(product.sellingPrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        product.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(product)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "New Product"}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="control-button-secondary h-10 px-4">Cancel</button>
            <button onClick={handleSubmit} className="control-button-primary h-10 px-6">Save</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Product Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="control-input w-full h-10 mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">SKU / Code</label>
              <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} type="text" className="control-input w-full h-10 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Image URL</label>
              <input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} type="text" className="control-input w-full h-10 mt-1" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Type</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="control-input w-full h-10 mt-1">
              <option value="PRODUCT">Product (Physical)</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Cost Price</label>
              <input required type="number" min="0" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})} className="control-input w-full h-10 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Selling Price</label>
              <input required type="number" min="0" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: parseFloat(e.target.value) || 0})} className="control-input w-full h-10 mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="control-input w-full h-24 mt-1 py-2 resize-none" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active (Visible in Catalog)</label>
          </div>
        </form>
      </Modal>

    </div>
  )
}

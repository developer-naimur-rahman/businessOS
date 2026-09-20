"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Plus, Search, Filter, MoreHorizontal, Truck, Phone, Mail, Edit } from "lucide-react"
import { Modal } from "../../../components/ui/modal"

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', code: '', phone: '', email: '', address: '', status: 'ACTIVE' })

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/business-core/suppliers')
      setSuppliers(res.data)
    } catch (err) {
      console.error("Failed to load suppliers", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleOpenModal = (supplier: any = null) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        code: supplier.code || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        status: supplier.status || 'ACTIVE'
      })
    } else {
      setEditingSupplier(null)
      setFormData({ name: '', code: '', phone: '', email: '', address: '', status: 'ACTIVE' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        await api.put(`/business-core/suppliers/${editingSupplier.id}`, formData)
      } else {
        await api.post('/business-core/suppliers', formData)
      }
      setIsModalOpen(false)
      fetchSuppliers()
    } catch (err) {
      alert("Failed to save supplier")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Suppliers</h1>
          <p className="text-slate-500">Manage vendor relationships and procurement contacts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenModal()} className="control-button-primary shadow-sm h-10 px-4">
            <Plus className="w-4 h-4 mr-2" /> New Supplier
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
            className="control-input pl-9 h-10 w-full"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-medium text-slate-500 px-4 py-3">Vendor</th>
                <th className="font-medium text-slate-500 px-4 py-3">Contact Details</th>
                <th className="font-medium text-slate-500 px-4 py-3">Location</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-center">Status</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading suppliers...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No suppliers found</p>
                    <p className="text-slate-400 text-sm">Add a supplier to manage your procurement channels.</p>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier: any) => (
                  <tr key={supplier.id} className="table-row-refined group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-semibold border border-slate-200/50">
                          <Truck className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{supplier.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{supplier.code || 'NO-ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center text-slate-600 text-xs">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center text-slate-600 text-xs">
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {supplier.email}
                          </div>
                        )}
                        {!supplier.phone && !supplier.email && (
                          <span className="text-slate-400 text-xs">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="line-clamp-2 max-w-[200px]">
                        {supplier.address || <span className="text-slate-400">Not provided</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        supplier.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(supplier)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
        title={editingSupplier ? "Edit Supplier" : "New Supplier"}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="control-button-secondary h-10 px-4">Cancel</button>
            <button onClick={handleSubmit} className="control-button-primary h-10 px-6">Save</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Vendor Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="control-input w-full h-10 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Vendor Code</label>
              <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} type="text" className="control-input w-full h-10 mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Phone</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="tel" className="control-input w-full h-10 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Email</label>
              <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="control-input w-full h-10 mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Address</label>
            <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="control-input w-full h-20 mt-1 py-2 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="control-input w-full h-10 mt-1">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}

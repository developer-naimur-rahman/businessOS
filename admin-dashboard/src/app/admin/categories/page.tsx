"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Plus, Search, MoreHorizontal, FolderTree, Edit } from "lucide-react"
import { Modal } from "../../../components/ui/modal"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  const fetchCategories = async () => {
    try {
      const res = await api.get('/business-core/categories?type=PRODUCT')
      setCategories(res.data)
    } catch (err) {
      console.error("Failed to load categories", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleOpenModal = (category: any = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || ''
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSave = { ...formData, type: 'PRODUCT' }
      if (editingCategory) {
        await api.put(`/business-core/categories/${editingCategory.id}`, dataToSave)
      } else {
        await api.post('/business-core/categories', dataToSave)
      }
      setIsModalOpen(false)
      fetchCategories()
    } catch (err) {
      alert("Failed to save category")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FolderTree className="w-8 h-8 text-indigo-500" />
            Store Categories
          </h1>
          <p className="text-slate-400 mt-2">Manage your product catalog structure taxonomy.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenModal()} className="control-button-primary shadow-sm h-10 px-4">
            <Plus className="w-4 h-4 mr-2" /> New Category
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search categories..." 
            className="control-input pl-9 h-10 w-full"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-medium text-slate-500 px-4 py-3">Category Name</th>
                <th className="font-medium text-slate-500 px-4 py-3">Description</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading categories...</td></tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No categories found</p>
                    <p className="text-slate-400 text-sm">Create categories to group your products.</p>
                  </td>
                </tr>
              ) : (
                categories.map((category: any) => (
                  <tr key={category.id} className="table-row-refined group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
                          <FolderTree className="w-4 h-4" />
                        </div>
                        <p className="font-semibold text-slate-900">{category.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {category.description || <span className="text-slate-400">No description</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(category)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
        title={editingCategory ? "Edit Category" : "New Category"}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="control-button-secondary h-10 px-4">Cancel</button>
            <button onClick={handleSubmit} className="control-button-primary h-10 px-6">Save</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Category Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="control-input w-full h-10 mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="control-input w-full h-24 mt-1 py-2 resize-none" />
          </div>
        </form>
      </Modal>
    </div>
  )
}

"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Plus, Search, Filter, MoreHorizontal, UserCircle2, Phone, Mail, Edit } from "lucide-react"
import { Modal } from "../../../components/ui/modal"

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', code: '', phone: '', email: '', address: '', status: 'ACTIVE' })

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/business-core/customers')
      setCustomers(res.data)
    } catch (err) {
      console.error("Failed to load customers", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleOpenModal = (customer: any = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        code: customer.code || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        status: customer.status || 'ACTIVE'
      })
    } else {
      setEditingCustomer(null)
      setFormData({ name: '', code: '', phone: '', email: '', address: '', status: 'ACTIVE' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await api.put(`/business-core/customers/${editingCustomer.id}`, formData)
      } else {
        await api.post('/business-core/customers', formData)
      }
      setIsModalOpen(false)
      fetchCustomers()
    } catch (err) {
      alert("Failed to save customer")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Customers</h1>
          <p className="text-slate-500">Manage client relationships and contact information.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenModal()} className="control-button-primary shadow-sm h-10 px-4">
            <Plus className="w-4 h-4 mr-2" /> New Customer
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name, phone or email..." 
            className="control-input pl-9 h-10 w-full"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="control-button-secondary h-10 px-3 w-full md:w-auto">
            <Filter className="w-4 h-4 mr-2 text-slate-500" /> Filter
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-medium text-slate-500 px-4 py-3">Customer Profile</th>
                <th className="font-medium text-slate-500 px-4 py-3">Contact</th>
                <th className="font-medium text-slate-500 px-4 py-3">Location</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-center">Status</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <UserCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No customers found</p>
                    <p className="text-slate-400 text-sm">Add a customer to start tracking client history.</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer: any) => (
                  <tr key={customer.id} className="table-row-refined group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold border border-slate-200/50">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{customer.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{customer.code || 'NO-ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center text-slate-600 text-xs">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center text-slate-600 text-xs">
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {customer.email}
                          </div>
                        )}
                        {!customer.phone && !customer.email && (
                          <span className="text-slate-400 text-xs">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="line-clamp-2 max-w-[200px]">
                        {customer.address || <span className="text-slate-400">Not provided</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        customer.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(customer)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
        title={editingCustomer ? "Edit Customer" : "New Customer"}
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
              <label className="text-xs font-semibold text-slate-700 uppercase">Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="control-input w-full h-10 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Customer ID / Code</label>
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

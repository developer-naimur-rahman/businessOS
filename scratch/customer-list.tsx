"use client"
import React, { useEffect, useState, useMemo } from "react"
import { api } from "../../../lib/api-client"
import { Plus, Search, Filter, UserCircle2, Phone, Mail, Edit, Building2, Eye, MapPin, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Modal } from "../../../components/ui/modal"
import { useRouter } from "next/navigation"

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount)
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterDue, setFilterDue] = useState('ALL')

  const defaultForm = { 
    name: '', phone: '', email: '', address: '', city: '', country: '',
    customerType: 'INDIVIDUAL', companyName: '', taxId: '', avatarUrl: ''
  }
  const [formData, setFormData] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

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
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || '',
        customerType: customer.customerType || 'INDIVIDUAL',
        companyName: customer.companyName || '',
        taxId: customer.taxId || '',
        avatarUrl: customer.avatarUrl || ''
      })
    } else {
      setEditingCustomer(null)
      setFormData(defaultForm)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCustomer) {
        await api.put(`/business-core/customers/${editingCustomer.id}`, formData)
      } else {
        await api.post('/business-core/customers', formData)
      }
      setIsModalOpen(false)
      fetchCustomers()
    } catch (err) {
      console.error("Failed to save customer", err)
      alert("Failed to save customer")
    } finally {
      setSaving(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'ALL' || c.customerType === filterType;
      const matchesDue = filterDue === 'ALL' || 
                         (filterDue === 'HAS_DUE' ? c.outstandingBalance > 0 : c.outstandingBalance === 0);

      return matchesSearch && matchesType && matchesDue;
    });
  }, [customers, searchTerm, filterType, filterDue])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your customer relationships and balances.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, phone, email, or company..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm font-medium text-slate-700"
            >
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
            <select 
              value={filterDue}
              onChange={(e) => setFilterDue(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm font-medium text-slate-700"
            >
              <option value="ALL">All Balances</option>
              <option value="HAS_DUE">Has Due</option>
              <option value="NO_DUE">No Due</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCircle2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No customers found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">We couldn't find any customers matching your search and filter criteria.</p>
              {(searchTerm || filterType !== 'ALL' || filterDue !== 'ALL') && (
                <button onClick={() => { setSearchTerm(''); setFilterType('ALL'); setFilterDue('ALL') }} className="mt-4 text-blue-600 font-medium hover:underline">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200/80">
                <tr>
                  <th className="font-semibold text-slate-600 px-6 py-4">Customer</th>
                  <th className="font-semibold text-slate-600 px-6 py-4">Contact Info</th>
                  <th className="font-semibold text-slate-600 px-6 py-4">Location</th>
                  <th className="font-semibold text-slate-600 px-6 py-4 text-right">Total Spent</th>
                  <th className="font-semibold text-slate-600 px-6 py-4 text-right">Outstanding Due</th>
                  <th className="font-semibold text-slate-600 px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => {
                  const initials = (customer.name || '?').substring(0, 2).toUpperCase()
                  const isBusiness = customer.customerType === 'BUSINESS'
                  
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {customer.avatarUrl ? (
                              <img src={customer.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-slate-500 text-xs">{initials}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {customer.name}
                              {isBusiness && <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100">B2B</span>}
                            </div>
                            {isBusiness && customer.companyName && (
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3" /> {customer.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {customer.phone ? (
                            <div className="flex items-center gap-2 text-slate-700 text-xs">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}
                            </div>
                          ) : <span className="text-xs text-slate-400 italic">No phone</span>}
                          
                          {customer.email && (
                            <div className="flex items-center gap-2 text-slate-700 text-xs">
                              <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {customer.city || customer.country ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {[customer.city, customer.country].filter(Boolean).join(', ')}
                          </div>
                        ) : <span className="text-slate-400 italic">Unspecified</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {formatMoney(customer.totalSpent || 0)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {customer.outstandingBalance > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-bold text-rose-600">{formatMoney(customer.outstandingBalance)}</span>
                            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Unpaid</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">৳0</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => router.push(`/admin/customers/${customer.id}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(customer)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit Customer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !saving && setIsModalOpen(false)} title={editingCustomer ? "Edit Customer Profile" : "Add New Customer"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Basic Info</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Type</label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button type="button" onClick={() => setFormData({...formData, customerType: 'INDIVIDUAL'})} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.customerType === 'INDIVIDUAL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Individual</button>
                  <button type="button" onClick={() => setFormData({...formData, customerType: 'BUSINESS'})} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.customerType === 'BUSINESS' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Business</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="John Doe" />
              </div>

              {formData.customerType === 'BUSINESS' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name *</label>
                    <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Acme Corp" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tax ID / BIN</label>
                    <input type="text" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Optional" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Avatar URL</label>
                <input type="url" value={formData.avatarUrl} onChange={e => setFormData({...formData, avatarUrl: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" placeholder="https://..." />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Contact & Location</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone *</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="017..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Optional" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Street Address</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="123 Main St" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Dhaka" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                  <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Bangladesh" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
              {saving ? "Saving..." : editingCustomer ? "Save Changes" : "Create Customer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

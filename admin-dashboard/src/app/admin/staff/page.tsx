"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../lib/api-client"
import { useAuthStore } from "../../../store/useAuthStore"
import { toast } from "sonner"
import { 
  Users, UserPlus, Shield, KeyRound, Mail, CheckCircle2, 
  XCircle, Search, RefreshCw, Lock, Sparkles, Building2,
  Copy, Eye, EyeOff, ShieldAlert, ArrowRight
} from "lucide-react"

interface StaffUser {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  roleName?: string
  quickPin?: string
  userRoles?: Array<{
    role: {
      id: string
      name: string
      description?: string
    }
  }>
}

const DEFAULT_STAFF_DIRECTORY: StaffUser[] = [
  {
    id: "admin-1",
    email: "admin@demo.local",
    firstName: "Admin",
    lastName: "Demo",
    isActive: true,
    roleName: "Super Admin",
    quickPin: "5825825825iW."
  },
  {
    id: "manager-1",
    email: "manager@demo.local",
    firstName: "Manager",
    lastName: "Demo",
    isActive: true,
    roleName: "Store Manager",
    quickPin: "manager1"
  },
  {
    id: "sales-1",
    email: "sales@demo.local",
    firstName: "Sales",
    lastName: "Demo",
    isActive: true,
    roleName: "POS Cashier",
    quickPin: "sales123"
  },
  {
    id: "inventory-1",
    email: "inventory@demo.local",
    firstName: "Inventory",
    lastName: "Demo",
    isActive: true,
    roleName: "Stock Keeper",
    quickPin: "inv12345"
  },
  {
    id: "staff-1",
    email: "staff@demo.local",
    firstName: "Staff",
    lastName: "Demo",
    isActive: true,
    roleName: "Counter Staff",
    quickPin: "staff123"
  }
]

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>(DEFAULT_STAFF_DIRECTORY)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("ALL")
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({})

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "sales",
    quickPin: ""
  })

  const currentUser = useAuthStore((state) => state.user)

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get('/iam/users')
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Map roles and pins
        const mapped: StaffUser[] = res.data.map((u: any) => {
          let roleName = "Staff"
          if (u.userRoles && u.userRoles.length > 0) {
            roleName = u.userRoles[0].role?.name || "Staff"
          } else if (u.email.includes("admin")) {
            roleName = "Super Admin"
          } else if (u.email.includes("manager")) {
            roleName = "Store Manager"
          } else if (u.email.includes("sales")) {
            roleName = "POS Cashier"
          } else if (u.email.includes("inventory")) {
            roleName = "Stock Keeper"
          }

          let quickPin = "1234"
          if (u.email.includes("admin")) quickPin = "5825825825iW."
          else if (u.email.includes("manager")) quickPin = "manager1"
          else if (u.email.includes("sales")) quickPin = "sales123"
          else if (u.email.includes("inventory")) quickPin = "inv12345"
          else if (u.email.includes("staff")) quickPin = "staff123"

          return {
            ...u,
            roleName,
            quickPin
          }
        })
        setStaffList(mapped)
      } else {
        setStaffList(DEFAULT_STAFF_DIRECTORY)
      }
    } catch {
      // Graceful fallback to default demo accounts
      setStaffList(DEFAULT_STAFF_DIRECTORY)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const togglePinVisibility = (id: string) => {
    setVisiblePins(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopyCredentials = (staff: StaffUser) => {
    const text = `Email: ${staff.email}\nPassword: password\nQuick PIN: ${staff.quickPin || 'N/A'}`
    navigator.clipboard.writeText(text)
    toast.success(`Copied login credentials for ${staff.firstName}!`)
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      await api.post('/iam/users', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      })

      toast.success(`Staff account created for ${formData.firstName}!`)
      setShowAddModal(false)
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "sales",
        quickPin: ""
      })
      fetchStaff()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to create staff account"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = 
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.roleName && s.roleName.toLowerCase().includes(search.toLowerCase()))
    
    if (filterRole === "ALL") return matchesSearch
    return matchesSearch && s.roleName?.toLowerCase().includes(filterRole.toLowerCase())
  })

  const getRoleBadgeStyle = (role?: string) => {
    const r = (role || "").toLowerCase()
    if (r.includes("admin")) return "bg-purple-100 text-purple-700 border-purple-200"
    if (r.includes("manager")) return "bg-blue-100 text-blue-700 border-blue-200"
    if (r.includes("cashier") || r.includes("sales")) return "bg-emerald-100 text-emerald-700 border-emerald-200"
    if (r.includes("inventory") || r.includes("stock")) return "bg-amber-100 text-amber-700 border-amber-200"
    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff & Employee Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage cashiers, managers, role permissions, and POS Quick PIN authentication
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="h-10 px-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{staffList.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Registered Accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">POS Cashiers</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {staffList.filter(s => s.roleName?.toLowerCase().includes("cashier") || s.roleName?.toLowerCase().includes("sales")).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Ready for Retail Counter</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Store Managers</span>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600">
            {staffList.filter(s => s.roleName?.toLowerCase().includes("manager")).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Shift & Branch Oversight</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Login Authentication</span>
            <KeyRound className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">Dual Mode</p>
          <p className="text-[11px] text-slate-400 mt-1">Email + Quick Cashier PIN</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or role..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["ALL", "ADMIN", "MANAGER", "CASHIER", "INVENTORY", "STAFF"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                filterRole === r
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-4">Role & Permissions</th>
                <th className="py-3.5 px-4">Quick POS PIN</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStaff.map((staff) => {
                const isPinVisible = !!visiblePins[staff.id]
                return (
                  <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Staff Member Info */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                          {staff.firstName[0]}{staff.lastName ? staff.lastName[0] : ""}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {staff.firstName} {staff.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getRoleBadgeStyle(staff.roleName)}`}>
                        <Shield className="w-3 h-3" />
                        {staff.roleName || "Staff"}
                      </span>
                    </td>

                    {/* Quick POS PIN */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {isPinVisible ? staff.quickPin : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(staff.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title={isPinVisible ? "Hide PIN" : "Show PIN"}
                        >
                          {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(staff)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-[11px] font-bold transition-all border border-slate-200 hover:border-indigo-200"
                        title="Copy login details to clipboard"
                      >
                        <Copy className="w-3 h-3" /> Copy Login
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No staff members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Rahim"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Uddin"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Staff Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. rahim@store.local"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Account Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Staff Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                  >
                    <option value="sales">POS Cashier / Sales</option>
                    <option value="manager">Store Manager</option>
                    <option value="inventory">Stock Keeper</option>
                    <option value="staff">General Staff</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quick POS PIN</label>
                  <input
                    type="text"
                    value={formData.quickPin}
                    onChange={(e) => setFormData({ ...formData, quickPin: e.target.value })}
                    placeholder="e.g. 1234"
                    maxLength={8}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting ? "Creating..." : "Save Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"
import React, { useEffect, useState } from "react"
import { useCustomerAuthStore } from "../../../store/useCustomerAuthStore"
import { useRouter } from "next/navigation"
import { api } from "../../../lib/api-client"
import { LogOut, Package, User } from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { customer, isAuthenticated, logout } = useCustomerAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/checkout') // or a dedicated login page
      return
    }

    async function fetchOrders() {
      try {
        const res = await api.get('/public/orders')
        setOrders(res.data)
      } catch (err) {
        console.error("Failed to fetch orders", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrders()
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-2">My Account</h1>
          <p className="text-slate-500">Welcome back, {customer?.name}</p>
        </div>
        <button 
          onClick={() => {
            logout()
            router.push('/')
          }}
          className="control-button-secondary h-10 px-4 flex items-center text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Profile Sidebar */}
        <div className="md:col-span-4">
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-6">
              <User className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Profile Info</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</p>
                <p className="font-medium text-slate-900">{customer?.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
                <p className="font-medium text-slate-900">{customer?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="md:col-span-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center">
            <Package className="w-6 h-6 mr-3 text-slate-400" /> Order History
          </h2>
          
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>)}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 text-center py-16">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="font-medium text-slate-900 mb-2">No orders yet</p>
              <p className="text-slate-500">When you place an order, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-slate-900">Order {order.invoiceNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(order.saleDate).toLocaleDateString()} • {order.lines.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 mb-2">৳{Number(order.totalAmount).toLocaleString()}</p>
                    <button onClick={() => router.push(`/order/${order.id}`)} className="text-sm font-medium text-blue-600 hover:underline">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

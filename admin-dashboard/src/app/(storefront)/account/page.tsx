"use client"
import React, { useEffect, useState } from "react"
import { useCustomerAuthStore } from "../../../store/useCustomerAuthStore"
import { useRouter } from "next/navigation"
import { api } from "../../../lib/api-client"
import { LogOut, Package, User } from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { customer, isAuthenticated, login, logout } = useCustomerAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError("")
    try {
      if (authMode === 'login') {
        const res = await api.post('/public/auth/login', { email, password })
        login(res.data.access_token, res.data.customer)
      } else {
        const res = await api.post('/public/auth/register', { email, password, name, phone })
        login(res.data.access_token, res.data.customer)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) return null

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 animate-in fade-in duration-500">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2 text-center">
          {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h1>
        <p className="text-slate-500 text-center mb-8">
          {authMode === 'login' ? 'Sign in to view your orders and manage your account.' : 'Join us to track orders and checkout faster.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 text-center">{error}</div>}
          
          {authMode === 'register' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="control-input h-12 w-full mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="control-input h-12 w-full mt-1" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="control-input h-12 w-full mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="control-input h-12 w-full mt-1" />
          </div>
          
          <div className="pt-4">
            <button type="submit" disabled={authLoading} className="control-button-primary w-full h-12 rounded-lg">
              {authLoading ? "Processing..." : authMode === 'login' ? "Sign In" : "Create Account"}
            </button>
          </div>
          
          <div className="text-center text-sm text-slate-500 mt-6 pt-4 border-t border-slate-200">
            {authMode === 'login' ? (
              <>Don't have an account? <button type="button" onClick={() => setAuthMode('register')} className="text-blue-600 font-semibold hover:underline">Register</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-blue-600 font-semibold hover:underline">Sign In</button></>
            )}
          </div>
        </form>
      </div>
    )
  }

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
          className="control-button-secondary h-10 px-4 flex items-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
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
                <div key={order.id} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/order/${order.id}`)}>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-slate-900">Order {order.invoiceNumber || `#${order.id.slice(0,8)}`}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(order.saleDate).toLocaleDateString()} • {order.lines?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto">
                    <p className="font-semibold text-slate-900 mb-0 md:mb-2 text-lg">৳{Number(order.totalAmount || 0).toLocaleString()}</p>
                    <button className="text-sm font-medium text-blue-600 hover:underline">
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


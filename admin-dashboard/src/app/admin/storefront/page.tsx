"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { 
  Save, 
  Plus, 
  Trash2, 
  Tag, 
  Mail, 
  MessageSquare, 
  Star, 
  Sliders, 
  Calendar, 
  Phone, 
  User, 
  CheckCircle2, 
  XCircle,
  Clock,
  Percent,
  Search,
  Filter
} from "lucide-react"
import { toast } from "sonner"

export default function StorefrontCMSPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'coupons' | 'inquiries' | 'reviews'>('banners')
  
  // CMS Config state
  const [config, setConfig] = useState<any>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)

  // Coupons state
  const [coupons, setCoupons] = useState<any[]>([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [showAddCoupon, setShowAddCoupon] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmount: 0,
    maxDiscount: 0,
    isActive: true
  })

  // Inquiries state
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loadingInquiries, setLoadingInquiries] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'ALL'>('ALL')

  // Load CMS Config
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await api.get('/admin/storefront-config')
        setConfig(res.data)
      } catch (err) {
        console.error("Failed to load storefront config", err)
      } finally {
        setLoadingConfig(false)
      }
    }
    fetchConfig()
  }, [])

  // Load Tab Specific Data
  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons()
    } else if (activeTab === 'inquiries') {
      fetchInquiries()
    } else if (activeTab === 'reviews') {
      fetchReviews()
    }
  }, [activeTab])

  const fetchCoupons = async () => {
    setLoadingCoupons(true)
    try {
      const res = await api.get('/admin/coupons')
      setCoupons(Array.isArray(res.data) ? res.data : (res.data?.coupons || []))
    } catch (err) {
      console.error("Failed to load coupons", err)
      toast.error("Failed to load promo coupons")
    } finally {
      setLoadingCoupons(false)
    }
  }

  const fetchInquiries = async () => {
    setLoadingInquiries(true)
    try {
      const res = await api.get('/admin/inquiries')
      setInquiries(Array.isArray(res.data) ? res.data : (res.data?.inquiries || []))
    } catch (err) {
      console.error("Failed to load inquiries", err)
      toast.error("Failed to load customer inquiries")
    } finally {
      setLoadingInquiries(false)
    }
  }

  const fetchReviews = async () => {
    setLoadingReviews(true)
    try {
      const res = await api.get('/admin/reviews')
      setReviews(Array.isArray(res.data) ? res.data : (res.data?.reviews || []))
    } catch (err) {
      console.error("Failed to load reviews", err)
      toast.error("Failed to load product reviews")
    } finally {
      setLoadingReviews(false)
    }
  }

  // Save CMS Config
  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await api.put('/admin/storefront-config', config)
      toast.success("Storefront configuration saved successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save configuration")
    } finally {
      setSavingConfig(false)
    }
  }

  // Slide helpers
  const addSlide = (type: 'heroSlides' | 'serviceSlides') => {
    setConfig({
      ...config,
      [type]: [
        ...(config[type] || []),
        { image: '', title: 'New Slide', subtitle: '', buttonText: 'Shop Now', link: type === 'heroSlides' ? '/products' : '/services' }
      ]
    })
  }

  const removeSlide = (type: 'heroSlides' | 'serviceSlides', index: number) => {
    const newSlides = [...(config[type] || [])]
    newSlides.splice(index, 1)
    setConfig({ ...config, [type]: newSlides })
  }

  const updateSlide = (type: 'heroSlides' | 'serviceSlides', index: number, field: string, value: string) => {
    const newSlides = [...(config[type] || [])]
    newSlides[index] = { ...newSlides[index], [field]: value }
    setConfig({ ...config, [type]: newSlides })
  }

  // Coupon helpers
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCoupon.code.trim()) {
      toast.error("Please enter a coupon code")
      return
    }
    try {
      await api.post('/admin/coupons', newCoupon)
      toast.success(`Coupon ${newCoupon.code.toUpperCase()} created successfully!`)
      setShowAddCoupon(false)
      setNewCoupon({
        code: '',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 0,
        maxDiscount: 0,
        isActive: true
      })
      fetchCoupons()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create coupon")
    }
  }

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return
    try {
      await api.delete(`/admin/coupons/${code}`)
      toast.success(`Coupon ${code} deleted`)
      fetchCoupons()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete coupon")
    }
  }

  // Review helpers
  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to remove this review?")) return
    try {
      await api.delete(`/admin/reviews/${id}`)
      toast.success("Review deleted successfully")
      setReviews(reviews.filter((r) => r.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete review")
    }
  }

  const filteredReviews = reviews.filter((r) => {
    if (reviewRatingFilter === 'ALL') return true
    return r.rating === reviewRatingFilter
  })

  return (
    <div className="p-4 sm:p-8 md:p-10 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Page Title & Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Storefront &amp; Engagement Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your homepage slides, promo codes, customer contact messages, and product reviews.
          </p>
        </div>

        {activeTab === 'banners' && (
          <button 
            onClick={handleSaveConfig}
            disabled={savingConfig || loadingConfig}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {savingConfig ? 'Saving...' : 'Save CMS Changes'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeTab === 'banners'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Banners &amp; Flash Sale
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeTab === 'coupons'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          Coupons &amp; Discounts ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeTab === 'inquiries'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          Customer Inquiries ({inquiries.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeTab === 'reviews'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4" />
          Product Reviews ({reviews.length})
        </button>
      </div>

      {/* TAB 1: BANNERS & FLASH SALE */}
      {activeTab === 'banners' && (
        <div className="space-y-8">
          {loadingConfig ? (
            <div className="p-12 text-center text-slate-500">Loading storefront settings...</div>
          ) : (
            <>
              {/* Left Column: Store Slides */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Store Slideshow (Products Column)</h2>
                    <p className="text-xs text-slate-500">Left hero banner cycling retail and computer supplies.</p>
                  </div>
                  <button onClick={() => addSlide('heroSlides')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Slide
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {config?.heroSlides?.map((slide: any, index: number) => (
                    <div key={index} className="p-5 border border-slate-200 rounded-xl relative group bg-slate-50/50">
                      <button 
                        onClick={() => removeSlide('heroSlides', index)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                          <input 
                            type="text" 
                            value={slide.image || ''} 
                            onChange={(e) => updateSlide('heroSlides', index, 'image', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                          <input 
                            type="text" 
                            value={slide.title || ''} 
                            onChange={(e) => updateSlide('heroSlides', index, 'title', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle</label>
                          <input 
                            type="text" 
                            value={slide.subtitle || ''} 
                            onChange={(e) => updateSlide('heroSlides', index, 'subtitle', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Button Text</label>
                            <input 
                              type="text" 
                              value={slide.buttonText || ''} 
                              onChange={(e) => updateSlide('heroSlides', index, 'buttonText', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Link Destination</label>
                            <input 
                              type="text" 
                              value={slide.link || ''} 
                              onChange={(e) => updateSlide('heroSlides', index, 'link', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Service Slides */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Services Slideshow (Digital Print &amp; Studio)</h2>
                    <p className="text-xs text-slate-500">Right hero banner cycling print services, binding, and ID cards.</p>
                  </div>
                  <button onClick={() => addSlide('serviceSlides')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Slide
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {config?.serviceSlides?.map((slide: any, index: number) => (
                    <div key={index} className="p-5 border border-slate-200 rounded-xl relative group bg-slate-50/50">
                      <button 
                        onClick={() => removeSlide('serviceSlides', index)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                          <input 
                            type="text" 
                            value={slide.image || ''} 
                            onChange={(e) => updateSlide('serviceSlides', index, 'image', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                          <input 
                            type="text" 
                            value={slide.title || ''} 
                            onChange={(e) => updateSlide('serviceSlides', index, 'title', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle</label>
                          <input 
                            type="text" 
                            value={slide.subtitle || ''} 
                            onChange={(e) => updateSlide('serviceSlides', index, 'subtitle', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Button Text</label>
                            <input 
                              type="text" 
                              value={slide.buttonText || ''} 
                              onChange={(e) => updateSlide('serviceSlides', index, 'buttonText', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Link Destination</label>
                            <input 
                              type="text" 
                              value={slide.link || ''} 
                              onChange={(e) => updateSlide('serviceSlides', index, 'link', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flash Sale Banner Config */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h2 className="font-bold text-slate-900 text-sm">Flash Sale Countdown Timer</h2>
                  <p className="text-xs text-slate-500">Sets the deadline for homepage promotional flash deals.</p>
                </div>
                <div className="p-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Flash Sale End Time (Local / UTC)</label>
                  <input 
                    type="datetime-local" 
                    value={config?.flashSaleEnd ? new Date(config.flashSaleEnd).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({ ...config, flashSaleEnd: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    When active, customers see an animated live countdown clock on the storefront homepage. Clear this input to deactivate.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: COUPONS & DISCOUNTS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Promo &amp; Discount Coupons</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage promo codes verified during storefront checkout (e.g., WELCOME10, FLAT100).
              </p>
            </div>
            <button
              onClick={() => setShowAddCoupon(!showAddCoupon)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              {showAddCoupon ? 'Cancel' : 'Create New Coupon'}
            </button>
          </div>

          {/* Add Coupon Modal/Drawer */}
          {showAddCoupon && (
            <form onSubmit={handleCreateCoupon} className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-indigo-950 mb-4">Create New Promotional Code</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    placeholder="e.g. SUMMER25"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%) Off</option>
                    <option value="FIXED">Fixed Amount (৳ BDT) Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min. Order Amount (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCoupon.minOrderAmount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })}
                    placeholder="0 for none"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Discount Cap (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCoupon.maxDiscount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                    placeholder="0 for no limit"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="couponActive"
                    checked={newCoupon.isActive}
                    onChange={(e) => setNewCoupon({ ...newCoupon, isActive: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="couponActive" className="text-xs font-semibold text-slate-700">
                    Immediately Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCoupon(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          )}

          {/* Coupons Table */}
          {loadingCoupons ? (
            <div className="p-8 text-center text-slate-500">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
              No custom promo coupons configured yet. Built-in codes (WELCOME10, FLAT100, SAVE50) are active automatically.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Discount</th>
                    <th className="px-6 py-3">Min. Order</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `৳${c.value} FLAT OFF`}
                        {c.maxDiscount ? ` (Up to ৳${c.maxDiscount})` : ''}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {c.minOrderAmount ? `৳${c.minOrderAmount}` : 'No minimum'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          c.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.isActive !== false ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {c.isActive !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customer Contact Inquiries</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Messages submitted via the public /contact page form.
              </p>
            </div>
            <button
              onClick={fetchInquiries}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
            >
              Refresh Inbox
            </button>
          </div>

          {loadingInquiries ? (
            <div className="p-8 text-center text-slate-500">Loading inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Inquiries Yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Messages submitted by visitors on the Contact Us page will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {inquiries.map((inq) => (
                <div key={inq.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-50 text-[#04BBFD] flex items-center justify-center font-bold text-xs">
                        {inq.name ? inq.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{inq.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          {inq.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {inq.phone}</span>}
                          {inq.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {inq.email}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(inq.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {inq.subject && (
                    <div className="text-xs font-bold text-slate-800">
                      Subject: <span className="font-normal text-slate-600">{inq.subject}</span>
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 leading-relaxed">
                    {inq.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRODUCT REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Product Reviews Moderation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, filter, and moderate customer product feedback.
              </p>
            </div>

            {/* Rating Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setReviewRatingFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  reviewRatingFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  onClick={() => setReviewRatingFilter(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                    reviewRatingFilter === r
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  {r}★
                </button>
              ))}
            </div>
          </div>

          {loadingReviews ? (
            <div className="p-8 text-center text-slate-500">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto">
              <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Reviews Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                No customer product reviews match the current filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{rev.customerName || 'Verified Customer'}</h4>
                      </div>

                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3 italic">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-indigo-600">
                      Product ID: {rev.productId?.slice(0, 8)}...
                    </span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

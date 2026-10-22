"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { toast } from "sonner"
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Settings,
  Search,
  User,
  Phone,
  Save,
  Filter,
  RefreshCw,
  ChevronRight
} from "lucide-react"

export default function AdminServiceSchedulingPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  // Shop Schedule Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<any>({
    openingTime: '09:30',
    closingTime: '20:30',
    breakStart: '13:30',
    breakEnd: '14:30',
    defaultSlotMinutes: 20,
    maxConcurrentPerSlot: 2,
    workingDays: [6, 0, 1, 2, 3, 4],
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [aptRes, setRes] = await Promise.all([
        api.get('/admin/service-scheduling/appointments', {
          params: { date: dateFilter || undefined, status: statusFilter !== 'ALL' ? statusFilter : undefined }
        }),
        api.get('/admin/service-scheduling/settings')
      ])
      setAppointments(aptRes.data || [])
      if (setRes.data) setSettings(setRes.data)
    } catch (e: any) {
      toast.error("তথ্য লোড করতে ব্যর্থ হয়েছে: " + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateFilter, statusFilter])

  const handleUpdateStatus = async (tokenNumber: string, status: 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await api.patch(`/admin/service-scheduling/appointments/${tokenNumber}/status`, { status })
      toast.success(`অ্যাপয়েন্টমেন্ট স্ট্যাটাস ${status} করা হয়েছে!`)
      loadData()
    } catch (e: any) {
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।")
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await api.post('/admin/service-scheduling/settings', settings)
      toast.success("দোকানের সময় ও শিডিউল সেটিংস সংরক্ষিত হয়েছে!")
      setIsSettingsOpen(false)
      loadData()
    } catch (e: any) {
      toast.error("সেটিংস সংরক্ষণে সমস্যা।")
    } finally {
      setSavingSettings(false)
    }
  }

  const filteredAppointments = appointments.filter(a => {
    const q = search.toLowerCase().trim()
    return !q ||
      a.tokenNumber?.toLowerCase().includes(q) ||
      a.customerName?.toLowerCase().includes(q) ||
      a.customerPhone?.includes(q) ||
      a.serviceTitleBn?.toLowerCase().includes(q)
  })

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Shop Availability & Counter Appointments
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            অ্যাপয়েন্টমেন্ট ও দোকান শিডিউল ব্যবস্থাপনা
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            গ্রাহক বুকিং ট্র্যাকিং, সার্ভিস ডেস্ক চেক-ইন এবং দোকানের কাজের সময় নির্ধারণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> রিফ্রেশ
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 inline-flex items-center gap-2 shadow-sm"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            দোকান সময় সেটিংস
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">তারিখ:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">স্ট্যাটাস:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">সকল স্ট্যাটাস</option>
              <option value="CONFIRMED">কনফার্মড (CONFIRMED)</option>
              <option value="CHECKED_IN">চেক-ইন (CHECKED_IN)</option>
              <option value="COMPLETED">সম্পন্ন (COMPLETED)</option>
              <option value="CANCELLED">বাতিল (CANCELLED)</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, ফোন বা টোকেন নম্বর..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">এই তারিখে কোনো অ্যাপয়েন্টমেন্ট নেই</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            অন্য কোনো তারিখ নির্বাচন করুন অথবা উপরে "দোকান সময় সেটিংস" যাচাই করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.tokenNumber || apt.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-bold leading-none">{apt.slotTime}</span>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1">২০ মি.</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">#{apt.tokenNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      apt.status === 'CHECKED_IN' ? 'bg-amber-100 text-amber-800' :
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {apt.customerName} • <span className="font-mono text-xs text-slate-500">{apt.customerPhone}</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    সেবা: <strong className="text-slate-700">{apt.serviceTitleBn}</strong> {apt.notes && `• নোট: ${apt.notes}`}
                  </p>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {apt.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleUpdateStatus(apt.tokenNumber, 'CHECKED_IN')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all"
                  >
                    কাউন্টার চেক-ইন
                  </button>
                )}
                {(apt.status === 'CONFIRMED' || apt.status === 'CHECKED_IN') && (
                  <button
                    onClick={() => handleUpdateStatus(apt.tokenNumber, 'COMPLETED')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> সম্পন্ন
                  </button>
                )}
                {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleUpdateStatus(apt.tokenNumber, 'CANCELLED')}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs transition-all"
                    title="বাতিল করুন"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shop Hours & Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                দোকানের কাজের সময় ও শিডিউল সেটিংস
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">দোকান খোলার সময় *</label>
                  <input
                    type="time"
                    required
                    value={settings.openingTime}
                    onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">দোকান বন্ধের সময় *</label>
                  <input
                    type="time"
                    required
                    value={settings.closingTime}
                    onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">লাঞ্চ / বিরতি শুরু</label>
                  <input
                    type="time"
                    value={settings.breakStart || ""}
                    onChange={(e) => setSettings({ ...settings, breakStart: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">বিরতি শেষ</label>
                  <input
                    type="time"
                    value={settings.breakEnd || ""}
                    onChange={(e) => setSettings({ ...settings, breakEnd: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">স্লটের সময়কাল (মিনিট)</label>
                  <input
                    type="number"
                    value={settings.defaultSlotMinutes}
                    onChange={(e) => setSettings({ ...settings, defaultSlotMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">এক সময়ে সর্বোচ্চ গ্রাহক (ডেস্ক সংখ্যা)</label>
                  <input
                    type="number"
                    value={settings.maxConcurrentPerSlot}
                    onChange={(e) => setSettings({ ...settings, maxConcurrentPerSlot: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {savingSettings ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

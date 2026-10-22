"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import {
  Trophy,
  Award,
  DollarSign,
  TrendingUp,
  Target,
  Settings,
  Plus,
  User,
  Calendar,
  CreditCard,
  X,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

export default function StaffCommissionsPage() {
  const [data, setData] = useState<any>({
    metrics: {
      totalStaffCount: 0,
      totalStaffSalesBdt: 0,
      totalCommissionsEarnedBdt: 0,
      totalCommissionsPaidBdt: 0,
      pendingPayoutsBdt: 0,
    },
    rules: {
      defaultProductCommissionPercent: 2,
      serviceJobCommissionPercent: 10,
      monthlyTargetBdt: 150000,
      dailyTargetBdt: 10000,
    },
    leaderboard: [],
    recentPayouts: [],
  })
  const [loading, setLoading] = useState(true)

  // Modals
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Rules form
  const [productCommPercent, setProductCommPercent] = useState("2")
  const [serviceCommPercent, setServiceCommPercent] = useState("10")
  const [monthlyTarget, setMonthlyTarget] = useState("150000")
  const [dailyTarget, setDailyTarget] = useState("10000")

  // Payout form
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState<"CASH" | "BANK" | "MOBILE_BANKING">("CASH")
  const [payoutNotes, setPayoutNotes] = useState("")

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/staff-commissions/summary")
      setData(res.data)
      if (res.data.rules) {
        setProductCommPercent(String(res.data.rules.defaultProductCommissionPercent || 2))
        setServiceCommPercent(String(res.data.rules.serviceJobCommissionPercent || 10))
        setMonthlyTarget(String(res.data.rules.monthlyTargetBdt || 150000))
        setDailyTarget(String(res.data.rules.dailyTargetBdt || 10000))
      }
    } catch (err: any) {
      console.error("Failed to load staff commissions", err)
      toast.error("কমিশন ডাটা লোড করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post("/admin/staff-commissions/rules", {
        defaultProductCommissionPercent: Number(productCommPercent),
        serviceJobCommissionPercent: Number(serviceCommPercent),
        monthlyTargetBdt: Number(monthlyTarget),
        dailyTargetBdt: Number(dailyTarget),
      })
      toast.success("কমিশন রুলস ও টার্গেট আপডেট হয়েছে")
      setShowRulesModal(false)
      loadSummary()
    } catch (err: any) {
      toast.error("রুলস সংরক্ষণ করতে সমস্যা হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff || !payoutAmount) return
    setSubmitting(true)
    try {
      await api.post("/admin/staff-commissions/payout", {
        userId: selectedStaff.userId,
        amount: Number(payoutAmount),
        paymentMethod: payoutMethod,
        notes: payoutNotes,
      })
      toast.success(`${selectedStaff.name} কে ৳${payoutAmount} পেআউট সফল হয়েছে`)
      setShowPayoutModal(false)
      setPayoutAmount("")
      setPayoutNotes("")
      loadSummary()
    } catch (err: any) {
      toast.error("পেআউট রেকর্ড করতে সমস্যা হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Trophy className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              সেলসম্যান টার্গেট মিটার ও কমিশন (Staff Commissions & Leaderboard)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            দৈনিক ও মাসিক বিক্রয় টার্গেট অর্জন, স্বয়ংক্রিয় সেলস কমিশন ক্যালকুলেটর ও পেআউট খাতা
          </p>
        </div>

        <button
          onClick={() => setShowRulesModal(true)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center gap-2 shadow-sm"
        >
          <Settings className="w-4 h-4 text-slate-500" /> কমিশন রুলস ও টার্গেট সেটিংস
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">এই মাসের মোট স্টাফ সেলস</p>
            <h3 className="text-2xl font-black text-slate-900 tabular-nums">
              ৳{Number(data.metrics?.totalStaffSalesBdt || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{data.metrics?.totalStaffCount || 0} জন কর্মকর্তা সক্রিয়</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">মোট অর্জিত কমিশন</p>
            <h3 className="text-2xl font-black text-amber-600 tabular-nums">
              ৳{Number(data.metrics?.totalCommissionsEarnedBdt || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-amber-700/80 mt-0.5 font-medium">রেট: {data.rules?.defaultProductCommissionPercent || 2}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">কমিশন পরিশোধিত (Paid)</p>
            <h3 className="text-2xl font-black text-emerald-600 tabular-nums">
              ৳{Number(data.metrics?.totalCommissionsPaidBdt || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">ক্যাশ বা ব্যাংক পেআউট</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">বকেয়া কমিশন (Pending)</p>
            <h3 className="text-2xl font-black text-rose-600 tabular-nums">
              ৳{Number(data.metrics?.pendingPayoutsBdt || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">পরিশোধের অপেক্ষায়</p>
          </div>
        </div>
      </div>

      {/* Staff Leaderboard & Target Progress Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">বিক্রয় র‍্যাঙ্কিং ও কমিশন বিবরণী</h3>
          </div>
          <span className="text-xs text-slate-500">মাসিক টার্গেট: ৳{Number(data.rules?.monthlyTargetBdt || 150000).toLocaleString()}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">র‍্যাঙ্ক</th>
                <th className="px-5 py-3.5">সেলসম্যান / স্টাফ</th>
                <th className="px-5 py-3.5 text-right">আজকের সেলস</th>
                <th className="px-5 py-3.5 text-right">এই মাসের সেলস</th>
                <th className="px-5 py-3.5">মাসিক টার্গেট মিটার (%)</th>
                <th className="px-5 py-3.5 text-right">অর্জিত কমিশন</th>
                <th className="px-5 py-3.5 text-right">বাকি পাওনা</th>
                <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    লিডারবোর্ড লোড হচ্ছে...
                  </td>
                </tr>
              ) : (data.leaderboard || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    কোনো সক্রিয় স্টাফ পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                data.leaderboard.map((staff: any) => (
                  <tr key={staff.userId} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${
                          staff.rank === 1
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : staff.rank === 2
                            ? "bg-slate-200 text-slate-800"
                            : staff.rank === 3
                            ? "bg-orange-100 text-orange-900"
                            : "text-slate-500 font-bold"
                        }`}
                      >
                        {staff.badge}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{staff.name}</div>
                      <div className="text-xs text-slate-400">{staff.role} | {staff.email}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-700 tabular-nums">
                      ৳{Number(staff.dailySalesBdt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900 tabular-nums text-base">
                      ৳{Number(staff.monthlySalesBdt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">অর্জিত</span>
                          <span className={staff.monthlyTargetPercent >= 80 ? "text-emerald-600" : "text-amber-600"}>
                            {staff.monthlyTargetPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              staff.monthlyTargetPercent >= 80
                                ? "bg-emerald-500"
                                : staff.monthlyTargetPercent >= 40
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                            style={{ width: `${Math.min(100, staff.monthlyTargetPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-amber-600 tabular-nums">
                      ৳{Number(staff.earnedCommissionBdt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-rose-600 tabular-nums">
                      ৳{Number(staff.pendingCommissionBdt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedStaff(staff)
                          setPayoutAmount(String(staff.pendingCommissionBdt || 1000))
                          setShowPayoutModal(true)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors shadow-sm"
                      >
                        পেআউট দিন
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: RULES CONFIGURATION */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">কমিশন রুলস ও টার্গেট কনফিগারেশন</h3>
              <button onClick={() => setShowRulesModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRules} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">সাধারণ প্রোডাক্ট কমিশন হার (%) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={productCommPercent}
                  onChange={(e) => setProductCommPercent(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">যেমন: ২% (৳১,০০০ টাকার পণ্যে ৳২০ কমিশন)</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">সার্ভিস ও প্রিন্টিং কমিশন হার (%) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={serviceCommPercent}
                  onChange={(e) => setServiceCommPercent(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">মাসিক টার্গেট (৳)</label>
                  <input
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">দৈনিক টার্গেট (৳)</label>
                  <input
                    type="number"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAYOUT RECORD */}
      {showPayoutModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">কমিশন ও বোনাস পেআউট</h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="space-y-4 mt-4">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-900">কর্মকর্তার নাম: {selectedStaff.name}</p>
                <p className="text-xs text-indigo-700">বাকি অর্জিত কমিশন: ৳{Number(selectedStaff.pendingCommissionBdt).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">পেআউটের পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 font-black text-emerald-600 text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">পেমেন্ট মেথড</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="CASH">💵 নগদ ক্যাশ (Cash Register)</option>
                  <option value="MOBILE_BANKING">📱 বিকাশ / নগদ (bKash/Nagad)</option>
                  <option value="BANK">🏛️ ব্যাংক অ্যাকাউন্ট (Bank Transfer)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">নোট / বিবরণ</label>
                <input
                  type="text"
                  placeholder="e.g. অক্টোবর মাসের ইনসেন্টিভ ও সেলস কমিশন"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? "প্রসেস হচ্ছে..." : "পেআউট নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

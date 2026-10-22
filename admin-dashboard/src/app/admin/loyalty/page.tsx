"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../lib/api-client"
import { 
  Award, Gift, Star, Users, ArrowUpRight, Plus, 
  Settings, RefreshCw, CheckCircle2, Shield, Heart 
} from "lucide-react"
import { toast } from "sonner"

export default function LoyaltyRewardsPage() {
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState({
    earnRateSpentBdt: 100,
    redeemValueBdt: 1,
    minimumRedeemPoints: 100,
    welcomeBonusPoints: 50,
  })
  const [wallets, setWallets] = useState<any>({
    kpi: { totalPointsInCirculation: 0, tierCounts: { BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0 }, activeLoyaltyMembers: 0 },
    customers: [],
  })

  // Manual Adjust Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [pointsDelta, setPointsDelta] = useState(100)
  const [adjustReason, setAdjustReason] = useState("Eid Festival Bonus")
  const [submittingAdjust, setSubmittingAdjust] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rulesRes, walletsRes] = await Promise.all([
        api.get("/admin/loyalty/rules"),
        api.get("/admin/loyalty/customers"),
      ])
      if (rulesRes.data) setRules(rulesRes.data)
      if (walletsRes.data) setWallets(walletsRes.data)
    } catch (err) {
      console.error("Failed to load loyalty data:", err)
      toast.error("Failed to load loyalty program data")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post("/admin/loyalty/rules", rules)
      toast.success(res.data.message || "Loyalty rules updated successfully")
    } catch (err) {
      toast.error("Failed to save rules")
    }
  }

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    setSubmittingAdjust(true)
    try {
      const res = await api.post("/admin/loyalty/adjust", {
        customerId: selectedCustomer.id,
        pointsDelta: Number(pointsDelta),
        reason: adjustReason,
      })
      toast.success(res.data.message || "Points adjusted successfully")
      setAdjustModalOpen(false)
      loadData()
    } catch (err) {
      toast.error("Failed to adjust points")
    } finally {
      setSubmittingAdjust(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
              <Gift className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Customer Retention & Lifetime Value
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Loyalty, Rewards & VIP Tiers</h1>
          <p className="text-slate-400 text-xs mt-1">
            Reward repeat shoppers with points, automatic tier upgrades (Bronze, Silver, Gold, Platinum), and checkout cashback.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tier Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-700 to-amber-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200">TIER 1 • NEW MEMBER</div>
          <div className="text-xl font-black mt-1">BRONZE</div>
          <div className="text-2xl font-black mt-2">{wallets.kpi?.tierCounts?.BRONZE || 0} Members</div>
          <p className="text-[11px] text-amber-100 mt-1">&lt; 500 Pts • Standard Benefits</p>
        </div>

        <div className="bg-gradient-to-br from-slate-400 to-slate-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-200">TIER 2 • REPEAT BUYER</div>
          <div className="text-xl font-black mt-1">SILVER</div>
          <div className="text-2xl font-black mt-2">{wallets.kpi?.tierCounts?.SILVER || 0} Members</div>
          <p className="text-[11px] text-slate-100 mt-1">500–1,999 Pts • 2% Extra Cashback</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-100">TIER 3 • VALUED REGULAR</div>
          <div className="text-xl font-black mt-1">GOLD</div>
          <div className="text-2xl font-black mt-2">{wallets.kpi?.tierCounts?.GOLD || 0} Members</div>
          <p className="text-[11px] text-yellow-100 mt-1">2,000–4,999 Pts • 5% Extra Benefit</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-800 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">TIER 4 • VIP STATUS</div>
          <div className="text-xl font-black mt-1">PLATINUM</div>
          <div className="text-2xl font-black mt-2">{wallets.kpi?.tierCounts?.PLATINUM || 0} Members</div>
          <p className="text-[11px] text-indigo-100 mt-1">5,000+ Pts • VIP Priority & 10% Off</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rules Config (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#04BBFD]" />
            <span>Earn & Burn Rules Configuration</span>
          </h2>

          <form onSubmit={handleSaveRules} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Earn Rate (Spend ৳ to get 1 Point)
              </label>
              <input
                type="number"
                min={1}
                value={rules.earnRateSpentBdt}
                onChange={(e) => setRules({ ...rules, earnRateSpentBdt: Number(e.target.value) || 100 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. ৳100 spent = 1 point</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Redemption Value (1 Point in ৳)
              </label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={rules.redeemValueBdt}
                onChange={(e) => setRules({ ...rules, redeemValueBdt: Number(e.target.value) || 1 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. 1 point = ৳1.00 checkout discount</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Minimum Points to Redeem
              </label>
              <input
                type="number"
                min={10}
                value={rules.minimumRedeemPoints}
                onChange={(e) => setRules({ ...rules, minimumRedeemPoints: Number(e.target.value) || 100 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#04BBFD]/20 cursor-pointer"
            >
              Save Rules
            </button>
          </form>
        </div>

        {/* Customer Points Wallet Table (Col 8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Customer Points Wallets</h3>
            <span className="text-xs font-bold text-slate-500">
              Total Points: {(wallets.kpi?.totalPointsInCirculation || 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Current Points</th>
                  <th className="p-4">VIP Tier</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(wallets.customers || []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-black text-sm text-indigo-600">
                        {c.currentPoints.toLocaleString()} Pts
                      </span>
                      <div className="text-[10px] text-slate-400">৳{c.currentPoints * rules.redeemValueBdt} value</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        c.tier === "PLATINUM" ? "bg-purple-100 text-purple-800" :
                        c.tier === "GOLD" ? "bg-amber-100 text-amber-800" :
                        c.tier === "SILVER" ? "bg-slate-200 text-slate-800" :
                        "bg-amber-50 text-amber-900"
                      }`}>
                        {c.tier}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-slate-800">
                      ৳{c.totalSpent.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCustomer(c)
                          setAdjustModalOpen(true)
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-[#04BBFD] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        🎁 Adjust / Bonus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Award Bonus Points</h3>
                <p className="text-xs text-slate-500 font-bold">{selectedCustomer.name}</p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Points Delta (+ to add, - to deduct)
                </label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Reason / Campaign</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAdjust}
                className="w-full py-3 bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                {submittingAdjust ? "Applying..." : "Confirm Points Award"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

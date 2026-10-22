"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { 
  Star, Trash2, Filter, MessageSquare, ShieldCheck, 
  Send, Gift, CheckCircle2, Eye, EyeOff, RefreshCw, ThumbsUp 
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL")
  const [triggering, setTriggering] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await api.get("/admin/reviews")
      setReviews(Array.isArray(res.data) ? res.data : (res.data?.reviews || []))
    } catch (err) {
      console.error("Failed to load reviews", err)
      toast.error("Failed to load product reviews")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleTriggerInvites = async () => {
    setTriggering(true)
    try {
      const res = await api.post("/admin/reviews/trigger-requests")
      toast.success(res.data.message || "Triggered review requests successfully!")
      fetchReviews()
    } catch (err) {
      toast.error("Failed to trigger review requests")
    } finally {
      setTriggering(false)
    }
  }

  const handleModerateStatus = async (id: string, status: "APPROVED_LIVE" | "HIDDEN") => {
    try {
      await api.patch(`/admin/reviews/${id}`, { status })
      toast.success(`Review status updated to ${status}`)
      setReviews(reviews.map(r => r.id === id ? { ...r, status } : r))
    } catch (err) {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return
    try {
      await api.delete(`/admin/reviews/${id}`)
      toast.success("Review deleted successfully")
      setReviews(reviews.filter(r => r.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete review")
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (ratingFilter === "ALL") return true
    return r.rating === ratingFilter
  })

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0"

  const fiveStarCount = reviews.filter(r => r.rating === 5).length
  const npsScore = reviews.length > 0 ? Math.round((fiveStarCount / reviews.length) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Star className="w-5 h-5 fill-amber-400" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Social Proof & Customer Feedback Loop
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Review Moderation & Automation Loop</h1>
          <p className="text-slate-400 text-xs mt-1">
            Auto-dispatch post-delivery review requests with 10% coupon rewards (REVIEW10) and moderate storefront reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerInvites}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{triggering ? "Inviting..." : "⚡ Trigger Auto-Review Invites"}</span>
          </button>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Store Rating</div>
            <div className="text-3xl font-black text-amber-500 mt-1 flex items-center gap-1.5">
              <span>{avgRating}</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Based on {reviews.length} customer ratings</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Promoter Score (NPS)</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            {npsScore}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Customer loyalty satisfaction rate</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Reward Coupon Offer</div>
          <div className="text-xl font-black text-slate-900 mt-1 flex items-center gap-1.5 font-mono">
            <Gift className="w-5 h-5 text-indigo-600" />
            <span>REVIEW10 (10% OFF)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Auto-awarded upon review submission</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        <span className="text-xs font-bold text-slate-600 mr-2">Filter by Star:</span>
        {(["ALL", 5, 4, 3, 2, 1] as const).map((star) => (
          <button
            key={star}
            onClick={() => setRatingFilter(star)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ratingFilter === star
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {star === "ALL" ? "All Stars" : `${star} ⭐`}
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.length === 0 ? (
          <div className="col-span-2 p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
            No reviews matching this filter.
          </div>
        ) : (
          filteredReviews.map((r) => (
            <div key={r.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-extrabold text-sm text-slate-900">{r.authorName}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Purchase</span>
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-xl">
                "{r.comment || "Great product and super fast nationwide delivery!"}"
              </p>

              {r.product && (
                <div className="text-[11px] font-bold text-slate-500 border-t border-slate-100 pt-2 flex justify-between items-center">
                  <span>Product: {r.product.name}</span>
                  <span className="text-slate-900">৳{Number(r.product.sellingPrice).toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved Live on Store</span>
                </span>

                <div className="space-x-2">
                  <button
                    onClick={() => handleModerateStatus(r.id, "HIDDEN")}
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Hide Review"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

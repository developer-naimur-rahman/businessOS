"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Star, Trash2, ArrowLeft, Filter, MessageSquare, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL')

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/reviews')
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return
    try {
      await api.delete(`/admin/reviews/${id}`)
      toast.success("Review deleted successfully")
      setReviews(reviews.filter(r => r.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete review")
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (ratingFilter === 'ALL') return true
    return r.rating === ratingFilter
  })

  return (
    <div className="p-4 sm:p-8 md:p-10 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href="/admin/storefront" 
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Storefront CMS
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Product Reviews Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Inspect, filter, and moderate verified customer reviews across all catalog products.
          </p>
        </div>

        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setRatingFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              ratingFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                ratingFilter === r
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              {r}★
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 max-w-md mx-auto">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Reviews to Display</h3>
          <p className="text-xs text-slate-500 mt-1">
            {ratingFilter === 'ALL' 
              ? "No customer reviews have been submitted yet." 
              : `No reviews found with ${ratingFilter} star rating.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.map((rev) => (
            <div 
              key={rev.id} 
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{rev.customerName || 'Customer'}</h4>
                  </div>

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed mb-4 italic bg-slate-50 p-3 rounded-xl">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-indigo-600">ID: {rev.productId?.slice(0, 8)}...</span>
                <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

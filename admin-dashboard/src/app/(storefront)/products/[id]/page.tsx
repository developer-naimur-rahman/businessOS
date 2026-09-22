"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../../lib/api-client"
import Link from "next/link"
import { ArrowLeft, Check, Truck, ShieldCheck, Plus, Minus, Star } from "lucide-react"
import { MediaImage } from "../../../../components/ui/media-image"
import { useParams } from "next/navigation"
import { useCartStore } from "../../../../store/useCartStore"

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/public/catalog/products/${params.id}`)
        if (res.data && (res.data.type === 'PRODUCT' || res.data.type === 'SERVICE')) {
          setProduct(res.data)
        } else {
          setProduct(null)
        }
      } catch (err) {
        console.error("Failed to load product", err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-12 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="bg-slate-100 aspect-square rounded-3xl"></div>
          <div className="space-y-6 py-8">
            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
            <div className="h-10 bg-slate-100 rounded w-3/4"></div>
            <div className="h-6 bg-slate-100 rounded w-1/3"></div>
            <div className="h-24 bg-slate-100 rounded w-full mt-8"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">Product not found</h1>
        <p className="text-slate-500 mb-8">The product you're looking for doesn't exist or is currently unavailable.</p>
        <Link href="/products" className="control-button-primary rounded-full px-8 h-12 inline-flex items-center">
          Back to Catalog
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <Link href="/products" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Product Image Gallery (Demo) */}
        <div className="space-y-4">
          <div className="bg-slate-100 aspect-square rounded-3xl overflow-hidden border border-slate-200/50 shadow-sm relative group">
            <MediaImage 
              asset={null} 
              fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=1200&auto=format&fit=crop" 
              className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.02]" 
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                <MediaImage 
                  asset={product.imageUrl} 
                  fallbackUrl="https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop" 
                  className="w-full h-full object-cover mix-blend-multiply" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col pt-4 lg:pt-8">
          <div className="mb-8 border-b border-slate-100 pb-8">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {product.category?.name || 'Essential'}
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-4 leading-tight">
              {product.name}
            </h1>
            <div className="text-3xl font-medium text-slate-900 tabular-nums">
              ৳{Number(product.sellingPrice).toLocaleString()}
            </div>
          </div>

          <div className="prose prose-slate max-w-none mb-10">
            <p className="text-lg text-slate-600 leading-relaxed">
              {product.description || "Premium quality product designed for modern business environments. Excellent build quality with reliable performance."}
            </p>
          </div>

          <div className="space-y-6 mb-10">
            {/* Quantity Selector */}
            <div>
              <p className="text-sm font-medium text-slate-900 mb-3">Quantity</p>
              <div className="flex items-center w-32 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden h-12">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-medium text-slate-900 tabular-nums">
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => {
                  addItem({
                    productId: product.id,
                    name: product.name,
                    price: Number(product.sellingPrice),
                    quantity: quantity,
                    type: product.type
                  })
                }}
                className="control-button-primary h-14 rounded-full text-base flex-1 shadow-md hover:shadow-lg interactive-item"
              >
                Add to Cart — ৳{(Number(product.sellingPrice) * quantity).toLocaleString()}
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100 mt-auto">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <Check className="w-5 h-5 text-emerald-500" /> In stock and ready to ship
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <Truck className="w-5 h-5 text-slate-400" /> Free local delivery on orders over ৳5000
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <ShieldCheck className="w-5 h-5 text-slate-400" /> 1-year authentic business warranty
            </div>
          </div>

        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="mt-24 pt-16 border-t border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-900 mb-12">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          <div className="lg:col-span-1">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 sticky top-32">
              <div className="text-center mb-8">
                <div className="text-5xl font-black text-slate-900 mb-2">{product.rating ? Number(product.rating).toFixed(1) : '0.0'}</div>
                <div className="flex justify-center gap-1 text-amber-400 mb-2">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className={`w-6 h-6 ${star <= Math.round(product.rating || 0) ? 'fill-current' : 'text-slate-300'}`} />
                  ))}
                </div>
                <div className="text-sm text-slate-500">Based on {product.reviewCount || 0} reviews</div>
              </div>

              <div className="border-t border-slate-200 pt-8 mt-8">
                <h3 className="font-semibold text-slate-900 mb-4">Write a Review</h3>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const rating = parseInt((form.elements.namedItem('rating') as HTMLSelectElement).value);
                    const orderId = (form.elements.namedItem('orderId') as HTMLInputElement).value;
                    const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement).value;
                    
                    try {
                      await api.post(`/public/catalog/products/${product.id}/reviews`, { rating, orderId, comment });
                      alert('Review submitted successfully!');
                      form.reset();
                      // Refresh product data to show new review
                      const res = await api.get(`/public/catalog/products/${product.id}`);
                      setProduct(res.data);
                    } catch (err: any) {
                      alert(err.response?.data?.message || 'Failed to submit review. Are you sure you purchased this product?');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase mb-1 block">Rating</label>
                    <select name="rating" required className="control-input w-full h-10">
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase mb-1 block">Your Order ID</label>
                    <input name="orderId" required type="text" className="control-input w-full h-10" placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000" />
                    <p className="text-[10px] text-slate-400 mt-1">We need this to verify your purchase. Find it in your recent orders.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase mb-1 block">Comment</label>
                    <textarea name="comment" className="control-input w-full h-24 py-2 resize-none" placeholder="What did you like or dislike?"></textarea>
                  </div>
                  <button type="submit" className="control-button-primary w-full h-10">Submit Review</button>
                </form>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {(!product.reviews || product.reviews.length === 0) ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                <Star className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No reviews yet</h3>
                <p className="text-slate-500">Be the first to review this product!</p>
              </div>
            ) : (
              product.reviews.map((review: any) => (
                <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {review.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{review.authorName}</div>
                        <div className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-400">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-slate-700 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

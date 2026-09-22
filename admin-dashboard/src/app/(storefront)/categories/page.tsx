"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { MediaImage } from "../../../components/ui/media-image"
import { LayoutGrid, ShoppingBag, Briefcase } from "lucide-react"

export default function AllCategoriesPage() {
  const [storeCategories, setStoreCategories] = useState<any[]>([])
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const [storeRes, serviceRes] = await Promise.all([
          api.get('/public/catalog/categories?type=PRODUCT'),
          api.get('/public/catalog/categories?type=SERVICE')
        ])
        setStoreCategories(storeRes.data || [])
        setServiceCategories(serviceRes.data || [])
      } catch (err) {
        console.error("Failed to load categories", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const CategoryCard = ({ category, href }: { category: any, href: string }) => (
    <Link href={href} className="group relative bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="w-16 h-16 bg-slate-50 rounded-2xl mb-6 overflow-hidden flex items-center justify-center border border-slate-100/50 relative z-10">
        {category.imageUrl ? (
          <MediaImage asset={category.imageUrl} className="w-full h-full object-cover" />
        ) : (
          <LayoutGrid className="w-6 h-6 text-indigo-400" />
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{category.name}</h3>
        <p className="text-slate-500 text-sm line-clamp-2">{category.description || 'Browse items in this category'}</p>
      </div>
    </Link>
  )

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-500 min-h-[60vh]">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">Explore Our Catalog</h1>
        <p className="text-lg text-slate-500">
          Find exactly what you're looking for by browsing our extensive collection of products and professional services.
        </p>
      </div>

      {loading ? (
        <div className="space-y-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-24">
          
          {/* Store Categories Section */}
          {storeCategories.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Store Categories</h2>
                  <p className="text-slate-500">Physical products and digital goods</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {storeCategories.map(category => (
                  <CategoryCard 
                    key={category.id} 
                    category={category} 
                    href={`/categories/${category.id}`} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* Service Categories Section */}
          {serviceCategories.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Service Categories</h2>
                  <p className="text-slate-500">Professional services and consultations</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {serviceCategories.map(category => (
                  <CategoryCard 
                    key={category.id} 
                    category={category} 
                    href={`/categories/${category.id}`} 
                  />
                ))}
              </div>
            </section>
          )}
          
          {storeCategories.length === 0 && serviceCategories.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
              <LayoutGrid className="w-16 h-16 mx-auto text-slate-300 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Categories Found</h3>
              <p className="text-slate-500">We're still organizing our catalog. Check back soon!</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

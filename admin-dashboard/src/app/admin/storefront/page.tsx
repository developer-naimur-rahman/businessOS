"use client"

import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Save, Plus, Trash2 } from "lucide-react"

export default function StorefrontCMSPage() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await api.get('/admin/storefront-config')
        setConfig(res.data)
      } catch (err) {
        console.error("Failed to load storefront config", err)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/storefront-config', config)
      alert("Storefront configuration saved successfully")
    } catch (err) {
      alert("Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

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

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Storefront CMS</h1>
          <p className="text-slate-500">Manage your homepage banners, flash sales, and featured content.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Store Slides */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-semibold text-slate-800">Store Slideshow (Left Column)</h2>
            <button onClick={() => addSlide('heroSlides')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Slide
            </button>
          </div>
          <div className="p-6 space-y-6">
            {config?.heroSlides?.map((slide: any, index: number) => (
              <div key={index} className="p-5 border border-slate-200 rounded-xl relative group">
                <button 
                  onClick={() => removeSlide('heroSlides', index)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                    <input 
                      type="text" 
                      value={slide.image || ''} 
                      onChange={(e) => updateSlide('heroSlides', index, 'image', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={slide.title || ''} 
                      onChange={(e) => updateSlide('heroSlides', index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                    <input 
                      type="text" 
                      value={slide.subtitle || ''} 
                      onChange={(e) => updateSlide('heroSlides', index, 'subtitle', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
                    <input 
                      type="text" 
                      value={slide.buttonText || ''} 
                      onChange={(e) => updateSlide('heroSlides', index, 'buttonText', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link Destination</label>
                    <input 
                      type="text" 
                      value={slide.link || ''} 
                      onChange={(e) => updateSlide('heroSlides', index, 'link', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Slides */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-semibold text-slate-800">Service Slideshow (Right Column)</h2>
            <button onClick={() => addSlide('serviceSlides')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Slide
            </button>
          </div>
          <div className="p-6 space-y-6">
            {config?.serviceSlides?.map((slide: any, index: number) => (
              <div key={index} className="p-5 border border-slate-200 rounded-xl relative group">
                <button 
                  onClick={() => removeSlide('serviceSlides', index)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                    <input 
                      type="text" 
                      value={slide.image || ''} 
                      onChange={(e) => updateSlide('serviceSlides', index, 'image', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={slide.title || ''} 
                      onChange={(e) => updateSlide('serviceSlides', index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                    <input 
                      type="text" 
                      value={slide.subtitle || ''} 
                      onChange={(e) => updateSlide('serviceSlides', index, 'subtitle', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
                    <input 
                      type="text" 
                      value={slide.buttonText || ''} 
                      onChange={(e) => updateSlide('serviceSlides', index, 'buttonText', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link Destination</label>
                    <input 
                      type="text" 
                      value={slide.link || ''} 
                      onChange={(e) => updateSlide('serviceSlides', index, 'link', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flash Sale */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-800">Flash Sale</h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Flash Sale End Time</label>
            <input 
              type="datetime-local" 
              value={config?.flashSaleEnd ? new Date(config.flashSaleEnd).toISOString().slice(0, 16) : ''}
              onChange={(e) => setConfig({ ...config, flashSaleEnd: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-sm text-slate-500 mt-2">Clear this field to hide the flash sale section.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"
import React, { useState } from "react"
import { Image as ImageIcon, UploadCloud, Search, Filter, MoreHorizontal, FileImage } from "lucide-react"

export default function AdminMediaLibraryPage() {
  const [loading, setLoading] = useState(false)

  // Demo representation of the future media library
  const mediaAssets = [
    { id: '1', name: 'hero-banner-main.jpg', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=300', size: '2.4 MB', type: 'image/jpeg', date: '2026-09-14' },
    { id: '2', name: 'product-keyboard-1.png', url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=300', size: '1.1 MB', type: 'image/png', date: '2026-09-12' },
    { id: '3', name: 'service-printing.jpg', url: 'https://images.unsplash.com/photo-1562564055-71e051d33c19?q=80&w=300', size: '3.2 MB', type: 'image/jpeg', date: '2026-09-10' },
    { id: '4', name: 'logo-transparent.png', url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=300', size: '450 KB', type: 'image/png', date: '2026-09-08' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Media Library</h1>
          <p className="text-slate-500">Manage images and assets for products, services, and the storefront.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="control-button-primary shadow-sm h-10 px-4">
            <UploadCloud className="w-4 h-4 mr-2" /> Upload Assets
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search files..." 
            className="control-input pl-9 h-10 w-full"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="control-button-secondary h-10 px-3 w-full md:w-auto">
            <Filter className="w-4 h-4 mr-2 text-slate-500" /> Filter
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
        <FileImage className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900 mb-1">Architecture Preview</h4>
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            This is the UI shell for the Media Library. Actual file uploading and storage requires configuring an S3 bucket or local file backend API which is currently pending.
          </p>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {/* Upload Dropzone */}
        <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-slate-500 cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-5 h-5 text-slate-700" />
          </div>
          <span className="font-medium text-sm">Drop files here</span>
        </div>

        {/* Existing Assets */}
        {mediaAssets.map((asset) => (
          <div key={asset.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100">
            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <p className="text-white font-medium text-sm truncate">{asset.name}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-white/70 text-xs">{asset.size}</span>
                <button className="text-white/90 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  )
}

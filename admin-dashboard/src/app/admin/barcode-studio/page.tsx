"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../lib/api-client"
import { 
  Barcode, Printer, Settings, Check, Plus, RefreshCw, 
  Trash2, Eye, Sliders, Layers 
} from "lucide-react"
import { toast } from "sonner"

export default function BarcodeStudioPage() {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [presets, setPresets] = useState<any[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState("38x25mm")

  // Selected Items to print
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [previewLabels, setPreviewLabels] = useState<any[]>([])

  // Layout Toggles
  const [showStoreName, setShowStoreName] = useState(true)
  const [showPrice, setShowPrice] = useState(true)
  const [showSku, setShowSku] = useState(true)
  const [showComparePrice, setShowComparePrice] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [presetsRes, productsRes] = await Promise.all([
        api.get("/admin/barcode-studio/presets"),
        api.get("/api/storefront/catalog/products"),
      ])
      setPresets(presetsRes.data?.presets || [])
      const prods = productsRes.data || []
      setProducts(prods)

      // Preselect first 2 products for quick start
      if (prods.length > 0) {
        setSelectedItems([
          { productId: prods[0].id, name: prods[0].name, price: prods[0].sellingPrice, copies: 4 },
          ...(prods[1] ? [{ productId: prods[1].id, name: prods[1].name, price: prods[1].sellingPrice, copies: 2 }] : [])
        ])
      }
    } catch (err) {
      console.error("Failed to load barcode studio data:", err)
      toast.error("Failed to load products or presets")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBatch = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please add at least one product to print")
      return
    }

    setGenerating(true)
    try {
      const res = await api.post("/admin/barcode-studio/generate-batch", {
        presetId: selectedPresetId,
        items: selectedItems.map(item => ({
          productId: item.productId,
          copies: item.copies,
          showBrandName: showStoreName,
          showPrice: showPrice,
          showMrpDiscount: showComparePrice,
          showVariantAttributes: true,
        })),
      })

      setPreviewLabels(res.data?.labels || [])
      toast.success(`Generated ${res.data?.totalLabels} barcode stickers ready for printing!`)
    } catch (err) {
      toast.error("Failed to generate barcode batch")
    } finally {
      setGenerating(false)
    }
  }

  const handleAddItem = (prod: any) => {
    const existing = selectedItems.find(i => i.productId === prod.id)
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.productId === prod.id ? { ...i, copies: i.copies + 1 } : i))
    } else {
      setSelectedItems([...selectedItems, { productId: prod.id, name: prod.name, price: prod.sellingPrice, copies: 2 }])
    }
    toast.success(`Added "${prod.name}"`)
  }

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#04BBFD]/20 text-[#04BBFD] rounded-lg">
              <Barcode className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#04BBFD]">
              Retail POS & Warehouse Tagging
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Thermal Barcode & Label Design Studio</h1>
          <p className="text-slate-400 text-xs mt-1">
            Generate Code-128 barcode stickers for 38x25mm thermal rolls, 50x30mm apparel tags, and 40-up A4 laser sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            disabled={previewLabels.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {previewLabels.length} Labels</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls & Product Picker (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Selector */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#04BBFD]" />
              <span>Label Dimensions & Printer Type</span>
            </h3>

            <div className="space-y-2">
              {presets.map((preset) => (
                <label
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedPresetId === preset.id
                      ? "border-[#04BBFD] bg-sky-50/50 shadow-xs"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="preset"
                    checked={selectedPresetId === preset.id}
                    onChange={() => setSelectedPresetId(preset.id)}
                    className="mt-1 text-[#04BBFD] focus:ring-[#04BBFD]"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{preset.name}</div>
                    <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{preset.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Layout Options */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">Label Visual Fields</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded text-[#04BBFD]"
                />
                <span className="font-semibold text-slate-700">Store Name</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded text-[#04BBFD]"
                />
                <span className="font-semibold text-slate-700">Selling Price ৳</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded text-[#04BBFD]"
                />
                <span className="font-semibold text-slate-700">Barcode Text / SKU</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={showComparePrice}
                  onChange={(e) => setShowComparePrice(e.target.checked)}
                  className="rounded text-[#04BBFD]"
                />
                <span className="font-semibold text-slate-700">MRP / Regular Price</span>
              </label>
            </div>
          </div>

          {/* Selected Queue */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Selected Products Queue</h3>
              <span className="text-xs font-bold text-slate-400">
                {selectedItems.length} Products
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500">৳{item.price} each</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={item.copies}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1
                        setSelectedItems(selectedItems.map(i => i.productId === item.productId ? { ...i, copies: val } : i))
                      }}
                      className="w-12 bg-white border border-slate-200 rounded-lg p-1 text-center font-bold text-xs"
                    />
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateBatch}
              disabled={generating || selectedItems.length === 0}
              className="w-full py-3 bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#04BBFD]/20 cursor-pointer disabled:opacity-50"
            >
              {generating ? "Generating..." : "⚡ Generate Barcode Preview Batch"}
            </button>
          </div>
        </div>

        {/* Right: Live On-Screen Preview & Printable Canvas (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">Live Thermal Preview Canvas</h2>
              <p className="text-[11px] text-slate-400">Exact pixel dimensions based on {selectedPresetId}</p>
            </div>
            <button
              onClick={handleGenerateBatch}
              className="text-xs font-bold text-[#04BBFD] hover:underline"
            >
              Update Preview
            </button>
          </div>

          {previewLabels.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Barcode className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-xs">Click "Generate Barcode Preview Batch" to render thermal labels.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[650px] overflow-y-auto p-2 bg-slate-100/70 rounded-2xl">
              {previewLabels.map((lbl, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-black rounded-lg p-2.5 flex flex-col justify-between text-center font-mono text-black shadow-xs select-none"
                  style={{
                    minHeight: selectedPresetId === "38x25mm" ? "120px" : "150px",
                  }}
                >
                  {lbl.showBrandName && (
                    <div className="text-[9px] font-black uppercase tracking-tight truncate">
                      {lbl.storeName}
                    </div>
                  )}

                  <div className="text-[10px] font-extrabold leading-tight line-clamp-2 my-1">
                    {lbl.productTitle}
                  </div>

                  {/* SVG / CSS Barcode bars */}
                  <div className="my-1.5 py-1 bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-[2px] h-7 w-full overflow-hidden px-1">
                      {[...Array(28)].map((_, i) => (
                        <span
                          key={i}
                          className="bg-black inline-block h-full"
                          style={{
                            width: (i % 3 === 0 ? "2px" : i % 5 === 0 ? "3px" : "1px"),
                            marginRight: (i % 4 === 0 ? "1px" : "0px"),
                          }}
                        />
                      ))}
                    </div>
                    {lbl.showPrice && (
                      <span className="text-[9px] font-bold tracking-widest text-slate-700">
                        *{lbl.sku}*
                      </span>
                    )}
                  </div>

                  {lbl.showPrice && (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-black">
                      <span>৳{lbl.price.toLocaleString()}</span>
                      {lbl.comparePrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ৳{lbl.comparePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

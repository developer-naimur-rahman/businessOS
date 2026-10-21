"use client"
import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Printer, FileText, Image as ImageIcon, Sparkles, 
  UploadCloud, CheckCircle2, ArrowRight, ShieldCheck, 
  Clock, Info, FileSpreadsheet, Trash2, Layers, Sliders
} from "lucide-react"
import { useCartStore } from "../../../store/useCartStore"
import { toast } from "sonner"

type PrintCategory = "documents" | "photos" | "banners" | "business_cards" | "binding"

export default function PrintingServicePage() {
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)

  // Service Type
  const [activeCategory, setActiveCategory] = useState<PrintCategory>("documents")

  // Documents Config
  const [docPaperSize, setDocPaperSize] = useState<"A4" | "A3" | "Legal">("A4")
  const [docColorMode, setDocColorMode] = useState<"bw" | "color">("bw")
  const [docPaperType, setDocPaperType] = useState<"70gsm" | "80gsm" | "100gsm">("70gsm")
  const [docSides, setDocSides] = useState<"single" | "double">("single")
  const [docPages, setDocPages] = useState<number>(10)
  const [docCopies, setDocCopies] = useState<number>(1)

  // Photos Config
  const [photoSize, setPhotoSize] = useState<"passport" | "4R" | "5R" | "8R" | "12R">("4R")
  const [photoPaper, setPhotoPaper] = useState<"glossy" | "matte">("glossy")
  const [photoCopies, setPhotoCopies] = useState<number>(4)

  // Banner Config
  const [bannerWidth, setBannerWidth] = useState<number>(6) // feet
  const [bannerHeight, setBannerHeight] = useState<number>(3) // feet
  const [bannerMaterial, setBannerMaterial] = useState<"standard_pvc" | "high_density_pvc">("standard_pvc")
  const [bannerFinishing, setBannerFinishing] = useState<"eyelets" | "pockets" | "cut_to_size">("eyelets")
  const [bannerQty, setBannerQty] = useState<number>(1)

  // Business Cards Config
  const [cardQuantity, setCardQuantity] = useState<number>(100) // 100, 200, 500, 1000
  const [cardSides, setCardSides] = useState<"single" | "double">("double")
  const [cardLamination, setCardLamination] = useState<"matte" | "glossy" | "none">("matte")

  // Book Binding Config
  const [bindingType, setBindingType] = useState<"spiral" | "wire" | "hardcover" | "tape">("spiral")
  const [bindingPages, setBindingPages] = useState<number>(50)
  const [bindingCopies, setBindingCopies] = useState<number>(1)

  // Files & Instructions
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([])
  const [notes, setNotes] = useState<string>("")

  // Calculate prices in BDT (৳)
  const calculatedPrice = useMemo(() => {
    if (activeCategory === "documents") {
      let perPage = docColorMode === "bw" ? 3 : 15
      if (docPaperSize === "A3") perPage *= 2.2
      if (docPaperSize === "Legal") perPage *= 1.2
      if (docPaperType === "80gsm") perPage += 1
      if (docPaperType === "100gsm") perPage += 3
      if (docSides === "double") perPage = perPage * 0.85 * 2 // slight discount for duplex

      return Math.max(10, Math.round(perPage * docPages * docCopies))
    }

    if (activeCategory === "photos") {
      const priceMap: Record<string, number> = {
        passport: 15,
        "4R": 25,
        "5R": 45,
        "8R": 120,
        "12R": 300
      }
      const unit = priceMap[photoSize] || 25
      return Math.round(unit * photoCopies)
    }

    if (activeCategory === "banners") {
      const sqft = Math.max(1, bannerWidth * bannerHeight)
      const perSqft = bannerMaterial === "high_density_pvc" ? 45 : 30
      let finishingCost = bannerFinishing === "eyelets" ? 50 : 20
      return Math.round((sqft * perSqft + finishingCost) * bannerQty)
    }

    if (activeCategory === "business_cards") {
      let base = (cardQuantity / 100) * 350
      if (cardSides === "double") base += (cardQuantity / 100) * 150
      if (cardLamination !== "none") base += (cardQuantity / 100) * 80
      return Math.round(base)
    }

    if (activeCategory === "binding") {
      const bindingCosts: Record<string, number> = {
        tape: 30,
        spiral: 60,
        wire: 90,
        hardcover: 350
      }
      const costPerBook = bindingCosts[bindingType] + Math.round(bindingPages * 2.5)
      return Math.round(costPerBook * bindingCopies)
    }

    return 100
  }, [
    activeCategory, docPaperSize, docColorMode, docPaperType, docSides, docPages, docCopies,
    photoSize, photoCopies, bannerWidth, bannerHeight, bannerMaterial, bannerFinishing, bannerQty,
    cardQuantity, cardSides, cardLamination, bindingType, bindingPages, bindingCopies
  ])

  // File Upload Simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newItems = Array.from(files).map(f => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + " MB"
      }))
      setUploadedFiles(prev => [...prev, ...newItems])
      toast.success(`Attached ${files.length} file(s) successfully`)
    }
  }

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const getJobTitle = () => {
    switch (activeCategory) {
      case "documents":
        return `Custom Document Printing (${docPaperSize}, ${docColorMode.toUpperCase()}, ${docPages} pages x ${docCopies} copies)`
      case "photos":
        return `Photo Studio Print (${photoSize.toUpperCase()} ${photoPaper}, ${photoCopies} copies)`
      case "banners":
        return `Vinyl Banner Print (${bannerWidth}ft x ${bannerHeight}ft, ${bannerQty} pcs)`
      case "business_cards":
        return `Custom Business Cards (${cardQuantity} pcs, ${cardSides === "double" ? "Double" : "Single"} Sided)`
      case "binding":
        return `Book Binding & Print (${bindingType.toUpperCase()} Binding, ${bindingPages} pages x ${bindingCopies} copies)`
    }
  }

  const handleAddToCart = () => {
    const title = getJobTitle()
    addItem({
      productId: `print-${activeCategory}-${Date.now()}`,
      name: title,
      price: calculatedPrice,
      quantity: 1,
      type: "SERVICE",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop"
    })

    toast.success("Printing job added to cart!", {
      description: `Job: ${title} — ৳${calculatedPrice.toLocaleString()}`,
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart")
      }
    })
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 md:py-16 animate-in fade-in duration-500">
      
      {/* Hero Header */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-[#04BBFD] text-xs font-bold uppercase tracking-wider mb-4 border border-[#04BBFD]/20">
          <Printer className="w-4 h-4" /> Professional Printing Studio
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          Online Printing & Reproduction
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Order high-resolution document prints, banners, ID cards, photo portraits, and thesis binding. Upload your files, customize specifications, get instant pricing, and order online.
        </p>
      </div>

      {/* Service Category Tabs */}
      <div className="flex overflow-x-auto gap-3 pb-4 mb-10 no-scrollbar justify-start sm:justify-center">
        {[
          { id: "documents", label: "Documents & Photocopy", icon: FileText },
          { id: "photos", label: "Photo Studio", icon: ImageIcon },
          { id: "banners", label: "Banners & Posters", icon: Sliders },
          { id: "business_cards", label: "Business Cards", icon: Layers },
          { id: "binding", label: "Book & Thesis Binding", icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as PrintCategory)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shrink-0 transition-all ${
                isActive 
                  ? "bg-[#04BBFD] text-white shadow-lg shadow-[#04BBFD]/25 scale-[1.02]" 
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/70"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Configuration Forms */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-8">
          
          {/* 1. DOCUMENT PRINTING */}
          {activeCategory === "documents" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#04BBFD]" /> Document Specifications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Paper Size</label>
                  <select 
                    value={docPaperSize} 
                    onChange={e => setDocPaperSize(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="A4">A4 (210 x 297 mm) — Standard</option>
                    <option value="Legal">Legal (8.5 x 14 in) — Official</option>
                    <option value="A3">A3 (297 x 420 mm) — Large Sheet</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Color Mode</label>
                  <select 
                    value={docColorMode} 
                    onChange={e => setDocColorMode(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="bw">Black & White (Laser Sharp)</option>
                    <option value="color">Full Color (High Fidelity)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Paper Quality / Weight</label>
                  <select 
                    value={docPaperType} 
                    onChange={e => setDocPaperType(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="70gsm">70 GSM — Everyday Copy Paper</option>
                    <option value="80gsm">80 GSM — Premium Executive Paper</option>
                    <option value="100gsm">100 GSM — Heavy Presentation Paper</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Print Sides</label>
                  <select 
                    value={docSides} 
                    onChange={e => setDocSides(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="single">Single-Sided (Simplex)</option>
                    <option value="double">Double-Sided (Duplex — 15% discount)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Number of Pages per Copy</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5000"
                    value={docPages} 
                    onChange={e => setDocPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="control-input w-full h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Number of Sets / Copies</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000"
                    value={docCopies} 
                    onChange={e => setDocCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="control-input w-full h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. PHOTO STUDIO */}
          {activeCategory === "photos" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#04BBFD]" /> Photo Studio Print Options
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Print Size</label>
                  <select 
                    value={photoSize} 
                    onChange={e => setPhotoSize(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="passport">Passport Size (45 x 35 mm)</option>
                    <option value="4R">4R (4 x 6 in) — Classic Album</option>
                    <option value="5R">5R (5 x 7 in) — Portrait</option>
                    <option value="8R">8R (8 x 10 in) — Frame Size</option>
                    <option value="12R">12R (12 x 18 in) — Large Portrait</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Paper Finish</label>
                  <select 
                    value={photoPaper} 
                    onChange={e => setPhotoPaper(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="glossy">Glossy (Vibrant & Reflective)</option>
                    <option value="matte">Matte (Anti-glare, Fine Texture)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Quantity (Photos)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="500"
                    value={photoCopies} 
                    onChange={e => setPhotoCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="control-input w-full h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. BANNERS & POSTERS */}
          {activeCategory === "banners" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#04BBFD]" /> Large Format Banner & Signage
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Width (Feet)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={bannerWidth} 
                    onChange={e => setBannerWidth(Math.max(1, parseInt(e.target.value) || 1))}
                    className="control-input w-full h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Height (Feet)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={bannerHeight} 
                    onChange={e => setBannerHeight(Math.max(1, parseInt(e.target.value) || 1))}
                    className="control-input w-full h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Substrate Material</label>
                  <select 
                    value={bannerMaterial} 
                    onChange={e => setBannerMaterial(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="standard_pvc">Standard Flex Banner (300 GSM)</option>
                    <option value="high_density_pvc">Heavy Duty Star PVC Banner (440 GSM)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Finishing & Mounting</label>
                  <select 
                    value={bannerFinishing} 
                    onChange={e => setBannerFinishing(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="eyelets">Brass Eyelets / Grommets in Corners</option>
                    <option value="pockets">Pole Pockets (Top & Bottom)</option>
                    <option value="cut_to_size">Plain Cut to Border</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={bannerQty} 
                    onChange={e => setBannerQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="control-input w-full h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. BUSINESS CARDS */}
          {activeCategory === "business_cards" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#04BBFD]" /> Business Card Options
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Card Count</label>
                  <select 
                    value={cardQuantity} 
                    onChange={e => setCardQuantity(parseInt(e.target.value))}
                    className="control-input w-full h-11"
                  >
                    <option value="100">100 Cards</option>
                    <option value="200">200 Cards</option>
                    <option value="500">500 Cards</option>
                    <option value="1000">1000 Cards</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Sides</label>
                  <select 
                    value={cardSides} 
                    onChange={e => setCardSides(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="single">Single Sided</option>
                    <option value="double">Double Sided</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Lamination</label>
                  <select 
                    value={cardLamination} 
                    onChange={e => setCardLamination(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="matte">Velvet Matte</option>
                    <option value="glossy">High Gloss</option>
                    <option value="none">No Lamination</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. BOOK BINDING */}
          {activeCategory === "binding" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#04BBFD]" /> Book & Thesis Binding Options
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Binding Style</label>
                  <select 
                    value={bindingType} 
                    onChange={e => setBindingType(e.target.value as any)}
                    className="control-input w-full h-11"
                  >
                    <option value="spiral">Plastic Spiral Binding</option>
                    <option value="wire">Metal Wire-O Binding</option>
                    <option value="tape">Tape / Strip Binding</option>
                    <option value="hardcover">Hardcover Golden Embossed (Thesis)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Pages per Book</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="1000"
                    value={bindingPages} 
                    onChange={e => setBindingPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="control-input w-full h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Number of Copies</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={bindingCopies} 
                    onChange={e => setBindingCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="control-input w-full h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#04BBFD]" /> Attach Your Document / Design Files
            </h3>

            <label className="border-2 border-dashed border-slate-200 hover:border-[#04BBFD] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-sky-50/30 group">
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-[#04BBFD] transition-colors mb-2" />
              <span className="text-sm font-semibold text-slate-800">
                Click to browse files or drag & drop here
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports PDF, DOCX, PSD, AI, JPG, PNG (Max 50MB)
              </span>
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attached Files ({uploadedFiles.length})</p>
                <div className="space-y-1.5">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-sm">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-[#04BBFD] shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{f.name}</span>
                        <span className="text-xs text-slate-400">({f.size})</span>
                      </div>
                      <button 
                        onClick={() => removeFile(i)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes / Instructions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Special Instructions or Notes</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Please print page 1-5 in color and remaining in B&W, bind from left edge."
              className="control-input w-full h-24 py-2 resize-none"
            />
          </div>

        </div>

        {/* Right Column: Instant Price Summary & Cart Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 sticky top-36">
            
            <div className="pb-5 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Estimated Cost</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  ৳{calculatedPrice.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">BDT incl. taxes</span>
              </div>
            </div>

            {/* Summary specifications */}
            <div className="space-y-3 text-sm">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Job Specification</h4>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-slate-700">
                <p className="font-semibold text-slate-900 text-sm leading-snug">{getJobTitle()}</p>
                <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200/60">
                  <p>• Category: {activeCategory.replace('_', ' ').toUpperCase()}</p>
                  <p>• Files attached: {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : "None (Can provide via email or WhatsApp)"}</p>
                  <p>• Production timeline: Usually ready within 2-4 hours</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button 
                onClick={handleAddToCart}
                className="w-full bg-[#04BBFD] hover:bg-[#03a0d9] text-white h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#04BBFD]/25 hover:shadow-xl transition-all interactive-item"
              >
                Add Printing Job to Cart <ArrowRight className="w-5 h-5" />
              </button>
              
              <Link 
                href="/contact" 
                className="w-full block text-center py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Need custom bulk quotation? Contact Us
              </Link>
            </div>

            {/* Guarantees */}
            <div className="pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Heavy-duty commercial laser & inkjet reproduction</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Same-day store pickup or express city delivery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Confidential document handling guarantee</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  )
}

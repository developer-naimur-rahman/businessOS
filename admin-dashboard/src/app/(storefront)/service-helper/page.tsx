"use client"
import React, { useEffect, useState, useMemo, Suspense } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  HelpCircle,
  FileText,
  CheckSquare,
  Square,
  Camera,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
  Download,
  Calendar,
  ShieldCheck,
  SendHorizontal,
  ChevronRight
} from "lucide-react"

function ServiceHelperContent() {
  const searchParams = useSearchParams()
  const initialSlug = searchParams.get("service") || "teletalk-govt-job"

  const [services, setServices] = useState<any[]>([])
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)
  const [loading, setLoading] = useState(true)

  // Checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  // AI Assistant Chat State
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; action?: any }>>([
    {
      role: 'assistant',
      text: 'স্বাগতম! আমি বিজনেস ওএস স্মার্ট সার্ভিস অ্যাসিস্ট্যান্ট। সরকারি ফি, ছবির সাইজ, বা প্রয়োজনীয় কাগজপত্র সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।'
    }
  ])
  const [inputQuery, setInputQuery] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // In-Browser Photo Resizer Tool State
  const [photoToolOpen, setPhotoToolOpen] = useState(false)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [processedPhotoUrl, setProcessedPhotoUrl] = useState<string | null>(null)
  const [resizingPreset, setResizingPreset] = useState<'300x300' | '300x80' | 'passport'>('300x300')

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await api.get('/public/services')
        if (Array.isArray(res.data) && res.data.length > 0) {
          setServices(res.data)
        }
      } catch (e) {
        console.error("Failed to load services", e)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  const currentService = useMemo(() => {
    if (!services || services.length === 0) return null
    return services.find(s => s.slug === selectedSlug) || services[0]
  }, [services, selectedSlug])

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  // AI Chat Submission
  const handleAskAi = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim()
    if (!q) return

    const newMsgs = [...messages, { role: 'user' as const, text: q }]
    setMessages(newMsgs)
    setInputQuery("")
    setAiLoading(true)

    try {
      const res = await api.post('/public/service-assistant/ask', {
        query: q,
        serviceSlug: currentService?.slug,
      })

      const data = res.data
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: data.replyBn,
          action: data.recommendedAction,
        }
      ])
    } catch (err: any) {
      toast.error("AI অ্যাসিস্ট্যান্ট সংযোগে সমস্যা হয়েছে।")
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: 'দুঃখিত, সংযোগে সাময়িক সমস্যা হচ্ছে। দয়া করে একটু পর আবার চেষ্টা করুন অথবা সরাসরি আমাদের শপে আসুন।'
        }
      ])
    } finally {
      setAiLoading(false)
    }
  }

  // Voice Speech Recognition Fallback
  const handleVoiceToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.info("আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট নেই। অনুগ্রহ করে টাইপ করুন।")
      return
    }

    if (isRecording) {
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'bn-BD'
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsRecording(true)
        toast.info("শুনছি... আপনার প্রশ্নটি মুখে বলুন।")
      }

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript
        setIsRecording(false)
        if (spoken) {
          setInputQuery(spoken)
          handleAskAi(spoken)
        }
      }

      recognition.onerror = () => {
        setIsRecording(false)
        toast.error("ভয়েস শোনা সম্ভব হয়নি। টাইপ করে প্রশ্ন করুন।")
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } catch (e) {
      setIsRecording(false)
      toast.error("মাইক্রোফোন চালু করা যায়নি।")
    }
  }

  // Client-Side Canvas Photo Resizer
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedPhotoUrl(event.target?.result as string)
      processImagePreset(event.target?.result as string, resizingPreset)
    }
    reader.readAsDataURL(file)
  }

  const processImagePreset = (imgSrc: string, preset: '300x300' | '300x80' | 'passport') => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      let targetW = 300
      let targetH = 300
      let maxKb = 100

      if (preset === '300x80') {
        targetW = 300
        targetH = 80
        maxKb = 60
      } else if (preset === 'passport') {
        targetW = 413 // ~35mm at 300dpi
        targetH = 531 // ~45mm at 300dpi
        maxKb = 300
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Fill white background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, targetW, targetH)

      // Center and fit
      const scale = Math.max(targetW / img.width, targetH / img.height)
      const x = (targetW / 2) - (img.width / 2) * scale
      const y = (targetH / 2) - (img.height / 2) * scale

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

      const resizedData = canvas.toDataURL('image/jpeg', 0.9)
      setProcessedPhotoUrl(resizedData)
      toast.success(`ছবি সফলভাবে ${targetW}x${targetH} পিক্সেল প্রিসেটে রিসাইজ হয়েছে!`)
    }
    img.src = imgSrc
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-20 text-center animate-pulse">
        <div className="h-10 bg-slate-200 rounded-full w-64 mx-auto mb-6"></div>
        <div className="h-64 bg-slate-100 rounded-3xl max-w-4xl mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 md:py-14 animate-in fade-in duration-500">
      
      {/* Header Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/services" className="hover:text-cyan-600 transition-colors">সার্ভিস ডিরেক্টরি</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900">স্মার্ট রিকোয়ারমেন্ট গাইড</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            স্মার্ট রিকোয়ারমেন্ট ও প্রস্তুতি গাইড
          </h1>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-3">
          <Link
            href={`/service-request?service=${currentService?.slug}`}
            className="px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
          >
            <SendHorizontal className="w-4 h-4" />
            আবেদন শুরু করুন
          </Link>
          <Link
            href={`/appointments?service=${currentService?.slug}`}
            className="px-5 py-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-sm inline-flex items-center gap-2 transition-all"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            অ্যাপয়েন্টমেন্ট নিন
          </Link>
        </div>
      </div>

      {/* Service Selector Tabs */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2">
          {services.map((s) => (
            <button
              key={s.slug}
              onClick={() => { setSelectedSlug(s.slug); setCheckedItems({}); }}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedSlug === s.slug
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{s.titleBn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Detailed Guide, Right Assistant & Photo Tool */}
      {currentService && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (8 cols): Service Details, Document Requirements, Checklist, Preparation */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Service Summary Banner */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-800 text-xs font-bold uppercase tracking-wider">
                    {currentService.targetAudience}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                    {currentService.titleBn}
                  </h2>
                  <p className="text-sm font-medium text-slate-400 mt-0.5">
                    {currentService.titleEn}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-right">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">সর্বমোট খরচ</span>
                  <div className="text-2xl font-black text-slate-900">
                    ৳{(currentService.officialGovtFeeBdt + currentService.shopServiceChargeBdt).toLocaleString()}
                  </div>
                  <span className="text-xs text-slate-500 block">
                    (সরকারি ফি: ৳{currentService.officialGovtFeeBdt} + সার্ভিস: ৳{currentService.shopServiceChargeBdt})
                  </span>
                </div>
              </div>

              <p className="text-slate-600 text-base leading-relaxed">
                {currentService.descriptionBn}
              </p>

              {/* Meta Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-400 font-medium block">প্রসেসিং সময়</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    {currentService.estimatedProcessingTime}
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-400 font-medium block">আবেদনের মাধ্যম</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    অনলাইন / শপ ভিজিট
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-400 font-medium block">অফিসিয়াল পোর্টাল</span>
                  <a
                    href={currentService.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-cyan-700 hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    {currentService.officialSourceTitle}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Required Documents Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    প্রয়োজনীয় ডকুমেন্টস ও ফাইল
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    নিচের ডকুমেন্টসগুলো পরিষ্কারভাবে স্ক্যান বা মোবাইল দিয়ে ছবি তুলে প্রস্তুত রাখুন।
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                  {currentService.requiredDocs?.length || 0} টি ডকুমেন্ট
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentService.requiredDocs?.map((doc: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-white hover:border-indigo-200 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900">{doc.nameBn}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        doc.type === 'ORIGINAL'
                          ? 'bg-amber-100 text-amber-800'
                          : doc.type === 'PHOTO'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {doc.type === 'ORIGINAL' ? 'মূল কপি' : doc.type === 'PHOTO' ? 'রঙিন ছবি' : 'স্ক্যান কপি'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{doc.nameEn}</p>
                    {doc.notesBn && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                        ⚠️ {doc.notesBn}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>ফরম্যাট: {doc.acceptedFormats?.map((f: string) => f.split('/')[1]?.toUpperCase()).join(', ')}</span>
                      <span>ম্যাক্স সাইজ: {Math.round(doc.maxSizeBytes / 1024 / 1024)} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo & Signature Specs Section */}
            {(currentService.photoSpecs || currentService.signatureSpecs) && (
              <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 border border-cyan-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Camera className="w-5 h-5 text-cyan-400" />
                      ছবি ও স্বাক্ষরের নির্ধারিত সাইজ স্পেসিফিকেশন
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      সরকারি পোর্টালে এই মাপের বাইরে কোনো ফাইল আপলোড করা সম্ভব নয়।
                    </p>
                  </div>
                  <button
                    onClick={() => setPhotoToolOpen(!photoToolOpen)}
                    className="px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {photoToolOpen ? 'টুল বন্ধ করুন' : 'ফটো রিসাইজার খুলুন'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {currentService.photoSpecs && (
                    <div className="bg-white/10 p-5 rounded-2xl border border-white/10 space-y-3">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">রঙিন ছবির মাপ</span>
                      <div className="text-3xl font-black text-white">
                        {currentService.photoSpecs.widthPx} × {currentService.photoSpecs.heightPx} px
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p>• সর্বোচ্চ ফাইল সাইজ: <strong>{currentService.photoSpecs.maxKb} KB</strong></p>
                        <p>• ব্যাকগ্রাউন্ড: <strong>{currentService.photoSpecs.bgColor}</strong></p>
                        <p>• বিবরণ: {currentService.photoSpecs.notesBn}</p>
                      </div>
                    </div>
                  )}

                  {currentService.signatureSpecs && (
                    <div className="bg-white/10 p-5 rounded-2xl border border-white/10 space-y-3">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">ডিজিটাল স্বাক্ষরের মাপ</span>
                      <div className="text-3xl font-black text-white">
                        {currentService.signatureSpecs.widthPx} × {currentService.signatureSpecs.heightPx} px
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p>• সর্বোচ্চ ফাইল সাইz: <strong>{currentService.signatureSpecs.maxKb} KB</strong></p>
                        <p>• বিবরণ: {currentService.signatureSpecs.notesBn}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* In-Browser Interactive Photo Resizer Tool */}
                {photoToolOpen && (
                  <div className="bg-slate-900/90 p-5 rounded-2xl border border-cyan-500/40 space-y-4 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-sm font-bold text-cyan-300">📸 তাত্ক্ষণিক ফটো রিসাইজার (Browser-Based Canvas)</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setResizingPreset('300x300'); if (uploadedPhotoUrl) processImagePreset(uploadedPhotoUrl, '300x300'); }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${resizingPreset === '300x300' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-white/10 text-white'}`}
                        >
                          300x300 (Job)
                        </button>
                        <button
                          onClick={() => { setResizingPreset('300x80'); if (uploadedPhotoUrl) processImagePreset(uploadedPhotoUrl, '300x80'); }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${resizingPreset === '300x80' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-white/10 text-white'}`}
                        >
                          300x80 (Signature)
                        </button>
                        <button
                          onClick={() => { setResizingPreset('passport'); if (uploadedPhotoUrl) processImagePreset(uploadedPhotoUrl, 'passport'); }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${resizingPreset === 'passport' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-white/10 text-white'}`}
                        >
                          Passport (45x35mm)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-300 block font-medium">আপনার ছবি নির্বাচন করুন:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                        />
                      </div>

                      {processedPhotoUrl && (
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                          <img src={processedPhotoUrl} alt="Processed preview" className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-300" />
                          <div className="text-right">
                            <span className="text-xs text-emerald-400 block font-bold">✓ প্রস্তুত!</span>
                            <a
                              href={processedPhotoUrl}
                              download={`resized-${resizingPreset}.jpg`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold mt-1 shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" /> ডাউনলোড
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preparation Instructions & Common Mistakes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Common Mistakes */}
              <div className="bg-rose-50/60 p-6 rounded-3xl border border-rose-200/80 space-y-4">
                <h4 className="text-base font-bold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  সাধারণ ভুলসমূহ (সতর্কতা)
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-rose-950">
                  {currentService.commonMistakesBn?.map((m: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What to bring to the physical shop */}
              <div className="bg-emerald-50/60 p-6 rounded-3xl border border-emerald-200/80 space-y-4">
                <h4 className="text-base font-bold text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  দোকানে আসলে সাথে যা যা আনবেন
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-950">
                  {currentService.whatToBringToShopBn?.map((b: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Interactive Checklist Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-cyan-600" />
                    আপনার প্রস্তুতি চেকলিস্ট
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    আবেদনে বসার আগে নিচের ধাপগুলো নিশ্চিত করে টিক চিহ্ন দিন।
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {Object.values(checkedItems).filter(Boolean).length} / {currentService.checklistItemsBn?.length || 0} সম্পন্ন
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                {currentService.checklistItemsBn?.map((item: string, i: number) => {
                  const isChecked = !!checkedItems[i]
                  return (
                    <div
                      key={i}
                      onClick={() => toggleCheck(i)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isChecked
                          ? "bg-cyan-50/70 border-cyan-200 text-slate-900"
                          : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/70"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-cyan-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-medium ${isChecked ? "line-through text-slate-400" : ""}`}>
                        {item}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Bottom CTA within Guide */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  সব কাগজপত্র প্রস্তুত? এখনই অনলাইন ফরম পূরণ করুন।
                </span>
                <Link
                  href={`/service-request?service=${currentService.slug}`}
                  className="px-6 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
                >
                  অনলাইন আবেদন ফরম খুলুন <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column (4 cols): Grounded AI Service Assistant & Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AI Assistant Chat Widget */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg flex flex-col h-[600px] overflow-hidden sticky top-24">
              
              {/* Chat Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">অন-ডিমান্ড AI অ্যাসিস্ট্যান্ট</h4>
                    <span className="text-[10px] text-cyan-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ভেরিফাইড নলেজবেস গ্রাউন্ডেড
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs sm:text-sm">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl ${
                        m.role === 'user'
                          ? 'bg-slate-900 text-white rounded-br-none shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm space-y-2'
                      }`}
                    >
                      <p className="leading-relaxed">{m.text}</p>
                      {m.action && m.action.url && (
                        <Link
                          href={m.action.url}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold hover:bg-cyan-100 transition-colors"
                        >
                          {m.action.labelBn || 'বিস্তারিত দেখুন'} <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                    <Bot className="w-4 h-4 animate-spin text-cyan-600" />
                    <span>AI চিন্তা করছে ও তথ্য যাচাই করছে...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
                <button
                  onClick={() => handleAskAi("ছবির সাইজ কত লাগবে?")}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors"
                >
                  ছবির সাইজ কত?
                </button>
                <button
                  onClick={() => handleAskAi("সরকারি ফি কত?")}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors"
                >
                  সরকারি ফি কত?
                </button>
                <button
                  onClick={() => handleAskAi("দোকানে কী কী আনতে হবে?")}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors"
                >
                  দোকানে কী আনব?
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <button
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded-xl transition-all ${
                    isRecording
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="মুখে বলুন"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAskAi(); }}
                  placeholder="প্রশ্ন লিখুন বা মুখে বলুন..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
                />
                <button
                  onClick={() => handleAskAi()}
                  disabled={!inputQuery.trim() || aiLoading}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Quick Contact & Assistance Card */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">জরুরি সহায়তা প্রয়োজন?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                আমাদের ফিজিক্যাল কম্পিউটার সেন্টারের সার্ভিস ডেস্কে সরাসরি ফোন করতে পারেন অথবা সরাসরি ভিজিট করতে পারেন।
              </p>
              <div className="pt-1 flex flex-col gap-2">
                <Link
                  href="/appointments"
                  className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold text-center block shadow-sm"
                >
                  📅 অ্যাপয়েন্টমেন্ট শিডিউল বুক করুন
                </Link>
                <Link
                  href="/track"
                  className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold text-center block shadow-sm"
                >
                  🔍 পূর্বের আবেদন ট্র্যাক করুন
                </Link>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default function ServiceHelperPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto p-12 text-center text-slate-400">Loading guide...</div>}>
      <ServiceHelperContent />
    </Suspense>
  )
}

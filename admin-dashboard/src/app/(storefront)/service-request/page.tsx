"use client"
import React, { useEffect, useState, useMemo, Suspense } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  SendHorizontal,
  CheckCircle2,
  FileText,
  UploadCloud,
  ShieldCheck,
  Search,
  Sparkles,
  User,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Eye,
  Camera,
  Check,
  Edit3
} from "lucide-react"

interface ExtractedFormField {
  key: string
  labelBn: string
  labelEn: string
  value: string
  order: number
  sourceDocTitle?: string
  confidence: number
  isConflict?: boolean
  conflictDetails?: string
  verificationStatus: 'EXTRACTED' | 'MANUAL_EDIT' | 'VERIFIED_BY_STAFF' | 'MISSING'
  originalExtractedValue?: string
  isVerified?: boolean
}

function ServiceRequestContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSlug = searchParams.get("service") || "teletalk-govt-job"

  const [services, setServices] = useState<any[]>([])
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)
  // Step 1: Service & Consent, Step 2: Identity & Vault, Step 3: Document Uploads,
  // Step 4: AI Extraction & Review/Correction, Step 5: Payment & Delivery, Step 6: Success
  const [step, setStep] = useState(1)

  // Form State
  const [phone, setPhone] = useState("")
  const [vaultLookupLoading, setVaultLookupLoading] = useState(false)
  const [consentAgreed, setConsentAgreed] = useState(false)
  const [aiConsentAgreed, setAiConsentAgreed] = useState(true)

  // Applicant Profile
  const [nameEn, setNameEn] = useState("")
  const [nameBn, setNameBn] = useState("")
  const [dob, setDob] = useState("")
  const [nidNumber, setNidNumber] = useState("")
  const [fatherNameEn, setFatherNameEn] = useState("")
  const [motherNameEn, setMotherNameEn] = useState("")
  const [presentAddress, setPresentAddress] = useState("")
  const [permanentAddress, setPermanentAddress] = useState("")
  const [email, setEmail] = useState("")

  // Dynamic Service-Specific Fields & Extraction
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({})
  const [extractedFields, setExtractedFields] = useState<ExtractedFormField[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionEngine, setExtractionEngine] = useState<string | null>(null)
  const [extractionConfidence, setExtractionConfidence] = useState<number | null>(null)
  const [conflictsDetected, setConflictsDetected] = useState<any[]>([])
  const [customerConfirmedData, setCustomerConfirmedData] = useState(false)

  // Uploaded Files
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; docType: string; title: string; fileUrl: string; mimeType: string }>>([])
  const [customerNotes, setCustomerNotes] = useState("")

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'CASH_AT_COUNTER'>('BKASH')
  const [transactionId, setTransactionId] = useState("")
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState("")
  const [deliveryMode, setDeliveryMode] = useState<'ONLINE_DOWNLOAD' | 'SHOP_PICKUP' | 'COURIER'>('ONLINE_DOWNLOAD')
  const [deliveryAddress, setDeliveryAddress] = useState("")

  // Submission Result
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdRefNumber, setCreatedRefNumber] = useState<string | null>(null)

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await api.get('/public/services')
        if (Array.isArray(res.data) && res.data.length > 0) {
          setServices(res.data)
        }
      } catch (err) {
        console.error("Failed to load services", err)
      }
    }
    loadCatalog()
  }, [])

  const currentService = useMemo(() => {
    return services.find(s => s.slug === selectedSlug) || services[0]
  }, [services, selectedSlug])

  // Look up reusable profile from Customer Vault by phone
  const handleVaultLookup = async () => {
    if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
      toast.error("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।")
      return
    }

    setVaultLookupLoading(true)
    try {
      const res = await api.get('/public/customer-vault/lookup', { params: { phone } })
      if (res.data?.found && res.data?.profile) {
        const p = res.data.profile
        setNameEn(p.nameEn || "")
        setNameBn(p.nameBn || "")
        setDob(p.dob || "")
        setNidNumber(p.nidNumber || "")
        setFatherNameEn(p.fatherNameEn || "")
        setMotherNameEn(p.motherNameEn || "")
        setPresentAddress(p.presentAddress || "")
        setPermanentAddress(p.permanentAddress || "")
        toast.success("কাস্টমার ভল্ট থেকে পূর্বের সংরক্ষিত তথ্য স্বয়ংক্রিয়ভাবে প্রিপপুলেট করা হয়েছে!")
      } else {
        toast.info("ভল্টে কোনো পূর্বের তথ্য পাওয়া যায়নি। নতুন তথ্য পূরণ করুন।")
      }
    } catch (e) {
      toast.error("ভল্ট লুকআপে সমস্যা হয়েছে।")
    } finally {
      setVaultLookupLoading(false)
    }
  }

  // Handle Document Upload (converts to base64 DataURL for safe transmission)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ফাইলের সাইজ ১০ মেগাবাইটের কম হতে হবে।")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      const newDoc = {
        id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        docType,
        title: file.name,
        fileUrl: base64,
        mimeType: file.type || 'application/octet-stream',
      }
      setUploadedDocs(prev => [...prev, newDoc])
      toast.success(`${file.name} সফলভাবে যুক্ত হয়েছে!`)
    }
    reader.readAsDataURL(file)
  }

  const removeDocument = (docId: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== docId))
    toast.info("ডকুমেন্ট সরানো হয়েছে।")
  }

  // Step C & D: Trigger AI Extraction & Mapping to Service Schema
  const runAiDocumentExtraction = async () => {
    if (!currentService) return
    setIsExtracting(true)
    try {
      const payload = {
        serviceSlug: currentService.slug,
        documents: uploadedDocs,
        existingProfile: {
          nameEn: nameEn.trim(),
          nameBn: nameBn.trim(),
          dob: dob.trim(),
          nidNumber: nidNumber.trim(),
          fatherNameEn: fatherNameEn.trim(),
          motherNameEn: motherNameEn.trim(),
          presentAddress: presentAddress.trim(),
          permanentAddress: permanentAddress.trim(),
          phone: phone.trim(),
        }
      }

      const res = await api.post('/public/service-request/extract-and-map', payload)
      if (res.data?.extractedFields) {
        setExtractedFields(res.data.extractedFields)
        setExtractionEngine(res.data.engineUsed || 'ALGORITHMIC_FALLBACK')
        setExtractionConfidence(res.data.overallConfidence || 0.85)
        setConflictsDetected(res.data.conflictsDetected || [])

        // If top-level applicant values were extracted and not already filled, sync them
        for (const f of res.data.extractedFields) {
          if (f.key === 'applicantNameEn' && f.value && !nameEn) setNameEn(f.value)
          if (f.key === 'applicantNameBn' && f.value && !nameBn) setNameBn(f.value)
          if (f.key === 'dob' && f.value && !dob) setDob(f.value)
          if (f.key === 'nidNumber' && f.value && !nidNumber) setNidNumber(f.value)
          if (f.key === 'fatherNameEn' && f.value && !fatherNameEn) setFatherNameEn(f.value)
          if (f.key === 'motherNameEn' && f.value && !motherNameEn) setMotherNameEn(f.value)
          if (f.key === 'presentAddress' && f.value && !presentAddress) setPresentAddress(f.value)
          if (f.key === 'permanentAddress' && f.value && !permanentAddress) setPermanentAddress(f.value)
        }

        toast.success("AI ডকুমেন্ট থেকে তথ্য সফলভাবে নিষ্কাশন করেছে! তথ্য যাচাই করুন।")
      }
    } catch (err: any) {
      console.error("AI extraction error", err)
      toast.error("ডকুমেন্ট নিষ্কাশনে সমস্যা হয়েছে। আপনি সরাসরি ফরম পূরণ করতে পারেন।")
      // Initialize fallback fields from service schema
      if (currentService.orderedFields) {
        const fallbacks: ExtractedFormField[] = currentService.orderedFields.map((f: any) => ({
          key: f.key,
          labelBn: f.labelBn,
          labelEn: f.labelEn,
          value: '',
          order: f.order,
          confidence: 0,
          verificationStatus: 'MISSING',
        }))
        setExtractedFields(fallbacks)
      }
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle inline customer edit on extracted field
  const handleCustomerFieldEdit = (key: string, newValue: string) => {
    setExtractedFields(prev =>
      prev.map(f => {
        if (f.key === key) {
          return {
            ...f,
            value: newValue,
            verificationStatus: 'MANUAL_EDIT',
          }
        }
        return f
      })
    )

    // Sync to top-level if common identity key
    if (key === 'applicantNameEn') setNameEn(newValue)
    if (key === 'applicantNameBn') setNameBn(newValue)
    if (key === 'dob') setDob(newValue)
    if (key === 'nidNumber') setNidNumber(newValue)
    if (key === 'presentAddress') setPresentAddress(newValue)
    if (key === 'permanentAddress') setPermanentAddress(newValue)
  }

  // Resolve conflict on a field
  const handleResolveConflictInClient = (key: string, chosenValue: string) => {
    setExtractedFields(prev =>
      prev.map(f => {
        if (f.key === key) {
          return {
            ...f,
            value: chosenValue,
            isConflict: false,
            conflictDetails: undefined,
            verificationStatus: 'MANUAL_EDIT',
          }
        }
        return f
      })
    )
    toast.success("অমিল দূর করে সঠিক মান নির্বাচন করা হয়েছে।")
  }

  // Calculate Granular Financials
  const financials = useMemo(() => {
    if (!currentService) return { govtFee: 0, shopFee: 0, addon: 0, total: 0 }
    const govtFee = Number(currentService.officialGovtFeeBdt || 0)
    const shopFee = Number(currentService.shopServiceChargeBdt || 0)
    const addon = deliveryMode === 'SHOP_PICKUP' || deliveryMode === 'COURIER' ? 40 : 0
    return {
      govtFee,
      shopFee,
      addon,
      total: govtFee + shopFee + addon,
    }
  }, [currentService, deliveryMode])

  // Final Submission to Backend
  const handleSubmitApplication = async () => {
    if (!nameEn || !phone) {
      toast.error("নাম ও মোবাইল নম্বর দেওয়া বাধ্যতামূলক।")
      return
    }

    setIsSubmitting(true)
    try {
      // Build structured field values list with full provenance retention
      const finalFieldValues = extractedFields.length > 0 ? extractedFields : (currentService.orderedFields || []).map((f: any) => ({
        key: f.key,
        labelBn: f.labelBn,
        labelEn: f.labelEn,
        value: f.key === 'applicantNameEn' ? nameEn : f.key === 'dob' ? dob : f.key === 'nidNumber' ? nidNumber : dynamicFieldValues[f.key] || '',
        order: f.order,
        confidence: 0.9,
        verificationStatus: 'MANUAL_EDIT' as const,
      }))

      const payload = {
        serviceSlug: currentService.slug,
        customerName: nameEn.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        deliveryMode,
        deliveryAddress: deliveryAddress.trim() || presentAddress,
        fieldValues: finalFieldValues,
        uploadedDocuments: uploadedDocs,
        customerNotes: customerNotes || undefined,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paidAmountBdt: transactionId.trim() ? financials.total : 0,
      }

      const res = await api.post('/public/service-request', payload)
      if (res.data?.referenceNumber) {
        setCreatedRefNumber(res.data.referenceNumber)
        setStep(6) // Success step
        toast.success(`আবেদন সফলভাবে গৃহীত হয়েছে! টোকেন #${res.data.referenceNumber}`)
      }
    } catch (err: any) {
      console.error("Submission failed", err)
      toast.error(err.response?.data?.message || "আবেদন দাখিলে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-[1050px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-cyan-800/30">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 text-xs px-3 py-1 rounded-full border border-cyan-500/30 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Document-to-Application System
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            ডিজিটাল সার্ভিস ও অনলাইন আবেদন ডেস্ক
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/80 max-w-xl">
            ডকুমেন্ট আপলোড করুন। AI স্বয়ংক্রিয়ভাবে তথ্য এক্সট্র্যাক্ট করে নির্ভুল ফরম তৈরি করবে। যাচাই করে দোকানে জমা দিন।
          </p>
        </div>
        <div className="flex sm:flex-col items-center gap-2 text-xs text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-center">নিরাপদ ও এনক্রিপ্টেড ডাটা ভল্ট</span>
        </div>
      </div>

      {/* Multi-Step Wizard Progress Bar */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2 text-xs font-bold text-slate-600">
        {[
          { num: 1, title: '১. সেবা ও সম্মতি' },
          { num: 2, title: '২. গ্রাহক ভল্ট' },
          { num: 3, title: '৩. ফাইল আপলোড' },
          { num: 4, title: '৪. AI এক্সট্র্যাকশন ও রিভিউ' },
          { num: 5, title: '৫. কোটেশন ও পেমেন্ট' },
          { num: 6, title: '৬. নিশ্চিতকরণ' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              step === s.num
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                : step > s.num
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <span>{step > s.num ? "✓" : s.num}</span>
            <span>{s.title}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Service Catalog Selection & Customer Consent */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ধাপ ১: কাঙ্ক্ষিত সেবা নির্বাচন করুন</h2>
            <p className="text-xs text-slate-500 mt-0.5">সরকারি বা বেসরকারি প্রয়োজনীয় অনলাইন সেবা বেছে নিন।</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => {
              const isSelected = svc.slug === selectedSlug
              return (
                <div
                  key={svc.slug}
                  onClick={() => setSelectedSlug(svc.slug)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? "border-cyan-600 bg-cyan-50/40 shadow-md ring-2 ring-cyan-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-100/60 px-2 py-0.5 rounded-md">
                        {svc.category}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{svc.titleBn}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{svc.descriptionBn}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">সরকারি ফি: ৳{svc.officialGovtFeeBdt || 0}</span>
                    <span className="font-bold text-cyan-800">চার্জ: ৳{svc.shopServiceChargeBdt || 0}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Customer Data Processing Consent (Section 7 Requirement) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              ব্যক্তিগত তথ্য প্রক্রিয়াকরণ সম্মতি (Data Privacy Consent)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার আপলোডকৃত জাতীয় পরিচয়পত্র, ছবি ও আবেদন সংশ্লিষ্ট কাগজপত্র কেবলমাত্র এই অনলাইন আবেদন ফরমটি নির্ভুলভাবে পূরণ করার উদ্দেশ্যে স্বয়ংক্রিয়ভাবে প্রক্রিয়াকরণ করা হবে। আপনার তথ্য সুরক্ষিত থাকবে এবং কোনো সরকারি পাসওয়ার্ড বা ওটিপি সংরক্ষণ করা হবে না।
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                আমি ব্যক্তিগত তথ্য প্রক্রিয়াকরণ ও আবেদন ফরম পূরণে আমার সম্মতি প্রদান করছি। *
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (!consentAgreed) {
                  toast.error("পরবর্তী ধাপে যেতে তথ্য প্রক্রিয়াকরণ সম্মতি প্রদান করুন।")
                  return
                }
                setStep(2)
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ (গ্রাহক পরিচিতি) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Customer Identity & Vault Lookup */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">ধাপ ২: আবেদনকারীর পরিচিতি ও কাস্টমার ভল্ট</h2>
              <p className="text-xs text-slate-500 mt-0.5">মোবাইল নম্বর দিলে সংরক্ষিত পূর্বের ভেরিফাইড তথ্য চলে আসবে।</p>
            </div>
            <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
              নির্বাচিত সেবা: {currentService?.titleBn}
            </span>
          </div>

          {/* Phone & Vault Lookup Bar */}
          <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-100 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-slate-700 block mb-1">মোবাইল নম্বর (Phone Number) *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-cyan-500 text-sm font-semibold"
              />
            </div>
            <button
              type="button"
              onClick={handleVaultLookup}
              disabled={vaultLookupLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold self-end inline-flex items-center justify-center gap-2 transition-all"
            >
              {vaultLookupLoading ? "খোঁজা হচ্ছে..." : "🔍 ভল্ট লুকআপ ও প্রিফিল"}
            </button>
          </div>

          {/* Core Profile Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">আবেদনকারীর পূর্ণ নাম (English CAPS) *</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value.toUpperCase())}
                placeholder="MD TARIQUL ISLAM"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">আবেদনকারীর নাম (বাংলা)</label>
              <input
                type="text"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="মো: তারিকুল ইসলাম"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">জন্ম তারিখ (Date of Birth) *</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">জাতীয় পরিচয়পত্র / ১৭ ডিজিট জন্ম নিবন্ধন নম্বর</label>
              <input
                type="text"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                placeholder="NID বা ডিজিটাল BRC নম্বর"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">পিতার নাম (ইংরেজি)</label>
              <input
                type="text"
                value={fatherNameEn}
                onChange={(e) => setFatherNameEn(e.target.value)}
                placeholder="Father's Name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">মাতার নাম (ইংরেজি)</label>
              <input
                type="text"
                value={motherNameEn}
                onChange={(e) => setMotherNameEn(e.target.value)}
                placeholder="Mother's Name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">বর্তমান ঠিকানা (Present Address) *</label>
              <input
                type="text"
                value={presentAddress}
                onChange={(e) => setPresentAddress(e.target.value)}
                placeholder="বাসা, রোড, থানা, জেলা ও পোস্টকোড"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">স্থায়ী ঠিকানা (Permanent Address) *</label>
              <input
                type="text"
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                placeholder="গ্রাম, ডাকঘর, থানা ও নিজ জেলা"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
            </button>
            <button
              onClick={() => {
                if (!nameEn || !phone) {
                  toast.error("নাম ও মোবাইল নম্বর দেওয়া বাধ্যতামূলক।")
                  return
                }
                setStep(3)
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ (ডকুমেন্ট আপলোড) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Multi-Document Upload (Section 2 Step B Requirement) */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">ধাপ ৩: প্রয়োজনীয় কাগজপত্র ও ছবি আপলোড</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                NID, জন্ম নিবন্ধন, শিক্ষাগত সার্টিফিকেট, ছবি ও স্বাক্ষর আপলোড করুন। AI স্বয়ংক্রিয়ভাবে এগুলো পড়ে ফর্ম পূরণ করবে।
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
              {uploadedDocs.length} টি ফাইল আপলোড হয়েছে
            </span>
          </div>

          {/* Required Documents Guide from Service Catalog */}
          {currentService?.requiredDocuments && currentService.requiredDocuments.length > 0 && (
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-2">
              <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-700" />
                এই সার্ভিসের জন্য প্রয়োজনীয় ডকুমেন্টের তালিকা:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentService.requiredDocuments.map((doc: string, idx: number) => (
                  <span key={idx} className="text-[11px] font-semibold bg-white text-amber-950 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                    • {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Upload Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { type: 'জাতীয় পরিচয়পত্র (NID) / জন্ম নিবন্ধন', desc: 'পিডিএফ বা পরিষ্কার ছবি (উভয় পিঠ)', icon: '🪪' },
              { type: 'শিক্ষাগত সার্টিফিকেট / মার্কশিট', desc: 'SSC / HSC / ডিগ্রি সনদপত্র বা মার্কশিট', icon: '📜' },
              { type: 'পাসপোর্ট সাইজ ছবি', desc: '৩০০x৩০০ পিক্সেল সাইজ ল্যাব প্রিন্ট কোয়ালিটি', icon: '📸' },
              { type: 'আবেদনকারীর স্বাক্ষর (Signature)', desc: 'সাদা কাগজে কালো কালির স্বাক্ষর স্ক্যান', icon: '✍️' },
              { type: 'চাকরির সার্কুলার / অন্যান্য ফাইল', desc: 'কাজের বিবরণ বা অন্য কোনো প্রাসঙ্গিক ডকুমেন্ট', icon: '📎' },
            ].map((d, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 hover:border-cyan-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{d.icon}</span> {d.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{d.desc}</p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, d.type)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-cyan-700 cursor-pointer w-full"
                />
              </div>
            ))}
          </div>

          {/* Uploaded Documents List */}
          {uploadedDocs.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block">আপলোডকৃত ফাইলের তালিকা:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {uploadedDocs.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        ✓
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">{doc.title}</span>
                        <span className="text-[10px] text-cyan-700 font-semibold">{doc.docType}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="text-slate-400 hover:text-rose-600 font-bold text-xs p-1"
                      title="মুছে ফেলুন"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Voice/Written Special Note */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              অতিরিক্ত নির্দেশিকা বা কোনো বিশেষ সংশোধন থাকলে লিখুন:
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="যেমন: সার্টিফিকেটে নামের বানান বা পিতার নামে অমিল আছে, ইত্যাদি..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
            </button>
            <button
              onClick={async () => {
                setStep(4)
                // Automatically run extraction if documents were uploaded and not yet extracted
                if (uploadedDocs.length > 0 && extractedFields.length === 0) {
                  await runAiDocumentExtraction()
                } else if (extractedFields.length === 0 && currentService?.orderedFields) {
                  // Fallback initialization
                  const init: ExtractedFormField[] = currentService.orderedFields.map((f: any) => ({
                    key: f.key,
                    labelBn: f.labelBn,
                    labelEn: f.labelEn,
                    value: f.key === 'applicantNameEn' ? nameEn : f.key === 'dob' ? dob : f.key === 'nidNumber' ? nidNumber : '',
                    order: f.order,
                    confidence: f.key === 'applicantNameEn' && nameEn ? 0.9 : 0,
                    verificationStatus: f.key === 'applicantNameEn' && nameEn ? 'VERIFIED_BY_STAFF' : 'MISSING',
                  }))
                  setExtractedFields(init)
                }
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ (AI এক্সট্র্যাকশন ও রিভিউ) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AI Document Extraction, Dynamic Schema Form & Customer Review / Correction (Section 2 Steps C, D, E) */}
      {step === 4 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          
          {/* Header & Re-scan Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                  {extractionEngine === 'AI_GEMINI' ? '✨ Gemini AI Engine' : '⚡ Heuristic Extraction'}
                </span>
                {extractionConfidence !== null && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    কনফিডেন্স: {Math.round(extractionConfidence * 100)}%
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                ধাপ ৪: AI এক্সট্র্যাক্টকৃত আবেদন ডাটা রিভিউ ও সংশোধন
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ডকুমেন্ট থেকে সংগৃহীত তথ্য নিচে প্রদর্শন করা হয়েছে। কোনো তথ্য পরিবর্তন করতে চাইলে সরাসরি এডিট করুন।
              </p>
            </div>

            <button
              type="button"
              onClick={runAiDocumentExtraction}
              disabled={isExtracting}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm self-start sm:self-center transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isExtracting ? 'animate-spin' : ''}`} />
              {isExtracting ? "AI বিশ্লেষণ চলছে..." : "পুনরায় AI বিশ্লেষণ করুন"}
            </button>
          </div>

          {/* Conflict Warnings Box (Section 2 Step E Requirement) */}
          {conflictsDetected.length > 0 && (
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>সতর্কতা: আপলোডকৃত ডকুমেন্টের মধ্যে অথবা পূর্বের তথ্যে গরমিল শনাক্ত হয়েছে:</span>
              </div>
              <div className="space-y-2">
                {conflictsDetected.map((conf, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-rose-950 block">ফিল্ড: {conf.fieldKey}</span>
                      <span className="text-slate-600 text-[11px]">{conf.messageBn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolveConflictInClient(conf.fieldKey, nameEn || '')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-lg"
                      >
                        ভল্টের মান রাখুন
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveConflictInClient(conf.fieldKey, '')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg"
                      >
                        ম্যানুয়ালি লিখুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo & Signature Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {uploadedDocs.filter(d => d.docType.includes('ছবি') || d.docType.includes('স্বাক্ষর') || d.mimeType.startsWith('image/')).map((imgDoc, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <img src={imgDoc.fileUrl} alt={imgDoc.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">{imgDoc.docType}</span>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">{imgDoc.title}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                    ✓ ছবি সংযুক্ত আছে
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Ordered Application Fields (Editable by Customer with Provenance) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                আবেদন ফরমের সাজানো ফিল্ডসমূহ (Service Schema Fields):
              </h3>
              <span className="text-[11px] text-slate-400">
                ফিল্ডের মান পরিবর্তন করলে স্ট্যাটাস 'সংশোধিত' হিসেবে সংরক্ষিত হবে
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {extractedFields.map((field) => {
                const confPercent = Math.round(field.confidence * 100)
                return (
                  <div
                    key={field.key}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      field.isConflict
                        ? "border-rose-300 bg-rose-50/50"
                        : field.verificationStatus === 'MANUAL_EDIT'
                        ? "border-amber-300 bg-amber-50/30"
                        : field.verificationStatus === 'VERIFIED_BY_STAFF'
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-200 bg-slate-50/60 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 block">
                        {field.order}. {field.labelBn} <span className="text-[10px] text-slate-400">({field.labelEn})</span>
                      </span>

                      {/* Provenance Status Badges */}
                      <div className="flex items-center gap-1.5">
                        {field.verificationStatus === 'MANUAL_EDIT' && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            ✏️ আপনি সংশোধন করেছেন
                          </span>
                        )}
                        {field.verificationStatus === 'VERIFIED_BY_STAFF' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            🛡️ ভল্ট ভেরিফাইড
                          </span>
                        )}
                        {field.verificationStatus === 'EXTRACTED' && (
                          <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-md">
                            🤖 AI নিষ্কাশিত
                          </span>
                        )}
                        {field.verificationStatus === 'MISSING' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                            ⚠️ পূরণ করুন
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type={field.key === 'dob' ? 'date' : 'text'}
                        value={field.value || ""}
                        onChange={(e) => handleCustomerFieldEdit(field.key, e.target.value)}
                        placeholder={`মান লিখুন (${field.labelEn})`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-cyan-500 text-sm font-semibold"
                      />
                    </div>

                    {/* Source Document & Confidence Pill */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>উৎস: {field.sourceDocTitle || "সরাসরি ইনপুট"}</span>
                      {field.confidence > 0 && (
                        <span className={`font-bold ${confPercent >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          নির্ভুলতা: {confPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Explicit Customer Review Checkbox (Section 2 Step E Requirement) */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-start gap-3">
            <input
              type="checkbox"
              id="confirmDataCheck"
              checked={customerConfirmedData}
              onChange={(e) => setCustomerConfirmedData(e.target.checked)}
              className="mt-1 w-4 h-4 text-cyan-500 rounded border-slate-700 focus:ring-cyan-400"
            />
            <label htmlFor="confirmDataCheck" className="text-xs font-semibold leading-relaxed cursor-pointer">
              আমি নিশ্চিত করছি যে উপরে প্রদর্শিত সকল তথ্য (নাম, জন্ম তারিখ, ঠিকানা ও অন্যান্য তথ্য) নির্ভুলভাবে প্রদর্শিত হয়েছে এবং আমি প্রয়োজনীয় সংশোধন সম্পন্ন করেছি। এই তথ্য অনুযায়ী আমার আবেদন প্রস্তুত করা হোক। *
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
            </button>
            <button
              onClick={() => {
                if (!customerConfirmedData) {
                  toast.error("তথ্য সঠিক আছে মর্মে নিচের চেকবক্সে টিক দিন।")
                  return
                }
                setStep(5)
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ (ফি কোটেশন ও পেমেন্ট) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Fee Quotation, Payment & Delivery (Section 2 Step F) */}
      {step === 5 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ধাপ ৫: ফি বিবরণ, পেমেন্ট ও ডেলিভারি মাধ্যম</h2>
            <p className="text-xs text-slate-500 mt-0.5">সরকারি ফি ও শপ সার্ভিস চার্জের নির্ভুল হিসাব।</p>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">সার্ভিস ফি কোটেশন</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-slate-300">অফিসিয়াল সরকারি ফি (Govt Fee):</span>
                <span className="font-bold text-white">৳{financials.govtFee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-slate-300">কম্পিউটার ও সার্ভিস চার্জ (Shop Fee):</span>
                <span className="font-bold text-white">৳{financials.shopFee.toLocaleString()}</span>
              </div>
              {financials.addon > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-white/10">
                  <span className="text-slate-300">প্রিন্ট ও হ্যান্ডলিং চার্জ:</span>
                  <span className="font-bold text-white">৳{financials.addon.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 text-base sm:text-lg font-black text-cyan-400">
                <span>সর্বমোট প্রদেয় ফি:</span>
                <span>৳{financials.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Method Preference */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 block">ডেলিভারি মাধ্যম নির্বাচন করুন:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'ONLINE_DOWNLOAD', label: 'অনলাইন ডিজিটাল ডাউনলোড', desc: 'পিডিএফ ও এডমিট কার্ড সরাসরি ডাউনলোড' },
                { key: 'SHOP_PICKUP', label: 'শপ কাউন্টার থেকে সংগ্রহ', desc: 'দোকান থেকে প্রিন্ট কপি সংগ্রহ করবেন' },
                { key: 'COURIER', label: 'হোম ডেলিভারি (কুরিয়ার)', desc: 'কাগজপত্র ঠিকানায় হোম ডেলিভারি' },
              ].map((d) => (
                <div
                  key={d.key}
                  onClick={() => setDeliveryMode(d.key as any)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    deliveryMode === d.key
                      ? "border-cyan-600 bg-cyan-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">{d.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-1">{d.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method & Transaction ID */}
          <div className="space-y-4 pt-2">
            <label className="text-xs font-bold text-slate-800 block">পেমেন্ট মাধ্যম:</label>
            <div className="flex gap-3">
              {[
                { key: 'BKASH', label: 'বিকাশ (bKash Send/Pay)', no: '01711-223344 (Personal)' },
                { key: 'NAGAD', label: 'নগদ (Nagad)', no: '01811-998877 (Personal)' },
                { key: 'CASH_AT_COUNTER', label: 'দোকানে এসে ক্যাশ পরিশোধ', no: 'কাউন্টারে পে করবেন' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key as any)}
                  className={`flex-1 p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === m.key
                      ? "border-cyan-600 bg-cyan-50/50 shadow-sm"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">{m.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{m.no}</span>
                </button>
              ))}
            </div>

            {paymentMethod !== 'CASH_AT_COUNTER' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 animate-in fade-in">
                <span className="text-xs font-bold text-slate-800 block">
                  উক্ত নম্বরে ৳{financials.total} টাকা পাঠিয়ে ট্রানজেকশন আইডি দিন:
                </span>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="যেমন: BKH987XTR44"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-cyan-500 text-sm font-mono uppercase"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
            </button>
            <button
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              className="px-10 py-3.5 rounded-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-cyan-600/30 inline-flex items-center gap-2 transition-all"
            >
              {isSubmitting ? "আবেদন দাখিল হচ্ছে..." : "✓ প্রস্তুতকৃত আবেদন দোকানে জমা দিন"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Success Confirmation & Reference Token */}
      {step === 6 && createdRefNumber && (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">আবেদন সফলভাবে গৃহীত হয়েছে!</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আপনার প্রস্তুতকৃত আবেদন ডাটা ও ডকুমেন্টস আমাদের কম্পিউটার সার্ভিস সেন্টারে পৌঁছেছে।
            </p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-2">
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest block">আবেদন রেফারেন্স টোকেন</span>
            <div className="text-3xl font-black text-white tracking-wider font-mono">
              {createdRefNumber}
            </div>
            <span className="text-xs text-slate-400 block pt-1">
              (এই রেফারেন্স নম্বরটি সংরক্ষণ বা স্ক্রিনশট নিয়ে রাখুন)
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/track?query=${createdRefNumber}`}
              className="px-6 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md transition-all"
            >
              🔍 লাইভ স্ট্যাটাস ট্র্যাক করুন
            </Link>
            <Link
              href={`/appointments?service=${currentService?.slug}`}
              className="px-6 py-3 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              📅 শপ অ্যাপয়েন্টমেন্ট বুকিং
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}

export default function ServiceRequestPage() {
  return (
    <Suspense fallback={<div className="max-w-[1000px] mx-auto p-12 text-center text-slate-400">Loading request form...</div>}>
      <ServiceRequestContent />
    </Suspense>
  )
}

"use client"

import React, { useEffect, useState, useMemo, Suspense } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCustomerAuthStore } from "../../../store/useCustomerAuthStore"
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
  Edit3,
  Trash2,
  HelpCircle,
  Phone,
  Info
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

  const { customer, isAuthenticated } = useCustomerAuthStore()
  const [services, setServices] = useState<any[]>([])
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)

  // EXACT WORKFLOW SEQUENCE REQUESTED:
  // Step 1: Service Selection & Consent
  // Step 2: Upload Documents (FIRST step after service selection)
  // Step 3: AI Extraction & Auto-Filled Form
  // Step 4: Customer Review, Correction & Optional Vault Prefill
  // Step 5: Service Request, Quotation & Payment
  // Step 6: Request Confirmation & Tracking
  const [step, setStep] = useState(1)

  // Step 1: Consent
  const [consentAgreed, setConsentAgreed] = useState(false)

  // Step 2: Uploaded Documents State
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; docType: string; title: string; fileUrl: string; mimeType: string }>>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Step 3: AI Extraction State
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionEngine, setExtractionEngine] = useState<string | null>(null)
  const [extractionConfidence, setExtractionConfidence] = useState<number | null>(null)
  const [extractionCompleted, setExtractionCompleted] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  // Step 4: Reviewed & Auto-Filled Form State
  const [extractedFields, setExtractedFields] = useState<ExtractedFormField[]>([])
  const [conflictsDetected, setConflictsDetected] = useState<any[]>([])
  const [customerConfirmedData, setCustomerConfirmedData] = useState(false)
  const [customerNotes, setCustomerNotes] = useState("")

  // Applicant Contact & Optional Vault State
  const [contactPhone, setContactPhone] = useState("")
  const [applicantName, setApplicantName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [vaultLookupLoading, setVaultLookupLoading] = useState(false)
  const [vaultFoundProfile, setVaultFoundProfile] = useState<any | null>(null)
  const [showVaultDrawer, setShowVaultDrawer] = useState(false)

  // Step 5: Payment & Delivery State
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'CASH_AT_COUNTER'>('BKASH')
  const [transactionId, setTransactionId] = useState("")
  const [deliveryMode, setDeliveryMode] = useState<'ONLINE_DOWNLOAD' | 'SHOP_PICKUP' | 'COURIER'>('ONLINE_DOWNLOAD')
  const [deliveryAddress, setDeliveryAddress] = useState("")

  // Step 6: Submission Result
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdRefNumber, setCreatedRefNumber] = useState<string | null>(null)

  // Auto-fill from authenticated customer if available
  useEffect(() => {
    if (isAuthenticated && customer) {
      if (customer.phone && !contactPhone) setContactPhone(customer.phone)
      if (customer.name && !applicantName) setApplicantName(customer.name)
      if (customer.email && !customerEmail) setCustomerEmail(customer.email)
    }
  }, [isAuthenticated, customer])

  // Load published services catalog
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

  // Handle Document Upload
  const handleFileUpload = (files: FileList | null, docTypeCategory?: string) => {
    if (!files || files.length === 0) return
    setUploadError(null)

    Array.from(files).forEach(file => {
      // Validate file size (< 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`"${file.name}" ফাইলটি ১০ মেগাবাইটের বেশি। অনুগ্রহ করে ছোট ফাইল আপলোড করুন।`)
        toast.error(`"${file.name}" ফাইলটি ১০ মেগাবাইটের বেশি।`)
        return
      }

      // Detect document category
      let docType = docTypeCategory || 'সহায়ক ডকুমেন্ট'
      const lower = file.name.toLowerCase()
      if (lower.includes('nid') || lower.includes('smart') || lower.includes('birth') || lower.includes('brc') || lower.includes('নিবন্ধন')) {
        docType = 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন'
      } else if (lower.includes('photo') || lower.includes('pic') || lower.includes('ছবি')) {
        docType = 'পাসপোর্ট সাইজ ছবি (৩০০x৩০০)'
      } else if (lower.includes('sign') || lower.includes('স্বাক্ষর')) {
        docType = 'স্বাক্ষর স্ক্যান (৩০০x৮০)'
      } else if (lower.includes('ssc') || lower.includes('hsc') || lower.includes('cert') || lower.includes('mark') || lower.includes('সনদ')) {
        docType = 'শিক্ষাগত সার্টিফিকেট / মার্কশিট'
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
        toast.success(`"${file.name}" সফলভাবে যুক্ত হয়েছে!`)
      }
      reader.readAsDataURL(file)
    })
  }

  const removeDocument = (docId: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== docId))
    toast.info("ডকুমেন্ট সরানো হয়েছে।")
  }

  // Trigger AI Document Extraction & Dynamic Mapping
  const executeAiExtraction = async () => {
    if (!currentService) return
    setIsExtracting(true)
    setExtractionError(null)

    try {
      const payload = {
        serviceSlug: currentService.slug,
        documents: uploadedDocs,
        existingProfile: vaultFoundProfile || (contactPhone ? { phone: contactPhone } : undefined),
      }

      const res = await api.post('/public/service-request/extract-and-map', payload)
      if (res.data?.extractedFields) {
        setExtractedFields(res.data.extractedFields)
        setExtractionEngine(res.data.engineUsed || 'AI_GEMINI')
        setExtractionConfidence(res.data.overallConfidence || 0.85)
        setConflictsDetected(res.data.conflictsDetected || [])
        setExtractionCompleted(true)

        // Automatically populate applicant contact name & phone if extracted
        for (const f of res.data.extractedFields) {
          if (f.key === 'applicantNameEn' && f.value && !applicantName) {
            setApplicantName(f.value)
          }
          if (f.key === 'phone' && f.value && !contactPhone) {
            setContactPhone(f.value)
          }
          if (f.key === 'presentAddress' && f.value && !deliveryAddress) {
            setDeliveryAddress(f.value)
          }
        }

        toast.success("AI ডকুমেন্ট থেকে তথ্য বিশ্লেষণ সম্পন্ন করেছে! অনুগ্রহ করে তথ্য যাচাই করুন।")
      }
    } catch (err: any) {
      console.error("AI extraction error", err)
      const isTooLarge = err.response?.status === 413
      const serverMsg = err.response?.data?.message
      const displayMsg = isTooLarge
        ? "আপলোডকৃত ফাইলের আকার অনেক বড় (সর্বোচ্চ ৫০ মেগাবাইট অনুমোদিত)। অনুগ্রহ করে ছোট সাইজের ফাইল দিন অথবা সরাসরি ফরম পূরণ করুন।"
        : (typeof serverMsg === 'string' ? serverMsg : "ডকুমেন্ট বিশ্লেষণ সার্ভিসে সাময়িক সমস্যা হয়েছে। আপনি সরাসরি ফরম পূরণ করতে পারবেন অথবা পুনরায় চেষ্টা করতে পারেন।")

      setExtractionError(displayMsg)
      toast.error(isTooLarge ? "ফাইলের আকার অনেক বড়!" : "AI এক্সট্র্যাকশনে সমস্যা হয়েছে। সরাসরি ফরম পূরণ করতে পারবেন।")
      
      // Initialize fallback fields from service schema so customer can fill manually
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
      setExtractionEngine('ALGORITHMIC_FALLBACK')
      setExtractionConfidence(0)
      setExtractionCompleted(true)
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle inline customer edit on extracted field
  const handleFieldEdit = (key: string, newValue: string) => {
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

    if (key === 'applicantNameEn') setApplicantName(newValue)
    if (key === 'presentAddress' && !deliveryAddress) setDeliveryAddress(newValue)
  }

  // Resolve conflict on a field
  const handleResolveConflict = (key: string, chosenValue: string) => {
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
    toast.success("সঠিক মান নির্ধারণ করা হয়েছে।")
  }

  // Optional Customer Vault Lookup
  const handleVaultLookup = async () => {
    setVaultLookupLoading(true)
    try {
      let p: any = null
      if (isAuthenticated) {
        const res = await api.get('/customer/vault/me').catch(() => null)
        if (res?.data) p = res.data
      }
      if (!p) {
        if (!contactPhone || contactPhone.replace(/[^0-9]/g, '').length < 10) {
          toast.error("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।")
          setVaultLookupLoading(false)
          return
        }
        const res = await api.get('/public/customer-vault/lookup', { params: { phone: contactPhone } })
        if (res.data?.requiresLogin) {
          toast.info("ভল্ট রেকর্ড সুরক্ষিত। সম্পূর্ণ ডাটা প্রি-ফিলের জন্য অনুগ্রহ করে কাস্টমার একাউন্টে লগইন করুন।")
          setVaultLookupLoading(false)
          return
        }
        if (res.data?.found && res.data?.profile) {
          p = res.data.profile
        }
      }

      if (p) {
        setVaultFoundProfile(p)
        toast.success("কাস্টমার ভল্টে পূর্বের সংরক্ষিত তথ্য পাওয়া গেছে!")

        // Suggest prefilling missing fields from vault
        setExtractedFields(prev =>
          prev.map(f => {
            const vaultVal = p[f.key] || (f.key === 'applicantNameEn' ? p.nameEn : f.key === 'applicantNameBn' ? p.nameBn : f.key === 'dob' ? p.dob : f.key === 'nidNumber' ? p.nidNumber : p.presentAddress)
            if (!f.value && vaultVal) {
              return {
                ...f,
                value: vaultVal,
                sourceDocTitle: 'Verified Customer Vault',
                confidence: 1.0,
                verificationStatus: 'VERIFIED_BY_STAFF',
              }
            }
            return f
          })
        )
      } else {
        toast.info("ভল্টে কোনো পূর্বের রেকর্ড পাওয়া যায়নি। নতুন কাস্টমার হিসেবে এগিয়ে যান।")
      }
    } catch (e) {
      toast.error("ভল্ট লুকআপে সমস্যা হয়েছে।")
    } finally {
      setVaultLookupLoading(false)
    }
  }

  // Financials Calculation
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
  const handleSubmitServiceRequest = async () => {
    const finalCustomerName = applicantName.trim() || (extractedFields.find(f => f.key === 'applicantNameEn')?.value) || 'আবেদনকারী'
    const finalPhone = contactPhone.trim()

    if (!finalPhone || finalPhone.length < 10) {
      toast.error("আপনার যোগাযোগের মোবাইল নম্বর দেওয়া বাধ্যতামূলক।")
      setStep(4)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        serviceSlug: currentService.slug,
        customerName: finalCustomerName,
        customerPhone: finalPhone,
        customerEmail: customerEmail.trim() || undefined,
        customerId: customer?.id || undefined,
        deliveryMode,
        deliveryAddress: deliveryAddress.trim() || undefined,
        fieldValues: extractedFields,
        uploadedDocuments: uploadedDocs,
        customerNotes: customerNotes || undefined,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paidAmountBdt: transactionId.trim() ? financials.total : 0,
      }

      const res = await api.post('/public/service-request', payload)
      if (res.data?.referenceNumber) {
        setCreatedRefNumber(res.data.referenceNumber)
        setStep(6) // Success confirmation step
        toast.success(`সার্ভিস রিকোয়েস্ট সফলভাবে জমা হয়েছে! টোকেন #${res.data.referenceNumber}`)
      }
    } catch (err: any) {
      console.error("Submission failed", err)
      toast.error(err.response?.data?.message || "রিকোয়েস্ট দাখিলে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Exact Status Badge Mapping required by prompt
  const renderStatusBadge = (field: ExtractedFormField) => {
    if (field.verificationStatus === 'MANUAL_EDIT') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
          ✏️ আপনি সংশোধন করেছেন
        </span>
      )
    }
    if (field.verificationStatus === 'VERIFIED_BY_STAFF' || field.sourceDocTitle === 'Verified Customer Vault') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
          🛡️ পূর্বের ভেরিফাইড তথ্য
        </span>
      )
    }
    if (field.verificationStatus === 'MISSING' || !field.value) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-200">
          ⚠️ ডকুমেন্টে পাওয়া যায়নি
        </span>
      )
    }
    if (field.confidence < 0.75 || field.isConflict) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 border border-orange-200">
          🔍 যাচাই প্রয়োজন
        </span>
      )
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-900 border border-cyan-200">
        🤖 AI থেকে পাওয়া
      </span>
    )
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
            ডকুমেন্ট আপলোড করুন → AI তথ্য পড়বে → আপনি যাচাই করবেন → দোকানে জমা দিন। সরকারি ওয়েবসাইটে মূল আবেদনটি দোকানের অভিজ্ঞ কর্মী সম্পন্ন করবেন।
          </p>
        </div>
        <div className="flex sm:flex-col items-center gap-2 text-xs text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-center">নিরাপদ ও এনক্রিপ্টেড ডাটা ভল্ট</span>
        </div>
      </div>

      {/* Multi-Step Wizard Progress Bar - EXACT REORDERED SEQUENCE */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2 text-xs font-bold text-slate-600 scrollbar-none">
        {[
          { num: 1, title: '১. সেবা ও সম্মতি' },
          { num: 2, title: '২. ডকুমেন্ট আপলোড' },
          { num: 3, title: '৩. AI এক্সট্র্যাকশন' },
          { num: 4, title: '৪. তথ্য রিভিউ ও সংশোধন' },
          { num: 5, title: '৫. কোটেশন ও পেমেন্ট' },
          { num: 6, title: '৬. সার্ভিস রিকোয়েস্ট নিশ্চিতকরণ' },
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

      {/* ========================================================================= */}
      {/* STEP 1: Service Selection & Consent (No Identity Fields Here!)           */}
      {/* ========================================================================= */}
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

          {/* Service Requirements & Photo/Signature Specs Guide */}
          {currentService && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-600" />
                {currentService.titleBn} এর প্রয়োজনীয় কাগজপত্র ও নির্দেশিকা:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">প্রয়োজনীয় ডকুমেন্ট:</span>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                    {currentService.requiredDocuments?.map((doc: string, i: number) => (
                      <li key={i}>{doc}</li>
                    )) || <li>NID বা জন্ম নিবন্ধন ও সার্টিফিকেট</li>}
                  </ul>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">ছবি ও স্বাক্ষর স্ট্যান্ডার্ড:</span>
                  <p className="text-[11px] text-slate-600">
                    ছবি: ৩০০ × ৩০০ পিক্সেল (সর্বোচ্চ ১০০ KB) | স্বাক্ষর: ৩০০ × ৮০ পিক্সেল (সর্বোচ্চ ৬০ KB)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Data Processing Consent */}
          <div className="bg-cyan-50/50 p-5 rounded-2xl border border-cyan-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              ব্যক্তিগত তথ্য প্রক্রিয়াকরণ সম্মতি (Privacy Consent)
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
                setStep(2) // Directly to Document Upload!
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ (ডকুমেন্ট আপলোড) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Upload Documents (MUST COME BEFORE CUSTOMER VAULT)               */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">ধাপ ২: প্রয়োজনীয় কাগজপত্র ও ছবি আপলোড করুন</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                NID, জন্ম নিবন্ধন, সার্টিফিকেট, ছবি ও স্বাক্ষর আপলোড করুন। AI স্বয়ংক্রিয়ভাবে পড়ে ফরম পূরণ করে দেবে। কোনো ফর্ম ম্যানুয়ালি আগে লিখতে হবে না।
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100 self-start sm:self-center">
              {uploadedDocs.length} টি ফাইল যুক্ত হয়েছে
            </span>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
              dragActive ? "border-cyan-600 bg-cyan-50/50 scale-[1.01]" : "border-slate-300 hover:border-cyan-400 bg-slate-50/50"
            }`}
          >
            <UploadCloud className="w-12 h-12 text-cyan-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">ডকুমেন্ট ড্র্যাগ করে এখানে ছাড়ুন অথবা সিলেক্ট করুন</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              সাপোর্টেড ফরম্যাট: PDF, JPG, PNG, মোবাইল ক্যামেরা ছবি (সর্বোচ্চ ১০MB প্রতি ফাইল)
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <label className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-md inline-flex items-center gap-2 transition-all">
                <FileText className="w-4 h-4 text-cyan-400" />
                ফাইল সিলেক্ট করুন
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </label>

              <label className="px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer shadow-md inline-flex items-center gap-2 transition-all sm:hidden">
                <Camera className="w-4 h-4" />
                ক্যামেরা দিয়ে ছবি তুলুন
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Category-Specific Quick Upload Buttons */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-700 block">সুবিধাজনক ক্যাটাগরি অনুযায়ী ফাইল যুক্ত করুন:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { title: '🪪 NID বা জন্ম নিবন্ধন', cat: 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন' },
                { title: '📜 সার্টিফিকেট / মার্কশিট', cat: 'শিক্ষাগত সার্টিফিকেট / মার্কশিট' },
                { title: '📸 পাসপোর্ট ছবি (300x300)', cat: 'পাসপোর্ট সাইজ ছবি (৩০০x৩০০)' },
                { title: '✍️ স্বাক্ষর স্ক্যান (300x80)', cat: 'স্বাক্ষর স্ক্যান (৩০০x৮০)' },
              ].map((btn, idx) => (
                <label
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/30 cursor-pointer transition-all text-center space-y-1 block shadow-2xs"
                >
                  <span className="font-bold text-slate-800 text-xs block">{btn.title}</span>
                  <span className="text-[10px] text-cyan-700 block">+ ফাইল যুক্ত করুন</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e.target.files, btn.cat)}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Uploaded Documents List */}
          {uploadedDocs.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block">আপলোডকৃত ফাইলের তালিকা ({uploadedDocs.length} টি):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {uploadedDocs.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center shrink-0 text-xs">
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
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
            </button>
            <button
              onClick={async () => {
                if (uploadedDocs.length === 0) {
                  toast.warning("কোনো ডকুমেন্ট আপলোড করেননি। আপনি কি সরাসরি ফর্ম পূরণ করতে চান?")
                }
                setStep(3)
                await executeAiExtraction()
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ (AI এক্সট্র্যাকশন শুরু করুন) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: AI Extraction & Auto-Filled Form Progress State                   */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-12 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in text-center">
          
          {isExtracting ? (
            <div className="py-12 space-y-6 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-cyan-50 border-4 border-cyan-500 border-t-transparent animate-spin mx-auto flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-cyan-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900">ডকুমেন্ট বিশ্লেষণ ও ফিল্ড ম্যাপিং চলছে...</h2>
                <p className="text-xs text-slate-500">
                  AI আপনার আপলোডকৃত ফাইলগুলো থেকে নাম, জন্ম তারিখ, NID নম্বর ও অন্যান্য তথ্য স্বয়ংক্রিয়ভাবে পড়ছে।
                </p>
              </div>
              <div className="space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                {uploadedDocs.map((d, i) => (
                  <div key={d.id} className="flex items-center justify-between text-slate-700">
                    <span className="truncate max-w-[240px]">📄 {d.title}</span>
                    <span className="text-cyan-700 font-bold animate-pulse">প্রসেসিং...</span>
                  </div>
                ))}
              </div>
            </div>
          ) : extractionError ? (
            <div className="py-8 space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-3">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                  ⚠️ স্বয়ংক্রিয় রিডিং বিকল্প
                </span>
                <h2 className="text-xl font-black text-slate-900">ডকুমেন্ট থেকে স্বয়ংক্রিয় তথ্য পড়া যায়নি</h2>
                <div className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-left">
                  {extractionError}
                </div>
                <p className="text-xs text-slate-500">
                  চিন্তার কিছু নেই! আপনার আপলোডকৃত ফাইলসমূহ সুরক্ষিত আছে। আপনি সরাসরি আবেদন ফরমটি পূরণ করতে পারেন অথবা পুনরায় চেষ্টা করতে পারেন।
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={executeAiExtraction}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> পুনরায় চেষ্টা করুন
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center justify-center gap-2 transition-all"
                >
                  ম্যানুয়ালি ফরম পূরণ করুন <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-100 text-cyan-800">
                  {extractionEngine === 'AI_GEMINI' ? '✨ Gemini AI Engine' : '⚡ Heuristic Engine'}
                </span>
                <h2 className="text-2xl font-black text-slate-900">ডকুমেন্ট বিশ্লেষণ সফলভাবে সম্পন্ন হয়েছে!</h2>
                <p className="text-xs text-slate-500">
                  ডকুমেন্ট থেকে প্রাপ্ত তথ্য দিয়ে স্বয়ংক্রিয়ভাবে আবেদন ফরমটি পূরণ করা হয়েছে। পরবর্তী ধাপে গিয়ে তথ্যগুলো যাচাই ও ভুল থাকলে সংশোধন করুন।
                </p>
              </div>

              {extractionConfidence !== null && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-600">গড় নির্ভুলতা স্কোর (Confidence):</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{Math.round(extractionConfidence * 100)}%</span>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={executeAiExtraction}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> পুনরায় এক্সট্র্যাক্ট করুন
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center justify-center gap-2 transition-all"
                >
                  তথ্য রিভিউ ও সংশোধনে যান <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Customer Review, Correction & Optional Vault Prefill             */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                ধাপ ৪: AI পূরণকৃত আবেদন তথ্য রিভিউ ও সংশোধন
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                নিচে প্রতিটি ফিল্ডের মান মনোযোগ দিয়ে দেখুন। কোনো বানান বা তথ্যে ভুল থাকলে ক্লিক করে সংশোধন করুন।
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setStep(2); }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-center transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-600" />
              আরো ডকুমেন্ট আপলোড করুন
            </button>
          </div>

          {/* Conflict Warnings Box if detected */}
          {conflictsDetected.length > 0 && (
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>সতর্কতা: আপলোডকৃত ডকুমেন্টের মধ্যে গরমিল শনাক্ত হয়েছে:</span>
              </div>
              <div className="space-y-2">
                {conflictsDetected.map((conf, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-rose-950 block">ফিল্ড: {conf.fieldKey}</span>
                      <span className="text-slate-600 text-[11px]">{conf.messageBn}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResolveConflict(conf.fieldKey, '')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg self-end sm:self-center"
                    >
                      ম্যানুয়ালি ঠিক করুন
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Application Fields (Service-Specific Schema) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-600" />
              {currentService.titleBn} সংক্রান্ত আবেদন ফিল্ডসমূহ:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {extractedFields.map((field) => (
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
                      {field.order}. {field.labelBn} <span className="text-[10px] text-slate-400 font-normal">({field.labelEn})</span>
                    </span>

                    {/* Exact Bengali Status Badges required */}
                    {renderStatusBadge(field)}
                  </div>

                  <div className="relative">
                    <input
                      type={field.key === 'dob' ? 'date' : 'text'}
                      value={field.value || ""}
                      onChange={(e) => handleFieldEdit(field.key, e.target.value)}
                      placeholder={`মান লিখুন (${field.labelEn})`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-cyan-500 text-sm font-semibold"
                    />
                  </div>

                  {/* Provenance: Source Document & Confidence */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="truncate max-w-[200px]">উৎস: {field.sourceDocTitle || "সরাসরি ইনপুট"}</span>
                    {field.confidence > 0 && (
                      <span className="font-bold text-emerald-600">
                        {Math.round(field.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Customer Vault Drawer (OPTIONAL: For returning customers) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowVaultDrawer(!showVaultDrawer)}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-600" />
                <span className="text-xs font-bold text-slate-800">
                  কাস্টমার ভল্ট (ঐচ্ছিক): পূর্বে কি আমাদের দোকান থেকে সেবা নিয়েছেন?
                </span>
              </div>
              <span className="text-xs text-cyan-700 font-bold">
                {showVaultDrawer ? "লুকান ▲" : "খুলুন ▼"}
              </span>
            </div>

            {showVaultDrawer && (
              <div className="pt-2 space-y-3 animate-in fade-in">
                <p className="text-[11px] text-slate-500">
                  আপনার মোবাইল নম্বর দিলে ভল্ট থেকে পূর্বের ভেরিফাইড তথ্য দিয়ে খালি ফিল্ডগুলো পূরণ করা যাবে। নতুন কাস্টমার হলে এটি পূরণ না করলেও চলবে।
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleVaultLookup}
                    disabled={vaultLookupLoading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                  >
                    {vaultLookupLoading ? "খোঁজা হচ্ছে..." : "🔍 ভল্ট রেকর্ড খুঁজুন"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Mandatory Contact Phone (for SMS updates & shop communication) */}
          <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">আপনার যোগাযোগের মোবাইল নম্বর *</span>
              <span className="text-[11px] text-slate-500 block">আবেদন সম্পন্ন হলে এসএমএস ও ডেলিভারি নোটিফিকেশন পাঠাতে প্রয়োজন।</span>
            </div>
            <input
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono font-bold text-sm w-full sm:w-56 focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Explicit Customer Review Checkbox */}
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
              onClick={() => setStep(2)}
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
                if (!contactPhone || contactPhone.length < 10) {
                  toast.error("যোগাযোগের জন্য সঠিক মোবাইল নম্বর দিন।")
                  return
                }
                setStep(5)
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ (কোটেশন ও পেমেন্ট) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: Service Request, Quotation & Payment (Not Govt Submission!)       */}
      {/* ========================================================================= */}
      {step === 5 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ধাপ ৫: সার্ভিস ফি কোটেশন ও পেমেন্ট</h2>
            <p className="text-xs text-slate-500 mt-0.5">সরকারি ফি ও শপ সার্ভিস চার্জের নির্ভুল হিসাব।</p>
          </div>

          {/* MANDATORY PROMPT STATEMENT BANNER */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-bold leading-relaxed">
              “আপনি আপনার ডকুমেন্ট ও তথ্য যাচাই করে সার্ভিস রিকোয়েস্ট জমা দিচ্ছেন। সরকারি ওয়েবসাইটে আবেদনটি দোকানের কর্মী সম্পন্ন করবেন।”
            </p>
          </div>

          {/* Granular Financial Quotation Card */}
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
              onClick={handleSubmitServiceRequest}
              disabled={isSubmitting}
              className="px-10 py-3.5 rounded-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-cyan-600/30 inline-flex items-center gap-2 transition-all"
            >
              {isSubmitting ? "রিকোয়েস্ট দাখিল হচ্ছে..." : "✓ সার্ভিস রিকোয়েস্ট দোকানে জমা দিন"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: Request Confirmation & Tracking                                  */}
      {/* ========================================================================= */}
      {step === 6 && createdRefNumber && (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">সার্ভিস রিকোয়েস্ট সফলভাবে গৃহীত হয়েছে!</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আপনার প্রস্তুতকৃত আবেদন ডাটা ও ডকুমেন্টস আমাদের কম্পিউটার সার্ভিস সেন্টারে পৌঁছেছে। আমাদের দক্ষ কর্মী আপনার তথ্য অনুযায়ী সরকারি ওয়েবসাইটে আবেদন সম্পন্ন করবেন।
            </p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-2">
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest block">সার্ভিস রিকোয়েস্ট টোকেন</span>
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

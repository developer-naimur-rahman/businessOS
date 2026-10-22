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
  Mic,
  MicOff,
  Copy,
  ExternalLink,
  ChevronRight
} from "lucide-react"

function ServiceRequestContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSlug = searchParams.get("service") || "teletalk-govt-job"

  const [services, setServices] = useState<any[]>([])
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)
  const [step, setStep] = useState(1) // 1: Consent & Service, 2: Identity & Vault, 3: Fields & Docs, 4: Payment & Delivery, 5: Success

  // Form State
  const [phone, setPhone] = useState("")
  const [vaultLookupLoading, setVaultLookupLoading] = useState(false)
  const [consentAgreed, setConsentAgreed] = useState(false)
  const [aiConsentAgreed, setAiConsentAgreed] = useState(true)

  // Applicant Profile
  const [nameEn, setNameEn] = useState("")
  const [nameBn, setNameBn] = useState("")
  const [dob, setDob] = useState("")
  const [gender, setGender] = useState("MALE")
  const [nidNumber, setNidNumber] = useState("")
  const [fatherNameEn, setFatherNameEn] = useState("")
  const [motherNameEn, setMotherNameEn] = useState("")
  const [presentAddress, setPresentAddress] = useState("")
  const [permanentAddress, setPermanentAddress] = useState("")
  const [email, setEmail] = useState("")

  // Dynamic Service-Specific Fields
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({})

  // Uploaded Files / Screenshots
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; docType: string; title: string; fileUrl: string; mimeType: string }>>([])
  const [voiceNoteText, setVoiceNoteText] = useState("")
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

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      const newDoc = {
        id: `doc-${Date.now()}`,
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
      const payload = {
        serviceSlug: currentService.slug,
        customerName: nameEn.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        deliveryMode,
        deliveryAddress: deliveryAddress.trim() || presentAddress,
        fieldValues: {
          applicantNameEn: nameEn,
          applicantNameBn: nameBn,
          dob,
          nidNumber,
          fatherNameEn,
          motherNameEn,
          presentAddress,
          permanentAddress,
          ...dynamicFieldValues,
        },
        uploadedDocuments: uploadedDocs,
        voiceTranscript: voiceNoteText || undefined,
        customerNotes: customerNotes || undefined,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paidAmountBdt: transactionId.trim() ? financials.total : 0,
      }

      const res = await api.post('/public/service-request', payload)
      if (res.data?.referenceNumber) {
        setCreatedRefNumber(res.data.referenceNumber)
        setStep(5) // Success step
        toast.success(`আবেদন সফলভাবে গৃহীত হয়েছে! টোকেন #${res.data.referenceNumber}`)
      }
    } catch (err: any) {
      toast.error("আবেদন সাবমিট করতে সমস্যা হয়েছে: " + (err.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 md:py-16 animate-in fade-in duration-500">
      
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="text-center space-y-2 mb-8">
          <span className="px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-800 text-xs font-bold uppercase tracking-wider">
            Customer Self-Service Intake Portal
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            অনলাইন সার্ভিস আবেদন ফরম
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            নিচের ধাপগুলো সম্পন্ন করে আবেদন সাবমিট করুন। আমাদের সার্ভিস ডেস্ক তাৎক্ষণিক প্রসেসিং শুরু করবে।
          </p>
        </div>

        {/* Wizard Steps Navigation */}
        <div className="flex items-center justify-between max-w-xl mx-auto px-2">
          {[
            { num: 1, label: 'সেবা ও সম্মতি' },
            { num: 2, label: 'পরিচয় ও ভল্ট' },
            { num: 3, label: 'তথ্য ও ফাইল' },
            { num: 4, label: 'পেমেন্ট ও ডেলিভারি' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                  step === s.num
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 scale-105"
                    : step > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${step === s.num ? "text-cyan-700" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Service Selection & Privacy Consent */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ধাপ ১: কাঙ্ক্ষিত সেবা নির্বাচন করুন</h2>
            <p className="text-xs text-slate-500 mt-1">আপনি কোন সেবার জন্য আবেদন করতে চান?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((s) => (
              <div
                key={s.slug}
                onClick={() => setSelectedSlug(s.slug)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedSlug === s.slug
                    ? "border-cyan-600 bg-cyan-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">{s.titleBn}</span>
                  {selectedSlug === s.slug && <CheckCircle2 className="w-5 h-5 text-cyan-600 shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 font-medium">{s.titleEn}</p>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mt-3 pt-2 border-t border-slate-100">
                  <span>সরকারি ফি: ৳{s.officialGovtFeeBdt}</span>
                  <span className="text-cyan-700">চার্জ: ৳{s.shopServiceChargeBdt}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Transparent Bangla Privacy & Consent Notice (Section 16 Requirement) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              ব্যক্তিগত তথ্যের নিরাপত্তা ও গোপনীয়তা সম্মতি (Privacy Notice)
            </h4>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                • <strong>উদ্দেশ্য:</strong> আপনার প্রদত্ত তথ্য ও প্রমাণক কাগজপত্র কেবলমাত্র আপনার নির্বাচিত সরকারি/অনলাইন ফরম নির্ভুলভাবে পূরণের জন্য ব্যবহৃত হবে।
              </p>
              <p>
                • <strong>সংরক্ষণ ও অধিকার:</strong> আপনার তথ্য আমাদের এনক্রিপ্টেড কাস্টমার ভল্টে সংরক্ষিত থাকবে যাতে ভবিষ্যতে অন্য কোনো আবেদন করার সময় পুনরায় এন্ট্রি করতে না হয়। আপনি যেকোনো সময় আপনার তথ্য সংশোধন বা ডিলিটের অনুরোধ করতে পারেন।
              </p>
              <p>
                • <strong>AI প্রসেসিং:</strong> ছবি রিসাইজ, ডকুমেন্টের তথ্য স্বয়ংক্রিয় রিডিং (OCR) ও আবেদন চেকলিস্ট প্রস্তুত করতে হাইব্রিড AI ইঞ্জিন সাহায্য করতে পারে।
              </p>
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-200">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                />
                আমি উল্লিখিত শর্তাবলী পড়েছি এবং আমার আবেদন প্রসেসিংয়ের জন্য সম্মতি প্রদান করছি।
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (!consentAgreed) {
                  toast.error("আবেদন শুরু করতে অনুগ্রহ করে গোপনীয়তা নীতিতে সম্মতি দিন।")
                  return
                }
                setStep(2)
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Identity & Reusable Customer Vault */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">ধাপ ২: আবেদনকারীর পরিচয় ও কাস্টমার ভল্ট</h2>
              <p className="text-xs text-slate-500 mt-0.5">মোবাইল নম্বর দিলে সংরক্ষিত পূর্বের তথ্য চলে আসবে।</p>
            </div>
            <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
              সেবা: {currentService?.titleBn}
            </span>
          </div>

          {/* Phone & Vault Lookup Bar */}
          <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-100 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-slate-700 block mb-1">মোবাইল নম্বর (Phone Number):</label>
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
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
                if (!nameEn || !phone || !dob) {
                  toast.error("নাম, মোবাইল নম্বর ও জন্মতারিখ পূরণ করুন।")
                  return
                }
                setStep(3)
              }}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পরবর্তী ধাপ <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Service-Specific Fields & Document Uploads */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ধাপ ৩: আবেদনের নির্দিষ্ট তথ্য ও ফাইল আপলোড</h2>
            <p className="text-xs text-slate-500 mt-0.5">সার্ভিস অনুযায়ী প্রয়োজনীয় নির্দিষ্ট তথ্য ও ডকুমেন্টস দিন।</p>
          </div>

          {/* Dynamic Service-Specific Fields */}
          {currentService?.orderedFields && currentService.orderedFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                {currentService.titleBn} সংক্রান্ত তথ্য
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {currentService.orderedFields
                  .filter((f: any) => !['applicantNameEn', 'applicantNameBn', 'dob', 'nidNumber', 'fatherNameEn', 'motherNameEn', 'presentAddress', 'permanentAddress'].includes(f.key))
                  .map((f: any) => (
                    <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label className="font-bold text-slate-700 block mb-1">
                        {f.order}. {f.labelBn} {f.required && '*'}
                      </label>
                      {f.type === 'select' ? (
                        <select
                          value={dynamicFieldValues[f.key] || ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
                        >
                          <option value="">নির্বাচন করুন</option>
                          {f.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          value={dynamicFieldValues[f.key] || ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.helpTextBn || f.labelEn}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
                        />
                      ) : (
                        <input
                          type={f.type === 'date' ? 'date' : 'text'}
                          value={dynamicFieldValues[f.key] || ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.labelEn}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Document & Screenshot Upload Box */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  কাগজপত্র ও ছবি আপলোড করুন
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ছবি, জাতীয় পরিচয়পত্র, মার্কশিট বা স্ক্রিনশট যুক্ত করুন।</p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                {uploadedDocs.length} টি ফাইল যুক্ত
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['পাসপোর্ট সাইজ ছবি', 'স্বাক্ষর স্ক্যান', 'NID / জন্ম নিবন্ধন', 'শিক্ষাগত সনদ বা অন্যান্য'].map((docLabel, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">{docLabel}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, docLabel)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocs.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-500 block">সংযুক্ত ফাইলের তালিকা:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {uploadedDocs.map((doc, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">📎 {doc.title}</span>
                      <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-md">{doc.docType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice Note / Customer Stated Problem */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              অতিরিক্ত নির্দেশিকা বা কোনো বিশেষ সমস্যা থাকলে লিখুন:
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="যেমন: নামের বানানে ভুল আছে ঠিক করতে হবে, অথবা আজকেই আবেদন সাবমিট করতে হবে..."
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
              onClick={() => setStep(4)}
              className="px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/20 inline-flex items-center gap-2 transition-all"
            >
              পেমেন্ট ও সাবমিশন <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Fee Quotation, Payment & Delivery */}
      {step === 4 && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ধাপ ৪: ফি বিবরণ, পেমেন্ট ও ডেলিভারি মাধ্যম</h2>
            <p className="text-xs text-slate-500 mt-0.5">সরকারি ফি ও শপ সার্ভিস চার্জের নির্ভুল হিসাব।</p>
          </div>

          {/* Detailed Financial Breakdown Card (Section 14 Requirement) */}
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
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
            </button>
            <button
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              className="px-10 py-3.5 rounded-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-cyan-600/30 inline-flex items-center gap-2 transition-all"
            >
              {isSubmitting ? "আবেদন দাখিল হচ্ছে..." : "✓ আবেদন নিশ্চিত ও সাবমিট করুন"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Success & Reference Token */}
      {step === 5 && createdRefNumber && (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">আবেদন সফলভাবে গৃহীত হয়েছে!</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আপনার সার্ভিস রিকোয়েস্ট টোকেন নিচে দেওয়া হলো। এই টোকেন দিয়ে লাইভ ট্র্যাকিং করতে পারবেন।
            </p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-2">
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest block">আবেদন রেফারেন্স টোকেন</span>
            <div className="text-3xl font-black text-white tracking-wider font-mono">
              {createdRefNumber}
            </div>
            <span className="text-xs text-slate-400 block pt-1">
              (এই রেফারেন্স নম্বরটি স্ক্রিনশট বা লিখে রাখুন)
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

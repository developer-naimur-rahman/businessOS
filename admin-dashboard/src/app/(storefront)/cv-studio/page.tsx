"use client"
import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { api } from "../../../lib/api-client"
import { useCustomerAuthStore } from "../../../store/useCustomerAuthStore"
import { 
  FileText, Download, Printer, Sparkles, CheckCircle2, User, 
  Briefcase, GraduationCap, Award, Globe, Phone, Mail, MapPin, 
  Plus, Trash2, Eye, ShieldCheck, Check, ArrowRight, RefreshCw,
  Sliders, Copy, ExternalLink, AlertCircle, BookmarkCheck
} from "lucide-react"
import { toast } from "sonner"

export type CVLanguage = "BN" | "EN" | "BILINGUAL"
export type CVTemplateId = "minimal-clean" | "corporate-modern" | "bangla-academic" | "ats-friendly"

export interface CVEducation {
  degree: string
  institution: string
  boardOrUniversity?: string
  passingYear: string
  resultGpa: string
}

export interface CVExperience {
  company: string
  designation: string
  startDate: string
  endDate: string
  isCurrent?: boolean
  responsibilities: string
}

export interface CVData {
  nameBn: string
  nameEn: string
  titleBn: string
  titleEn: string
  phone: string
  email: string
  address: string
  dob?: string
  fatherName?: string
  motherName?: string
  nationality?: string
  religion?: string
  maritalStatus?: string
  summaryBn: string
  summaryEn: string
  education: CVEducation[]
  experience: CVExperience[]
  skills: string[]
  languages: string[]
  certifications: string[]
  references: string
}

const INITIAL_CV_DATA: CVData = {
  nameBn: "মোঃ নাঈমুর রহমান",
  nameEn: "Md. Naimur Rahman",
  titleBn: "সফটওয়্যার ডেভেলপার ও টেকনোলজি স্পেশালিস্ট",
  titleEn: "Full Stack Software Engineer & Solutions Architect",
  phone: "01712345678",
  email: "naimur.rahman@example.com",
  address: "হাউস #১২, রোড #৪, ধানমন্ডি, ঢাকা-১২০৫",
  dob: "1998-05-15",
  fatherName: "মোঃ খলিলুর রহমান",
  motherName: "নাছিমা আক্তার",
  nationality: "Bangladeshi",
  religion: "Islam",
  maritalStatus: "Single",
  summaryBn: "প্রযুক্তি খাতে ৫+ বছরের বাস্তব কাজের অভিজ্ঞতাসম্পন্ন দক্ষ পেশাজীবী। জটিল সমস্যা সমাধান এবং আধুনিক ক্লাউড সলিউশন নির্মাণে পারদর্শী।",
  summaryEn: "Results-driven Software Engineer with 5+ years of experience in designing scalable web applications, API integrations, and cloud infrastructure.",
  education: [
    {
      degree: "B.Sc. in Computer Science & Engineering",
      institution: "Dhaka University of Engineering & Technology (DUET)",
      boardOrUniversity: "DUET",
      passingYear: "2021",
      resultGpa: "3.78 out of 4.00"
    },
    {
      degree: "Higher Secondary Certificate (HSC - Science)",
      institution: "Dhaka College",
      boardOrUniversity: "Dhaka Board",
      passingYear: "2016",
      resultGpa: "5.00 out of 5.00"
    }
  ],
  experience: [
    {
      company: "Innovate Tech Ltd",
      designation: "Senior Software Engineer",
      startDate: "2022-01",
      endDate: "Present",
      isCurrent: true,
      responsibilities: "Lead full-stack engineering team building retail POS and ERP systems with microservices."
    },
    {
      company: "DataSoft Systems",
      designation: "Software Developer",
      startDate: "2020-03",
      endDate: "2021-12",
      isCurrent: false,
      responsibilities: "Developed frontend portals with React, Next.js, and implemented high-throughput REST APIs."
    }
  ],
  skills: [
    "JavaScript / TypeScript", "React & Next.js", "Node.js & NestJS",
    "PostgreSQL & Prisma", "Docker & CI/CD", "REST & GraphQL", "Git"
  ],
  languages: ["বাংলা (Native)", "English (Professional Fluent)"],
  certifications: [
    "AWS Certified Solutions Architect - Associate",
    "Professional Web Development Certificate - BASIS"
  ],
  references: "Available upon request."
}

export default function CVStudioPage() {
  const { customer, isAuthenticated, token } = useCustomerAuthStore()
  
  const [template, setTemplate] = useState<CVTemplateId>("corporate-modern")
  const [language, setLanguage] = useState<CVLanguage>("EN")
  const [fontFamily, setFontFamily] = useState<string>("Inter, sans-serif")
  const [data, setData] = useState<CVData>(INITIAL_CV_DATA)
  const [activeTab, setActiveTab] = useState<"info" | "summary" | "education" | "experience" | "skills" | "preview">("info")
  const [isWatermarked, setIsWatermarked] = useState<boolean>(true)
  const [isLoadingVault, setIsLoadingVault] = useState<boolean>(false)

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printCopies, setPrintCopies] = useState<number>(5)
  const [printColorMode, setPrintColorMode] = useState<"BLACK_WHITE" | "FULL_COLOR">("FULL_COLOR")
  const [printPaper, setPrintPaper] = useState<"A4" | "PHOTO_4R">("A4")
  const [isOrderingPrint, setIsOrderingPrint] = useState(false)
  const [isPurchasingPdf, setIsPurchasingPdf] = useState(false)

  const printAreaRef = useRef<HTMLDivElement>(null)

  // Auto-restore saved draft if present in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("businessos_cv_draft")
      if (saved) {
        setData(JSON.parse(saved))
      }
    } catch {
      // Ignore
    }
  }, [])

  // Auto-save draft
  const handleSaveDraft = () => {
    try {
      localStorage.setItem("businessos_cv_draft", JSON.stringify(data))
      toast.success("সিভি ড্রাফট সফলভাবে সেভ করা হয়েছে!")
    } catch {
      toast.error("ড্রাফট সংরক্ষণ ব্যর্থ হয়েছে।")
    }
  }

  // Pre-fill from Customer Vault
  const handleLoadFromVault = async () => {
    setIsLoadingVault(true)
    try {
      const res = await api.get('/customer/vault/me')
      if (res.data) {
        const v = res.data
        setData(prev => ({
          ...prev,
          nameBn: v.nameBn || prev.nameBn,
          nameEn: v.nameEn || prev.nameEn,
          phone: v.phone || prev.phone,
          email: v.email || prev.email,
          dob: v.dob || prev.dob,
          fatherName: v.fatherNameBn || v.fatherNameEn || prev.fatherName,
          motherName: v.motherNameBn || v.motherNameEn || prev.motherName,
          address: v.presentAddress || v.permanentAddress || prev.address,
          education: v.educationHistory?.length > 0 ? v.educationHistory.map((e: any) => ({
            degree: e.degree || e.examTitle,
            institution: e.boardOrUniversity || "Institute",
            passingYear: e.passingYear || "",
            resultGpa: e.resultGpa || ""
          })) : prev.education
        }))
        toast.success("কাস্টমার ভল্ট থেকে প্রোফাইল ডাটা সফলভাবে লোড হয়েছে!")
      } else {
        toast.info("ভল্টে কোনো সংরক্ষিত প্রোফাইল পাওয়া যায়নি।")
      }
    } catch {
      toast.info("ভল্ট ডাটা লোড করতে কাস্টমার অ্যাকাউন্টে লগইন করুন।")
    } finally {
      setIsLoadingVault(false)
    }
  }

  // AI Summary Assistant
  const handleAiSuggestSummary = () => {
    const skillsList = data.skills.slice(0, 4).join(", ")
    const title = language === "BN" ? data.titleBn : data.titleEn
    
    if (language === "BN") {
      const suggested = `${title} হিসেবে দক্ষ ও প্রতিশ্রুতিশীল পেশাজীবী। ${skillsList} নিয়ে কাজ করার বাস্তব অভিজ্ঞতা রয়েছে। প্রাতিষ্ঠানিক লক্ষ্য অর্জনে আধুনিক প্রযুক্তি প্রয়োগে আগ্রহী।`
      setData(prev => ({ ...prev, summaryBn: suggested }))
      toast.success("এআই দিয়ে বাংলা সারসংক্ষেপ জেনারেট করা হয়েছে!")
    } else {
      const suggested = `Dedicated and proactive ${title} with hands-on expertise in ${skillsList}. Proven track record of delivering high-quality solutions, driving efficiency, and contributing to organizational growth.`
      setData(prev => ({ ...prev, summaryEn: suggested }))
      toast.success("AI generated professional summary in English!")
    }
  }

  // Handle PDF Purchase & Download
  const handleConfirmPurchase = () => {
    setIsPurchasingPdf(true)
    setTimeout(() => {
      setIsPurchasingPdf(false)
      setIsWatermarked(false)
      setIsPaymentModalOpen(false)
      toast.success("পেমেন্ট সফল! ওয়াটারমার্কমুক্ত অফিসিয়াল এইচডি পিডিএফ ডাউনলোড হচ্ছে...")
      
      setTimeout(() => {
        window.print()
      }, 400)
    }, 1200)
  }

  // Handle Shop Print Order
  const handleOrderPrintSubmit = async () => {
    setIsOrderingPrint(true)
    try {
      const dropPayload = {
        customerName: language === "BN" ? data.nameBn : data.nameEn,
        customerPhone: data.phone,
        fileName: `CV_${(language === "BN" ? data.nameBn : data.nameEn).replace(/\s+/g, "_")}.pdf`,
        paperSize: printPaper,
        colorMode: printColorMode,
        copies: printCopies,
        notes: `CV Studio Print Order: Template=${template}, Language=${language}, Font=${fontFamily}`
      }

      await api.post('/public/print-drop', dropPayload)
      toast.success(`প্রিন্ট অর্ডার সফল! রেফারেন্স সহ প্রিন্ট কিউতে যুক্ত হয়েছে। দোকানে সংগ্রহ করুন।`)
      setIsPrintModalOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error("প্রিন্ট অর্ডার ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।")
    } finally {
      setIsOrderingPrint(false)
    }
  }

  // Helpers for Education & Experience Rows
  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: "New Degree", institution: "Institution Name", passingYear: "2023", resultGpa: "GPA" }
      ]
    }))
  }

  const removeEducation = (index: number) => {
    setData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: "Company Name", designation: "Job Title", startDate: "2022", endDate: "Present", isCurrent: true, responsibilities: "Key job responsibilities..." }
      ]
    }))
  }

  const removeExperience = (index: number) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const displayName = language === "BN" ? data.nameBn : data.nameEn
  const displayTitle = language === "BN" ? data.titleBn : data.titleEn
  const displaySummary = language === "BN" ? data.summaryBn : data.summaryEn

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-cyan-400 font-black text-lg">
              <Sparkles className="w-5 h-5 text-cyan-400" /> BusinessOS
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-bold text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" /> AI CV & Career Studio
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadFromVault}
              disabled={isLoadingVault}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVault ? "animate-spin" : ""}`} />
              {isLoadingVault ? "ভল্ট লোড হচ্ছে..." : "ভল্ট ডাটা অটো-ফিল"}
            </button>

            <button
              onClick={handleSaveDraft}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
              ড্রাফট সেভ
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              দোকান থেকে প্রিন্ট (৳{printCopies * 5})
            </button>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-cyan-500/30 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              HD PDF ডাউনলোড (৳৫০)
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Section Editor (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Controls Bar: Template, Language, Font */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> স্টাইল ও ফরম্যাট নির্বাচন
              </span>
              <span className="text-[11px] text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                A4 Standard
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Template Picker */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">টেমপ্লেট (Template)</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs font-semibold"
                >
                  <option value="corporate-modern">কর্পোরেট মডার্ন (Corporate Modern)</option>
                  <option value="minimal-clean">মিনিমাল ক্লিন (Minimal Clean)</option>
                  <option value="bangla-academic">বাংলা সরকারি/একাডেমিক (Academic)</option>
                  <option value="ats-friendly">আন্তর্জাতিক এটিএস (ATS Friendly)</option>
                </select>
              </div>

              {/* Language Picker */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">ভাষা (Language)</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLanguage("BN")}
                    className={`py-1 text-center rounded-lg text-[10px] font-bold transition-all ${
                      language === "BN" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("EN")}
                    className={`py-1 text-center rounded-lg text-[10px] font-bold transition-all ${
                      language === "EN" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("BILINGUAL")}
                    className={`py-1 text-center rounded-lg text-[10px] font-bold transition-all ${
                      language === "BILINGUAL" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    উভয়
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex overflow-x-auto gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-3 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "info" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5" /> ব্যক্তিগত তথ্য
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "summary" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> সারসংক্ষেপ
            </button>
            <button
              onClick={() => setActiveTab("education")}
              className={`px-3 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "education" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> শিক্ষা ({data.education.length})
            </button>
            <button
              onClick={() => setActiveTab("experience")}
              className={`px-3 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "experience" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> অভিজ্ঞতা ({data.experience.length})
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`px-3 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "skills" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" /> দক্ষতা
            </button>
          </div>

          {/* Form Editors */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex-1 overflow-y-auto space-y-4 max-h-[650px] custom-scrollbar">
            
            {/* Tab 1: Personal Information */}
            {activeTab === "info" && (
              <div className="space-y-3.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-cyan-400" /> পরিচিতি ও যোগাযোগের বিবরণ
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">পূর্ণ নাম (বাংলায়)</label>
                    <input
                      type="text"
                      value={data.nameBn}
                      onChange={(e) => setData({ ...data, nameBn: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Full Name (English)</label>
                    <input
                      type="text"
                      value={data.nameEn}
                      onChange={(e) => setData({ ...data, nameEn: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">পদবী/পেশা (বাংলা)</label>
                    <input
                      type="text"
                      value={data.titleBn}
                      onChange={(e) => setData({ ...data, titleBn: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Professional Title (English)</label>
                    <input
                      type="text"
                      value={data.titleEn}
                      onChange={(e) => setData({ ...data, titleEn: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">ফোন নম্বর (Phone)</label>
                    <input
                      type="text"
                      value={data.phone}
                      onChange={(e) => setData({ ...data, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">ইমেইল (Email)</label>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">ঠিকানা (Full Address)</label>
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => setData({ ...data, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">পিতার নাম (Father's Name)</label>
                    <input
                      type="text"
                      value={data.fatherName || ""}
                      onChange={(e) => setData({ ...data, fatherName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">জন্মতারিখ (Date of Birth)</label>
                    <input
                      type="date"
                      value={data.dob || ""}
                      onChange={(e) => setData({ ...data, dob: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Summary / Objective */}
            {activeTab === "summary" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> পেশাদার সারসংক্ষেপ ও উদ্দেশ্য
                  </h4>
                  <button
                    type="button"
                    onClick={handleAiSuggestSummary}
                    className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> এআই দিয়ে লিখুন
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">পেশাদার সারসংক্ষেপ (বাংলা)</label>
                  <textarea
                    rows={4}
                    value={data.summaryBn}
                    onChange={(e) => setData({ ...data, summaryBn: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Professional Summary (English)</label>
                  <textarea
                    rows={4}
                    value={data.summaryEn}
                    onChange={(e) => setData({ ...data, summaryEn: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Education */}
            {activeTab === "education" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-400" /> শিক্ষাগত যোগ্যতা
                  </h4>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="px-2.5 py-1 bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> ডিগ্রি যোগ করুন
                  </button>
                </div>

                {data.education.map((edu, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative group">
                    <button
                      type="button"
                      onClick={() => removeEducation(idx)}
                      className="absolute top-2 right-2 p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="ডিগ্রি মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-2 gap-2 pr-6">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">ডিগ্রি / পরীক্ষা</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const newEdu = [...data.education]
                            newEdu[idx].degree = e.target.value
                            setData({ ...data, education: newEdu })
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">শিক্ষা প্রতিষ্ঠান</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const newEdu = [...data.education]
                            newEdu[idx].institution = e.target.value
                            setData({ ...data, education: newEdu })
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">পাসের সন (Year)</label>
                        <input
                          type="text"
                          value={edu.passingYear}
                          onChange={(e) => {
                            const newEdu = [...data.education]
                            newEdu[idx].passingYear = e.target.value
                            setData({ ...data, education: newEdu })
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">ফলাফল / সিজিপিএ</label>
                        <input
                          type="text"
                          value={edu.resultGpa}
                          onChange={(e) => {
                            const newEdu = [...data.education]
                            newEdu[idx].resultGpa = e.target.value
                            setData({ ...data, education: newEdu })
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Experience */}
            {activeTab === "experience" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" /> পেশাগত অভিজ্ঞতা
                  </h4>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="px-2.5 py-1 bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> অভিজ্ঞতা যোগ করুন
                  </button>
                </div>

                {data.experience.map((exp, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative group">
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="absolute top-2 right-2 p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="অভিজ্ঞতা মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-2 gap-2 pr-6">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">প্রতিষ্ঠানের নাম</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = [...data.experience]
                            newExp[idx].company = e.target.value
                            setData({ ...data, experience: newExp })
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">পদবী (Designation)</label>
                        <input
                          type="text"
                          value={exp.designation}
                          onChange={(e) => {
                            const newExp = [...data.experience]
                            newExp[idx].designation = e.target.value
                            setData({ ...data, experience: newExp })
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">শুরুর তারিখ</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const newExp = [...data.experience]
                            newExp[idx].startDate = e.target.value
                            setData({ ...data, experience: newExp })
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">সমাপ্তি</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => {
                            const newExp = [...data.experience]
                            newExp[idx].endDate = e.target.value
                            setData({ ...data, experience: newExp })
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">দায়িত্ব ও অর্জন</label>
                      <textarea
                        rows={2}
                        value={exp.responsibilities}
                        onChange={(e) => {
                          const newExp = [...data.experience]
                          newExp[idx].responsibilities = e.target.value
                          setData({ ...data, experience: newExp })
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 5: Skills & Languages */}
            {activeTab === "skills" && (
              <div className="space-y-3.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Award className="w-4 h-4 text-cyan-400" /> দক্ষতা ও ভাষাগত যোগ্যতা
                </h4>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">দক্ষতা (কমা দিয়ে আলাদা করুন)</label>
                  <textarea
                    rows={3}
                    value={data.skills.join(", ")}
                    onChange={(e) => {
                      const split = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                      setData({ ...data, skills: split })
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">ভাষাজ্ঞান (Languages)</label>
                  <input
                    type="text"
                    value={data.languages.join(", ")}
                    onChange={(e) => {
                      const split = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                      setData({ ...data, languages: split })
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">সার্টিফিকেশন ও প্রশিক্ষণ (Certifications)</label>
                  <textarea
                    rows={2}
                    value={data.certifications.join(", ")}
                    onChange={(e) => {
                      const split = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                      setData({ ...data, certifications: split })
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">রেফারেন্স (References)</label>
                  <input
                    type="text"
                    value={data.references}
                    onChange={(e) => setData({ ...data, references: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live A4 Document Canvas Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" /> লাইভ প্রিভিউ (A4 Live Canvas)
            </span>
            {isWatermarked && (
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> প্রিভিউ ওয়াটারমার্ক সক্রিয়
              </span>
            )}
          </div>

          {/* Printable A4 Canvas Container */}
          <div 
            ref={printAreaRef}
            className="w-full max-w-[650px] aspect-[1/1.414] bg-white text-slate-900 shadow-2xl rounded-lg p-8 sm:p-10 relative overflow-hidden flex flex-col transition-all print:m-0 print:p-8 print:shadow-none print:w-full"
            style={{ fontFamily: fontFamily }}
          >
            {/* Watermark Overlay for Unpaid Previews */}
            {isWatermarked && (
              <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-around opacity-15 rotate-[-30deg] select-none">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-widest uppercase">
                  PREVIEW / প্রিভিউ
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-widest uppercase">
                  BUSINESSOS STUDIO
                </span>
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-widest uppercase">
                  UNPAID DRAFT
                </span>
              </div>
            )}

            {/* Template Variant 1: Corporate Modern */}
            {template === "corporate-modern" && (
              <div className="space-y-5 text-xs">
                {/* Header Banner */}
                <div className="border-b-2 border-indigo-700 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight">{displayName}</h1>
                    <p className="text-indigo-700 font-bold text-xs uppercase tracking-wider mt-0.5">{displayTitle}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">{data.phone}</p>
                    <p>{data.email}</p>
                    <p className="max-w-[200px] leading-tight">{data.address}</p>
                  </div>
                </div>

                {/* Summary */}
                {displaySummary && (
                  <div className="space-y-1">
                    <h2 className="text-[11px] font-black uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5">
                      {language === "BN" ? "পেশাগত সারসংক্ষেপ" : "Professional Summary"}
                    </h2>
                    <p className="text-slate-700 text-[11px] leading-relaxed">{displaySummary}</p>
                  </div>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-[11px] font-black uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5">
                      {language === "BN" ? "পেশাগত অভিজ্ঞতা" : "Work Experience"}
                    </h2>
                    <div className="space-y-2.5">
                      {data.experience.map((exp, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-slate-900 text-[11px]">{exp.designation}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{exp.startDate} - {exp.endDate}</span>
                          </div>
                          <p className="text-indigo-600 font-semibold text-[10px]">{exp.company}</p>
                          <p className="text-slate-600 text-[10px] leading-relaxed">{exp.responsibilities}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-[11px] font-black uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5">
                      {language === "BN" ? "শিক্ষাগত যোগ্যতা" : "Education"}
                    </h2>
                    <div className="space-y-2">
                      {data.education.map((edu, i) => (
                        <div key={i} className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 text-[11px] block">{edu.degree}</span>
                            <span className="text-slate-600 text-[10px]">{edu.institution}</span>
                          </div>
                          <div className="text-right text-[10px]">
                            <span className="font-semibold text-slate-700 block">{edu.resultGpa}</span>
                            <span className="text-slate-500">{edu.passingYear}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {data.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <h2 className="text-[11px] font-black uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5">
                      {language === "BN" ? "মূল দক্ষতা" : "Key Skills"}
                    </h2>
                    <div className="flex flex-wrap gap-1">
                      {data.skills.map((s, i) => (
                        <span key={i} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Template Variant 2: Minimal Clean */}
            {template === "minimal-clean" && (
              <div className="space-y-5 text-xs text-slate-800">
                <div className="text-center border-b border-slate-300 pb-3">
                  <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                  <p className="text-xs text-slate-600 mt-0.5">{displayTitle}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {data.phone} • {data.email} • {data.address}
                  </p>
                </div>

                {displaySummary && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">{language === "BN" ? "উদ্দেশ্য" : "Objective"}</h3>
                    <p className="text-[10px] text-slate-700 leading-relaxed">{displaySummary}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">{language === "BN" ? "অভিজ্ঞতা" : "Experience"}</h3>
                  {data.experience.map((e, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between font-semibold text-[10px]">
                        <span>{e.designation} - {e.company}</span>
                        <span>{e.startDate} - {e.endDate}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal">{e.responsibilities}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">{language === "BN" ? "শিক্ষা" : "Education"}</h3>
                  {data.education.map((e, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span><strong>{e.degree}</strong>, {e.institution}</span>
                      <span>{e.passingYear} ({e.resultGpa})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Template Variant 3: Bangla Academic / Govt Format */}
            {template === "bangla-academic" && (
              <div className="space-y-4 text-xs text-slate-900">
                <div className="text-center border-b-2 border-slate-900 pb-2">
                  <h1 className="text-2xl font-black">{data.nameBn || data.nameEn}</h1>
                  <p className="text-xs font-bold mt-0.5">{data.titleBn || data.titleEn}</p>
                  <p className="text-[10px] mt-1">{data.address} | মোবা: {data.phone} | ইমেইল: {data.email}</p>
                </div>

                {data.fatherName && (
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 border border-slate-200 rounded">
                    <p><strong>পিতার নাম:</strong> {data.fatherName}</p>
                    <p><strong>মাতার নাম:</strong> {data.motherName || "—"}</p>
                    <p><strong>জন্মতারিখ:</strong> {data.dob || "—"}</p>
                    <p><strong>জাতীয়তা:</strong> {data.nationality || "বাংলাদেশী"}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="font-bold border-b border-slate-300 pb-0.5">শিক্ষাগত বিবরণ</h3>
                  <table className="w-full text-left text-[10px] border-collapse border border-slate-300 mt-1">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-1">পরীক্ষা/ডিগ্রি</th>
                        <th className="border border-slate-300 p-1">শিক্ষা প্রতিষ্ঠান</th>
                        <th className="border border-slate-300 p-1">সন</th>
                        <th className="border border-slate-300 p-1">জিপিএ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.education.map((e, i) => (
                        <tr key={i}>
                          <td className="border border-slate-300 p-1 font-semibold">{e.degree}</td>
                          <td className="border border-slate-300 p-1">{e.institution}</td>
                          <td className="border border-slate-300 p-1">{e.passingYear}</td>
                          <td className="border border-slate-300 p-1 font-bold">{e.resultGpa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold border-b border-slate-300 pb-0.5">কাজের বিবরণ ও পূর্ব অভিজ্ঞতা</h3>
                  {data.experience.map((e, idx) => (
                    <div key={idx} className="space-y-0.5 pt-1">
                      <div className="flex justify-between font-bold text-[10px]">
                        <span>{e.designation} - {e.company}</span>
                        <span>{e.startDate} হতে {e.endDate}</span>
                      </div>
                      <p className="text-[10px] text-slate-700">{e.responsibilities}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Template Variant 4: ATS Friendly */}
            {template === "ats-friendly" && (
              <div className="space-y-4 text-xs font-mono text-slate-900">
                <div className="border-b border-slate-800 pb-2">
                  <h1 className="text-xl font-bold uppercase tracking-tight">{data.nameEn}</h1>
                  <p className="text-[10px]">{data.phone} | {data.email} | {data.address}</p>
                </div>

                <div>
                  <h3 className="font-bold uppercase text-[11px] border-b border-slate-400 pb-0.5">Core Competencies</h3>
                  <p className="text-[10px] mt-1">{data.skills.join(" • ")}</p>
                </div>

                <div>
                  <h3 className="font-bold uppercase text-[11px] border-b border-slate-400 pb-0.5">Professional Experience</h3>
                  <div className="space-y-2 mt-1">
                    {data.experience.map((e, i) => (
                      <div key={i} className="text-[10px]">
                        <div className="flex justify-between font-bold">
                          <span>{e.company} - {e.designation}</span>
                          <span>{e.startDate} - {e.endDate}</span>
                        </div>
                        <p className="text-slate-700">{e.responsibilities}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold uppercase text-[11px] border-b border-slate-400 pb-0.5">Education</h3>
                  <div className="space-y-1 mt-1">
                    {data.education.map((e, i) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span>{e.degree}, {e.institution}</span>
                        <span>{e.passingYear} (Result: {e.resultGpa})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Payment & Download Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" /> অফিশিয়াল HD PDF আনলক
              </h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              পেমেন্ট সম্পন্ন হলে ওয়াটারমার্কমুক্ত উচ্চমানের প্রিন্ট-রেডি ভেক্টর PDF তাৎক্ষণিক ডাউনলোড করতে পারবেন।
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-300">মূল্য (PDF Fee):</span>
              <span className="font-black text-xl text-cyan-400">৳৫০</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">পেমেন্ট মেথড নির্বাচন করুন</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button" 
                  onClick={handleConfirmPurchase}
                  disabled={isPurchasingPdf}
                  className="p-3 bg-pink-950/40 border border-pink-700/50 hover:bg-pink-900/50 rounded-xl flex flex-col items-center justify-center text-xs font-bold text-pink-300 transition-all"
                >
                  <span className="text-sm">bKash</span>
                  <span className="text-[10px] text-pink-400">বিকাশ পেমেন্ট</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleConfirmPurchase}
                  disabled={isPurchasingPdf}
                  className="p-3 bg-orange-950/40 border border-orange-700/50 hover:bg-orange-900/50 rounded-xl flex flex-col items-center justify-center text-xs font-bold text-orange-300 transition-all"
                >
                  <span className="text-sm">Nagad</span>
                  <span className="text-[10px] text-orange-400">নগদ পেমেন্ট</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleConfirmPurchase}
                  disabled={isPurchasingPdf}
                  className="p-3 bg-indigo-950/40 border border-indigo-700/50 hover:bg-indigo-900/50 rounded-xl flex flex-col items-center justify-center text-xs font-bold text-indigo-300 transition-all"
                >
                  <span className="text-sm">Counter</span>
                  <span className="text-[10px] text-indigo-400">দোকান কাউন্টার</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={isPurchasingPdf}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-cyan-500/30 flex items-center gap-1.5"
              >
                {isPurchasingPdf ? "যাচাই হচ্ছে..." : "পেমেন্ট নিশ্চিত করুন (Enter)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Physical Print Shop Order Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" /> ফিজিক্যাল দোকান থেকে প্রিন্ট অর্ডার
              </h3>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              সরাসরি আমাদের শপ প্রিন্টারে প্রিন্ট জব পাঠানো হবে। দোকানে এসে রেফারেন্স কোড দেখিয়ে কপি সংগ্রহ করুন।
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">কপি সংখ্যা (Copies)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-base font-black px-3">{printCopies}</span>
                  <button
                    type="button"
                    onClick={() => setPrintCopies(printCopies + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">কালার মোড</label>
                <select
                  value={printColorMode}
                  onChange={(e) => setPrintColorMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="FULL_COLOR">রঙিন (Full Color - ৳20/কপি)</option>
                  <option value="BLACK_WHITE">সাদা-কালো (B&W - ৳5/কপি)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-300">আনুমানিক প্রিন্ট খরচ:</span>
              <span className="font-black text-xl text-indigo-400">
                ৳{printCopies * (printColorMode === "FULL_COLOR" ? 20 : 5)}
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={handleOrderPrintSubmit}
                disabled={isOrderingPrint}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                {isOrderingPrint ? "প্রিন্ট কিউতে পাঠানো হচ্ছে..." : "প্রিন্ট নিশ্চিত করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

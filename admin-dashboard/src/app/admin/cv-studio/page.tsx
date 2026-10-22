"use client"

import React, { useState, useEffect, useRef } from "react"
import { api } from "../../../lib/api-client"
import {
  FileText,
  User,
  Search,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
  Layers,
  Check,
  DollarSign,
  ChevronRight,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Sliders
} from "lucide-react"
import { toast } from "sonner"

export type DocumentCategory = 'CAREER_JOB' | 'BUSINESS_PROPOSAL' | 'LETTERS_FORMS' | 'STUDENT_ACADEMIC'
export type DocumentServiceMode = 'TEMPLATE_BASED' | 'CUSTOM_MADE'
export type LanguageMode = 'BN' | 'EN' | 'BILINGUAL'

export interface EducationItem {
  degree: string
  institution: string
  boardOrUniversity?: string
  passingYear: string
  resultGpa: string
}

export interface ExperienceItem {
  company: string
  designation: string
  startDate: string
  endDate: string
  isCurrent?: boolean
  responsibilities: string
}

export interface DocumentSnapshotData {
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
  education: EducationItem[]
  experience: ExperienceItem[]
  skills: string[]
  languages: string[]
  certifications: string[]
  references: string
  customFields?: Record<string, any>
  customRequirementsNotes?: string
}

const DEFAULT_SNAPSHOT_DATA: DocumentSnapshotData = {
  nameBn: "মোঃ নাঈমুর রহমান",
  nameEn: "Md. Naimur Rahman",
  titleBn: "সফটওয়্যার ডেভেলপার ও টেকনোলজি স্পেশালিস্ট",
  titleEn: "Senior Software Engineer & Solutions Architect",
  phone: "01712345678",
  email: "naimur.rahman@example.com",
  address: "হাউস #১২, রোড #৪, ধানমন্ডি, ঢাকা-১২০৫",
  dob: "1998-05-15",
  fatherName: "মোঃ খলিলুর রহমান",
  motherName: "নাছিমা আক্তার",
  nationality: "Bangladeshi",
  religion: "Islam",
  maritalStatus: "Single",
  summaryBn: "প্রযুক্তি ও সফটওয়্যার খাতে ৫+ বছরের বাস্তব কাজের অভিজ্ঞতাসম্পন্ন দক্ষ পেশাজীবী। জটিল বিজনেস প্রসেস অটোমেশন ও আধুনিক আর্কিটেকচার নির্মাণে পারদর্শী।",
  summaryEn: "Results-driven Software Engineer with 5+ years of experience delivering scalable enterprise web applications, ERP microservices, and POS platforms.",
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
      responsibilities: "Lead full-stack engineering team building retail POS and inventory automation systems."
    },
    {
      company: "DataSoft Systems Ltd",
      designation: "Software Engineer",
      startDate: "2020-03",
      endDate: "2021-12",
      isCurrent: false,
      responsibilities: "Developed RESTful backend microservices, Redis caching layers, and payment gateway webhooks."
    }
  ],
  skills: ["TypeScript", "Next.js", "NestJS", "PostgreSQL", "Prisma", "Docker", "REST API", "TailwindCSS"],
  languages: ["বাংলা (Native)", "English (Professional Working)", "Hindi (Conversational)"],
  certifications: ["AWS Certified Solutions Architect", "Certified Scrum Master (CSM)"],
  references: "Available upon formal request."
}

export default function AdminCvStudioPage() {
  const [activeMainTab, setActiveMainTab] = useState<'WORKSPACE' | 'ORDERS'>('WORKSPACE')

  // Templates & Category
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('minimal-clean')
  const [serviceMode, setServiceMode] = useState<DocumentServiceMode>('TEMPLATE_BASED')
  const [previewLanguage, setPreviewLanguage] = useState<LanguageMode>('BILINGUAL')
  const [selectedFont, setSelectedFont] = useState<'sans' | 'hind' | 'noto'>('sans')

  // Customer Vault State
  const [customerSearch, setCustomerSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [loadingVault, setLoadingVault] = useState(false)

  // Document Editor State
  const [activeEditorTab, setActiveEditorTab] = useState<'IDENTITY' | 'SUMMARY' | 'EDUCATION' | 'EXPERIENCE' | 'SKILLS' | 'CUSTOM'>('IDENTITY')
  const [formData, setFormData] = useState<DocumentSnapshotData>(DEFAULT_SNAPSHOT_DATA)
  const [newSkillInput, setNewSkillInput] = useState("")
  const [newLangInput, setNewLangInput] = useState("")
  const [newCertInput, setNewCertInput] = useState("")

  // Financials & Pricing Panel
  const [customDesignFee, setCustomDesignFee] = useState<string>("500")
  const [discountAmount, setDiscountAmount] = useState<string>("0")
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIALLY_PAID' | 'UNPAID'>('PAID')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'BAKI'>('CASH')
  const [paidAmount, setPaidAmount] = useState<string>("")
  const [assignedStaff, setAssignedStaff] = useState<string>("Ripon (Desk Lead)")
  const [customDeadline, setCustomDeadline] = useState<string>("")
  const [customRequirements, setCustomRequirements] = useState<string>("")

  // Print Queue Options
  const [sendToPrintQueue, setSendToPrintQueue] = useState<boolean>(false)
  const [printCopies, setPrintCopies] = useState<number>(1)
  const [printColorMode, setPrintColorMode] = useState<'BLACK_WHITE' | 'FULL_COLOR'>('FULL_COLOR')
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'LEGAL'>('A4')
  const [printBinding, setPrintBinding] = useState<'NONE' | 'SPIRAL' | 'LAMINATION'>('NONE')

  // Orders History State
  const [orders, setOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false)
  const [orderCategoryFilter, setOrderCategoryFilter] = useState<string>('ALL')
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL')
  const [orderSearch, setOrderSearch] = useState<string>("")
  const [orderMetrics, setOrderMetrics] = useState<any>({
    totalOrders: 0,
    templateBasedCount: 0,
    customMadeCount: 0,
    totalRevenueBdt: 0,
    totalDueBdt: 0,
    pendingFulfillment: 0
  })

  // Action Submission State
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  // 2. Fetch Orders when tab changes
  useEffect(() => {
    if (activeMainTab === 'ORDERS') {
      fetchOrders()
    }
  }, [activeMainTab, orderCategoryFilter, orderStatusFilter])

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/document-studio/templates')
      if (Array.isArray(res.data) && res.data.length > 0) {
        setTemplates(res.data)
      }
    } catch (err) {
      console.error("Failed to load templates from server, fallback to defaults", err)
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const params: any = {}
      if (orderCategoryFilter !== 'ALL') params.category = orderCategoryFilter
      if (orderStatusFilter !== 'ALL') params.status = orderStatusFilter
      if (orderSearch.trim()) params.search = orderSearch.trim()

      const res = await api.get('/admin/document-studio/orders', { params })
      setOrders(res.data.orders || [])
      setOrderMetrics(res.data.metrics || {})
    } catch (err) {
      toast.error("অর্ডার হিস্ট্রি লোড করতে ব্যর্থ হয়েছে")
    } finally {
      setOrdersLoading(false)
    }
  }

  // Active Template
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0] || {
    id: 'minimal-clean',
    titleBn: 'মিনিমাল ক্লিন সিভি ও রিজিউম',
    titleEn: 'Minimal Clean Professional Resume',
    basePriceBdt: 50,
    customDesignPriceBdt: 400,
    category: 'CAREER_JOB',
    pageSize: 'A4'
  }

  // Price calculations
  const basePrice = serviceMode === 'TEMPLATE_BASED' ? Number(activeTemplate.basePriceBdt || 50) : 0
  const customFee = serviceMode === 'CUSTOM_MADE' ? Number(customDesignFee || 500) : 0
  
  let printFee = 0
  if (sendToPrintQueue) {
    const rate = printColorMode === 'FULL_COLOR' ? 20 : 5
    const bindingCost = printBinding === 'LAMINATION' ? 20 * printCopies : printBinding === 'SPIRAL' ? 40 : 0
    printFee = (rate * printCopies) + bindingCost
  }

  const discount = Math.max(0, Number(discountAmount || 0))
  const grandTotal = Math.max(0, basePrice + customFee + printFee - discount)

  // Customer Search & Vault Loading
  const handleCustomerSearch = async (val: string) => {
    setCustomerSearch(val)
    if (val.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearchingCustomer(true)
    try {
      const res = await api.get(`/business-core/customers?search=${encodeURIComponent(val)}`)
      const list = res.data.items || res.data || []
      setSearchResults(list.slice(0, 5))
    } catch (err) {
      console.warn("Customer search error", err)
    } finally {
      setSearchingCustomer(false)
    }
  }

  const handleSelectCustomer = async (cust: any) => {
    setSelectedCustomer(cust)
    setSearchResults([])
    setCustomerSearch(`${cust.name} (${cust.phone || 'No phone'})`)

    // Load confirmed Customer Vault data
    setLoadingVault(true)
    try {
      const vaultRes = await api.get(`/admin/customer-vault/${cust.phone || cust.id}`)
      if (vaultRes.data) {
        const v = vaultRes.data
        setFormData((prev) => ({
          ...prev,
          nameBn: v.nameBn || prev.nameBn,
          nameEn: v.nameEn || cust.name || prev.nameEn,
          phone: v.phone || cust.phone || prev.phone,
          email: v.email || cust.email || prev.email,
          address: v.presentAddress || v.permanentAddress || prev.address,
          dob: v.dob || prev.dob,
          fatherName: v.fatherNameBn || v.fatherNameEn || prev.fatherName,
          motherName: v.motherNameBn || v.motherNameEn || prev.motherName,
          education: Array.isArray(v.educationHistory) && v.educationHistory.length > 0
            ? v.educationHistory.map((e: any) => ({
                degree: e.examTitle || e.degree || 'Degree',
                institution: e.boardOrUniversity || 'Institution',
                passingYear: e.passingYear || '',
                resultGpa: e.resultGpa || ''
              }))
            : prev.education
        }))
        toast.success(`কাস্টমার ভল্ট থেকে ${cust.name}-এর সংরক্ষিত তথ্য লোড হয়েছে!`)
      }
    } catch (err) {
      // If no vault profile exists yet, prefill from customer basic record
      setFormData((prev) => ({
        ...prev,
        nameEn: cust.name || prev.nameEn,
        phone: cust.phone || prev.phone,
        email: cust.email || prev.email
      }))
      toast.info(`গ্রাহকের প্রাথমিক তথ্য যুক্ত হয়েছে (ভল্ট রেকর্ড তৈরি হতে পারে)`)
    } finally {
      setLoadingVault(false)
    }
  }

  // Repeatable sections handlers
  const handleAddEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: "New Degree", institution: "College / University", passingYear: "2024", resultGpa: "GPA 5.00" }
      ]
    }))
  }

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: "Organization Name", designation: "Role / Position", startDate: "2023", endDate: "Present", isCurrent: true, responsibilities: "Key job responsibilities and achievements." }
      ]
    }))
  }

  const handleRemoveExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, newSkillInput.trim()] }))
    setNewSkillInput("")
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))
  }

  const handleAddLanguage = () => {
    if (!newLangInput.trim()) return
    setFormData((prev) => ({ ...prev, languages: [...prev.languages, newLangInput.trim()] }))
    setNewLangInput("")
  }

  const handleRemoveLanguage = (lang: string) => {
    setFormData((prev) => ({ ...prev, languages: prev.languages.filter((l) => l !== lang) }))
  }

  // Create Document Order
  const handleSaveOrder = async () => {
    if (!formData.nameEn && !formData.nameBn) {
      toast.error("অনুগ্রহ করে গ্রাহকের নাম দিন")
      return
    }
    if (!formData.phone) {
      toast.error("অনুগ্রহ করে মোবাইল নম্বর প্রদান করুন")
      return
    }

    setSubmittingOrder(true)
    try {
      const payload = {
        customerId: selectedCustomer?.id || undefined,
        customerName: formData.nameEn || formData.nameBn,
        customerPhone: formData.phone,
        customerEmail: formData.email || undefined,
        category: activeTemplate.category,
        templateId: activeTemplate.id,
        serviceMode,
        language: previewLanguage,
        snapshotData: {
          ...formData,
          customRequirementsNotes: customRequirements || undefined
        },
        paymentStatus,
        paymentMethod,
        paidAmountBdt: paymentStatus === 'PAID' ? grandTotal : Number(paidAmount || 0),
        customDesignFeeBdt: customFee,
        discountBdt: discount,
        assignedStaffName: assignedStaff,
        deliveryDeadline: customDeadline || undefined,
        customRequirementsNotes: customRequirements,
        printOptions: {
          requested: sendToPrintQueue,
          copies: printCopies,
          colorMode: printColorMode,
          paperSize: printPaperSize,
          binding: printBinding
        }
      }

      const res = await api.post('/admin/document-studio/orders', payload)
      toast.success(`ডকুমেন্ট অর্ডার #${res.data.orderNumber} সফলভাবে সেভ হয়েছে!`)

      if (sendToPrintQueue) {
        toast.info(`প্রিন্ট ড্রপ টিকিট তৈরি হয়েছে এবং প্রিন্ট কিউতে যুক্ত হয়েছে।`)
      }

      // Switch to orders tab
      setActiveMainTab('ORDERS')
      fetchOrders()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "অর্ডার সেভ করতে সমস্যা হয়েছে")
    } finally {
      setSubmittingOrder(false)
    }
  }

  // Print direct from browser
  const handleDirectPrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Universal AI Document & CV Studio
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  সার্বজনীন ডকুমেন্ট, পেশাদার সিভি ও বায়োডাটা ওয়ার্কস্পেস — কাস্টমার ভল্ট, টেমপ্লেট ও প্রিন্ট শপ একীভূত
                </p>
              </div>
            </div>
          </div>

          {/* Main Tab Controls */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveMainTab('WORKSPACE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'WORKSPACE'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              ডকুমেন্ট এডিটর ও লাইভ ক্যানভাস
            </button>
            <button
              onClick={() => setActiveMainTab('ORDERS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'ORDERS'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              অর্ডার হিস্ট্রি ও ডেলিভারি ({orderMetrics.totalOrders || 0})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: WORKSPACE */}
      {activeMainTab === 'WORKSPACE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Customer Selection & Form Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Customer Selector & Vault Pre-fill */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">১. গ্রাহক নির্বাচন ও AI কাস্টমার ভল্ট</span>
                </div>
                {loadingVault && (
                  <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> ভল্ট তথ্য আসছে...
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="মোবাইল নম্বর বা নাম দিয়ে গ্রাহক খুঁজুন..."
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  {selectedCustomer && (
                    <button
                      onClick={() => handleSelectCustomer(selectedCustomer)}
                      className="px-3 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ভল্ট রিফ্রেশ
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 z-20 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100">
                    {searchResults.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-3 hover:bg-indigo-50/60 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                          <p className="text-[11px] text-slate-500">{cust.phone || 'ফোন নম্বর নেই'} • {cust.email || 'ইমেইল নেই'}</p>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          ভল্ট লোড
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Category & Template Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  ২. ডকুমেন্ট ক্যাটাগরি ও টেমপ্লেট
                </span>

                {/* Service Mode Toggle: Template-Based vs Custom-Made */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setServiceMode('TEMPLATE_BASED')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      serviceMode === 'TEMPLATE_BASED'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    মোড A: স্ট্যান্ডার্ড টেমপ্লেট (৳{activeTemplate.basePriceBdt})
                  </button>
                  <button
                    onClick={() => setServiceMode('CUSTOM_MADE')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      serviceMode === 'CUSTOM_MADE'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    মোড B: কাস্টম ডিজাইন ও কোটেশন
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'ALL', label: 'সব ক্যাটাগরি' },
                  { id: 'CAREER_JOB', label: 'সিভি ও রিজিউম (Career)' },
                  { id: 'BUSINESS_PROPOSAL', label: 'কোম্পানি প্রোফাইল ও প্রপোজাল' },
                  { id: 'LETTERS_FORMS', label: 'আবেদনপত্র ও হলফনামা' },
                  { id: 'STUDENT_ACADEMIC', label: 'শিক্ষার্থী ও বৃত্তি' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Templates Horizontal Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {templates
                  .filter((t) => selectedCategory === 'ALL' || t.category === selectedCategory)
                  .map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{tmpl.titleBn}</p>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tmpl.titleEn}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            ৳{tmpl.basePriceBdt}
                          </span>
                          <span className="text-slate-400 uppercase">{tmpl.pageSize || 'A4'}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* 3. Document Fields Editor (Tabs) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  ৩. ডকুমেন্ট তথ্য এডিটর
                </span>

                {/* Sub tabs */}
                <div className="flex items-center gap-1 text-[11px] font-bold overflow-x-auto">
                  <button
                    onClick={() => setActiveEditorTab('IDENTITY')}
                    className={`px-2.5 py-1 rounded-lg ${activeEditorTab === 'IDENTITY' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    পরিচয় ও যোগাযোগ
                  </button>
                  <button
                    onClick={() => setActiveEditorTab('SUMMARY')}
                    className={`px-2.5 py-1 rounded-lg ${activeEditorTab === 'SUMMARY' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    সারসংক্ষেপ
                  </button>
                  <button
                    onClick={() => setActiveEditorTab('EDUCATION')}
                    className={`px-2.5 py-1 rounded-lg ${activeEditorTab === 'EDUCATION' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    শিক্ষা ({formData.education?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveEditorTab('EXPERIENCE')}
                    className={`px-2.5 py-1 rounded-lg ${activeEditorTab === 'EXPERIENCE' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    অভিজ্ঞতা ({formData.experience?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveEditorTab('SKILLS')}
                    className={`px-2.5 py-1 rounded-lg ${activeEditorTab === 'SKILLS' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    দক্ষতা ও ভাষা
                  </button>
                  {serviceMode === 'CUSTOM_MADE' && (
                    <button
                      onClick={() => setActiveEditorTab('CUSTOM')}
                      className={`px-2.5 py-1 rounded-lg ${activeEditorTab === 'CUSTOM' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50'}`}
                    >
                      কাস্টম রিকোয়ারমেন্টস
                    </button>
                  )}
                </div>
              </div>

              {/* TAB 1: IDENTITY */}
              {activeEditorTab === 'IDENTITY' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">পূর্ণ নাম (বাংলা)</label>
                    <input
                      type="text"
                      value={formData.nameBn}
                      onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Name (English) *</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">পদবী বা পেশা (বাংলা)</label>
                    <input
                      type="text"
                      value={formData.titleBn}
                      onChange={(e) => setFormData({ ...formData, titleBn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Professional Title (English)</label>
                    <input
                      type="text"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ইমেইল ঠিকানা</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">বর্তমান / স্থায়ী ঠিকানা</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">পিতার নাম</label>
                    <input
                      type="text"
                      value={formData.fatherName || ''}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">জন্মতারিখ (DOB)</label>
                    <input
                      type="date"
                      value={formData.dob || ''}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SUMMARY */}
              {activeEditorTab === 'SUMMARY' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">পেশাদার সারসংক্ষেপ (বাংলা)</label>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.summaryBn}
                      onChange={(e) => setFormData({ ...formData, summaryBn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium leading-relaxed"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Professional Summary & Objectives (English)</label>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.summaryEn}
                      onChange={(e) => setFormData({ ...formData, summaryEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: EDUCATION */}
              {activeEditorTab === 'EDUCATION' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">শিক্ষাগত যোগ্যতার তালিকা ({formData.education?.length || 0})</span>
                    <button
                      onClick={handleAddEducation}
                      className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold hover:bg-indigo-100 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> ডিগ্রি যোগ করুন
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {formData.education?.map((edu, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative space-y-2">
                        <button
                          onClick={() => handleRemoveEducation(idx)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-2 pr-6">
                          <div>
                            <label className="font-semibold text-slate-500 text-[10px]">ডিগ্রি / পরীক্ষার নাম</label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => {
                                const copy = [...formData.education]
                                copy[idx].degree = e.target.value
                                setFormData({ ...formData, education: copy })
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-500 text-[10px]">প্রতিষ্ঠান / বিশ্ববিদ্যালয়</label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => {
                                const copy = [...formData.education]
                                copy[idx].institution = e.target.value
                                setFormData({ ...formData, education: copy })
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-500 text-[10px]">পাসের সন</label>
                            <input
                              type="text"
                              value={edu.passingYear}
                              onChange={(e) => {
                                const copy = [...formData.education]
                                copy[idx].passingYear = e.target.value
                                setFormData({ ...formData, education: copy })
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-500 text-[10px]">ফলাফল / GPA / সিজিপিএ</label>
                            <input
                              type="text"
                              value={edu.resultGpa}
                              onChange={(e) => {
                                const copy = [...formData.education]
                                copy[idx].resultGpa = e.target.value
                                setFormData({ ...formData, education: copy })
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: EXPERIENCE */}
              {activeEditorTab === 'EXPERIENCE' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">কাজের অভিজ্ঞতার রেকর্ড ({formData.experience?.length || 0})</span>
                    <button
                      onClick={handleAddExperience}
                      className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold hover:bg-indigo-100 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> অভিজ্ঞতা যোগ করুন
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {formData.experience?.map((exp, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative space-y-2">
                        <button
                          onClick={() => handleRemoveExperience(idx)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-2 pr-6">
                          <div>
                            <label className="font-semibold text-slate-500 text-[10px]">কোম্পানি / প্রতিষ্ঠান</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => {
                                const copy = [...formData.experience]
                                copy[idx].company = e.target.value
                                setFormData({ ...formData, experience: copy })
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-medium"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-500 text-[10px]">পদবী / ডেসিগনেশন</label>
                            <input
                              type="text"
                              value={exp.designation}
                              onChange={(e) => {
                                const copy = [...formData.experience]
                                copy[idx].designation = e.target.value
                                setFormData({ ...formData, experience: copy })
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="font-semibold text-slate-500 text-[10px]">দায়িত্ব ও অবদান</label>
                            <textarea
                              rows={2}
                              value={exp.responsibilities}
                              onChange={(e) => {
                                const copy = [...formData.experience]
                                copy[idx].responsibilities = e.target.value
                                setFormData({ ...formData, experience: copy })
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SKILLS & LANGUAGES */}
              {activeEditorTab === 'SKILLS' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">দক্ষতা ও টেকনোলজি (Skills)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="নতুন দক্ষতা লিখে এন্টার দিন..."
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                      />
                      <button
                        onClick={handleAddSkill}
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold"
                      >
                        যুক্ত করুন
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.skills?.map((skill) => (
                        <span key={skill} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 flex items-center gap-1 font-semibold">
                          {skill}
                          <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-600 font-bold ml-1">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ভাষা দক্ষতা (Languages)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="নতুন ভাষা..."
                        value={newLangInput}
                        onChange={(e) => setNewLangInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                      />
                      <button
                        onClick={handleAddLanguage}
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold"
                      >
                        যুক্ত করুন
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.languages?.map((lang) => (
                        <span key={lang} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1 font-semibold">
                          {lang}
                          <button onClick={() => handleRemoveLanguage(lang)} className="hover:text-red-600 font-bold ml-1">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: CUSTOM REQUIREMENTS (FOR MODE B) */}
              {activeEditorTab === 'CUSTOM' && serviceMode === 'CUSTOM_MADE' && (
                <div className="space-y-3 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    কাস্টম ডিজাইন ও বেস্পোক নির্দেশিকা (Mode B)
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">গ্রাহকের বিশেষ চাহিদা ও লেআউট নির্দেশনা</label>
                    <textarea
                      rows={3}
                      placeholder="ক্লায়েন্টের স্পেসিফিক ফন্ট, কালার প্যালেট, কাস্টম লোগো প্লেসমেন্ট বা বিশেষ কোনো সেকশনের নির্দেশ..."
                      value={customRequirements}
                      onChange={(e) => setCustomRequirements(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">ডিজাইনার / অপারেটর</label>
                      <input
                        type="text"
                        value={assignedStaff}
                        onChange={(e) => setAssignedStaff(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">ডেলিভারি ডেডলাইন</label>
                      <input
                        type="date"
                        value={customDeadline}
                        onChange={(e) => setCustomDeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Financials, Payment & Print Shop Fulfillment */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                ৪. পেমেন্ট, প্রাইসিং ও প্রিন্ট শপ ডিসপ্যাচ
              </span>

              {/* Pricing Breakdown Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">
                    {serviceMode === 'TEMPLATE_BASED' ? 'বেস টেমপ্লেট প্রাইস' : 'কাস্টম ডিজাইন ফি'}
                  </label>
                  <input
                    type="number"
                    value={serviceMode === 'TEMPLATE_BASED' ? basePrice : customDesignFee}
                    onChange={(e) => serviceMode === 'CUSTOM_MADE' && setCustomDesignFee(e.target.value)}
                    disabled={serviceMode === 'TEMPLATE_BASED'}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">প্রিন্ট চার্জ</label>
                  <input
                    type="number"
                    disabled
                    value={printFee}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">বিশেষ ডিসকাউন্ট (৳)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">সর্বমোট বিল (BDT)</label>
                  <div className="w-full px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 font-extrabold text-emerald-700 text-sm">
                    ৳{grandTotal}
                  </div>
                </div>
              </div>

              {/* Payment Status & Method */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পেমেন্ট স্ট্যাটাস</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    <option value="PAID">পরিশোধিত (Paid) - ফুল আনলক</option>
                    <option value="PARTIALLY_PAID">আংশিক জমা / অগ্রিম (Partial)</option>
                    <option value="UNPAID">বাকি / অপরিশোধিত (Unpaid)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পেমেন্ট মাধ্যম</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="CASH">ক্যাশ কাউন্টার (Cash)</option>
                    <option value="BKASH">বিকাশ (bKash Agent/Merchant)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="BAKI">বাকি খাতা (Customer Due)</option>
                  </select>
                </div>
                {paymentStatus !== 'PAID' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">জমা হওয়া টাকা (BDT)</label>
                    <input
                      type="number"
                      placeholder="কত টাকা পেয়েছেন..."
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Print Shop Fulfillment Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendToPrintQueue}
                      onChange={(e) => setSendToPrintQueue(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-slate-700" />
                      শপ প্রিন্ট কিউতে পাঠাতে চান? (Auto Print Drop Ticket)
                    </span>
                  </label>
                  {sendToPrintQueue && (
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      প্রিন্ট ফি: ৳{printFee}
                    </span>
                  )}
                </div>

                {sendToPrintQueue && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">কপি সংখ্যা</span>
                      <input
                        type="number"
                        min={1}
                        value={printCopies}
                        onChange={(e) => setPrintCopies(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">কালার মোড</span>
                      <select
                        value={printColorMode}
                        onChange={(e) => setPrintColorMode(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                      >
                        <option value="FULL_COLOR">কালার প্রিন্ট (৳২০/পেজ)</option>
                        <option value="BLACK_WHITE">সাদা-কালো (৳৫/পেজ)</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">কাগজের সাইজ</span>
                      <select
                        value={printPaperSize}
                        onChange={(e) => setPrintPaperSize(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                      >
                        <option value="A4">A4 (80 GSM)</option>
                        <option value="LEGAL">Legal পেপার</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">বাইন্ডিং / ফিনিশিং</span>
                      <select
                        value={printBinding}
                        onChange={(e) => setPrintBinding(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                      >
                        <option value="NONE">কোনোটি নয়</option>
                        <option value="LAMINATION">লেমিনেশন (+৳২০/কপি)</option>
                        <option value="SPIRAL">স্পাইরাল বাইন্ডিং (+৳৪০)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  কাউন্টার প্রিন্ট
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  disabled={submittingOrder}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-2"
                >
                  {submittingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      অর্ডার সংরক্ষিত হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      অর্ডার সংরক্ষণ ও ডকুমেন্ট অনুমোদন (Save Order)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live A4 Canvas Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Canvas Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-700">ভাষা:</span>
                <button
                  onClick={() => setPreviewLanguage('BILINGUAL')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${previewLanguage === 'BILINGUAL' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                >
                  দ্বিভাষিক
                </button>
                <button
                  onClick={() => setPreviewLanguage('EN')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${previewLanguage === 'EN' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setPreviewLanguage('BN')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${previewLanguage === 'BN' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                >
                  বাংলা
                </button>
              </div>

              {/* Watermark Status Pill */}
              <div className="flex items-center gap-1 text-[11px] font-bold">
                {paymentStatus === 'PAID' ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ক্লিন ভার্সন (Watermark Off)
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> প্রিভিউ ওয়াটারমার্ক সক্রিয়
                  </span>
                )}
              </div>
            </div>

            {/* A4 Canvas Container */}
            <div className="bg-slate-200/70 p-4 rounded-2xl border border-slate-300/80 shadow-inner overflow-hidden flex justify-center">
              <div
                ref={canvasRef}
                className="w-full max-w-[480px] min-h-[670px] bg-white rounded-lg shadow-2xl border border-slate-300 p-6 text-slate-900 relative overflow-hidden flex flex-col justify-between"
                style={{
                  fontFamily: selectedFont === 'hind' ? 'Hind Siliguri, sans-serif' : 'Inter, sans-serif'
                }}
              >
                {/* Watermark Overlay (Only if not paid) */}
                {paymentStatus !== 'PAID' && (
                  <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center opacity-10 select-none rotate-[-35deg]">
                    <span className="text-6xl font-black tracking-widest text-slate-900 uppercase">
                      PREVIEW ONLY
                    </span>
                  </div>
                )}

                {/* Document Header */}
                <div>
                  <div className="border-b-2 border-indigo-600 pb-3 mb-4">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {previewLanguage === 'BN' ? (formData.nameBn || formData.nameEn) : formData.nameEn}
                    </h2>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">
                      {previewLanguage === 'BN' ? (formData.titleBn || formData.titleEn) : formData.titleEn}
                    </p>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium mt-2">
                      {formData.phone && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {formData.phone}</span>}
                      {formData.email && <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {formData.email}</span>}
                      {formData.address && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {formData.address}</span>}
                    </div>
                  </div>

                  {/* Summary / Objective */}
                  {(formData.summaryEn || formData.summaryBn) && (
                    <div className="mb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 mb-1.5">
                        {previewLanguage === 'BN' ? 'পেশাদার সারসংক্ষেপ' : 'Professional Summary'}
                      </h3>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {previewLanguage === 'BN' ? (formData.summaryBn || formData.summaryEn) : formData.summaryEn}
                      </p>
                    </div>
                  )}

                  {/* Experience Section */}
                  {formData.experience && formData.experience.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 mb-2">
                        {previewLanguage === 'BN' ? 'কাজের অভিজ্ঞতা' : 'Experience & Roles'}
                      </h3>
                      <div className="space-y-2">
                        {formData.experience.map((exp, i) => (
                          <div key={i} className="text-[10px]">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{exp.designation}</span>
                              <span className="text-slate-400 font-medium">{exp.startDate} – {exp.endDate}</span>
                            </div>
                            <div className="text-indigo-600 font-semibold">{exp.company}</div>
                            {exp.responsibilities && (
                              <p className="text-slate-500 mt-0.5 leading-snug">{exp.responsibilities}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education Section */}
                  {formData.education && formData.education.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 mb-2">
                        {previewLanguage === 'BN' ? 'শিক্ষাগত যোগ্যতা' : 'Education History'}
                      </h3>
                      <div className="space-y-1.5">
                        {formData.education.map((edu, i) => (
                          <div key={i} className="flex justify-between items-start text-[10px] text-slate-700">
                            <div>
                              <span className="font-bold text-slate-900">{edu.degree}</span>
                              <span className="block text-slate-500">{edu.institution}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-slate-800">{edu.resultGpa}</span>
                              <span className="block text-slate-400 font-medium">{edu.passingYear}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Grid */}
                  {formData.skills && formData.skills.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 mb-1.5">
                        {previewLanguage === 'BN' ? 'বিশেষ দক্ষতা' : 'Key Competencies & Skills'}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {formData.skills.map((skill) => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Stamp */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Template: {activeTemplate.titleEn} (v{activeTemplate.version || '1.0'})</span>
                  <span>Generated via BusinessOS Universal AI Studio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & FULFILLMENT HISTORY */}
      {activeMainTab === 'ORDERS' && (
        <div className="space-y-5">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">মোট অর্ডার</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{orderMetrics.totalOrders || 0}</p>
              <div className="text-[10px] text-slate-500 mt-1">
                টেমপ্লেট: {orderMetrics.templateBasedCount || 0} • কাস্টম: {orderMetrics.customMadeCount || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">আদায়কৃত রাজস্ব</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">৳{orderMetrics.totalRevenueBdt || 0}</p>
              <div className="text-[10px] text-slate-500 mt-1">ক্যাশ ও অনলাইন গেটওয়ে</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">বাকি পাওনা</span>
              <p className="text-2xl font-black text-red-500 mt-1">৳{orderMetrics.totalDueBdt || 0}</p>
              <div className="text-[10px] text-slate-500 mt-1">বাকি খাতায় রেকর্ডকৃত</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">পেন্ডিং ডেলিভারি</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{orderMetrics.pendingFulfillment || 0}</p>
              <div className="text-[10px] text-slate-500 mt-1">কাজ চলমান বা প্রিন্ট কিউতে</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
              <select
                value={orderCategoryFilter}
                onChange={(e) => setOrderCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
              >
                <option value="ALL">সব ক্যাটাগরি</option>
                <option value="CAREER_JOB">সিভি ও রিজিউম</option>
                <option value="BUSINESS_PROPOSAL">বিজনেস প্রপোজাল</option>
                <option value="LETTERS_FORMS">আবেদনপত্র ও হলফনামা</option>
                <option value="STUDENT_ACADEMIC">শিক্ষার্থী ও বৃত্তি</option>
              </select>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
              >
                <option value="ALL">সব স্ট্যাটাস</option>
                <option value="READY_FOR_DELIVERY">প্রস্তুত (Ready)</option>
                <option value="IN_PROGRESS">চলমান (In Progress)</option>
                <option value="PAID">পরিশোধিত (Paid)</option>
                <option value="UNPAID">বাকি (Due)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="অর্ডার # বা মোবাইল নম্বর খুঁজুন..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {ordersLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                অর্ডার তালিকা লোড হচ্ছে...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                কোনো ডকুমেন্ট অর্ডার পাওয়া যায়নি। ওয়ার্কস্পেস থেকে নতুন অর্ডার তৈরি করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">অর্ডার রেফারেন্স</th>
                      <th className="py-3 px-4">গ্রাহক ও মোবাইল</th>
                      <th className="py-3 px-4">টেমপ্লেট ও সার্ভিস মোড</th>
                      <th className="py-3 px-4">বিল ও পেমেন্ট</th>
                      <th className="py-3 px-4">ডেলিভারি স্ট্যাটাস</th>
                      <th className="py-3 px-4">প্রিন্ট কিউ</th>
                      <th className="py-3 px-4 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          #{ord.orderNumber}
                          <span className="block text-[10px] font-sans font-normal text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                          <span className="text-slate-500 text-[11px]">{ord.customerPhone}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{ord.templateTitleBn}</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ord.serviceMode === 'CUSTOM_MADE' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ord.serviceMode === 'CUSTOM_MADE' ? 'কাস্টম ডিজাইন' : 'টেমপ্লেট ভিত্তিক'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 block">৳{ord.financials?.totalAmountBdt}</span>
                          <span className={`text-[10px] font-bold ${
                            ord.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {ord.paymentStatus === 'PAID' ? 'পরিশোধিত' : `বাকি: ৳${ord.financials?.dueAmountBdt}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {ord.fulfillmentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {ord.printFulfillment?.requested ? (
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px] font-bold">
                              #{ord.printFulfillment.printTokenNumber || 'Enqueued'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">ডিজিটাল অনলি</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                // Load this order snapshot into editor
                                if (ord.snapshotData) {
                                  setFormData({
                                    ...DEFAULT_SNAPSHOT_DATA,
                                    ...ord.snapshotData
                                  })
                                  setSelectedTemplateId(ord.templateId)
                                  setServiceMode(ord.serviceMode)
                                  setActiveMainTab('WORKSPACE')
                                  toast.info(`অর্ডার #${ord.orderNumber} স্ন্যাপশট এডিটরে লোড হয়েছে`)
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-[11px]"
                            >
                              স্ন্যাপশট লোড
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                              title="প্রিন্ট করুন"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

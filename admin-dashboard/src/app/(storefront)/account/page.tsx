"use client"
import React, { useEffect, useState } from "react"
import { useCustomerAuthStore } from "../../../store/useCustomerAuthStore"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "../../../lib/api-client"
import {
  LogOut,
  Package,
  User,
  FileText,
  UploadCloud,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Eye,
  ExternalLink,
  Lock,
  Cpu,
  Search,
  Check,
  X,
  CreditCard
} from "lucide-react"
import { toast } from "sonner"

export default function CustomerAccountDashboard() {
  const router = useRouter()
  const { customer, isAuthenticated, login, logout, token } = useCustomerAuthStore()

  // Tabs
  const [activeTab, setActiveTab] = useState<
    'profile' | 'documents' | 'extracted' | 'upload' | 'applications' | 'orders' | 'privacy'
  >('profile')

  // Auth Form State (for unauthenticated visitors)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  // Dashboard Data State
  const [loading, setLoading] = useState(true)
  const [vaultProfile, setVaultProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<any>({})

  // Multi-file upload state
  const [selectedFiles, setSelectedFiles] = useState<Array<{
    filename: string;
    docType: string;
    fileBase64OrText: string;
    mimeType: string;
    sizeBytes: number;
  }>>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  // Dynamic field edit modal state
  const [editingField, setEditingField] = useState<any>(null)
  const [newFieldValue, setNewFieldValue] = useState("")

  // Load customer data
  const loadCustomerData = async () => {
    if (!token && !localStorage.getItem('customer_access_token')) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [profileRes, appsRes, ordersRes] = await Promise.all([
        api.get('/customer/vault/me').catch(() => ({ data: null })),
        api.get('/customer/vault/applications').catch(() => ({ data: [] })),
        api.get('/public/orders').catch(() => ({ data: [] })),
      ])

      if (profileRes.data) {
        setVaultProfile(profileRes.data)
        setProfileForm({
          nameEn: profileRes.data.nameEn || '',
          nameBn: profileRes.data.nameBn || '',
          fatherNameEn: profileRes.data.fatherNameEn || '',
          motherNameEn: profileRes.data.motherNameEn || '',
          dob: profileRes.data.dob || '',
          nidNumber: profileRes.data.nidNumber || '',
          birthRegNumber: profileRes.data.birthRegNumber || '',
          presentAddress: profileRes.data.presentAddress || '',
          permanentAddress: profileRes.data.permanentAddress || '',
        })
      }
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : [])
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : [])
    } catch (err: any) {
      console.error("Failed to load customer vault data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadCustomerData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Login / Register handler
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError("")
    try {
      if (authMode === 'login') {
        const res = await api.post('/public/auth/login', {
          email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
          phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined,
          password,
        })
        login(res.data.access_token, res.data.customer)
        toast.success(`স্বাগতম, ${res.data.customer.name}!`)
      } else {
        const res = await api.post('/public/auth/register', {
          email: emailOrPhone,
          phone,
          password,
          name,
        })
        login(res.data.access_token, res.data.customer)
        toast.success('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!')
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Please check your credentials.')
      toast.error('লগইন ব্যর্থ হয়েছে। সঠিক তথ্য প্রদান করুন।')
    } finally {
      setAuthLoading(false)
    }
  }

  // Update profile handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.put('/customer/vault/me', {
        ...vaultProfile,
        ...profileForm,
      })
      setVaultProfile(res.data)
      setEditingProfile(false)
      toast.success('প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে।')
    } catch (err: any) {
      toast.error('প্রোফাইল আপডেট ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
  }

  // Multiple file selection for analysis
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        let detectedType = 'OTHER'
        const lowerName = file.name.toLowerCase()
        if (lowerName.includes('nid') || lowerName.includes('voter')) detectedType = 'NID'
        else if (lowerName.includes('photo') || lowerName.includes('pic') || lowerName.includes('image')) detectedType = 'PHOTO'
        else if (lowerName.includes('sign')) detectedType = 'SIGNATURE'
        else if (lowerName.includes('birth') || lowerName.includes('jonmo')) detectedType = 'BIRTH_CERTIFICATE'
        else if (lowerName.includes('cert') || lowerName.includes('ssc') || lowerName.includes('hsc')) detectedType = 'ACADEMIC_CERT'
        else if (lowerName.includes('trade') || lowerName.includes('license')) detectedType = 'TRADE_LICENSE'

        setSelectedFiles(prev => [
          ...prev,
          {
            filename: file.name,
            docType: detectedType,
            fileBase64OrText: base64,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          }
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  // Execute AI Collective Analysis
  const handleExecuteCollectiveAnalysis = async () => {
    if (selectedFiles.length === 0) {
      toast.error('বিশ্লেষণের জন্য অনুগ্রহ করে অন্তত একটি ফাইল সিলেক্ট করুন।')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)
    try {
      const res = await api.post('/customer/vault/multi-upload', {
        documents: selectedFiles,
      })
      setAnalysisResult(res.data)
      toast.success(`সফলভাবে ${res.data.processedDocumentCount} টি ডকুমেন্ট প্রসেস হয়েছে!`)
      setSelectedFiles([])
      await loadCustomerData()
    } catch (err: any) {
      toast.error('ডকুমেন্ট বিশ্লেষণ ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Dynamic field update (Approve, Edit, Reject)
  const handleUpdateFieldStatus = async (fieldId: string, status: 'REVIEWED' | 'REJECTED', value?: any) => {
    try {
      await api.put('/customer/vault/field', {
        fieldId,
        update: {
          status,
          ...(value !== undefined ? { value } : {}),
        }
      })
      toast.success(status === 'REVIEWED' ? 'ফিল্ডটি যাচাই ও অনুমোদন করা হয়েছে।' : 'সাজেশন বাতিল করা হয়েছে।')
      await loadCustomerData()
      setEditingField(null)
    } catch (err: any) {
      toast.error('আপডেট ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
  }

  // Delete dynamic field
  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ফিল্ডটি মুছে ফেলতে চান?')) return
    try {
      await api.delete(`/customer/vault/field/${fieldId}`)
      toast.success('ফিল্ডটি মুছে ফেলা হয়েছে।')
      await loadCustomerData()
    } catch (err: any) {
      toast.error('মুছে ফেলা ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
  }

  // Update privacy consent
  const handleConsentToggle = async (type: 'ai' | 'general', currentVal: boolean) => {
    try {
      const aiVal = type === 'ai' ? !currentVal : (vaultProfile?.consentRecord?.aiProcessingConsented ?? true)
      const genVal = type === 'general' ? !currentVal : (vaultProfile?.consentRecord?.consentGiven ?? true)
      await api.post('/customer/vault/consent', {
        aiProcessingConsented: aiVal,
        consentGiven: genVal,
      })
      toast.success('আপনার গোপনীয়তা পছন্দ আপডেট করা হয়েছে।')
      await loadCustomerData()
    } catch (err: any) {
      toast.error('কনসেন্ট আপডেট ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
  }

  // Data erasure request
  const handleErasureRequest = async () => {
    const reason = prompt('আপনার ব্যক্তিগত ডাটা মুছে ফেলার কারণ লিখুন (ঐচ্ছিক):')
    if (reason === null) return
    try {
      await api.post('/customer/vault/erasure-request', { reason })
      toast.success('আপনার ডাটা মুছে ফেলার আবেদন গৃহীত হয়েছে এবং সংবেদনশীল তথ্য মুছে ফেলা হয়েছে।')
      await loadCustomerData()
    } catch (err: any) {
      toast.error('আবেদন ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
  }

  // Render Login/Register form if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
            {authMode === 'login' ? 'গ্রাহক অ্যাকাউন্টে লগইন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </h1>
          <p className="text-slate-500 text-sm">
            {authMode === 'login'
              ? 'আপনার সুরক্ষিত AI কাস্টমার ভল্ট, সেবার অগ্রগতি ও অর্ডার দেখতে লগইন করুন।'
              : 'একবার তথ্য সংরক্ষণ করে বারবার বিভিন্ন সেবায় সহজে আবেদন করার সুযোগ নিন।'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          {authError && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-200 text-center">
              {authError}
            </div>
          )}

          {authMode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">আপনার পুরো নাম</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Naimur Rahman"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="control-input h-12 w-full mt-1 px-4 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01700000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="control-input h-12 w-full mt-1 px-4 rounded-xl border border-slate-200"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {authMode === 'login' ? 'ইমেইল অথবা মোবাইল নম্বর' : 'ইমেইল এড্রেস'}
            </label>
            <input
              type="text"
              required
              placeholder={authMode === 'login' ? '01700000000 অথবা email@example.com' : 'email@example.com'}
              value={emailOrPhone}
              onChange={e => setEmailOrPhone(e.target.value)}
              className="control-input h-12 w-full mt-1 px-4 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">পাসওয়ার্ড</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="control-input h-12 w-full mt-1 px-4 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              {authLoading ? 'প্রসেসিং হচ্ছে...' : authMode === 'login' ? 'লগইন করুন' : 'অ্যাকাউন্ট নিশ্চিত করুন'}
            </button>
          </div>

          <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-100">
            {authMode === 'login' ? (
              <>
                অ্যাকাউন্ট নেই?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-cyan-600 font-bold hover:underline"
                >
                  রেজিস্ট্রেশন করুন
                </button>
              </>
            ) : (
              <>
                আগে থেকেই অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-cyan-600 font-bold hover:underline"
                >
                  লগইন করুন
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 md:py-16 animate-in fade-in duration-500">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold mb-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-600" />
            AI Dynamic Customer Intelligence Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {vaultProfile?.nameEn || customer?.name || 'Customer'} এর ড্যাশবোর্ড
          </h1>
          <p className="text-slate-500 text-sm">
            ভল্ট আইডি: <span className="font-mono font-bold text-slate-700">{vaultProfile?.id || 'VAULT-PENDING'}</span> • মোবাইল: {vaultProfile?.phone || customer?.phone || 'N/A'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCustomerData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="রিফ্রেশ ডাটা"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              logout()
              router.push('/')
            }}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> লগআউট
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-200 no-scrollbar">
        {[
          { key: 'profile', label: 'আমার প্রোফাইল', icon: User },
          { key: 'documents', label: `ডকুমেন্টস (${vaultProfile?.documents?.length || 0})`, icon: FileText },
          { key: 'extracted', label: `AI এক্সট্র্যাক্টেড ডাটা (${vaultProfile?.dynamicFields?.length || 0})`, icon: Layers },
          { key: 'upload', label: 'মাল্টি-ডকুমেন্ট এআই বিশ্লেষণ', icon: UploadCloud },
          { key: 'applications', label: `আবেদনসমূহ (${applications.length})`, icon: CheckCircle2 },
          { key: 'orders', label: `অর্ডার ও পেমেন্টস (${orders.length})`, icon: Package },
          { key: 'privacy', label: 'গোপনীয়তা ও অনুমতি', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile View / Edit */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-600" /> স্থায়ী নাগরিক প্রোফাইল
            </h2>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5" /> {editingProfile ? 'বাতিল' : 'সম্পাদনা করুন'}
            </button>
          </div>

          {editingProfile ? (
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700">নাম (English CAPS)</label>
                <input
                  type="text"
                  required
                  value={profileForm.nameEn}
                  onChange={e => setProfileForm({ ...profileForm, nameEn: e.target.value })}
                  className="control-input h-11 w-full mt-1 px-3 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">নাম (বাংলা)</label>
                <input
                  type="text"
                  value={profileForm.nameBn}
                  onChange={e => setProfileForm({ ...profileForm, nameBn: e.target.value })}
                  className="control-input h-11 w-full mt-1 px-3 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">পিতার নাম (English)</label>
                <input
                  type="text"
                  value={profileForm.fatherNameEn}
                  onChange={e => setProfileForm({ ...profileForm, fatherNameEn: e.target.value })}
                  className="control-input h-11 w-full mt-1 px-3 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">মাতার নাম (English)</label>
                <input
                  type="text"
                  value={profileForm.motherNameEn}
                  onChange={e => setProfileForm({ ...profileForm, motherNameEn: e.target.value })}
                  className="control-input h-11 w-full mt-1 px-3 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">জন্ম তারিখ (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={profileForm.dob}
                  onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                  className="control-input h-11 w-full mt-1 px-3 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">এনআইডি নম্বর (NID)</label>
                <input
                  type="text"
                  value={profileForm.nidNumber}
                  onChange={e => setProfileForm({ ...profileForm, nidNumber: e.target.value })}
                  className="control-input h-11 w-full mt-1 px-3 rounded-xl border border-slate-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700">বর্তমান ঠিকানা</label>
                <input
                  type="text"
                  value={profileForm.presentAddress}
                  onChange={e => setProfileForm({ ...profileForm, presentAddress: e.target.value })}
                  className="control-input h-11 w-full mt-1 px-3 rounded-xl border border-slate-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700">স্থায়ী ঠিকানা</label>
                <input
                  type="text"
                  value={profileForm.permanentAddress}
                  onChange={e => setProfileForm({ ...profileForm, permanentAddress: e.target.value })}
                  className="control-input h-11 w-full mt-1 px-3 rounded-xl border border-slate-200"
                />
              </div>
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm shadow hover:bg-cyan-700">
                  পরিবর্তন সংরক্ষণ করুন
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase">নাম (English)</span>
                <p className="font-semibold text-slate-900 mt-0.5">{vaultProfile?.nameEn || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase">নাম (বাংলা)</span>
                <p className="font-semibold text-slate-900 mt-0.5">{vaultProfile?.nameBn || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase">পিতার নাম</span>
                <p className="font-semibold text-slate-900 mt-0.5">{vaultProfile?.fatherNameEn || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase">মাতার নাম</span>
                <p className="font-semibold text-slate-900 mt-0.5">{vaultProfile?.motherNameEn || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase">জন্ম তারিখ</span>
                <p className="font-semibold text-slate-900 mt-0.5">{vaultProfile?.dob || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase">এনআইডি নম্বর</span>
                <p className="font-semibold text-slate-900 mt-0.5">{vaultProfile?.nidNumber || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                <span className="text-xs text-slate-400 font-bold uppercase">বর্তমান ঠিকানা</span>
                <p className="font-semibold text-slate-900 mt-0.5">{vaultProfile?.presentAddress || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase">ভেরিফিকেশন স্ট্যাটাস</span>
                <p className="font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> সংরক্ষিত ও সক্রিয়
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" /> সংরক্ষিত ডকুমেন্টস ভল্ট
            </h2>
            <button
              onClick={() => setActiveTab('upload')}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> নতুন ডকুমেন্ট আপলোড
            </button>
          </div>

          {(vaultProfile?.documents || []).length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">কোনো ডকুমেন্ট সংরক্ষিত নেই</p>
              <p className="text-xs text-slate-500 mt-1">NID, ছবি বা সার্টিফিকেট আপলোড করে তথ্য স্বয়ংক্রিয়ভাবে সেভ করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultProfile.documents.map((doc: any) => (
                <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                        {doc.docType}
                      </span>
                      {doc.isVerified ? (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ভেরিফাইড
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">সংরক্ষিত</span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">{doc.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{doc.extractedTextPreview || 'প্রিভিউ নেই'}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    <span className="font-semibold text-cyan-600">নিরাপদ স্টোরেজ</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Dynamic Fields & Extracted Data */}
      {activeTab === 'extracted' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-600" /> AI এক্সট্র্যাক্টেড ডায়নামিক ফিল্ডস
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                বিভিন্ন ডকুমেন্ট থেকে AI কর্তৃক উদ্ভাবিত তথ্য যা পরবর্তী যেকোনো সেবায় স্বয়ংক্রিয়ভাবে ব্যবহারযোগ্য।
              </p>
            </div>
          </div>

          {(vaultProfile?.dynamicFields || []).length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">কোনো ডায়নামিক ফিল্ড পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500 mt-1">একাধিক ডকুমেন্ট আপলোড করলে AI নতুন নতুন ফিল্ড প্রস্তুত করবে।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultProfile.dynamicFields.map((field: any) => (
                <div
                  key={field.id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    field.isConflicting
                      ? 'bg-amber-50/50 border-amber-200'
                      : field.status === 'REVIEWED'
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                        {field.category || 'GENERAL'}
                      </span>
                      {field.isConflicting ? (
                        <span className="text-[11px] text-amber-700 font-bold flex items-center gap-0.5 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> বৈসাদৃশ্য রয়েছে
                        </span>
                      ) : field.status === 'REVIEWED' ? (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> অনুমোদিত
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                          AI সাজেশন
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mb-0.5">{field.labelEn || field.key}</h4>
                    <p className="text-xs text-slate-500 mb-2">{field.labelBn}</p>
                    <div className="bg-slate-100 p-2.5 rounded-xl font-mono text-sm font-semibold text-slate-800 break-all">
                      {String(field.value)}
                    </div>

                    {field.sourceDocName && (
                      <p className="text-[11px] text-slate-400 mt-2">
                        উৎস: <span className="text-slate-600">{field.sourceDocName}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    {field.status !== 'REVIEWED' ? (
                      <button
                        onClick={() => handleUpdateFieldStatus(field.id, 'REVIEWED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> অনুমোদন
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ভেরিফাইড
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const val = prompt('নতুন মান লিখুন:', String(field.value))
                          if (val !== null) handleUpdateFieldStatus(field.id, 'REVIEWED', val)
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                        title="এডিট করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Multi-File Collective Upload & AI Extraction */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-600" /> মাল্টি-ডকুমেন্ট এআই কালেক্টিভ প্রসেসিং
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              একসাথে একাধিক ফাইল (NID, সার্টিফিকেট, পাসপোর্ট, ছবি) আপলোড করুন। AI স্বয়ংক্রিয়ভাবে সব ফাইল একসাথে বিশ্লেষণ করে তথ্য সাজিয়ে ভল্টে যোগ করবে।
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <input
              type="file"
              multiple
              id="multiFileInput"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />
            <label htmlFor="multiFileInput" className="cursor-pointer flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <span className="font-bold text-slate-800 text-base">ফাইল নির্বাচন করতে ক্লিক করুন</span>
              <span className="text-xs text-slate-500 mt-1">PDF, JPG, PNG ফাইল সমর্থিত (এক সাথে একাধিক ফাইল দিতে পারবেন)</span>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">নির্বাচিত ফাইলসমূহ ({selectedFiles.length} টি):</h3>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  সব ক্লিয়ার করুন
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 truncate">{f.filename}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {f.docType}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExecuteCollectiveAnalysis}
                  disabled={isAnalyzing}
                  className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> AI বিশ্লেষণ চলছে...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" /> AI কালেক্টিভ এক্সট্রাকশন শুরু করুন
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="mt-8 p-6 bg-slate-900 text-white rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" /> বিশ্লেষণ সফল হয়েছে!
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400">প্রসেসকৃত ফাইল</div>
                  <div className="text-2xl font-black text-cyan-400">{analysisResult.processedDocumentCount}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400">নতুন ডায়নামিক ফিল্ড</div>
                  <div className="text-2xl font-black text-emerald-400">{analysisResult.newDynamicFieldsCount}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400">শনাক্তকৃত বৈসাদৃশ্য</div>
                  <div className="text-2xl font-black text-amber-400">{analysisResult.conflictsCount}</div>
                </div>
              </div>

              {analysisResult.conflicts && analysisResult.conflicts.length > 0 && (
                <div className="mt-4 p-4 bg-amber-950/60 border border-amber-800/80 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> নথিপত্রের মধ্যে অসঙ্গতি সনাক্ত হয়েছে:
                  </div>
                  {analysisResult.conflicts.map((c: any, i: number) => (
                    <div key={i} className="text-xs text-amber-200">
                      • <strong>{c.field}:</strong> ভল্টে ছিল "{c.existingValue}", কিন্তু {c.sourceDoc}-এ পাওয়া গেছে "{c.extractedValue}"।
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: My Applications */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-600" /> সরকারি ও অনলাইন সেবার আবেদনসমূহ
            </h2>
            <Link
              href="/service-request"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> নতুন সেবা আবেদন
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">কোনো আবেদন পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500 mt-1">যেকোনো সরকারি বা অনলাইন সেবার জন্য রিকোয়েস্ট সাবমিট করুন।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app: any) => (
                <div key={app.referenceNumber || app.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-bold text-slate-900 text-base">
                        {app.serviceTitleBn || app.serviceSlug}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
                        {app.status || 'SUBMITTED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      টোকেন নম্বর: <span className="font-mono font-bold text-slate-700">{app.referenceNumber}</span> • তারিখ: {new Date(app.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">মোট ফি</div>
                      <div className="font-bold text-slate-900">৳{Number(app.financials?.totalAmountBdt || 0).toLocaleString()}</div>
                    </div>
                    <Link
                      href={`/track?query=${app.referenceNumber}`}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      ট্র্যাকিং দেখুন
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Orders & Payments */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-600" /> খুচরা কেনাকাটা ও ইনভয়েস হিস্ট্রি
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">কোনো অর্ডার হিস্ট্রি নেই</p>
              <p className="text-xs text-slate-500 mt-1">দোকানের কাউন্টার থেকে বা অনলাইন শপ থেকে ক্রয়ের রেকর্ড এখানে দেখাবে।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-900">ইনভয়েস: {order.saleNumber || `#${order.id.slice(0, 8)}`}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {order.status || 'COMPLETED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      তারিখ: {new Date(order.saleDate).toLocaleDateString()} • {order.lines?.length || 1} টি আইটেম
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-slate-900">৳{Number(order.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Privacy & Permissions */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-600" /> গোপনীয়তা, সম্মতি ও ডেটা নিরাপত্তা
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              আপনার ব্যক্তিগত তথ্যের পূর্ণ নিয়ন্ত্রণ আপনার হাতে। কোনো তৃতীয় পক্ষ আপনার তথ্য দেখতে পারবে না।
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">AI বিশ্লেষণ ও স্মার্ট সাজেশনের সম্মতি</h4>
                <p className="text-xs text-slate-500 mt-0.5">আপনার আপলোডকৃত ফাইল থেকে তথ্য বের করে ভল্টে সাজাতে AI-কে অনুমতি দেওয়া</p>
              </div>
              <button
                onClick={() => handleConsentToggle('ai', vaultProfile?.consentRecord?.aiProcessingConsented ?? true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  (vaultProfile?.consentRecord?.aiProcessingConsented ?? true)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {(vaultProfile?.consentRecord?.aiProcessingConsented ?? true) ? 'সক্রিয় (অনুমতি দেওয়া)' : 'নিষ্ক্রিয়'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">সার্ভিস প্রসেসিং ও প্রোফাইল ডাটাবেজ সম্মতি</h4>
                <p className="text-xs text-slate-500 mt-0.5">সরকারি ও ইন্টারনেট সেবা ফরম পূরণের জন্য নাগরিকের সম্মতিক্রমে তথ্য সংরক্ষণ</p>
              </div>
              <button
                onClick={() => handleConsentToggle('general', vaultProfile?.consentRecord?.consentGiven ?? true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  (vaultProfile?.consentRecord?.consentGiven ?? true)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {(vaultProfile?.consentRecord?.consentGiven ?? true) ? 'সক্রিয় (অনুমোদিত)' : 'বাতিল'}
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className="font-bold text-base text-rose-600 mb-2">ব্যক্তিগত ডাটা মুছে ফেলার অধিকার (GDPR / Data Erasure)</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              আপনি চাইলে যেকোনো সময় আপনার ভল্টে সংরক্ষিত সকল এনআইডি, ঠিকানা, জন্মতারিখ ও ডকুমেন্টস স্থায়ীভাবে মুছে ফেলার অনুরোধ জানাতে পারেন।
            </p>
            <button
              onClick={handleErasureRequest}
              className="px-5 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> আমার সকল ব্যক্তিগত তথ্য মুছে ফেলুন
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

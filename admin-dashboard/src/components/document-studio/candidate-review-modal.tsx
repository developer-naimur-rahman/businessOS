"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  CheckCircle2,
  Sparkles,
  MapPin,
  GraduationCap,
  User,
  Briefcase,
  AlertCircle,
  Copy,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  Building2,
  Info
} from "lucide-react"

export interface StructuredAddressData {
  villageArea: string
  postOffice: string
  postalCode: string
  upazilaThana: string
  district: string
  division: string
  country: string
  inferredFields?: string[]
  inferredClues?: string[]
}

export interface GranularEducationItem {
  degree: string
  examTitle: string
  boardOrUniversity: string
  institution?: string
  passingYear: string
  resultGpa: string
  rollNumber?: string
  regNumber?: string
  groupMajor?: string
}

export interface CandidateExtractionData {
  identity: {
    nameBn: string
    nameEnUpper: string
    nameEnTitle: string
    fatherNameBn?: string
    fatherNameEnUpper?: string
    motherNameBn?: string
    motherNameEnUpper?: string
    dob?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    nidNumber?: string
    birthRegNumber?: string
    phone?: string
    email?: string
  }
  presentAddress: StructuredAddressData
  permanentAddress: StructuredAddressData
  education: GranularEducationItem[]
  experience: Array<{
    company: string
    designation: string
    startDate?: string
    endDate?: string
    responsibilities?: string
  }>
  skills: string[]
  inferredClues: string[]
  confidence: number
  rawSummary: string
  engine: 'AI_GEMINI' | 'ALGORITHMIC_FALLBACK'
  requiresUserConfirmation: boolean
}

interface CandidateReviewModalProps {
  isOpen: boolean
  onClose: () => void
  candidate: CandidateExtractionData | null
  onConfirm: (confirmedCandidate: CandidateExtractionData) => Promise<void>
  isApplying?: boolean
}

const COMMON_BOARDS = [
  'Dhaka Board',
  'Chattogram Board',
  'Rajshahi Board',
  'Cumilla Board',
  'Jashore Board',
  'Barishal Board',
  'Sylhet Board',
  'Dinajpur Board',
  'Mymensingh Board',
  'BTEB (Technical Board)',
  'Madrasah Board',
  'National University',
  'BOU (Open University)'
]

export function CandidateReviewModal({
  isOpen,
  onClose,
  candidate,
  onConfirm,
  isApplying = false
}: CandidateReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'PRESENT_ADDR' | 'PERM_ADDR' | 'EDUCATION' | 'SKILLS'>('IDENTITY')
  const [editedData, setEditedData] = useState<CandidateExtractionData | null>(null)
  const [newSkill, setNewSkill] = useState("")

  useEffect(() => {
    if (candidate) {
      setEditedData(JSON.parse(JSON.stringify(candidate)))
    }
  }, [candidate])

  if (!isOpen || !editedData) return null

  const handleCopyPresentToPermanent = () => {
    setEditedData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        permanentAddress: { ...prev.presentAddress }
      }
    })
  }

  const handleAddEducation = () => {
    setEditedData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        education: [
          ...prev.education,
          {
            degree: 'HSC',
            examTitle: 'Higher Secondary Certificate (HSC)',
            boardOrUniversity: 'Dhaka Board',
            institution: '',
            passingYear: '2020',
            resultGpa: '5.00',
            rollNumber: '',
            regNumber: '',
            groupMajor: 'Science'
          }
        ]
      }
    })
  }

  const handleRemoveEducation = (index: number) => {
    setEditedData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }
    })
  }

  const handleAddSkill = () => {
    if (!newSkill.trim() || !editedData) return
    setEditedData({
      ...editedData,
      skills: [...editedData.skills, newSkill.trim()]
    })
    setNewSkill("")
  }

  const handleRemoveSkill = (skill: string) => {
    if (!editedData) return
    setEditedData({
      ...editedData,
      skills: editedData.skills.filter((s) => s !== skill)
    })
  }

  const handleConfirmClick = async () => {
    if (!editedData) return
    await onConfirm(editedData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">AI স্মার্ট তথ্য বিশ্লেষণ ও হিউম্যান কনফার্মেশন</h2>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> যাচাই আবশ্যক
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                নাম ক্যাপিটাল লেটারে রূপান্তর, পৃথক গ্রাম-থানা-জেলা ফিল্ড এবং শিক্ষা বোর্ডের তথ্য যাচাই করে নিশ্চিত করুন।
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inferred Clues Banner */}
        {editedData.inferredClues && editedData.inferredClues.length > 0 && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">ভৌগোলিক ক্লু ডিডাকশন: </span>
              {editedData.inferredClues.join(' • ')}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('IDENTITY')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
              activeTab === 'IDENTITY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            ১. নাম ও ব্যক্তিগত তথ্য
          </button>
          <button
            onClick={() => setActiveTab('PRESENT_ADDR')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
              activeTab === 'PRESENT_ADDR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            ২. বর্তমান ঠিকানা (পৃথক ফিল্ড)
          </button>
          <button
            onClick={() => setActiveTab('PERM_ADDR')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
              activeTab === 'PERM_ADDR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            ৩. স্থায়ী ঠিকানা
          </button>
          <button
            onClick={() => setActiveTab('EDUCATION')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
              activeTab === 'EDUCATION' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            ৪. শিক্ষাগত যোগ্যতা ({editedData.education?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('SKILLS')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
              activeTab === 'SKILLS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            ৫. দক্ষতা ও অভিজ্ঞতা
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: IDENTITY */}
          {activeTab === 'IDENTITY' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 leading-relaxed">
                  ইংরেজি নাম স্বয়ংক্রিয়ভাবে আন্তর্জাতিক স্ট্যান্ডার্ড অনুযায়ী <strong>ALL UPPERCASE (বড় হাতের অক্ষরে)</strong> ফরম্যাট করা হয়েছে। প্রয়োজন অনুযায়ী বাংলা ও ইংরেজি নাম সংশোধন করতে পারেন।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পূর্ণ নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={editedData.identity.nameBn}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: { ...editedData.identity, nameBn: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Full Name (English UPPERCASE) *</label>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      🔤 অটো-ক্যাপিটালাইজড
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editedData.identity.nameEnUpper}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: {
                          ...editedData.identity,
                          nameEnUpper: e.target.value.toUpperCase()
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold uppercase tracking-wider text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">পিতার নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={editedData.identity.fatherNameBn || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: { ...editedData.identity, fatherNameBn: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Father's Name (English UPPERCASE)</label>
                  <input
                    type="text"
                    value={editedData.identity.fatherNameEnUpper || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: {
                          ...editedData.identity,
                          fatherNameEnUpper: e.target.value.toUpperCase()
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">মাতার নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={editedData.identity.motherNameBn || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: { ...editedData.identity, motherNameBn: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mother's Name (English UPPERCASE)</label>
                  <input
                    type="text"
                    value={editedData.identity.motherNameEnUpper || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: {
                          ...editedData.identity,
                          motherNameEnUpper: e.target.value.toUpperCase()
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">জন্মতারিখ (DOB)</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={editedData.identity.dob || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: { ...editedData.identity, dob: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">জাতীয় পরিচয়পত্র নম্বর (NID)</label>
                  <input
                    type="text"
                    value={editedData.identity.nidNumber || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: { ...editedData.identity, nidNumber: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    value={editedData.identity.phone || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: { ...editedData.identity, phone: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ইমেইল ঠিকানা</label>
                  <input
                    type="email"
                    value={editedData.identity.email || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        identity: { ...editedData.identity, email: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRESENT ADDRESS (Atomic Fields) */}
          {activeTab === 'PRESENT_ADDR' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 leading-relaxed">
                  <strong>এটমিক ঠিকানা বিভাজন:</strong> ঠিকানা কখনোই একটি একক ফর্মে রাখা হয়নি। গ্রাম, ডাকঘর, পোস্টকোড, থানা ও জেলা সম্পূর্ণ পৃথক ফিল্ডে বিভক্ত। যেকোনো ফিল্ডের তথ্য প্রয়োজনমতো সম্পাদনা করতে পারেন।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">গ্রাম / পাড়া / এলাকা / রোড নং</label>
                  <input
                    type="text"
                    placeholder="যেমন: বাঘিয়া বা হাউস #১২, রোড #৪"
                    value={editedData.presentAddress.villageArea}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        presentAddress: { ...editedData.presentAddress, villageArea: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ডাকঘর (Post Office)</label>
                  <input
                    type="text"
                    placeholder="যেমন: কাশিমপুর"
                    value={editedData.presentAddress.postOffice}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        presentAddress: { ...editedData.presentAddress, postOffice: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">পোস্ট কোড (Postal Code)</label>
                    {editedData.presentAddress.inferredFields?.includes('postalCode') && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        💡 Clue থেকে পূর্বাভাস
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="যেমন: 1704"
                    value={editedData.presentAddress.postalCode}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        presentAddress: { ...editedData.presentAddress, postalCode: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">উপজেলা / থানা (Thana / Upazila)</label>
                  <input
                    type="text"
                    placeholder="যেমন: কাশিমপুর / গাজীপুর সদর"
                    value={editedData.presentAddress.upazilaThana}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        presentAddress: { ...editedData.presentAddress, upazilaThana: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">জেলা (District)</label>
                  <input
                    type="text"
                    placeholder="যেমন: গাজীপুর"
                    value={editedData.presentAddress.district}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        presentAddress: { ...editedData.presentAddress, district: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">বিভাগ (Division)</label>
                  <input
                    type="text"
                    placeholder="যেমন: ঢাকা"
                    value={editedData.presentAddress.division}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        presentAddress: { ...editedData.presentAddress, division: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERMANENT ADDRESS */}
          {activeTab === 'PERM_ADDR' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">স্থায়ী ঠিকানার বিবরণ</span>
                <button
                  type="button"
                  onClick={handleCopyPresentToPermanent}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> বর্তমান ঠিকানার অনুরূপ করুন
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">গ্রাম / পাড়া / এলাকা / রোড নং</label>
                  <input
                    type="text"
                    value={editedData.permanentAddress.villageArea}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        permanentAddress: { ...editedData.permanentAddress, villageArea: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ডাকঘর (Post Office)</label>
                  <input
                    type="text"
                    value={editedData.permanentAddress.postOffice}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        permanentAddress: { ...editedData.permanentAddress, postOffice: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">পোস্ট কোড (Postal Code)</label>
                  <input
                    type="text"
                    value={editedData.permanentAddress.postalCode}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        permanentAddress: { ...editedData.permanentAddress, postalCode: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">উপজেলা / থানা</label>
                  <input
                    type="text"
                    value={editedData.permanentAddress.upazilaThana}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        permanentAddress: { ...editedData.permanentAddress, upazilaThana: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">জেলা</label>
                  <input
                    type="text"
                    value={editedData.permanentAddress.district}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        permanentAddress: { ...editedData.permanentAddress, district: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">বিভাগ</label>
                  <input
                    type="text"
                    value={editedData.permanentAddress.division}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        permanentAddress: { ...editedData.permanentAddress, division: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EDUCATION (Discrete Board, Roll, GPA) */}
          {activeTab === 'EDUCATION' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 font-semibold">
                  প্রতিটি শিক্ষাগত যোগ্যতার জন্য ডিগ্রি, বোর্ড, রোল ও জিপিএ আলাদা রেকর্ড করা হয়েছে।
                </p>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> নতুন ডিগ্রি যোগ করুন
                </button>
              </div>

              {editedData.education?.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  কোনো শিক্ষাগত যোগ্যতার তথ্য পাওয়া যায়নি। 'নতুন ডিগ্রি যোগ করুন' ক্লিক করুন।
                </div>
              ) : (
                <div className="space-y-3">
                  {editedData.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(idx)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-white"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pr-6">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">ডিগ্রি / পরীক্ষার নাম</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const copy = [...editedData.education]
                              copy[idx].degree = e.target.value
                              copy[idx].examTitle = e.target.value
                              setEditedData({ ...editedData, education: copy })
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">শিক্ষা বোর্ড / বিশ্ববিদ্যালয় *</label>
                          <input
                            type="text"
                            list={`boards-list-${idx}`}
                            value={edu.boardOrUniversity}
                            onChange={(e) => {
                              const copy = [...editedData.education]
                              copy[idx].boardOrUniversity = e.target.value
                              setEditedData({ ...editedData, education: copy })
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-indigo-700"
                          />
                          <datalist id={`boards-list-${idx}`}>
                            {COMMON_BOARDS.map((b) => (
                              <option key={b} value={b} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">শিক্ষা প্রতিষ্ঠান (Institution)</label>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => {
                              const copy = [...editedData.education]
                              copy[idx].institution = e.target.value
                              setEditedData({ ...editedData, education: copy })
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">বিভাগ / গ্রুপ (Group / Major)</label>
                          <input
                            type="text"
                            placeholder="যেমন: Science / CSE"
                            value={edu.groupMajor || ''}
                            onChange={(e) => {
                              const copy = [...editedData.education]
                              copy[idx].groupMajor = e.target.value
                              setEditedData({ ...editedData, education: copy })
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">পাসের সন (Passing Year)</label>
                          <input
                            type="text"
                            placeholder="যেমন: 2018"
                            value={edu.passingYear}
                            onChange={(e) => {
                              const copy = [...editedData.education]
                              copy[idx].passingYear = e.target.value
                              setEditedData({ ...editedData, education: copy })
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">ফলাফল / জিপিএ (GPA / CGPA)</label>
                          <input
                            type="text"
                            placeholder="যেমন: 5.00"
                            value={edu.resultGpa}
                            onChange={(e) => {
                              const copy = [...editedData.education]
                              copy[idx].resultGpa = e.target.value
                              setEditedData({ ...editedData, education: copy })
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-emerald-700"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">রোল নম্বর (Roll Number)</label>
                          <input
                            type="text"
                            placeholder="যদি থাকে"
                            value={edu.rollNumber || ''}
                            onChange={(e) => {
                              const copy = [...editedData.education]
                              copy[idx].rollNumber = e.target.value
                              setEditedData({ ...editedData, education: copy })
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">রেজিস্ট্রেশন নম্বর (Reg No)</label>
                          <input
                            type="text"
                            placeholder="যদি থাকে"
                            value={edu.regNumber || ''}
                            onChange={(e) => {
                              const copy = [...editedData.education]
                              copy[idx].regNumber = e.target.value
                              setEditedData({ ...editedData, education: copy })
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SKILLS */}
          {activeTab === 'SKILLS' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="নতুন দক্ষতা লিখুন (যেমন: JavaScript, MS Word, Graphics)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
                >
                  যোগ করুন
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {editedData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-indigo-400 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AI কনফিডেন্স স্কোর: <strong>{Math.round(editedData.confidence * 100)}%</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              বাতিল
            </button>

            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isApplying}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  সংরক্ষণ করা হচ্ছে...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  সকল তথ্য নিশ্চিত করুন ও সেভ করুন
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

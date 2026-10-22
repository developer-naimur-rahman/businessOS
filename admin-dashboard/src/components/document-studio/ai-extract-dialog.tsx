"use client"

import React, { useState } from "react"
import {
  X,
  Sparkles,
  UploadCloud,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  MapPin,
  GraduationCap
} from "lucide-react"
import { toast } from "sonner"

interface AiExtractDialogProps {
  isOpen: boolean
  onClose: () => void
  onExtract: (payload: { fileBase64OrText: string; docTypeHint?: string; filename?: string }) => Promise<void>
  isLoading?: boolean
}

export function AiExtractDialog({
  isOpen,
  onClose,
  onExtract,
  isLoading = false
}: AiExtractDialogProps) {
  const [activeTab, setActiveTab] = useState<'TEXT' | 'FILE'>('TEXT')
  const [inputText, setInputText] = useState("")
  const [docTypeHint, setDocTypeHint] = useState("IDENTITY_OR_ACADEMIC_OR_CV")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string>("")

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setFileBase64(result)
    }
    if (file.type.startsWith('text') || file.name.endsWith('.txt')) {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }
  }

  const handleApplyPreset = (presetType: 'NID_VILLAGE' | 'ACADEMIC_BOARD' | 'MIXED_CV') => {
    if (presetType === 'NID_VILLAGE') {
      setInputText(
        `নাম: মোঃ নাঈমুর রহমান\n` +
        `পিতার নাম: মোঃ খলিলুর রহমান\n` +
        `মাতার নাম: নাছিমা আক্তার\n` +
        `জন্মতারিখ: 1998-05-15\n` +
        `এনআইডি নম্বর: 19982690000000000\n` +
        `ঠিকানা: বাঘিয়া, কাশিমপুর, গাজীপুর\n` +
        `মোবাইল: 01712345678`
      )
    } else if (presetType === 'ACADEMIC_BOARD') {
      setInputText(
        `প্রার্থীর নাম: মোঃ নাঈমুর রহমান\n` +
        `মোবাইল: 01712345678\n` +
        `ঠিকানা: বাঘিয়া, কাশিমপুর, গাজীপুর\n` +
        `শিক্ষাগত যোগ্যতা:\n` +
        `পরীক্ষা: এসএসসি (SSC)\n` +
        `বোর্ড: ঢাকা বোর্ড\n` +
        `রোল: 104523\n` +
        `রেজিস্ট্রেশন: 1214567890\n` +
        `পাসের সন: 2016\n` +
        `ফলাফল: জিপিএ 5.00\n\n` +
        `পরীক্ষা: এইচএসসি (HSC)\n` +
        `বোর্ড: ঢাকা বোর্ড\n` +
        `পাসের সন: 2018\n` +
        `ফলাফল: জিপিএ 5.00`
      )
    } else {
      setInputText(
        `Md. Naimur Rahman\n` +
        `Phone: 01712345678\n` +
        `Email: naimur.rahman@example.com\n` +
        `Address: বাঘিয়া, কাশিমপুর, গাজীপুর\n` +
        `Education:\n` +
        `B.Sc in CSE, DUET (2022), CGPA: 3.78\n` +
        `HSC Science, Dhaka College, Dhaka Board (2016), GPA: 5.00\n` +
        `Skills: TypeScript, Next.js, Node.js, PostgreSQL`
      )
    }
  }

  const handleSubmit = async () => {
    if (activeTab === 'TEXT') {
      if (!inputText.trim()) {
        toast.error("অনুগ্রহ করে ডকুমেন্টের টেক্সট বা ক্লু দিন")
        return
      }
      await onExtract({
        fileBase64OrText: inputText.trim(),
        docTypeHint,
        filename: 'pasted_text.txt'
      })
    } else {
      if (!fileBase64) {
        toast.error("অনুগ্রহ করে একটি ফাইল নির্বাচন করুন")
        return
      }
      await onExtract({
        fileBase64OrText: fileBase64,
        docTypeHint,
        filename: selectedFile?.name || 'uploaded_doc'
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">✨ AI স্মার্ট ডকুমেন্ট আপলোড ও অটো-ডিটেক্ট</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                NID, সার্টিফিকেট বা জীবনবৃত্তান্তের টেক্সট দিন — AI স্বয়ংক্রিয়ভাবে ফিল্ড সাজিয়ে দেবে।
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

        {/* Mode Selector */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('TEXT')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'TEXT' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📝 টেক্সট বা ক্লু পেস্ট করুন
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FILE')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'FILE' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📁 ফাইল আপলোড (ছবি / PDF)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 flex-1">
          {activeTab === 'TEXT' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">ডকুমেন্ট টেক্সট / ক্লু পেস্ট করুন:</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">নমুনা ক্লু:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('NID_VILLAGE')}
                    className="text-[10px] font-bold text-indigo-600 hover:underline bg-indigo-50 px-2 py-0.5 rounded"
                  >
                    বাঘিয়া, কাশিমপুর NID
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ACADEMIC_BOARD')}
                    className="text-[10px] font-bold text-indigo-600 hover:underline bg-indigo-50 px-2 py-0.5 rounded"
                  >
                    শিক্ষা বোর্ড ও রোল
                  </button>
                </div>
              </div>

              <textarea
                rows={7}
                placeholder="এখানে NID, এডমিট কার্ড, সার্টিফিকেট বা জীবনবৃত্তান্তের টেক্সট পেস্ট করুন...&#10;যেমন:&#10;নাম: মোঃ নাঈমুর রহমান&#10;ঠিকানা: বাঘিয়া, কাশিমপুর, গাজীপুর&#10;বোর্ড: ঢাকা বোর্ড, ফলাফল: জিপিএ 5.00"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">ডকুমেন্টের ছবি বা PDF ফাইল নির্বাচন করুন:</label>
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,application/pdf,text/plain"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'ছবি বা PDF ফাইল ড্রপ করুন বা ক্লিক করুন'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  JPG, PNG, PDF অথবা TXT ফাইল সমর্থিত (সর্বোচ্চ 10MB)
                </p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>AI স্বয়ংক্রিয় প্রসেসিং:</strong> গ্রাম/ডাকঘর ক্লু থেকে থানা, পোস্টকোড ও জেলা স্বয়ংক্রিয় ডিটেক্ট করা হবে। নাম ইংরেজি ক্যাপিটালে রূপান্তর হবে। বিশ্লেষণ শেষে আপনাকে একটি রিভিউ উইন্ডো দেখানো হবে।
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                বিশ্লেষণ চলছে...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                AI দিয়ে বিশ্লেষণ করুন
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

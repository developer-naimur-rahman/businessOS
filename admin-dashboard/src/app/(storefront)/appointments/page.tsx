"use client"
import React, { useEffect, useState, useMemo, Suspense } from "react"
import { api } from "../../../lib/api-client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react"

function AppointmentsContent() {
  const searchParams = useSearchParams()
  const initialSlug = searchParams.get("service") || "teletalk-govt-job"

  const [services, setServices] = useState<any[]>([])
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)

  // Date selection (default today or tomorrow)
  const tomorrowStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [])
  const [selectedDate, setSelectedDate] = useState(tomorrowStr)

  // Slots state
  const [slotsData, setSlotsData] = useState<any>(null)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null)

  // Customer Contact State
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [notes, setNotes] = useState("")

  // Booking Result
  const [isBooking, setIsBooking] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null)

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await api.get('/public/services')
        if (Array.isArray(res.data) && res.data.length > 0) {
          setServices(res.data)
        }
      } catch (e) {
        console.error("Failed to load catalog", e)
      }
    }
    loadCatalog()
  }, [])

  const currentService = useMemo(() => {
    return services.find(s => s.slug === selectedSlug) || services[0]
  }, [services, selectedSlug])

  // Fetch real available slots for the selected date
  useEffect(() => {
    async function fetchSlots() {
      setLoadingSlots(true)
      setSelectedSlotTime(null)
      try {
        const res = await api.get('/public/appointments/slots', {
          params: { date: selectedDate, service: selectedSlug }
        })
        setSlotsData(res.data)
      } catch (e) {
        console.error("Failed to load slots", e)
      } finally {
        setLoadingSlots(false)
      }
    }
    if (selectedDate) {
      fetchSlots()
    }
  }, [selectedDate, selectedSlug])

  // Book Slot with Atomic Double-Booking Prevention
  const handleBookAppointment = async () => {
    if (!customerName || !customerPhone || !selectedSlotTime) {
      toast.error("আপনার নাম, মোবাইল নম্বর ও সময় স্লট নির্বাচন করুন।")
      return
    }

    setIsBooking(true)
    try {
      const payload = {
        serviceSlug: currentService?.slug || 'teletalk-govt-job',
        serviceTitleBn: currentService?.titleBn || 'অনলাইন সেবা',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        appointmentDate: selectedDate,
        slotTime: selectedSlotTime,
        notes: notes.trim() || undefined,
      }

      const res = await api.post('/public/appointments/book', payload)
      if (res.data?.tokenNumber) {
        setConfirmedBooking(res.data)
        toast.success(`অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে! টোকেন #${res.data.tokenNumber}`)
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error("দুঃখিত! এই স্লটটি ইতোমধ্যে অন্য গ্রাহক বুক করে ফেলেছেন। অন্য সময় নির্বাচন করুন।")
        // Refresh slots
        const res = await api.get('/public/appointments/slots', { params: { date: selectedDate } })
        setSlotsData(res.data)
        setSelectedSlotTime(null)
      } else {
        toast.error("অ্যাপয়েন্টমেন্ট বুকিংয়ে সমস্যা হয়েছে: " + (err.response?.data?.message || err.message))
      }
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 md:py-16 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-10 text-center space-y-2">
        <span className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          Real-Time Counter Availability Engine
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          দোকান অ্যাপয়েন্টমেন্ট বুকিং
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          লাইভ শপ শিডিউল থেকে ফাঁকা স্লট বেছে নিন। দোকানে এসেই কোনো লাইন ছাড়া সরাসরি সার্ভিস পান।
        </p>
      </div>

      {!confirmedBooking ? (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8">
          
          {/* 1. Service Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">
              ১. সেবা নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setSelectedSlug(s.slug)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedSlug === s.slug
                      ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">{s.titleBn}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{s.estimatedProcessingTime}</span>
                  </div>
                  {selectedSlug === s.slug && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Date Selection */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">
              ২. তারিখ নির্বাচন করুন:
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500 font-medium">
                দোকান খোলার সময়: শনি থেকে বৃহস্পতি (সকাল ৯:৩০ - রাত ৮:৩০)। শুক্রবার সাপ্তাহিক বন্ধ।
              </span>
            </div>
          </div>

          {/* 3. Slot Availability View */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">
                ৩. উপলব্ধ সময় স্লট (Genuinely Available Slots):
              </label>
              {slotsData?.isOpen && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  {slotsData.availableSlotsCount} টি স্লট ফাঁকা আছে
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl" />
                ))}
              </div>
            ) : !slotsData?.isOpen ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-1">
                <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                <p className="font-bold text-sm">{slotsData?.reasonBn || 'এই তারিখে দোকান বন্ধ থাকবে।'}</p>
                <p className="text-xs text-amber-700">অনুগ্রহ করে অন্য কোনো কর্মদিবসের তারিখ নির্বাচন করুন।</p>
              </div>
            ) : slotsData.slots.length === 0 ? (
              <p className="text-xs text-slate-400">কোনো স্লট পাওয়া যায়নি।</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {slotsData.slots.map((slot: any) => {
                  const isSelected = selectedSlotTime === slot.time
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlotTime(slot.time)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        !slot.available
                          ? "bg-slate-100/60 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white font-extrabold shadow-md shadow-emerald-600/30 scale-105"
                          : "bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold block">{slot.time}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? "text-emerald-100" : slot.available ? "text-emerald-600" : "text-slate-400"}`}>
                        {slot.available ? `${slot.remainingCapacity} সিট বাকি` : 'বুকড (ফুল)'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 4. Customer Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">আপনার নাম (Full Name) *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="আপনার নাম লিখুন"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর (Phone Number) *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">অতিরিক্ত কোনো তথ্য বা নোট থাকলে লিখুন (ঐচ্ছিক):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="যেমন: পুরাতন পাসপোর্ট নবায়ন, জরুরি ডেলিভারি..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {selectedSlotTime ? `নির্বাচিত: ${selectedDate} তারিখের ${selectedSlotTime} স্লট` : 'অনুগ্রহ করে একটি স্লট নির্বাচন করুন'}
            </span>
            <button
              onClick={handleBookAppointment}
              disabled={isBooking || !selectedSlotTime}
              className="w-full sm:w-auto px-10 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 inline-flex items-center justify-center gap-2 transition-all"
            >
              {isBooking ? "বুকিং নিশ্চিত হচ্ছে..." : "✓ অ্যাপয়েন্টমেন্ট কনফার্ম করুন"}
            </button>
          </div>

        </div>
      ) : (
        /* Confirmed Booking Voucher Card */
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-xl max-w-lg mx-auto text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে!</h2>
            <p className="text-xs text-slate-500 mt-1">
              দোকানে এসে এই টোকেনটি সার্ভিস ডেস্কে প্রদর্শন করুন।
            </p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block">বুকিং টোকেন নম্বর</span>
            <div className="text-3xl font-black tracking-wider font-mono">
              {confirmedBooking.tokenNumber}
            </div>
            <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-white/10 text-left">
              <p>• সেবা: <strong>{confirmedBooking.serviceTitleBn}</strong></p>
              <p>• তারিখ: <strong>{confirmedBooking.appointmentDate}</strong></p>
              <p>• নির্ধারিত সময়: <strong>{confirmedBooking.slotTime}</strong> (২০ মিনিট)</p>
              <p>• গ্রাহকের নাম: <strong>{confirmedBooking.customerName}</strong> ({confirmedBooking.customerPhone})</p>
            </div>
          </div>

          {/* Checklist notice */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left text-xs text-amber-950 space-y-1">
            <span className="font-bold block">দোকানে আসার প্রস্তুতি:</span>
            <p>• মূল শিক্ষাগত সনদ, NID বা জন্ম সনদের কপি সাথে আনবেন।</p>
            <p>• নির্ধারিত সময়ের ৫ মিনিট পূর্বে সার্ভিস ডেস্কে উপস্থিত হওয়ার অনুরোধ করা হচ্ছে।</p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={`/service-helper?service=${confirmedBooking.serviceSlug}`}
              className="w-full py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-all block"
            >
              📋 প্রয়োজনীয় কাগজের চেকলিস্ট দেখুন
            </Link>
            <button
              onClick={() => { setConfirmedBooking(null); setSelectedSlotTime(null); }}
              className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all block"
            >
              আরেকটি অ্যাপয়েন্টমেন্ট বুকিং করুন
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1000px] mx-auto p-12 text-center text-slate-400">Loading appointments...</div>}>
      <AppointmentsContent />
    </Suspense>
  )
}

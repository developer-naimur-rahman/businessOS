"use client"
import React, { useState } from 'react';
import { api } from '../../lib/api-client';
import { 
  Search, ShieldCheck, Wrench, Printer, ShoppingBag, CheckCircle2, 
  Clock, AlertTriangle, ArrowRight, Phone, MessageSquare, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function PublicTrackerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.warning('Please enter an Invoice, Job Ticket, S/N, or Phone number.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get('/public/track', { params: { query: searchQuery.trim() } });
      if (res.data?.found) {
        setResult(res.data);
      } else {
        setResult({ notFound: true, message: res.data?.message || 'No record found.' });
      }
    } catch (err: any) {
      toast.error('Search request failed. Please check your number.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl w-full mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Official Customer Self-Service Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Track Order, Service & Warranty
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            ইনভয়েস, সার্ভিস জব টিকেট (#JOB-xxxx), পেনড্রাইভ টোকেন (#PRT-xxx), অথবা মোবাইল নম্বর দিয়ে লাইভ স্ট্যাটাস দেখুন
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleTrack} className="mb-8">
          <div className="relative group">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Enter Invoice / Ticket / S/N / Phone (e.g. JOB-2026-1042 or 017...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-28 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm sm:text-base text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : <>Track <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </form>

        {/* Search Result */}
        {result && (
          result.notFound ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center animate-in fade-in">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-white text-base">No Matching Record Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{result.message}</p>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 space-y-6">
              {/* Type Badge & Ref # */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    {result.type === 'SERVICE_JOB' ? <Wrench className="w-5 h-5" /> :
                     result.type === 'PRINT_DROP' ? <Printer className="w-5 h-5" /> :
                     result.type === 'WARRANTY_RECORD' ? <ShieldCheck className="w-5 h-5" /> :
                     <ShoppingBag className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                      {result.type?.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-lg font-black text-white font-mono">{result.referenceNumber}</h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full inline-block">
                    {result.statusLabel}
                  </span>
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <h4 className="text-base font-bold text-slate-200">{result.title}</h4>
                {result.deviceOrFile && (
                  <p className="text-xs text-slate-400 mt-0.5">Device / Spec: {result.deviceOrFile}</p>
                )}
              </div>

              {/* Visual 4-Step Progress Bar */}
              {result.steps && (
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 relative">
                    {result.steps.map((st: any, idx: number) => (
                      <div key={idx} className="flex flex-col items-center text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                          st.completed 
                            ? 'bg-emerald-500 text-slate-950 font-black' 
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}>
                          {st.completed ? <CheckCircle2 className="w-4 h-4" /> : st.index}
                        </div>
                        <span className={`text-[11px] font-semibold ${st.completed ? 'text-slate-200' : 'text-slate-500'}`}>
                          {st.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial & Pickup Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[11px] text-slate-400 block">বিল ও পরিশোধ পরিস্থিতি (Payment Due)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">৳{result.financials?.totalBdt?.toLocaleString()}</span>
                    {result.financials?.dueAmountBdt > 0 ? (
                      <span className="text-xs font-bold text-rose-400 font-mono">
                        (বকেয়া: ৳{result.financials?.dueAmountBdt?.toLocaleString()})
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 font-mono">(পরিশোধিত / Paid)</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl flex flex-col justify-between">
                  <span className="text-[11px] text-indigo-300 font-medium">Customer Verification Note</span>
                  <p className="text-xs text-slate-300 font-semibold">{result.pickupNote}</p>
                </div>
              </div>

              {/* WhatsApp Support Button */}
              <div className="pt-2 flex justify-center">
                <a
                  href={`https://wa.me/8801700000000?text=${encodeURIComponent(`Hello, I am tracking my token #${result.referenceNumber}. Can I get an update?`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Need urgent assistance? Chat with Shop Desk on WhatsApp
                </a>
              </div>
            </div>
          )
        )}
      </div>

      <footer className="text-center text-slate-600 text-xs py-4">
        Powered by BusinessOS • Real-Time Customer Transparency Portal
      </footer>
    </div>
  );
}

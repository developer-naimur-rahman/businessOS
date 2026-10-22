"use client"
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api-client';
import { 
  Printer, QrCode, Clock, CheckCircle2, AlertCircle, RefreshCw, 
  FileText, Download, ArrowRight, User, Phone, Layers, Sparkles, X, Search
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPrintQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING_IN_QUEUE' | 'PRINTING_NOW' | 'PRINTED_READY' | 'BILLED_COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrConfig, setQrConfig] = useState<any>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/print-queue', {
        params: { status: activeTab !== 'ALL' ? activeTab : undefined }
      });
      setQueue(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load print queue.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQrConfig = async () => {
    try {
      const res = await api.get('/admin/print-queue/qr-config');
      setQrConfig(res.data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchQrConfig();
  }, [activeTab]);

  const filteredQueue = useMemo(() => {
    return queue.filter(job => {
      // 1. Tab filter
      if (activeTab === 'WAITING_IN_QUEUE' && job.status !== 'QUEUED' && job.status !== 'WAITING_IN_QUEUE') return false
      if (activeTab === 'PRINTING_NOW' && job.status !== 'PRINTING' && job.status !== 'PRINTING_NOW') return false
      if (activeTab === 'PRINTED_READY' && job.status !== 'READY_FOR_PICKUP' && job.status !== 'PRINTED_READY') return false
      if (activeTab === 'BILLED_COMPLETED' && job.status !== 'BILLED_DELIVERED' && job.status !== 'BILLED_COMPLETED') return false

      // 2. Search query filter
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        job.tokenNumber?.toLowerCase().includes(q) ||
        job.customerPhone?.includes(q) ||
        job.customerName?.toLowerCase().includes(q) ||
        job.fileName?.toLowerCase().includes(q)
      )
    })
  }, [queue, searchQuery, activeTab])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/print-queue/${id}/status`, { status: newStatus });
      toast.success(`Job marked as ${newStatus.replace(/_/g, ' ')}`);
      fetchQueue();
    } catch {
      toast.error('Failed to update job status.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Printer className="w-7 h-7 text-indigo-600" /> Print Drop Desk & Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Zero-pendrive walk-in customer file submissions & live machine queue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/pos"
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>কাউন্টার POS</span>
          </Link>
          <button
            onClick={() => setQrModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-indigo-400" /> Desk QR Standee
          </button>
          <button
            onClick={fetchQueue}
            className="w-10 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fast Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="টোকেন নম্বর (#PRT-xxx), কাস্টমার মোবাইল নম্বর বা ফাইল নাম দিয়ে খুঁজুন..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-14 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm font-medium text-slate-900 outline-none transition-all shadow-xs"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'ALL', label: 'All Jobs' },
          { key: 'WAITING_IN_QUEUE', label: 'Waiting in Queue' },
          { key: 'PRINTING_NOW', label: 'Printing Now' },
          { key: 'PRINTED_READY', label: 'Ready for Pickup' },
          { key: 'BILLED_COMPLETED', label: 'Billed & Delivered' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab.key 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          ))}
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
          <Printer className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-30" />
          <h3 className="font-bold text-slate-700">No print jobs found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'Try clearing your search query.' : 'Walk-in customer drops will automatically show up here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueue.map(job => {
            const isQueued = job.status === 'QUEUED' || job.status === 'WAITING_IN_QUEUE';
            const isPrinting = job.status === 'PRINTING' || job.status === 'PRINTING_NOW';
            const isReady = job.status === 'READY_FOR_PICKUP' || job.status === 'PRINTED_READY';
            const isBilled = job.status === 'BILLED_DELIVERED' || job.status === 'BILLED_COMPLETED';

            return (
              <div 
                key={job.id} 
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                      #{job.tokenNumber}
                    </span>
                    
                    {/* Interactive Status Selector */}
                    <select
                      value={isQueued ? 'QUEUED' : isPrinting ? 'PRINTING' : isReady ? 'READY_FOR_PICKUP' : 'BILLED_DELIVERED'}
                      onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer outline-none transition-all ${
                        isQueued ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        isPrinting ? 'bg-blue-50 text-blue-800 border-blue-300 animate-pulse' :
                        isReady ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="QUEUED">⏳ Waiting in Queue</option>
                      <option value="PRINTING">🖨️ Printing Now</option>
                      <option value="READY_FOR_PICKUP">✅ Ready for Pickup</option>
                      <option value="BILLED_DELIVERED">📦 Billed & Delivered</option>
                    </select>
                  </div>

                  {/* File info */}
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{job.fileName}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        {job.paperSize} • {job.colorMode === 'FULL_COLOR' ? 'Color' : 'B&W'} • {job.copies} Copies
                      </p>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 text-xs text-slate-600 mb-3 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500 font-medium"><User className="w-3.5 h-3.5 mr-1" /> Customer:</span>
                      <span className="font-bold text-slate-800">{job.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500 font-medium"><Phone className="w-3.5 h-3.5 mr-1" /> Phone:</span>
                      <span className="font-mono text-slate-800">{job.customerPhone}</span>
                    </div>
                    {job.bindingOrLamination && job.bindingOrLamination !== 'NONE' && (
                      <div className="flex items-center justify-between text-indigo-700 font-semibold">
                        <span>Add-on:</span>
                        <span>{job.bindingOrLamination.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {job.notes && (
                      <p className="text-[11px] text-amber-700 italic pt-1 border-t border-slate-200/60">
                        Note: "{job.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Fee</span>
                    <p className="text-lg font-black text-slate-900">৳{job.estimatedPriceBdt}</p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Action Step Buttons */}
                    {isQueued && (
                      <button
                        onClick={() => handleUpdateStatus(job.id, 'PRINTING')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        Start Print
                      </button>
                    )}
                    {isPrinting && (
                      <button
                        onClick={() => handleUpdateStatus(job.id, 'READY_FOR_PICKUP')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        Mark Ready
                      </button>
                    )}
                    {isReady && (
                      <>
                        <Link
                          href={`/admin/pos?importPrintQueueId=${job.id}&token=${job.tokenNumber}&fee=${job.estimatedPriceBdt}&customer=${encodeURIComponent(job.customerName)}&phone=${job.customerPhone}`}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors"
                          title="কাউন্টার POS এ বিল করুন"
                        >
                          POS এ বিল
                        </Link>
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'BILLED_DELIVERED')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                          Bill & Collect
                        </button>
                      </>
                    )}
                    {isBilled && (
                      <span className="text-xs font-bold text-slate-400 py-1.5 px-2">
                        ✓ সম্পন্ন
                      </span>
                    )}

                    {job.fileUrlOrBase64 && (
                      <a
                        href={job.fileUrlOrBase64}
                        download={job.fileName}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                        title="Download attached file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* QR Standee Poster Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="bg-indigo-600 p-6 text-center text-white relative">
              <button 
                onClick={() => setQrModalOpen(false)}
                className="absolute top-4 right-4 text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black">Desk Print Standee</h3>
              <p className="text-xs text-indigo-200 mt-1">Place this QR poster at your shop cash desk</p>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-48 h-48 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl mx-auto flex flex-col items-center justify-center p-3">
                <QrCode className="w-36 h-36 text-slate-900" />
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-base">স্ক্যান করে প্রিন্ট ফাইল ড্রপ করুন</h4>
                <p className="text-xs text-slate-500 mt-0.5">পেনড্রাইভের ঝামেলা ও ভাইরাস ছাড়াই সরাসরি প্রিন্ট করুন</p>
                <p className="text-[11px] font-mono font-bold text-indigo-600 mt-1">
                  URL: /upload-print
                </p>
              </div>

              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Shop Desk Poster (A4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

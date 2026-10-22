"use client"
import React, { useState } from 'react';
import { api } from '../../lib/api-client';
import { 
  Printer, Upload, CheckCircle2, FileText, Smartphone, ShieldCheck, 
  Sparkles, Layers, Palette, Copy, AlertCircle, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function PublicPrintUploadPage() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrlOrLink, setFileUrlOrLink] = useState('');
  const [paperSize, setPaperSize] = useState<'A4' | 'LEGAL' | 'PHOTO_4R' | 'PHOTO_STAMP_PP' | 'PVC_ID_CARD' | 'BANNER_SQFT'>('A4');
  const [colorMode, setColorMode] = useState<'BLACK_WHITE' | 'FULL_COLOR'>('BLACK_WHITE');
  const [copies, setCopies] = useState(1);
  const [pageRange, setPageRange] = useState('All Pages');
  const [binding, setBinding] = useState<'NONE' | 'SPIRAL_BINDING' | 'LAMINATION'>('NONE');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);

  // Live estimated cost
  const calculateEstimatedPrice = () => {
    let rate = 5;
    if (paperSize === 'A4') rate = colorMode === 'FULL_COLOR' ? 20 : 5;
    else if (paperSize === 'LEGAL') rate = colorMode === 'FULL_COLOR' ? 25 : 8;
    else if (paperSize === 'PHOTO_4R') rate = 30;
    else if (paperSize === 'PHOTO_STAMP_PP') rate = 50;
    else if (paperSize === 'PVC_ID_CARD') rate = 80;
    else if (paperSize === 'BANNER_SQFT') rate = 35;

    let extra = 0;
    if (binding === 'SPIRAL_BINDING') extra = 40;
    else if (binding === 'LAMINATION') extra = 20 * copies;

    return (rate * copies) + extra;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Simulate file upload or convert to base64 preview
      const reader = new FileReader();
      reader.onload = () => {
        setFileUrlOrLink(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success(`Attached file: ${file.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.warning('আপনার নাম এবং মোবাইল নাম্বার দেওয়া আবশ্যক।');
      return;
    }

    if (!fileName && !fileUrlOrLink) {
      toast.warning('অনুগ্রহ করে প্রিন্ট করার ফাইলটি সিলেক্ট করুন অথবা লিংক দিন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/public/print-drop', {
        customerName,
        customerPhone,
        fileName: fileName || 'Uploaded_Document.pdf',
        fileUrlOrBase64: fileUrlOrLink,
        paperSize,
        colorMode,
        copies,
        pageRange,
        bindingOrLamination: binding,
        notes
      });

      if (res.data?.success) {
        setTokenResult(res.data);
        toast.success(`ফাইল কিউতে জমা হয়েছে! টোকেন নম্বর: #${res.data.tokenNumber}`);
      }
    } catch (err: any) {
      toast.error('ফাইল জমা করতে ব্যর্থ হয়েছে। অনুগ্রহ করে কাউন্টারে জানান।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-xl w-full mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> পেনড্রাইভ মুক্ত ফাইল ড্রপ কাউন্টার
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Printer className="w-7 h-7 text-indigo-400" /> Print Drop Express
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            পেনড্রাইভ ছাড়াই আপনার মোবাইল থেকে সরাসরি প্রিন্ট ফাইল পাঠান
          </p>
        </div>

        {tokenResult ? (
          /* Success Token Card */
          <div className="bg-slate-800/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-18 h-18 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Print Queue Token</span>
            <div className="text-5xl font-black text-white my-2 font-mono tracking-wider text-emerald-300">
              #{tokenResult.tokenNumber}
            </div>
            <p className="text-slate-300 text-sm mb-6">
              আপনার ফাইল প্রিন্ট কিউতে গ্রহণ করা হয়েছে। প্রিন্ট ডেস্কে এই টোকেন নাম্বারটি বলুন।
            </p>

            <div className="bg-slate-900/60 rounded-2xl p-4 text-left border border-slate-700/60 space-y-2 text-xs mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Customer:</span>
                <span className="text-white font-bold">{tokenResult.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phone:</span>
                <span className="text-white font-mono">{tokenResult.customerPhone}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Paper & Color:</span>
                <span className="text-indigo-300 font-semibold">{paperSize} • {colorMode === 'FULL_COLOR' ? 'Color' : 'B&W'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Cost:</span>
                <span className="text-emerald-400 font-bold text-sm">৳{tokenResult.estimatedPriceBdt}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setTokenResult(null);
                setFileName('');
                setFileUrlOrLink('');
              }}
              className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold text-sm transition-all"
            >
              আরেকটি ফাইল পাঠান (New Print Drop)
            </button>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSubmit} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-4">
            
            {/* Customer Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">আপনার নাম (Full Name) *</label>
                <input 
                  type="text" 
                  placeholder="e.g. তানভীর আহমেদ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">মোবাইল নাম্বার (WhatsApp / Phone) *</label>
                <input 
                  type="tel" 
                  placeholder="e.g. 01700000000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* File Upload Box */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">প্রিন্ট করার ফাইল আপলোড করুন *</label>
              <div className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 rounded-2xl p-4 text-center transition-colors relative cursor-pointer group">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.pptx,.xlsx"
                />
                <div className="flex flex-col items-center justify-center">
                  <div className="w-11 h-11 bg-indigo-600/30 rounded-xl flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  {fileName ? (
                    <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> {fileName}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-200">ফাইল নির্বাচন করতে ট্যাপ করুন</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">PDF, Word, JPG, PNG, PowerPoint</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Print Options: Size & Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">কাগজের সাইজ (Paper Size)</label>
                <select 
                  value={paperSize}
                  onChange={(e: any) => setPaperSize(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="A4">A4 Normal Paper (৳5/৳20)</option>
                  <option value="LEGAL">Legal Document (৳8/৳25)</option>
                  <option value="PHOTO_4R">4R Glossy Photo (৳30)</option>
                  <option value="PHOTO_STAMP_PP">Passport / Stamp Photo (৳50)</option>
                  <option value="PVC_ID_CARD">PVC ID Card (৳80)</option>
                  <option value="BANNER_SQFT">Banner / Poster (৳35/sqft)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">কালার মোড (Color Mode)</label>
                <div className="grid grid-cols-2 gap-1.5 h-11">
                  <button
                    type="button"
                    onClick={() => setColorMode('BLACK_WHITE')}
                    className={`rounded-xl text-xs font-bold border flex items-center justify-center transition-all ${
                      colorMode === 'BLACK_WHITE' 
                        ? 'bg-slate-700 text-white border-slate-500 ring-2 ring-indigo-500' 
                        : 'bg-slate-900/60 text-slate-400 border-slate-800'
                    }`}
                  >
                    B&W (সাদা-কালো)
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('FULL_COLOR')}
                    className={`rounded-xl text-xs font-bold border flex items-center justify-center transition-all ${
                      colorMode === 'FULL_COLOR' 
                        ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white border-transparent ring-2 ring-pink-500' 
                        : 'bg-slate-900/60 text-slate-400 border-slate-800'
                    }`}
                  >
                    Color (রঙিন)
                  </button>
                </div>
              </div>
            </div>

            {/* Copies & Binding */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">কপি সংখ্যা (Copies)</label>
                <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-xl h-11 px-2">
                  <button 
                    type="button" 
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-300 font-bold"
                  >-</button>
                  <input 
                    type="number" 
                    min={1} 
                    value={copies} 
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center bg-transparent text-sm font-bold text-white outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setCopies(copies + 1)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-300 font-bold"
                  >+</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">বাইন্ডিং / লেমিনেশন</label>
                <select 
                  value={binding}
                  onChange={(e: any) => setBinding(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="NONE">কোনো বাইন্ডিং নেই</option>
                  <option value="SPIRAL_BINDING">স্পাইরাল বাইন্ডিং (+৳৪০)</option>
                  <option value="LAMINATION">লেমিনেশন (+৳২০/কপি)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <input 
                type="text" 
                placeholder="বিশেষ কোনো নির্দেশনা (যেমন: পেজ ৩ থেকে ৭ শুধু প্রিন্ট করুন)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 px-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Estimated Price Bar */}
            <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">আনুমানিক খরচ (Estimated Cost)</span>
                <span className="text-xl font-black text-emerald-400 font-mono">৳{calculateEstimatedPrice()}</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'ড্রপ হচ্ছে...' : (
                  <>ফাইল জমা দিন <ArrowRight className="w-4 h-4 ml-1.5" /></>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-slate-500 text-xs py-4">
        Powered by BusinessOS • Secure Zero-Pendrive Print Studio
      </footer>
    </div>
  );
}

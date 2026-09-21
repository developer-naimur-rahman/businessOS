import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Printer, FileText, PlusCircle } from 'lucide-react';
import { ReceiptTemplate } from './ReceiptTemplate';
import { A4InvoiceTemplate } from './A4InvoiceTemplate';

export function POSSuccessModal({ sale, businessDetails, onNewSale, onPrintThermal, onPrintA4 }: any) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play success sound
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.log('Audio playback prevented by browser'));
    }
  }, []);

  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 print:hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3" preload="auto" />
      
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-500 p-8 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg scale-in-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Sale Completed!</h2>
          <p className="text-emerald-100 font-medium opacity-90">Invoice #{sale.saleNumber}</p>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 py-3 border-y border-slate-100">
            <span className="text-slate-500 font-medium">Grand Total</span>
            <span className="text-3xl font-bold text-slate-900 tracking-tight">৳{Number(sale.total).toLocaleString()}</span>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onPrintThermal}
              className="w-full h-12 bg-slate-900 text-white rounded-xl font-medium shadow-sm hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              <Printer className="w-5 h-5 mr-2" /> Print POS Receipt
            </button>
            <button 
              onClick={onPrintA4}
              className="w-full h-12 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <FileText className="w-5 h-5 mr-2" /> Print A4 Invoice
            </button>
            <button 
              onClick={onNewSale}
              className="w-full h-12 text-emerald-600 font-semibold hover:bg-emerald-50 rounded-xl transition-colors flex items-center justify-center mt-2"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

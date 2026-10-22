import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Printer, FileText, PlusCircle, MessageSquare, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function POSSuccessModal({ sale, businessDetails, onNewSale, onPrintThermal, onPrintA4 }: any) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phone, setPhone] = useState(sale?.customerPhone || '');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  useEffect(() => {
    // Play success sound
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.log('Audio playback prevented by browser'));
    }
  }, []);

  if (!sale) return null;

  const generateReceiptText = () => {
    const dateStr = new Date(sale.createdAt || Date.now()).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    
    let itemsText = '';
    if (sale.lines && Array.isArray(sale.lines)) {
      itemsText = sale.lines.map((line: any, idx: number) => {
        const name = line.productName || line.sku || `Item #${idx + 1}`;
        const qty = line.quantity || 1;
        const price = line.unitPrice || line.sellingPrice || 0;
        return `▪️ ${name} x${qty} = ৳${(price * qty).toLocaleString()}`;
      }).join('\n');
    }

    return `🧾 *INVOICE #${sale.saleNumber || 'SALE'}*
📅 ${dateStr}
🏪 *${businessDetails?.name || 'BusinessOS Retail & Studio'}*
--------------------------------
${itemsText || '▪️ Store Purchase'}
--------------------------------
💰 *Grand Total: ৳${Number(sale.total || 0).toLocaleString()}*
💳 Payment: ${sale.payments?.[0]?.method || 'Cash / Paid'}
✅ Status: Completed
--------------------------------
🛡️ *Warranty & Support:*
Keep this digital token for warranty coverage & repairs.
🙏 ধন্যবাদ! আবার আসবেন!`;
  };

  const handleShareWhatsApp = () => {
    const text = generateReceiptText();
    let cleanedPhone = phone.replace(/[^0-9]/g, '');
    
    if (cleanedPhone) {
      if (cleanedPhone.startsWith('01')) {
        cleanedPhone = '88' + cleanedPhone;
      }
      const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      toast.success('Opening WhatsApp receipt...');
    } else {
      setShowPhoneInput(true);
      navigator.clipboard?.writeText(text);
      toast.info('Customer phone needed for direct launch, receipt copied to clipboard!');
    }
  };

  const handleCopyReceipt = () => {
    const text = generateReceiptText();
    navigator.clipboard?.writeText(text);
    toast.success('Digital receipt copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 print:hidden p-4">
      {/* Hidden audio element */}
      <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3" preload="auto" />
      
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-600 p-7 text-center flex flex-col items-center justify-center relative">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg scale-in-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-0.5">Sale Completed!</h2>
          <p className="text-emerald-100 font-medium text-sm">Invoice #{sale.saleNumber}</p>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-5 py-3 border-y border-slate-100">
            <span className="text-slate-500 font-medium">Grand Total</span>
            <span className="text-3xl font-black text-slate-900 tracking-tight">৳{Number(sale.total).toLocaleString()}</span>
          </div>

          {/* Customer WhatsApp input if needed */}
          {showPhoneInput && (
            <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <label className="block text-xs font-bold text-emerald-800 mb-1">Customer WhatsApp Number</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. 01700000000" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <button 
              onClick={handleShareWhatsApp}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Send Receipt on WhatsApp
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={onPrintThermal}
                className="h-11 bg-slate-900 text-white rounded-xl font-medium shadow-sm hover:bg-slate-800 transition-colors flex items-center justify-center text-sm"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Thermal POS
              </button>
              <button 
                onClick={onPrintA4}
                className="h-11 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center text-sm"
              >
                <FileText className="w-4 h-4 mr-1.5" /> A4 Invoice
              </button>
            </div>

            <button 
              onClick={handleCopyReceipt}
              className="w-full h-10 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Digital Text Receipt
            </button>

            <button 
              onClick={onNewSale}
              className="w-full h-11 text-emerald-700 font-bold hover:bg-emerald-50 rounded-xl transition-colors flex items-center justify-center mt-1 text-sm border border-emerald-100"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" /> Start New Sale (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

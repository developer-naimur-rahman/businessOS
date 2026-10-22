"use client"
import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api-client';
import { 
  FileSpreadsheet, Plus, Trash2, Printer, MessageSquare, Zap, 
  Cpu, HardDrive, Monitor, ShieldCheck, CheckCircle2, Clock, 
  Copy, ArrowRight, Eye, RefreshCw, X, FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface QuoteItem {
  id: string;
  name: string;
  specs: string;
  warrantyText: string;
  unitPrice: number;
  quantity: number;
}

export default function QuotationsPage() {
  const [activeTab, setActiveTab] = useState<'BUILDER' | 'LIST'>('BUILDER');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Builder State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<any>('CUSTOM_PC_BUILD');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('Prices valid for 15 days from issue date. Subject to market availability.');
  const [discount, setDiscount] = useState('0');

  // Pre-configured slots for Custom PC Builder
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', name: 'Intel Core i5-13400 Processor (10 Cores, 16 Threads)', specs: '2.5 GHz up to 4.6 GHz, 20MB Cache, LGA1700', warrantyText: '3 Years Warranty', unitPrice: 24500, quantity: 1 },
    { id: '2', name: 'MSI B760M BOMBER WIFI Motherboard', specs: 'DDR5, PCIe 4.0, Dual M.2, Wi-Fi 6E & Bluetooth 5.3', warrantyText: '3 Years Warranty', unitPrice: 15800, quantity: 1 },
    { id: '3', name: 'Corsair Vengeance 16GB (2x8GB) DDR5 5200MHz RAM', specs: 'Black Heatspreader, On-Die ECC', warrantyText: 'Lifetime Warranty', unitPrice: 7200, quantity: 1 },
    { id: '4', name: 'Samsung 980 500GB PCIe 3.0 M.2 NVMe SSD', specs: 'Up to 3,100 MB/s Read, 2,600 MB/s Write', warrantyText: '5 Years Warranty', unitPrice: 5900, quantity: 1 },
    { id: '5', name: 'Antec NX292 White Mid Tower Gaming Casing', specs: 'Mesh Front Panel, 4x 120mm RGB Fans Pre-installed', warrantyText: 'No Warranty', unitPrice: 3800, quantity: 1 },
    { id: '6', name: 'DeepCool PK550D 550W 80 PLUS Bronze Power Supply', specs: 'Active PFC, Flat Black Cables, 120mm Hypro Bearing', warrantyText: '5 Years Warranty', unitPrice: 4600, quantity: 1 }
  ]);

  // Printable View Modal
  const [printQuote, setPrintQuote] = useState<any>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/quotations');
      setQuotations(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load quotations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'LIST') {
      fetchQuotations();
    }
  }, [activeTab]);

  const subtotal = items.reduce((acc, i) => acc + (Number(i.unitPrice || 0) * (Number(i.quantity || 1))), 0);
  const numDiscount = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - numDiscount);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: '',
        specs: '',
        warrantyText: '1 Year Warranty',
        unitPrice: 0,
        quantity: 1
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSaveQuotation = async () => {
    if (!customerName.trim()) {
      toast.warning('Please enter customer or company name.');
      return;
    }
    if (items.length === 0) {
      toast.warning('Please add at least one item.');
      return;
    }

    try {
      const res = await api.post('/admin/quotations', {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        validUntilDate: validUntil || undefined,
        category,
        items,
        discountBdt: numDiscount,
        notes
      });

      if (res.data?.success) {
        toast.success(`Quotation ${res.data.quoteNumber} created successfully!`);
        // Preview printable quotation
        setPrintQuote({
          ...res.data,
          items,
          subtotalBdt: subtotal,
          discountBdt: numDiscount,
          grandTotalBdt: grandTotal,
          customerPhone,
          companyName,
          notes
        });
      }
    } catch {
      toast.error('Failed to create quotation.');
    }
  };

  const handleConvertToSale = async (quoteId: string) => {
    try {
      const res = await api.post(`/admin/quotations/${quoteId}/convert-to-sale`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Quotation converted to live sale!');
        fetchQuotations();
      }
    } catch {
      toast.error('Failed to convert quotation.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-7 h-7 text-indigo-600" /> Quotation Studio & Custom PC Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Formal price estimates, custom PC specifications, CCTV packages & instant sale conversion
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('BUILDER')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'BUILDER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Estimate Builder
            </button>
            <button
              onClick={() => setActiveTab('LIST')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'LIST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saved Quotations
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'BUILDER' ? (
        /* Builder Interface */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Itemized Component Specs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" /> Configured Components & Services ({items.length})
                </h3>
                <button
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Custom Component
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2 hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Component / Service Name (e.g. Intel Core i5-13400 Processor)"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Detailed Specs (e.g. 10 Cores, 16 Threads, 4.6 GHz)"
                        value={item.specs}
                        onChange={(e) => handleUpdateItem(item.id, 'specs', e.target.value)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600"
                      />
                      <input
                        type="text"
                        placeholder="Warranty (e.g. 3 Years Official)"
                        value={item.warrantyText}
                        onChange={(e) => handleUpdateItem(item.id, 'warrantyText', e.target.value)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 font-semibold"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Unit Price (৳)"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-right"
                        />
                        <span className="text-slate-400">×</span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-center"
                        />
                        <span className="font-bold text-slate-800 text-right flex-1 tabular-nums">
                          ৳{(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Customer Details & Financial Totals */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Customer & Project Details</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Arifur Rahman"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="e.g. 01700000000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Institution (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Nexus Tech Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quotation Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="CUSTOM_PC_BUILD">Gaming & Studio PC Build</option>
                    <option value="CCTV_SECURITY_SETUP">CCTV & Surveillance System</option>
                    <option value="OFFICE_EQUIPMENT">Office IT & Network Equipment</option>
                    <option value="PRINTING_BULK_ORDER">Bulk Printing & Publication Contract</option>
                    <option value="OTHER">Custom Service Package</option>
                  </select>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800 tabular-nums">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Special Discount (৳):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-rose-600"
                  />
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">Estimate Total</span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSaveQuotation}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileText className="w-4 h-4" /> Save & Preview A4 Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Saved Quotations List */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">All Formal Estimates & Price Quotes</h3>
            <button onClick={fetchQuotations} className="text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Quote # / Date</th>
                  <th className="p-3.5">Customer / Company</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Valid Until</th>
                  <th className="p-3.5 text-right">Estimate Total (৳)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No saved quotations found. Use Estimate Builder to create formal quotes.
                    </td>
                  </tr>
                ) : (
                  quotations.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-indigo-600 block">{q.quoteNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">{q.customerName}</span>
                        <span className="text-[10px] text-slate-400">{q.companyName || q.customerPhone || 'Retail Quote'}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-600">
                        {q.category?.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {q.validUntilDate}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 font-mono text-sm">
                        ৳{Number(q.grandTotalBdt || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          q.status === 'ACCEPTED_CONVERTED' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => setPrintQuote(q)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                          title="View / Print"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {q.status !== 'ACCEPTED_CONVERTED' && (
                          <button
                            onClick={() => handleConvertToSale(q.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs inline-flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" /> Convert to Sale
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formal A4 Printable Quotation Modal */}
      {printQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-bold">Formal A4 Quotation Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print A4
                </button>
                <button
                  onClick={() => {
                    const text = `📄 *QUOTATION #${printQuote.quoteNumber}*\nCustomer: ${printQuote.customerName}\nTotal: ৳${Number(printQuote.grandTotalBdt || 0).toLocaleString()}\nItems: ${printQuote.items?.map((i: any) => i.name).join(', ')}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button onClick={() => setPrintQuote(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Letterhead Paper */}
            <div className="p-8 sm:p-10 space-y-6 text-slate-800">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">BusinessOS IT & Studio</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Physical Retail • Electronics Showroom • Service & Print Lab</p>
                  <p className="text-xs text-slate-500">Dhaka, Bangladesh • Hotline: 01700-000000</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-700 uppercase tracking-widest block">PRICE ESTIMATE</span>
                  <span className="font-mono text-xs font-bold text-slate-600 block">#{printQuote.quoteNumber}</span>
                  <span className="text-[11px] text-slate-400">Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-slate-50 rounded-2xl p-4 text-xs grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Quotation Prepared For:</span>
                  <span className="font-black text-slate-900 text-sm block">{printQuote.customerName}</span>
                  {printQuote.companyName && <span className="text-slate-600 block">{printQuote.companyName}</span>}
                  {printQuote.customerPhone && <span className="font-mono text-slate-600 block">{printQuote.customerPhone}</span>}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Validity & Terms:</span>
                  <span className="font-semibold text-slate-800 block">Valid Until: {printQuote.validUntilDate || '15 Days'}</span>
                  <span className="text-slate-500 block">Payment: Advance / On Delivery</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left">
                <thead className="border-b-2 border-slate-900 text-slate-900 font-bold">
                  <tr>
                    <th className="py-2 w-8">#</th>
                    <th className="py-2">Item Description & Specifications</th>
                    <th className="py-2">Warranty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-center w-12">Qty</th>
                    <th className="py-2 text-right">Total (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printQuote.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="py-2">
                      <td className="py-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        {item.specs && <span className="text-[11px] text-slate-500 block">{item.specs}</span>}
                      </td>
                      <td className="py-2.5 font-medium text-slate-600">{item.warrantyText}</td>
                      <td className="py-2.5 text-right font-mono">৳{Number(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                        ৳{(item.unitPrice * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <div className="w-60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold font-mono">৳{Number(printQuote.subtotalBdt || 0).toLocaleString()}</span>
                  </div>
                  {printQuote.discountBdt > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">-৳{Number(printQuote.discountBdt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono">৳{Number(printQuote.grandTotalBdt || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer Terms & Signatures */}
              <div className="pt-8 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-end">
                <div className="max-w-xs">
                  <p className="font-bold text-slate-700 mb-1">Terms & Conditions:</p>
                  <p>1. Warranty claims handled as per official manufacturer policy.</p>
                  <p>2. Hardware prices are subject to global currency fluctuations.</p>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-700">Authorized Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

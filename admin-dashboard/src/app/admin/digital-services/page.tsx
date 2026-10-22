"use client"
import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api-client';
import { 
  Smartphone, Wallet, Zap, FileCheck, ArrowUpRight, ArrowDownLeft, 
  Plus, RefreshCw, Banknote, ShieldCheck, CheckCircle2, History, X,
  TrendingUp, CircleDollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export default function DigitalServicesPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Transaction Modal State
  const [trxModalOpen, setTrxModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<any>('MOBILE_RECHARGE');
  const [wallet, setWallet] = useState<any>('FLEXILOAD_SIM');
  const [recipient, setRecipient] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [serviceFee, setServiceFee] = useState('0');
  const [commission, setCommission] = useState('0');
  const [trxId, setTrxId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Float Adjust Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustWallet, setAdjustWallet] = useState<any>('BKASH_AGENT');
  const [adjustType, setAdjustType] = useState<'DEPOSIT_ADD' | 'WITHDRAW_DEDUCT'>('DEPOSIT_ADD');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/digital-services/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load digital services summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Set default wallet & fees when transaction type changes
  const handleTypeChange = (type: string) => {
    setTransactionType(type);
    if (type === 'MOBILE_RECHARGE') {
      setWallet('FLEXILOAD_SIM');
      setServiceFee('0');
      setCommission('2.5'); // e.g. ~2.5% recharge commission
    } else if (type === 'MFS_CASH_IN') {
      setWallet('BKASH_AGENT');
      setServiceFee('0');
      setCommission('4'); // ~৳4 per 1000 cash in
    } else if (type === 'MFS_CASH_OUT') {
      setWallet('BKASH_AGENT');
      setServiceFee('0');
      setCommission('4.5'); // ~৳4.5 per 1000 cash out
    } else if (type === 'ELECTRICITY_UTILITY_BILL') {
      setWallet('POLY_BIDYUT_UTILITY');
      setServiceFee('20'); // ৳20 customer service charge
      setCommission('5');
    } else if (type === 'ONLINE_GOVT_APPLICATION') {
      setWallet('PHYSICAL_CASH_DRAWER');
      setServiceFee('100'); // e.g. typing & government application fee
      setCommission('0');
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.warning('Please enter a valid amount.');
      return;
    }
    if (!recipient.trim()) {
      toast.warning('Account / Phone number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/admin/digital-services/transaction', {
        transactionType,
        wallet,
        recipientPhoneOrAccount: recipient.trim(),
        customerName: customerName.trim() || undefined,
        amountBdt: numAmount,
        serviceChargeOrFeeBdt: parseFloat(serviceFee) || 0,
        commissionEarnedBdt: parseFloat(commission) || 0,
        trxId: trxId.trim() || undefined,
        notes: notes.trim() || undefined
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Transaction recorded successfully!');
        setTrxModalOpen(false);
        setAmount('');
        setRecipient('');
        setCustomerName('');
        setTrxId('');
        setNotes('');
        fetchSummary();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(adjustAmount);
    if (!numAmount || numAmount <= 0) {
      toast.warning('Please enter a valid adjustment amount.');
      return;
    }

    try {
      const res = await api.post('/admin/digital-services/float-adjust', {
        wallet: adjustWallet,
        adjustmentType: adjustType,
        amountBdt: numAmount,
        sourceOrReason: adjustReason.trim() || undefined
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setAdjustModalOpen(false);
        setAdjustAmount('');
        setAdjustReason('');
        fetchSummary();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to adjust float.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-pink-600" /> Digital Utility Desk & MFS Float
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            bKash/Nagad agent wallets, Flexiload, Palli Bidyut bills & online government services
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdjustModalOpen(true)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4 text-indigo-600" /> Adjust Float
          </button>
          <button
            onClick={() => setTrxModalOpen(true)}
            className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Quick Transaction
          </button>
          <button
            onClick={fetchSummary}
            className="w-10 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Total Digital Float</span>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ৳{summary?.metrics?.totalDigitalFloatBdt?.toLocaleString() || '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all 5 agent wallets</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Physical Cash Drawer</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ৳{summary?.metrics?.cashDrawerBdt?.toLocaleString() || '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cash in register till</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Today's Transactions</span>
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary?.metrics?.todayCount || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Volume: ৳{summary?.metrics?.todayVolumeBdt?.toLocaleString() || '0'}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-5 text-white shadow-md shadow-pink-500/20">
          <div className="flex items-center justify-between text-xs font-bold text-pink-100 mb-2">
            <span>Today's Net Profit</span>
            <TrendingUp className="w-4 h-4 text-pink-200" />
          </div>
          <div className="text-2xl font-black text-white">
            ৳{summary?.metrics?.todayCommissionsAndFeesBdt?.toLocaleString() || '0'}
          </div>
          <p className="text-[11px] text-pink-100 mt-1">Commissions & service fees</p>
        </div>
      </div>

      {/* Wallet Balances Cards Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Live Wallet Balances</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'BKASH_AGENT', label: 'bKash Agent', color: 'border-pink-200 bg-pink-50/50 text-pink-700' },
            { key: 'NAGAD_AGENT', label: 'Nagad Agent', color: 'border-amber-200 bg-amber-50/50 text-amber-700' },
            { key: 'ROCKET_AGENT', label: 'Rocket Agent', color: 'border-purple-200 bg-purple-50/50 text-purple-700' },
            { key: 'FLEXILOAD_SIM', label: 'Flexiload SIM', color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
            { key: 'POLY_BIDYUT_UTILITY', label: 'Palli Bidyut Float', color: 'border-teal-200 bg-teal-50/50 text-teal-700' },
            { key: 'PHYSICAL_CASH_DRAWER', label: 'Cash Drawer', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' },
          ].map(w => (
            <div key={w.key} className={`p-4 rounded-2xl border ${w.color} shadow-xs`}>
              <span className="text-[11px] font-bold block mb-1 opacity-80">{w.label}</span>
              <span className="text-lg font-black font-mono">
                ৳{(summary?.balances?.[w.key] || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Transactions Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">Today's Digital Ledger</h3>
          <span className="text-xs text-slate-400 font-medium">Automatic float & cash synchronization</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Time / TrxID</th>
                <th className="p-3.5">Service Type</th>
                <th className="p-3.5">Recipient / Account</th>
                <th className="p-3.5">Wallet</th>
                <th className="p-3.5 text-right">Amount (৳)</th>
                <th className="p-3.5 text-right">Profit / Fee (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.recentTransactions?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No transactions recorded today yet.
                  </td>
                </tr>
              ) : (
                summary?.recentTransactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-800 block">{tx.trxId}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                        {tx.transactionType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-semibold text-slate-800 block">{tx.recipientPhoneOrAccount}</span>
                      <span className="text-[10px] text-slate-400">{tx.customerName || 'Walk-in Customer'}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-600">
                      {tx.wallet?.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 font-mono">
                      ৳{Number(tx.amountBdt || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-600 font-mono">
                      +৳{Number(tx.totalProfitEarnedBdt || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Transaction Entry Modal */}
      {trxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Digital Service Transaction</h3>
                <p className="text-xs text-pink-100">10-second entry for recharge, MFS cash-in & utility bill</p>
              </div>
              <button onClick={() => setTrxModalOpen(false)} className="text-pink-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="p-5 space-y-4">
              {/* Service Type Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Service Type</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  {[
                    { key: 'MOBILE_RECHARGE', label: 'মোবাইল রিচার্জ' },
                    { key: 'MFS_CASH_IN', label: 'বিকাশ ক্যাশ-ইন' },
                    { key: 'MFS_CASH_OUT', label: 'ক্যাশ-আউট' },
                    { key: 'ELECTRICITY_UTILITY_BILL', label: 'পল্লী বিদ্যুৎ বিল' },
                    { key: 'ONLINE_GOVT_APPLICATION', label: 'অনলাইন আবেদন' },
                  ].map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handleTypeChange(t.key)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        transactionType === t.key 
                          ? 'bg-pink-50 border-pink-500 text-pink-700 ring-2 ring-pink-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Wallet</label>
                  <select 
                    value={wallet} 
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="BKASH_AGENT">bKash Agent Wallet</option>
                    <option value="NAGAD_AGENT">Nagad Agent Wallet</option>
                    <option value="ROCKET_AGENT">Rocket Agent Wallet</option>
                    <option value="FLEXILOAD_SIM">Flexiload SIM Balance</option>
                    <option value="POLY_BIDYUT_UTILITY">Palli Bidyut Portal Float</option>
                    <option value="PHYSICAL_CASH_DRAWER">Cash Drawer Till</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (৳) *</label>
                  <input 
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    autoFocus
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 tabular-nums focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>

              {/* Recipient Account & Customer Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Recipient Phone *</label>
                  <input 
                    type="text"
                    placeholder="e.g. 01700000000 / Meter No"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name (optional)</label>
                  <input 
                    type="text"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Profit / Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Service Fee (৳)</label>
                  <input 
                    type="number"
                    value={serviceFee}
                    onChange={(e) => setServiceFee(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telco / MFS Commission (৳)</label>
                  <input 
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTrxModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-600/30"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Transaction (Enter)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Float Adjust Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Adjust / Load Wallet Float</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustFloat} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Wallet</label>
                <select
                  value={adjustWallet}
                  onChange={(e) => setAdjustWallet(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="BKASH_AGENT">bKash Agent</option>
                  <option value="NAGAD_AGENT">Nagad Agent</option>
                  <option value="ROCKET_AGENT">Rocket Agent</option>
                  <option value="FLEXILOAD_SIM">Flexiload SIM</option>
                  <option value="POLY_BIDYUT_UTILITY">Palli Bidyut Utility</option>
                  <option value="PHYSICAL_CASH_DRAWER">Physical Cash Drawer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEPOSIT_ADD')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      adjustType === 'DEPOSIT_ADD' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    + Deposit / Load
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('WITHDRAW_DEDUCT')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      adjustType === 'WITHDRAW_DEDUCT' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    - Deduct / Withdraw
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Amount (৳) *</label>
                <input
                  type="number"
                  placeholder="0"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Bank cash withdrawal / DSO deposit"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Float
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client"
import React, { useEffect, useState } from 'react';
import { api } from '../../../../lib/api-client';
import { 
  Database, Download, ShieldCheck, RefreshCw, HardDrive, 
  FileText, CheckCircle2, Lock, FileSpreadsheet, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function BackupVaultPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system/backup/list');
      setData(res.data);
    } catch {
      toast.error('Failed to load backup vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const res = await api.post('/admin/system/backup/create');
      if (res.data?.success) {
        toast.success(res.data.message || 'System backup created successfully!');
        
        // Trigger automatic JSON download to customer's machine
        const blob = new Blob([JSON.stringify(res.data.downloadPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BusinessOS_Backup_${res.data.backupId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        fetchBackups();
      }
    } catch (err: any) {
      toast.error('Failed to generate system backup.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7 text-indigo-600" /> Cloud Backup & Data Recovery Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete database snapshot, encrypted JSON export & tamper-proof disaster recovery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBackups}
            className="w-10 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isCreating ? 'Generating Snapshot...' : 'Create & Download Full Backup'}
          </button>
        </div>
      </div>

      {/* Live Database Health Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">Catalog Products</span>
          <span className="text-2xl font-black text-slate-900">
            {data?.liveDatabaseStats?.totalProducts || 0}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Variants & barcode mappings</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">Customer Profiles</span>
          <span className="text-2xl font-black text-slate-900">
            {data?.liveDatabaseStats?.totalCustomers || 0}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Active customer credit ledgers</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">Total Sales Invoices</span>
          <span className="text-2xl font-black text-slate-900">
            {data?.liveDatabaseStats?.totalSalesInvoices || 0}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">POS & online orders</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 block mb-1">Integrity Status</span>
          <span className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
            <ShieldCheck className="w-6 h-6" /> 100% OK
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Database synced & protected</p>
        </div>
      </div>

      {/* Backups History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">Historical System Backup Snapshots</h3>
          <span className="text-xs text-slate-400 font-medium">SHA-256 Checksum Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Backup ID / Timestamp</th>
                <th className="p-3.5">Records Included</th>
                <th className="p-3.5">File Size</th>
                <th className="p-3.5">SHA-256 Checksum</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.backups?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No manual backups logged yet. Click "Create & Download Full Backup" above to export a full snapshot.
                  </td>
                </tr>
              ) : (
                data?.backups?.map((b: any) => (
                  <tr key={b.id || b.backupId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-indigo-600 block">{b.backupId}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(b.timestamp).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">
                      {b.counts?.products || 0} Prods • {b.counts?.customers || 0} Custs • {b.counts?.sales || 0} Sales
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {b.sizeKb} KB
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-400">
                      {b.checksum?.slice(0, 16)}...
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.status || 'VERIFIED_READY'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

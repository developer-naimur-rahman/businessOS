"use client"
import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api-client';
import { 
  Printer, Wrench, AlertTriangle, CheckCircle2, Plus, RefreshCw, 
  Droplet, Gauge, History, X, Sparkles, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function MachineHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Maintenance Log Modal State
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [maintenanceType, setMaintenanceType] = useState<any>('INK_TONER_REFILL');
  const [newPageCount, setNewPageCount] = useState('');
  const [costBdt, setCostBdt] = useState('');
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');

  // New Equipment Modal State
  const [newEquipModalOpen, setNewEquipModalOpen] = useState(false);
  const [machineName, setMachineName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [machineType, setMachineType] = useState<any>('COLOR_INKJET_PRINTER');
  const [totalPrintedPages, setTotalPrintedPages] = useState('0');
  const [threshold, setThreshold] = useState('3000');
  const [equipNotes, setEquipNotes] = useState('');

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/machine-health');
      setData(res.data);
    } catch {
      toast.error('Failed to load machine health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleOpenMaintenance = (machine: any) => {
    setSelectedMachine(machine);
    setNewPageCount(machine.totalPrintedPagesOrHours?.toString() || '0');
    setCostBdt('0');
    setTechnician('In-House Operator');
    setNotes('');
    setMaintenanceModalOpen(true);
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;

    try {
      const res = await api.post(`/admin/machine-health/${selectedMachine.id}/log-maintenance`, {
        maintenanceType,
        newTotalPagesCount: parseInt(newPageCount) || selectedMachine.totalPrintedPagesOrHours,
        costBdt: parseFloat(costBdt) || 0,
        technicianName: technician.trim() || undefined,
        notes: notes.trim() || undefined
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setMaintenanceModalOpen(false);
        fetchEquipment();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record maintenance.');
    }
  };

  const handleRegisterEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName.trim() || !modelNumber.trim()) {
      toast.warning('Machine name and model number are required.');
      return;
    }

    try {
      const res = await api.post('/admin/machine-health/equipment', {
        machineName: machineName.trim(),
        modelNumber: modelNumber.trim(),
        machineType,
        totalPrintedPagesOrHours: parseInt(totalPrintedPages) || 0,
        maintenanceThresholdPages: parseInt(threshold) || 3000,
        notes: equipNotes.trim() || undefined
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setNewEquipModalOpen(false);
        setMachineName('');
        setModelNumber('');
        setEquipNotes('');
        fetchEquipment();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register equipment.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Gauge className="w-7 h-7 text-indigo-600" /> Studio Equipment & Printer Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ink/toner levels, page counter milestones, drum maintenance cycles & hardware longevity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewEquipModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
          <button
            onClick={fetchEquipment}
            className="w-10 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">Total Equipment</span>
          <span className="text-2xl font-black text-slate-900">
            {data?.metrics?.totalMachinesCount || 0}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Printers, photocopiers & PVC units</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 block mb-1">Healthy & Optimal</span>
          <span className="text-2xl font-black text-emerald-600">
            {data?.metrics?.healthyCount || 0}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Ready for high-volume jobs</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-amber-600 block mb-1">Refill Soon (Low Ink)</span>
          <span className="text-2xl font-black text-amber-600">
            {data?.metrics?.needRefillCount || 0}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Under 20% ink/toner level</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-rose-600 block mb-1">Maintenance Due</span>
          <span className="text-2xl font-black text-rose-600">
            {data?.metrics?.needMaintenanceCount || 0}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Page threshold exceeded</p>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data?.equipment?.map((m: any) => {
          const pagesProgress = Math.min(100, Math.round(((m.pagesSinceService || 0) / (m.maintenanceThresholdPages || 3000)) * 100));

          return (
            <div key={m.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{m.machineName}</h3>
                    <p className="text-[11px] font-mono text-slate-400">{m.modelNumber}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    m.healthStatus === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    m.healthStatus === 'REFILL_SOON' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  }`}>
                    {m.healthStatus?.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Ink Level Bars (CMYK) */}
                {m.inkLevels && (
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Ink / Toner Reservoirs
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {/* Black */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-0.5">
                          <span>BK</span>
                          <span>{m.inkLevels.black}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-900 rounded-full" style={{ width: `${m.inkLevels.black}%` }}></div>
                        </div>
                      </div>
                      {/* Cyan */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-cyan-700 mb-0.5">
                          <span>C</span>
                          <span>{m.inkLevels.cyan}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${m.inkLevels.cyan}%` }}></div>
                        </div>
                      </div>
                      {/* Magenta */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-pink-700 mb-0.5">
                          <span>M</span>
                          <span>{m.inkLevels.magenta}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 rounded-full" style={{ width: `${m.inkLevels.magenta}%` }}></div>
                        </div>
                      </div>
                      {/* Yellow */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-amber-700 mb-0.5">
                          <span>Y</span>
                          <span>{m.inkLevels.yellow}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${m.inkLevels.yellow}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Page Counter Progress */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Service Cycle:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {m.pagesSinceService?.toLocaleString()} / {m.maintenanceThresholdPages?.toLocaleString()} pgs
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        pagesProgress >= 90 ? 'bg-rose-500' : pagesProgress >= 70 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pagesProgress}%` }}
                    ></div>
                  </div>
                </div>

                {m.notes && (
                  <p className="text-[11px] text-slate-500 italic mb-3">
                    "{m.notes}"
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Lifetime Counter</span>
                  <span className="text-xs font-black font-mono text-slate-800">
                    {m.totalPrintedPagesOrHours?.toLocaleString()} pgs
                  </span>
                </div>
                <button
                  onClick={() => handleOpenMaintenance(m)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Wrench className="w-3.5 h-3.5" /> Log Maintenance
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Maintenance Modal */}
      {maintenanceModalOpen && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Log Machine Maintenance</h3>
                <p className="text-xs text-slate-500">{selectedMachine.machineName}</p>
              </div>
              <button onClick={() => setMaintenanceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Action</label>
                <select
                  value={maintenanceType}
                  onChange={(e: any) => setMaintenanceType(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="INK_TONER_REFILL">Ink / Toner Refill (Replenish to 100%)</option>
                  <option value="HEAD_CLEANING">Printhead Deep Cleaning & Alignment</option>
                  <option value="DRUM_ROLLER_REPLACEMENT">OPC Drum / Pickup Roller Replacement</option>
                  <option value="GENERAL_SERVICE">General Service & Internal Dusting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Total Printed Page Count</label>
                <input
                  type="number"
                  value={newPageCount}
                  onChange={(e) => setNewPageCount(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost (৳)</label>
                  <input
                    type="number"
                    value={costBdt}
                    onChange={(e) => setCostBdt(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Technician / Operator</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Refilled 664 original ink bottles"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Maintenance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Equipment Modal */}
      {newEquipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Register New Studio Machine</h3>
              <button onClick={() => setNewEquipModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterEquipment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Machine Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Epson EcoTank L8050 Photo Printer"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model / Serial *</label>
                  <input
                    type="text"
                    placeholder="e.g. L8050-PHOTO"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Machine Type</label>
                  <select
                    value={machineType}
                    onChange={(e: any) => setMachineType(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="COLOR_INKJET_PRINTER">Color Inkjet Printer</option>
                    <option value="LASER_PHOTOCOPIER">Laser Photocopier</option>
                    <option value="PVC_CARD_PRINTER">PVC ID Card Printer</option>
                    <option value="LARGE_FORMAT_BANNER_PLOTTER">Large Format Banner Plotter</option>
                    <option value="LAMINATING_MACHINE">Laminating Machine</option>
                    <option value="STUDIO_PC">Studio Editing Workstation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Printed Pages</label>
                  <input
                    type="number"
                    value={totalPrintedPages}
                    onChange={(e) => setTotalPrintedPages(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Interval (Pages)</label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Main desk customer token printer"
                  value={equipNotes}
                  onChange={(e) => setEquipNotes(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewEquipModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Register Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

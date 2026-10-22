"use client"
import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api-client';
import { 
  Users, Calendar, Clock, CheckCircle2, AlertCircle, Printer, 
  ArrowRight, RefreshCw, X, ShieldCheck, DollarSign, Wallet
} from 'lucide-react';
import { toast } from 'sonner';

export default function HrPayrollPage() {
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'PAYROLL'>('ATTENDANCE');
  const [loading, setLoading] = useState(true);

  // Attendance State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  // Payroll Sheet State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollData, setPayrollData] = useState<any>(null);

  // Pay Salary Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedStaffForPay, setSelectedStaffForPay] = useState<any>(null);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK' | 'MOBILE_BANKING'>('CASH');
  const [payNotes, setPayNotes] = useState('Monthly Salary Disbursement');

  // Printable Salary Slip Modal
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/admin/hr-payroll/attendance', { params: { date: selectedDate } });
      setAttendanceList(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Ignore
    }
  };

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/hr-payroll/payroll-sheet', { params: { month: selectedMonth } });
      setPayrollData(res.data);
    } catch {
      toast.error('Failed to load payroll sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ATTENDANCE') {
      fetchAttendance();
    } else {
      fetchPayroll();
    }
  }, [activeTab, selectedDate, selectedMonth]);

  const handleMarkAttendance = async (userId: string, status: string) => {
    try {
      const res = await api.post('/admin/hr-payroll/attendance', {
        userId,
        date: selectedDate,
        status
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchAttendance();
      }
    } catch {
      toast.error('Failed to record attendance.');
    }
  };

  const handleDisburseSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPay) return;

    try {
      const res = await api.post('/admin/hr-payroll/pay-salary', {
        userId: selectedStaffForPay.userId,
        monthString: selectedMonth,
        baseSalaryBdt: selectedStaffForPay.baseSalaryBdt,
        commissionBdt: selectedStaffForPay.earnedCommissionBdt,
        deductionOrAdvanceBdt: selectedStaffForPay.deductionOrAdvanceBdt,
        netPaidBdt: selectedStaffForPay.netPayableBdt,
        paymentMethod: payMethod,
        referenceOrNotes: payNotes
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setPayModalOpen(false);
        fetchPayroll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disburse salary.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" /> Staff Attendance & Monthly Payroll
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daily check-in / check-out, working day logs, commission addition & salary slips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('ATTENDANCE')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'ATTENDANCE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Attendance Board
            </button>
            <button
              onClick={() => setActiveTab('PAYROLL')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'PAYROLL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Salary & Slips
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'ATTENDANCE' ? (
        /* Attendance Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <label className="text-xs font-bold text-slate-700">Attendance Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono"
              />
            </div>
            <button onClick={fetchAttendance} className="text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
              Daily Staff Shift Roll Call ({selectedDate})
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Staff Name & Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Check-In Time</th>
                    <th className="p-3.5">Current Status</th>
                    <th className="p-3.5 text-right">Quick Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollData?.payrollSheet?.map((staff: any) => {
                    const todayRecord = attendanceList.find(a => a.userId === staff.userId);
                    const status = todayRecord?.status || 'PENDING';

                    return (
                      <tr key={staff.userId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{staff.staffName}</span>
                          <span className="text-[10px] text-slate-400">{staff.email}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-600">
                          {staff.role}
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">
                          {todayRecord?.checkInTime || '—'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            status === 'LATE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            status === 'LEAVE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleMarkAttendance(staff.userId, 'PRESENT')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px]"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(staff.userId, 'LATE')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px]"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(staff.userId, 'LEAVE')}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg font-bold text-[11px]"
                          >
                            Leave
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(staff.userId, 'ABSENT')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-bold text-[11px]"
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Monthly Payroll Sheet Tab */
        <div className="space-y-6">
          {/* Month Selector & KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Payroll Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Active Working Days: 26</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">Total Payroll Obligation</span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                ৳{payrollData?.metrics?.totalPayrollObligationBdt?.toLocaleString() || '0'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Base + commissions earned</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 block mb-1">Disbursed Salary</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                ৳{payrollData?.metrics?.totalPayrollDisbursedBdt?.toLocaleString() || '0'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Paid to staff accounts</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-amber-600 block mb-1">Pending Disbursement</span>
              <span className="text-2xl font-black text-amber-600 font-mono">
                ৳{payrollData?.metrics?.pendingPayrollBdt?.toLocaleString() || '0'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting salary payment</p>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Monthly Salary Roll ({selectedMonth})</h3>
              <span className="text-xs text-slate-400 font-medium">Automatic attendance & sales commission reconciliation</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Staff Name</th>
                    <th className="p-3.5">Days Present</th>
                    <th className="p-3.5 text-right">Base Salary (৳)</th>
                    <th className="p-3.5 text-right">Earned Commission (৳)</th>
                    <th className="p-3.5 text-right">Net Payable (৳)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollData?.payrollSheet?.map((s: any) => (
                    <tr key={s.userId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{s.staffName}</span>
                        <span className="text-[10px] text-slate-400">{s.role}</span>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-700">
                        {s.daysPresent} / {s.workingDays}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        ৳{s.baseSalaryBdt.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-indigo-600">
                        +৳{s.earnedCommissionBdt.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                        ৳{s.netPayableBdt.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.paymentStatus === 'PAID' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {s.paymentStatus === 'PAID' ? (
                          <button
                            onClick={() => {
                              setSelectedSlip(s);
                              setSlipModalOpen(true);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Slip
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStaffForPay(s);
                              setPayModalOpen(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs inline-flex items-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" /> Disburse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Salary Modal */}
      {payModalOpen && selectedStaffForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pay Staff Salary</h3>
                <p className="text-xs text-slate-500">{selectedStaffForPay.staffName} ({selectedMonth})</p>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisburseSalary} className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>Base Salary:</span>
                  <span className="font-bold font-mono">৳{selectedStaffForPay.baseSalaryBdt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Sales Commissions:</span>
                  <span className="font-bold font-mono text-indigo-600">+৳{selectedStaffForPay.earnedCommissionBdt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono">৳{selectedStaffForPay.netPayableBdt.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="CASH">Cash Payment from Till</option>
                  <option value="BANK">Bank Electronic Transfer</option>
                  <option value="MOBILE_BANKING">bKash / Nagad Direct Send</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Print Modal */}
      {slipModalOpen && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">Official Salary Payslip</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-indigo-600 rounded-lg text-xs font-bold"
                >
                  Print Slip
                </button>
                <button onClick={() => setSlipModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="text-base font-black text-slate-900">BusinessOS Studio & Retail</h3>
                <p className="text-[11px] text-slate-500">Monthly Staff Salary Payment Slip</p>
                <p className="font-mono font-bold text-slate-600 mt-1">Period: {selectedMonth}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">Employee</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedSlip.staffName}</span>
                  <span className="block">{selectedSlip.role}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase">Working Summary</span>
                  <span className="font-bold text-slate-900">{selectedSlip.daysPresent} Days Present</span>
                  <span className="block text-emerald-600 font-bold">Status: Paid</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span>Basic Salary:</span>
                  <span className="font-mono font-bold">৳{selectedSlip.baseSalaryBdt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-indigo-600">
                  <span>Sales Commissions Earned:</span>
                  <span className="font-mono font-bold">+৳{selectedSlip.earnedCommissionBdt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Net Disbursed Salary:</span>
                  <span className="font-mono">৳{selectedSlip.netPayableBdt.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-6 flex justify-between text-[10px] text-slate-400">
                <div>
                  <div className="w-24 border-b border-slate-300 mb-1"></div>
                  <span>Staff Signature</span>
                </div>
                <div className="text-right">
                  <div className="w-24 border-b border-slate-300 mb-1 ml-auto"></div>
                  <span>Authorized Manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

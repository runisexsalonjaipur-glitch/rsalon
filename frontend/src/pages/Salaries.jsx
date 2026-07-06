import React, { useState, useEffect } from 'react';
import { 
  Users, 
  IndianRupee, 
  Percent, 
  TrendingUp, 
  Award, 
  Save, 
  Wallet,
  Coins,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import apiCall from '../api';
import { toast } from 'react-hot-toast';

export default function Salaries() {
  const [staff, setStaff] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salaryEdits, setSalaryEdits] = useState({}); // { staffId: { salary, commission } }

  const role = localStorage.getItem('role');
  const isSuperAdmin = role === 'super_admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, reportRes] = await Promise.all([
        apiCall('/staff'),
        apiCall('/reports')
      ]);
      setStaff(staffRes.filter(s => s.status === 'active'));
      setReport(reportRes);
      
      // Initialize inline inputs
      const initialEdits = {};
      staffRes.forEach(s => {
        initialEdits[s._id] = {
          salary: s.salary || 0,
          commission: s.commission || 0
        };
      });
      setSalaryEdits(initialEdits);
    } catch (err) {
      toast.error('Failed to load payroll configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const handleInputChange = (staffId, field, value) => {
    setSalaryEdits(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: Number(value || 0)
      }
    }));
  };

  const handleSaveStaffSettings = async (st) => {
    try {
      setSaving(true);
      const edits = salaryEdits[st._id];
      await apiCall(`/staff/${st._id}`, {
        method: 'PUT',
        body: {
          name: st.name,
          phone: st.phone,
          role: st.role,
          status: st.status,
          salary: edits.salary,
          commission: edits.commission
        }
      });
      toast.success(`Compensation settings updated for ${st.name}!`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-center text-red-500 shadow-soft">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Access Restricted</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">Staff payroll, salary configurations, and stylist commission metrics are reserved for Super Admin views only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Compiling staff logs and payroll parameters...</p>
      </div>
    );
  }

  // Calculate monthly stats based on reports
  const performanceMap = {};
  if (report && report.staffPerformance) {
    report.staffPerformance.forEach(st => {
      performanceMap[st.name] = st;
    });
  }

  let totalBaseSalary = 0;
  let totalCommissions = 0;

  const staffPayouts = staff.map(st => {
    const perf = performanceMap[st.name] || { revenue: 0, count: 0, totalBilled: 0 };
    const edits = salaryEdits[st._id] || { salary: st.salary || 0, commission: st.commission || 0 };
    
    const commissionVal = Math.round((perf.revenue * edits.commission) / 100);
    const totalPayout = edits.salary + commissionVal;
    
    totalBaseSalary += edits.salary;
    totalCommissions += commissionVal;

    return {
      ...st,
      revenue: perf.revenue,
      totalBilled: perf.totalBilled !== undefined ? perf.totalBilled : perf.revenue,
      visits: perf.count,
      commissionEarned: commissionVal,
      totalPayout
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Salaries & Commissions</h2>
        <p className="text-sm text-slate-500 font-medium">Manage stylist compensation parameters, define incentive percentage splits, and track monthly payroll budgets.</p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100/60 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Base Salaries</span>
            <span className="block text-2xl font-black text-slate-800">₹{totalBaseSalary.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-soft">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100/60 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Commissions Billed</span>
            <span className="block text-2xl font-black text-slate-800">₹{totalCommissions.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-soft">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100/60 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Monthly Payroll</span>
            <span className="block text-2xl font-black text-slate-800">₹{(totalBaseSalary + totalCommissions).toLocaleString('en-IN')}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-soft">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Salaries Ledger Table */}
      <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Staff Compensation Ledger</h3>
            <p className="text-xs text-slate-400">Configure salaries and commissions per active register stylist</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase text-[9px] tracking-wider">
                <th className="py-4 px-6">Stylist / Role</th>
                <th className="py-4 px-4">Sales Billed</th>
                <th className="py-4 px-4">Base Fixed Salary</th>
                <th className="py-4 px-4">Commission Rate</th>
                <th className="py-4 px-4">Gross Billed Sales</th>
                <th className="py-4 px-4">Commissionable Base (Service)</th>
                <th className="py-4 px-4">Commission Due</th>
                <th className="py-4 px-4">Total Payout</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staffPayouts.map(st => {
                const edits = salaryEdits[st._id] || { salary: 0, commission: 0 };
                return (
                  <tr key={st._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name & Role */}
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="block font-bold text-slate-800 text-sm">{st.name}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold">{st.role}</span>
                      </div>
                    </td>

                    {/* Sales Billed count */}
                    <td className="py-4.5 px-4 font-semibold text-slate-650">
                      {st.visits} customer visits
                    </td>

                    {/* Fixed salary input */}
                    <td className="py-4.5 px-4 w-40">
                      <div className="relative w-32">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-[10px]">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={edits.salary}
                          onChange={(e) => handleInputChange(st._id, 'salary', e.target.value)}
                          className="form-input !py-1.5 !pl-7 text-xs font-bold w-full"
                          min={0}
                        />
                      </div>
                    </td>

                    {/* Commission percentage input */}
                    <td className="py-4.5 px-4 w-32">
                      <div className="relative w-24">
                        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 font-bold text-[10px]">
                          %
                        </span>
                        <input
                          type="number"
                          value={edits.commission}
                          onChange={(e) => handleInputChange(st._id, 'commission', e.target.value)}
                          className="form-input !py-1.5 !pr-7 !pl-3 text-xs font-bold w-full"
                          min={0}
                          max={100}
                        />
                      </div>
                    </td>

                    {/* Gross Billed Sales */}
                    <td className="py-4.5 px-4 font-bold text-slate-650">
                      ₹{st.totalBilled.toLocaleString('en-IN')}
                    </td>

                    {/* Revenue generated */}
                    <td className="py-4.5 px-4 font-bold text-slate-850">
                      ₹{st.revenue.toLocaleString('en-IN')}
                    </td>

                    {/* Commission Earned */}
                    <td className="py-4.5 px-4 font-extrabold text-emerald-600">
                      ₹{st.commissionEarned.toLocaleString('en-IN')}
                    </td>

                    {/* Total payout */}
                    <td className="py-4.5 px-4 font-black text-slate-900 text-sm">
                      ₹{st.totalPayout.toLocaleString('en-IN')}
                    </td>

                    {/* Save Action */}
                    <td className="py-4.5 px-6 text-right">
                      <button
                        onClick={() => handleSaveStaffSettings(st)}
                        disabled={saving}
                        className="btn-accent !py-1.5 !px-3.5 text-[10px] font-bold flex items-center gap-1 inline-flex hover:shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
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
  );
}

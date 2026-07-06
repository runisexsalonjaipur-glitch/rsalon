import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  FileText, 
  Save, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import apiCall from '../api';
import { toast } from 'react-hot-toast';

export default function Attendance() {
  const role = localStorage.getItem('role');
  const isSuperAdmin = role === 'super_admin';

  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'monthly'
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daily tab states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyRecords, setDailyRecords] = useState({}); // { staffId: { status, inTime, outTime, notes } }
  const [savingDaily, setSavingDaily] = useState(false);

  // Monthly tab states
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/staff');
      setStaff(res.filter(s => s.status === 'active'));
    } catch (err) {
      toast.error('Failed to load staff roster');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Fetch daily attendance records when date changes
  const fetchDailyAttendance = async () => {
    if (staff.length === 0) return;
    try {
      const records = await apiCall(`/attendance?date=${selectedDate}`);
      
      // Initialize daily records mapping
      const mapping = {};
      staff.forEach(st => {
        const record = records.find(r => r.staff === st._id || r.staff?._id === st._id);
        mapping[st._id] = {
          status: record?.status || 'Present',
          inTime: record?.inTime || '09:30 AM',
          outTime: record?.outTime || '07:30 PM',
          notes: record?.notes || ''
        };
      });
      setDailyRecords(mapping);
    } catch (err) {
      console.error('Failed to fetch daily attendance', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyAttendance();
    }
  }, [selectedDate, staff, activeTab]);

  // Fetch monthly attendance records
  const fetchMonthlyAttendance = async () => {
    try {
      setLoadingMonthly(true);
      const records = await apiCall(`/attendance?month=${selectedMonth}`);
      setMonthlyRecords(records);
    } catch (err) {
      toast.error('Failed to load monthly attendance stats');
      console.error(err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyAttendance();
    }
  }, [selectedMonth, activeTab]);

  const handleStatusChange = (staffId, status) => {
    setDailyRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        status
      }
    }));
  };

  const handleFieldChange = (staffId, field, value) => {
    setDailyRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value
      }
    }));
  };

  const handleSaveDaily = async () => {
    try {
      setSavingDaily(true);
      const promises = Object.keys(dailyRecords).map(staffId => {
        const rec = dailyRecords[staffId];
        return apiCall('/attendance', {
          method: 'POST',
          body: {
            staffId,
            date: selectedDate,
            status: rec.status,
            inTime: rec.inTime,
            outTime: rec.outTime,
            notes: rec.notes
          }
        });
      });

      await Promise.all(promises);
      toast.success('Daily attendance updated successfully!');
      fetchDailyAttendance();
    } catch (err) {
      toast.error('Failed to save daily roster');
      console.error(err);
    } finally {
      setSavingDaily(false);
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  if (!isSuperAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-center text-red-500 shadow-soft">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Access Restricted</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">Attendance logging and daily staff roster configurations are reserved for Super Admin views only.</p>
        </div>
      </div>
    );
  }

  // Monthly stats mapping helper
  const getMonthlyStats = () => {
    const stats = {};
    staff.forEach(st => {
      stats[st._id] = {
        name: st.name,
        role: st.role,
        present: 0,
        absent: 0,
        leave: 0,
        leaveDates: []
      };
    });

    monthlyRecords.forEach(rec => {
      const sId = rec.staff._id || rec.staff;
      if (stats[sId]) {
        if (rec.status === 'Present') stats[sId].present += 1;
        else if (rec.status === 'Absent') stats[sId].absent += 1;
        else if (rec.status === 'Leave') {
          stats[sId].leave += 1;
          const day = new Date(rec.date).getDate();
          stats[sId].leaveDates.push(day);
        }
      }
    });

    return Object.values(stats);
  };

  const monthlyStats = getMonthlyStats();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Attendance Register</h2>
          <p className="text-sm text-slate-500 font-medium">Log daily stylus present/leave markers, record shift timings, and check monthly attendance files.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daily' 
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daily Register
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'monthly' 
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Monthly Ledger
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading stylist configurations...</p>
        </div>
      ) : activeTab === 'daily' ? (
        /* TAB 1: DAILY ATTENDANCE REGISTER */
        <div className="space-y-6">
          {/* Roster Controls */}
          <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-slate-50 text-slate-650 rounded-xl transition border border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-150 text-xs rounded-xl focus:outline-none focus:border-accent text-slate-800 font-bold"
                />
              </div>

              <button
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-slate-50 text-slate-650 rounded-xl transition border border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSaveDaily}
              disabled={savingDaily}
              className="btn-accent flex items-center gap-1.5 shadow-md shadow-accent/10 px-5 py-2.5"
            >
              {savingDaily ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Daily Register
                </>
              )}
            </button>
          </div>

          {/* Roster Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {staff.map(st => {
              const rec = dailyRecords[st._id] || { status: 'Present', inTime: '09:30 AM', outTime: '07:30 PM', notes: '' };
              return (
                <div key={st._id} className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 space-y-5 flex flex-col justify-between">
                  {/* Stylist Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-50">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm block">{st.name}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">{st.role}</span>
                    </div>
                    {/* Status selection buttons */}
                    <div className="flex bg-slate-100 p-0.75 rounded-xl border border-slate-200/50">
                      {['Present', 'Absent', 'Leave'].map(stat => {
                        const isSel = rec.status === stat;
                        return (
                          <button
                            key={stat}
                            onClick={() => handleStatusChange(st._id, stat)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all capitalize ${
                              isSel 
                                ? stat === 'Present' ? 'bg-emerald-500 text-white shadow-sm' 
                                  : stat === 'Absent' ? 'bg-rose-500 text-white shadow-sm'
                                  : 'bg-amber-500 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {stat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Settings grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* In time */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Shift In Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 09:30 AM"
                        value={rec.inTime}
                        onChange={(e) => handleFieldChange(st._id, 'inTime', e.target.value)}
                        disabled={rec.status !== 'Present'}
                        className="form-input text-xs bg-white font-bold"
                      />
                    </div>

                    {/* Out time */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Shift Out Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 07:30 PM"
                        value={rec.outTime}
                        onChange={(e) => handleFieldChange(st._id, 'outTime', e.target.value)}
                        disabled={rec.status !== 'Present'}
                        className="form-input text-xs bg-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Notes / Reason for absence
                    </label>
                    <input
                      type="text"
                      placeholder="Add brief details..."
                      value={rec.notes}
                      onChange={(e) => handleFieldChange(st._id, 'notes', e.target.value)}
                      className="form-input text-xs bg-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TAB 2: MONTHLY ATTENDANCE LEDGER */
        <div className="space-y-6">
          {/* Month selector */}
          <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 flex items-center gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 text-xs rounded-xl focus:outline-none focus:border-accent text-slate-800 font-bold"
              />
            </div>
          </div>

          {loadingMonthly ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Compiling monthly statistics...</p>
            </div>
          ) : (
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-soft overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">Monthly Attendance Summary</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Summary of stylist presents, leaves, and absents for the selected period</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase text-[9px] tracking-wider">
                      <th className="py-4 px-6">Stylist</th>
                      <th className="py-4 px-4 text-center">Days Present</th>
                      <th className="py-4 px-4 text-center">Days Absent</th>
                      <th className="py-4 px-4 text-center">Approved Leaves</th>
                      <th className="py-4 px-6">Leave Details (Dates)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {monthlyStats.map(st => (
                      <tr key={st.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="block font-bold text-slate-800 text-sm">{st.name}</span>
                          <span className="block text-[10px] text-slate-400 font-semibold">{st.role}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-xl font-bold">
                            {st.present} days
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block bg-rose-50/70 text-rose-600 border border-rose-100 px-3 py-1 rounded-xl font-bold">
                            {st.absent} days
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-xl font-bold">
                            {st.leave} days
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {st.leaveDates.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {st.leaveDates.sort((a,b)=>a-b).map(day => (
                                <span 
                                  key={day} 
                                  className="bg-slate-100 text-slate-650 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                                >
                                  {day}th
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

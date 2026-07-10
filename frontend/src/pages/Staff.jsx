import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  Phone,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import apiCall from '../api';
import { toast } from 'react-hot-toast';

export default function Staff() {
  const role = localStorage.getItem('role');
  const isSuperAdmin = role === 'super_admin';

  // Load from cache for instant display
  const cachedStaff = (() => { try { return JSON.parse(localStorage.getItem('staff_list') || '[]'); } catch { return []; } })();

  // Data states
  const [staff, setStaff] = useState(cachedStaff);
  const [loading, setLoading] = useState(cachedStaff.length === 0);
  const [search, setSearch] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit
  const [activeStaffId, setActiveStaffId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [staffRole, setStaffRole] = useState('Stylist');
  const [status, setStatus] = useState('active');
  const [salary, setSalary] = useState(0);
  const [commission, setCommission] = useState(0);

  const fetchStaff = async () => {
    try {
      if (cachedStaff.length === 0) {
        setLoading(true);
      }
      const res = await apiCall('/staff');
      setStaff(res);
      localStorage.setItem('staff_list', JSON.stringify(res));
    } catch (err) {
      if (cachedStaff.length === 0) {
        toast.error('Failed to load staff register');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setName('');
    setPhone('');
    setSalary(0);
    setCommission(0);
    setShowModal(true);
  };

  const openEditModal = (st) => {
    setModalMode('edit');
    setActiveStaffId(st._id);
    setName(st.name);
    setPhone(st.phone);
    setStaffRole(st.role);
    setStatus(st.status);
    setSalary(st.salary || 0);
    setCommission(st.commission || 0);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Staff Name must be at least 2 characters');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    if (!staffRole) {
      toast.error('Staff Role is required');
      return;
    }

    const payload = { 
      name, 
      phone, 
      role: staffRole, 
      status,
      salary: Number(salary || 0),
      commission: Number(commission || 0)
    };

    try {
      if (modalMode === 'create') {
        await apiCall('/staff', {
          method: 'POST',
          body: payload
        });
        toast.success('Staff member registered successfully!');
      } else {
        await apiCall(`/staff/${activeStaffId}`, {
          method: 'PUT',
          body: payload
        });
        toast.success('Staff profile updated successfully!');
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await apiCall(`/staff/${id}`, {
        method: 'DELETE'
      });
      toast.success('Staff member deleted successfully');
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to delete staff member');
    }
  };

  // Filter staff
  const filteredStaff = staff.filter(st => {
    return st.name.toLowerCase().includes(search.toLowerCase()) || 
           st.role.toLowerCase().includes(search.toLowerCase()) ||
           st.phone.includes(search);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Registry</h2>
          <p className="text-sm text-slate-500 font-medium">Manage operational stylists, therapists, receptionist roles and statuses.</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreateModal}
            className="btn-accent shadow-md shadow-accent/10 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Register New Staff
          </button>
        )}
      </div>

      {/* Admin Limitation Alert */}
      {!isSuperAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-start gap-3 text-xs text-amber-850">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Staff View Only:</span>
            <span className="block mt-0.5">As a standard Admin, you can review operational team rosters. Editing phone numbers or adding/deleting staff requires Super Admin permissions.</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 space-y-5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search staff by name, phone, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input !pl-11"
          />
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Loading staff roster...</p>
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Staff Name</th>
                  <th className="pb-3 font-semibold">Roster Role</th>
                  <th className="pb-3 font-semibold">Mobile Phone</th>
                  <th className="pb-3 font-semibold">Status</th>
                  {isSuperAdmin && <th className="pb-3 font-semibold text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-650">
                {filteredStaff.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-55/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-[11px] text-accent-dark">
                          {st.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800">{st.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-semibold">
                        <Briefcase className="w-3.5 h-3.5 text-slate-450" /> {st.role}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {st.phone}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-150/40' 
                          : 'bg-red-50 text-red-650 border border-red-150/40'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    
                    {isSuperAdmin && (
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(st)}
                            className="p-2 hover:bg-slate-50 text-slate-500 hover:text-primary-dark rounded-xl transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(st._id)}
                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-semibold">
            No employees found matching current filter query.
          </div>
        )}
      </div>

      {/* Create / Edit Drawer Modal (Restricted to Super Admin) */}
      {showModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[28px] shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {modalMode === 'create' ? 'Register Stylist / Therapist' : 'Edit Employee Settings'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Define names, phone contact details, and role specializations.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Staff Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aman Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Contact (10 Digits)</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role Type</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="form-input text-xs bg-white cursor-pointer"
                  >
                    <option value="Stylist">Stylist</option>
                    <option value="Therapist">Therapist</option>
                    <option value="Assistant">Assistant</option>
                    <option value="Receptionist">Receptionist</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="form-input text-xs bg-white cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Salary & Commission Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Fixed Salary */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fixed Salary (Base)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="15000"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="form-input !pl-8 text-xs font-bold"
                      min={0}
                    />
                  </div>
                </div>

                {/* Commission Rate */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Commission (%)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      %
                    </span>
                    <input
                      type="number"
                      placeholder="10"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                      className="form-input !pr-8 !pl-3.5 text-xs font-bold"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-primary-light text-white font-bold rounded-2xl transition shadow-md text-xs mt-2"
              >
                {modalMode === 'create' ? 'Register Employee' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Tag, 
  X, 
  PlusCircle, 
  Check, 
  AlertCircle
} from 'lucide-react';
import apiCall from '../api';
import { toast } from 'react-hot-toast';

export default function Services() {
  const role = localStorage.getItem('role');
  const isSuperAdmin = role === 'super_admin';

  // Data states
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI filter states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit
  const [activeServiceId, setActiveServiceId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active');
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Dynamic category calculations
  const defaultCategories = ['Hair Cut', 'Hair Spa', 'Hair Color', 'Facial', 'Beard', 'Keratin', 'Smoothening', 'Wax', 'Cleanup'];
  const uniqueDbCategories = Array.from(new Set(services.map(s => s.category))).filter(Boolean);
  const mergedCategories = Array.from(new Set([...defaultCategories, ...uniqueDbCategories]));

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/services');
      setServices(res);
    } catch (err) {
      toast.error('Failed to load services');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setName('');
    setPrice('');
    setCategory(mergedCategories[0] || 'Hair Cut');
    setIsNewCategory(false);
    setStatus('active');
    setShowModal(true);
  };

  const openEditModal = (svc) => {
    setModalMode('edit');
    setActiveServiceId(svc._id);
    setName(svc.name);
    setPrice(svc.price);
    setCategory(svc.category);
    setIsNewCategory(false);
    setStatus(svc.status);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Service Name is required');
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error('Please enter a valid price greater than zero');
      return;
    }
    if (!category.trim()) {
      toast.error('Service Category is required');
      return;
    }

    const payload = { name, price: Number(price), category, status };

    try {
      if (modalMode === 'create') {
        await apiCall('/services', {
          method: 'POST',
          body: payload
        });
        toast.success('Service created successfully!');
      } else {
        await apiCall(`/services/${activeServiceId}`, {
          method: 'PUT',
          body: payload
        });
        toast.success('Service updated successfully!');
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await apiCall(`/services/${id}`, {
        method: 'DELETE'
      });
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (err) {
      toast.error(err.message || 'Failed to delete service');
    }
  };

  // Helper formatting
  const formatAmt = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  // Unique categories for filtering
  const categories = ['All', ...new Set(services.map(s => s.category))];

  // Filter services
  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Service Catalog</h2>
          <p className="text-sm text-slate-500 font-medium">Manage haircutting, facials, colors, and treatments offered.</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreateModal}
            className="btn-accent shadow-md shadow-accent/10 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Service
          </button>
        )}
      </div>

      {/* Admin Limitation Alert */}
      {!isSuperAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-start gap-3 text-xs text-amber-850">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Staff View Only:</span>
            <span className="block mt-0.5">As a standard Admin, you can browse available catalog services. Creating, modifying, or deleting services requires Super Admin permissions.</span>
          </div>
        </div>
      )}

      {/* Catalog Search & Category Filters */}
      <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 space-y-5">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search services by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input !pl-11"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full -mx-2 px-2 scrollbar-none w-full md:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  categoryFilter === cat 
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services List Table */}
        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Loading services catalog...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Service Name</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Price</th>
                  {isSuperAdmin && <th className="pb-3 font-semibold text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-650">
                {filteredServices.map((svc) => (
                  <tr key={svc._id} className="hover:bg-slate-55/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-dark">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-800">{svc.name}</span>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-slate-500">{svc.category}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        svc.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-150/40' 
                          : 'bg-red-50 text-red-650 border border-red-150/40'
                      }`}>
                        {svc.status}
                      </span>
                    </td>
                    <td className="py-4 text-right font-extrabold text-slate-850">{formatAmt(svc.price)}</td>
                    
                    {isSuperAdmin && (
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(svc)}
                            className="p-2 hover:bg-slate-50 text-slate-500 hover:text-primary-dark rounded-xl transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(svc._id)}
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
            No services matched your current query filter.
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
                {modalMode === 'create' ? 'Add Service Offered' : 'Edit Service Settings'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Define names, categories, and standard pricing amounts.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hair Wash + Blow Dry"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Standard Price (₹)</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-input text-xs"
                  />
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

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={isNewCategory ? 'NEW_CAT' : category}
                  onChange={(e) => {
                    if (e.target.value === 'NEW_CAT') {
                      setIsNewCategory(true);
                      setCategory('');
                    } else {
                      setIsNewCategory(false);
                      setCategory(e.target.value);
                    }
                  }}
                  className="form-input text-xs bg-white cursor-pointer font-semibold"
                >
                  {mergedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="NEW_CAT">+ Register New Category...</option>
                </select>
              </div>

              {/* Dynamic New Category Input */}
              {isNewCategory && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pedicure, Massage"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input text-xs font-semibold"
                    required
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-primary-light text-white font-bold rounded-2xl transition shadow-md text-xs mt-2"
              >
                {modalMode === 'create' ? 'Create Service Item' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

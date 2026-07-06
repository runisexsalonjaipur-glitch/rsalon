const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();
const { Staff, Service, Customer, Entry, Settings } = require('./models');
const { JWT_SECRET, requireSuperAdmin, requireAdminOrSuperAdmin } = require('./auth');

// Helper to get date ranges
const getDateRange = (filterType, startCustom, endCustom) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (filterType) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      // Start of current week (Sunday)
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      if (startCustom) {
        start = new Date(startCustom);
        start.setHours(0, 0, 0, 0);
      } else {
        start.setHours(0, 0, 0, 0);
      }
      if (endCustom) {
        end = new Date(endCustom);
        end.setHours(23, 59, 59, 999);
      } else {
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      // Default to today
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

// --- AUTHENTICATION ---
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  const superAdminUser = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
  const superAdminPass = process.env.SUPER_ADMIN_PASSWORD || 'superpassword';
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'adminpassword';

  if (username === superAdminUser && password === superAdminPass) {
    const token = jwt.sign({ username, role: 'super_admin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, username, role: 'super_admin' });
  } else if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, username, role: 'admin' });
  }

  return res.status(401).json({ message: 'Invalid username or password' });
});

// --- SETTINGS (Super Admin Only for PUT) ---
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        salonName: 'R Unisex Salon',
        logo: '',
        currency: '₹',
        theme: 'light'
      });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
});

router.put('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const { salonName, logo, currency, theme } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    settings.salonName = salonName || settings.salonName;
    settings.logo = logo !== undefined ? logo : settings.logo;
    settings.currency = currency || settings.currency;
    settings.theme = theme || settings.theme;

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
});

// --- SERVICES ---
router.get('/services', requireAdminOrSuperAdmin, async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
});

router.post('/services', requireSuperAdmin, async (req, res) => {
  try {
    const { name, price, category, status } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }
    const service = new Service({ name, price, category, status });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create service', error: error.message });
  }
});

router.put('/services/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { name, price, category, status } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, price, category, status },
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service', error: error.message });
  }
});

router.delete('/services/:id', requireSuperAdmin, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
});

// --- STAFF ---
router.get('/staff', requireAdminOrSuperAdmin, async (req, res) => {
  try {
    const staff = await Staff.find().sort({ name: 1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch staff', error: error.message });
  }
});

router.post('/staff', requireSuperAdmin, async (req, res) => {
  try {
    const { name, phone, role, status, salary, commission } = req.body;
    if (!name || !phone || !role) {
      return res.status(400).json({ message: 'Name, phone, and role are required' });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }
    const staffMember = new Staff({ 
      name, 
      phone, 
      role, 
      status, 
      salary: Number(salary || 0), 
      commission: Number(commission || 0) 
    });
    await staffMember.save();
    res.status(201).json(staffMember);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create staff member', error: error.message });
  }
});

router.put('/staff/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { name, phone, role, status, salary, commission } = req.body;
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }
    const staffMember = await Staff.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        phone, 
        role, 
        status, 
        ...(salary !== undefined ? { salary: Number(salary) } : {}), 
        ...(commission !== undefined ? { commission: Number(commission) } : {}) 
      },
      { new: true }
    );
    if (!staffMember) return res.status(404).json({ message: 'Staff member not found' });
    res.json(staffMember);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update staff member', error: error.message });
  }
});

router.delete('/staff/:id', requireSuperAdmin, async (req, res) => {
  try {
    const staffMember = await Staff.findByIdAndDelete(req.params.id);
    if (!staffMember) return res.status(404).json({ message: 'Staff member not found' });
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete staff member', error: error.message });
  }
});

// --- CUSTOMERS ---
router.get('/customers/search', requireAdminOrSuperAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    // Search by name or phone
    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q } }
      ]
    }).limit(10);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to search customers', error: error.message });
  }
});

// --- REPEAT CUSTOMERS CRMs ---
router.get('/customers/repeat', requireAdminOrSuperAdmin, async (req, res) => {
  try {
    const repeatCustomers = await Entry.aggregate([
      {
        $group: {
          _id: "$customer",
          visitCount: { $sum: 1 },
          totalSpent: { $sum: "$finalAmount" },
          lastVisit: { $max: "$createdAt" }
        }
      },
      {
        $match: {
          visitCount: { $gte: 2 },
          _id: { $ne: null }
        }
      },
      {
        $sort: { visitCount: -1 }
      }
    ]);

    const populated = await Customer.populate(repeatCustomers, { path: "_id" });
    
    const results = populated.map(item => ({
      _id: item._id?._id,
      name: item._id?.name || 'Walk-in',
      phone: item._id?.phone || 'N/A',
      visitCount: item.visitCount,
      totalSpent: item.totalSpent,
      lastVisit: item.lastVisit
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch repeat customers', error: error.message });
  }
});

// --- ENTRIES (SALON VISITS) ---
router.post('/entries', requireAdminOrSuperAdmin, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      staffId,
      services, // [{ serviceId, name, price }]
      discount = 0,
      paymentMode,
      paymentBreakdown = { cash: 0, upi: 0, card: 0 },
      notes
    } = req.body;

    // Validations
    if (!customerName || customerName.trim().length < 2) {
      return res.status(400).json({ message: 'Customer Name is required and must be at least 2 characters' });
    }
    if (!customerPhone || !/^\d{10}$/.test(customerPhone)) {
      return res.status(400).json({ message: 'Customer phone number must be exactly 10 digits' });
    }
    if (!staffId) {
      return res.status(400).json({ message: 'Please select a staff member' });
    }
    if (!services || services.length === 0) {
      return res.status(400).json({ message: 'At least one service must be selected' });
    }
    if (!paymentMode) {
      return res.status(400).json({ message: 'Payment mode is required' });
    }

    // Upsert Customer
    let customer = await Customer.findOne({ phone: customerPhone });
    if (!customer) {
      customer = new Customer({ name: customerName, phone: customerPhone });
      await customer.save();
    } else {
      // Update name if changed
      if (customer.name !== customerName) {
        customer.name = customerName;
        await customer.save();
      }
    }

    // Verify Staff Exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(400).json({ message: 'Selected staff member does not exist' });
    }

    // Calculate billing
    let subtotal = 0;
    for (const item of services) {
      subtotal += item.price;
    }
    const finalAmount = Math.max(0, subtotal - discount);

    // Validate Payment Breakdown for Mixed Mode
    if (paymentMode === 'Mixed') {
      const totalBreakdown = Number(paymentBreakdown.cash || 0) + 
                             Number(paymentBreakdown.upi || 0) + 
                             Number(paymentBreakdown.card || 0);
      if (Math.round(totalBreakdown) !== Math.round(finalAmount)) {
        return res.status(400).json({
          message: `For Mixed payment, breakdown sum (${totalBreakdown}) must equal Final Amount (${finalAmount})`
        });
      }
    } else {
      // Populate breakdown automatically for single payment mode
      paymentBreakdown.cash = paymentMode === 'Cash' ? finalAmount : 0;
      paymentBreakdown.upi = paymentMode === 'UPI' ? finalAmount : 0;
      paymentBreakdown.card = paymentMode === 'Card' ? finalAmount : 0;
    }

    const entry = new Entry({
      customer: customer._id,
      staff: staffId,
      services,
      subtotal,
      discount,
      finalAmount,
      paymentMode,
      paymentBreakdown,
      notes
    });

    await entry.save();
    
    // Return saved entry populated with customer and staff info
    const populated = await Entry.findById(entry._id)
      .populate('customer')
      .populate('staff');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save customer entry', error: error.message });
  }
});

// Get entries (Search & History)
router.get('/entries', requireAdminOrSuperAdmin, async (req, res) => {
  try {
    const { search, filter, startDate, endDate, page = 1, limit = 20, staffId, serviceName } = req.query;
    
    const query = {};

    // Date range filter
    const range = getDateRange(filter, startDate, endDate);
    query.createdAt = { $gte: range.start, $lte: range.end };

    // Staff specific filter
    if (staffId && staffId !== 'All') {
      query.staff = staffId;
    }

    // Service specific filter
    if (serviceName && serviceName !== 'All') {
      query['services.name'] = serviceName;
    }

    // Search query matches customer name, phone, staff name, or service name
    if (search) {
      const cleanSearch = search.trim();
      
      // Let's find customers matching the search
      const matchingCustomers = await Customer.find({
        $or: [
          { name: { $regex: cleanSearch, $options: 'i' } },
          { phone: { $regex: cleanSearch } }
        ]
      }).select('_id');

      const customerIds = matchingCustomers.map(c => c._id);

      // Find staff matching search
      const matchingStaff = await Staff.find({
        name: { $regex: cleanSearch, $options: 'i' }
      }).select('_id');
      const staffIds = matchingStaff.map(s => s._id);

      query.$or = [
        { customer: { $in: customerIds } },
        { staff: { $in: staffIds } },
        { 'services.name': { $regex: cleanSearch, $options: 'i' } },
        { paymentMode: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    const skipIndex = (page - 1) * limit;
    const entries = await Entry.find(query)
      .populate('customer')
      .populate('staff')
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(Number(limit));

    const total = await Entry.countDocuments(query);

    res.json({
      entries,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalEntries: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch entries history', error: error.message });
  }
});

// --- DASHBOARD STATISTICS ---
router.get('/dashboard/stats', requireAdminOrSuperAdmin, async (req, res) => {
  try {
    const role = req.user.role;
    const days = Number(req.query.days) || 7;
    const serviceName = req.query.serviceName || 'All';
    
    // Get start & end of today
    const today = getDateRange('today');
    
    // Fetch today's entries
    const todayEntries = await Entry.find({
      createdAt: { $gte: today.start, $lte: today.end }
    }).populate('customer').populate('staff');

    // Filter today entries if serviceName is specified
    let filteredTodayEntries = todayEntries;
    if (serviceName !== 'All') {
      filteredTodayEntries = todayEntries.filter(entry => 
        entry.services.some(s => s.name === serviceName)
      );
    }

    // Basic calculation for today
    let todayRevenue = 0;
    let todayCustomers = filteredTodayEntries.length;
    let todayCash = 0;
    let todayUpi = 0;
    let todayCard = 0;
    let todayDiscount = 0;
    let todayServicesCount = 0;

    filteredTodayEntries.forEach(entry => {
      if (serviceName !== 'All') {
        const matchingServices = entry.services.filter(s => s.name === serviceName);
        const svcPrice = matchingServices.reduce((sum, s) => sum + s.price, 0);
        const totalServicesPrice = entry.services.reduce((sum, s) => sum + s.price, 0) || 1;
        const proportion = svcPrice / totalServicesPrice;
        todayRevenue += Math.round(entry.finalAmount * proportion);
        todayServicesCount += matchingServices.length;
        todayCash += Math.round((entry.paymentBreakdown.cash || 0) * proportion);
        todayUpi += Math.round((entry.paymentBreakdown.upi || 0) * proportion);
        todayCard += Math.round((entry.paymentBreakdown.card || 0) * proportion);
      } else {
        todayRevenue += entry.finalAmount;
        todayDiscount += entry.discount;
        todayServicesCount += entry.services.length;
        todayCash += entry.paymentBreakdown.cash || 0;
        todayUpi += entry.paymentBreakdown.upi || 0;
        todayCard += entry.paymentBreakdown.card || 0;
      }
    });

    const averageBill = todayCustomers > 0 ? Math.round(todayRevenue / todayCustomers) : 0;

    // Get 5 recent entries (unfiltered by service so recent list shows all salon activity)
    const recentEntries = await Entry.find()
      .populate('customer')
      .populate('staff')
      .sort({ createdAt: -1 })
      .limit(5);

    // Common Daily stats response
    const operationalStats = {
      todayRevenue,
      todayCustomers,
      todayServicesCount,
      averageBill,
      paymentSplit: {
        cash: todayCash,
        upi: todayUpi,
        card: todayCard
      },
      recentEntries
    };

    // Get monthly stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEntries = await Entry.find({
      createdAt: { $gte: startOfMonth }
    });

    let monthlyRevenue = 0;
    let monthlyCustomers = monthlyEntries.length;
    monthlyEntries.forEach(entry => {
      if (serviceName !== 'All') {
        const matchingServices = entry.services.filter(s => s.name === serviceName);
        if (matchingServices.length > 0) {
          const svcPrice = matchingServices.reduce((sum, s) => sum + s.price, 0);
          const totalServicesPrice = entry.services.reduce((sum, s) => sum + s.price, 0) || 1;
          const proportion = svcPrice / totalServicesPrice;
          monthlyRevenue += Math.round(entry.finalAmount * proportion);
        }
      } else {
        monthlyRevenue += entry.finalAmount;
      }
    });

    // Top services & Top staff
    const staffPerformance = {};
    const serviceSales = {};
    
    const allStaff = await Staff.find({ status: 'active' });
    const allServices = await Service.find({ status: 'active' });

    allStaff.forEach(s => {
      staffPerformance[s._id] = { name: s.name, role: s.role, revenue: 0, customers: 0 };
    });
    allServices.forEach(s => {
      serviceSales[s.name] = { name: s.name, category: s.category, count: 0, revenue: 0 };
    });

    const allEntries = await Entry.find().populate('staff');
    allEntries.forEach(entry => {
      const sId = entry.staff ? entry.staff._id.toString() : null;
      if (sId && staffPerformance[sId]) {
        staffPerformance[sId].revenue += entry.finalAmount;
        staffPerformance[sId].customers += 1;
      } else if (sId && entry.staff) {
        staffPerformance[sId] = {
          name: entry.staff.name,
          role: entry.staff.role,
          revenue: entry.finalAmount,
          customers: 1
        };
      }

      entry.services.forEach(item => {
        if (serviceSales[item.name]) {
          serviceSales[item.name].count += 1;
          serviceSales[item.name].revenue += item.price;
        } else {
          serviceSales[item.name] = {
            name: item.name,
            category: 'Other',
            count: 1,
            revenue: item.price
          };
        }
      });
    });

    const topStaffList = Object.values(staffPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topServicesList = Object.values(serviceSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Last N days revenue for chart
    const dailyRevenueChart = [];
    for (let i = days - 1; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - i);
      dStart.setHours(0, 0, 0, 0);

      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - i);
      dEnd.setHours(23, 59, 59, 999);

      const dEntries = await Entry.find({
        createdAt: { $gte: dStart, $lte: dEnd }
      });

      let rev = 0;
      let custCount = 0;
      dEntries.forEach(e => {
        if (serviceName !== 'All') {
          const matchingServices = e.services.filter(s => s.name === serviceName);
          if (matchingServices.length > 0) {
            const svcPrice = matchingServices.reduce((sum, s) => sum + s.price, 0);
            const totalServicesPrice = e.services.reduce((sum, s) => sum + s.price, 0) || 1;
            const proportion = svcPrice / totalServicesPrice;
            rev += Math.round(e.finalAmount * proportion);
            custCount += 1;
          }
        } else {
          rev += e.finalAmount;
          custCount += 1;
        }
      });
      
      const label = dStart.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      dailyRevenueChart.push({ label, revenue: rev, customers: custCount });
    }

    res.json({
      ...operationalStats,
      monthlyRevenue,
      monthlyCustomers,
      topStaff: topStaffList,
      topServices: topServicesList,
      revenueChart: dailyRevenueChart
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to compile dashboard stats', error: error.message });
  }
});

// --- REPORTS (Super Admin Only) ---
router.get('/reports', requireSuperAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse range
    const range = getDateRange('custom', startDate, endDate);
    
    const entries = await Entry.find({
      createdAt: { $gte: range.start, $lte: range.end }
    }).populate('customer').populate('staff');

    let revenue = 0;
    let customerCount = entries.length;
    let discountTotal = 0;
    let cash = 0;
    let upi = 0;
    let card = 0;

    const staffStats = {};
    const serviceStats = {};
    const dailyStats = {};

    entries.forEach(entry => {
      revenue += entry.finalAmount;
      discountTotal += entry.discount;
      cash += entry.paymentBreakdown.cash || 0;
      upi += entry.paymentBreakdown.upi || 0;
      card += entry.paymentBreakdown.card || 0;

      // Staff breakdown
      const staffId = entry.staff ? entry.staff._id.toString() : 'Unknown';
      const staffName = entry.staff ? entry.staff.name : 'Unknown';
      if (!staffStats[staffId]) {
        staffStats[staffId] = { name: staffName, revenue: 0, count: 0 };
      }
      staffStats[staffId].revenue += entry.finalAmount;
      staffStats[staffId].count += 1;

      // Services breakdown
      entry.services.forEach(svc => {
        if (!serviceStats[svc.name]) {
          serviceStats[svc.name] = { name: svc.name, count: 0, revenue: 0 };
        }
        serviceStats[svc.name].count += 1;
        serviceStats[svc.name].revenue += svc.price;
      });

      // Daily breakdown for chart
      const dayKey = new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = { date: dayKey, revenue: 0, customers: 0 };
      }
      dailyStats[dayKey].revenue += entry.finalAmount;
      dailyStats[dayKey].customers += 1;
    });

    const averageBill = customerCount > 0 ? Math.round(revenue / customerCount) : 0;

    res.json({
      summary: {
        revenue,
        customerCount,
        averageBill,
        discountTotal,
        payments: { cash, upi, card }
      },
      staffPerformance: Object.values(staffStats).sort((a, b) => b.revenue - a.revenue),
      serviceSales: Object.values(serviceStats).sort((a, b) => b.count - a.count),
      chartData: Object.values(dailyStats)
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to compile report', error: error.message });
  }
});

module.exports = router;

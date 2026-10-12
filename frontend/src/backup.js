import apiCall from './api';

export const BACKUP_INTERVAL_DAYS = 7;
const SNOOZE_KEY = 'backup_snoozed_until';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '');
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');
const num = (v) => Number(v || 0);

// Build one sheet: bold header row + plain value rows
const sheet = (name, headers, rows, widths) => ({
  sheet: name,
  data: [
    headers.map((h) => ({ value: h, fontWeight: 'bold' })),
    ...rows.map((r) => r.map((v) => (v === undefined || v === null ? null : v))),
  ],
  columns: widths.map((width) => ({ width })),
  stickyRowsCount: 1,
});

/** Downloads every collection as one Excel workbook and records the backup on the server. */
export async function downloadExcelBackup() {
  const [data, { default: writeXlsxFile }] = await Promise.all([
    apiCall('/backup/export'),
    import('write-excel-file/browser'),
  ]);

  const staffName = Object.fromEntries((data.staff || []).map((s) => [String(s._id), s.name]));

  const sheets = [
    sheet(
      'Visits',
      ['Date', 'Time', 'Customer', 'Mobile', 'Staff', 'Services', 'Subtotal', 'Discount', 'Final Amount', 'Payment Mode', 'Cash', 'UPI', 'Card', 'Due Amount', 'Due Status', 'Notes'],
      (data.entries || []).map((e) => [
        fmtDate(e.createdAt),
        fmtTime(e.createdAt),
        e.customer?.name || 'Walk-in',
        e.customer?.phone || '',
        e.staff?.name || '',
        (e.services || []).map((s) => `${s.name} (₹${s.price})`).join(', '),
        num(e.subtotal),
        num(e.discount),
        num(e.finalAmount),
        e.paymentMode || '',
        num(e.paymentBreakdown?.cash),
        num(e.paymentBreakdown?.upi),
        num(e.paymentBreakdown?.card),
        num(e.dueAmount),
        e.dueStatus || '',
        e.notes || '',
      ]),
      [12, 9, 20, 13, 16, 40, 10, 10, 12, 12, 9, 9, 9, 11, 10, 24]
    ),
    sheet(
      'Customers',
      ['Name', 'Mobile', 'Added On'],
      (data.customers || []).map((c) => [c.name, c.phone, fmtDate(c.createdAt)]),
      [24, 14, 12]
    ),
    sheet(
      'Staff',
      ['Name', 'Mobile', 'Role', 'Status', 'Monthly Salary', 'Commission %'],
      (data.staff || []).map((s) => [s.name, s.phone, s.role, s.status, num(s.salary), num(s.commission)]),
      [20, 14, 16, 10, 14, 13]
    ),
    sheet(
      'Services',
      ['Name', 'Category', 'Price', 'Product Cost', 'Service Price', 'Status'],
      (data.services || []).map((s) => [s.name, s.category, num(s.price), num(s.productPrice), num(s.servicePrice || s.price), s.status]),
      [26, 16, 10, 12, 12, 10]
    ),
    sheet(
      'Attendance',
      ['Date', 'Staff', 'Status', 'In Time', 'Out Time', 'Notes'],
      (data.attendance || [])
        .slice()
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((a) => [a.date, staffName[String(a.staff)] || '', a.status, a.inTime, a.outTime, a.notes || '']),
      [12, 20, 10, 10, 10, 24]
    ),
    sheet(
      'Salary Payouts',
      ['Month', 'Staff', 'Period Start', 'Period End', 'Base Salary', 'Commission', 'Total Paid', 'Method', 'Paid On', 'Notes'],
      (data.payouts || []).map((p) => [
        p.month,
        staffName[String(p.staff)] || '',
        p.startDate || '',
        p.endDate || '',
        num(p.baseSalary),
        num(p.commission),
        num(p.totalPaid),
        p.paymentMethod || '',
        fmtDate(p.paidAt),
        p.notes || '',
      ]),
      [10, 20, 12, 12, 12, 12, 12, 9, 12, 24]
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  await writeXlsxFile(sheets).toFile(`RSalon_Backup_${stamp}.xlsx`);

  const res = await apiCall('/backup/complete', { method: 'POST' });
  try {
    localStorage.removeItem(SNOOZE_KEY);
    const cached = JSON.parse(localStorage.getItem('salon_settings') || '{}');
    localStorage.setItem('salon_settings', JSON.stringify({ ...cached, lastBackupAt: res.lastBackupAt }));
  } catch { /* storage unavailable — reminder still resets via the server */ }
  return res.lastBackupAt;
}

/** True when the last backup is older than 7 days (or never happened) and the reminder isn't snoozed. */
export function isBackupDue(lastBackupAt) {
  try {
    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (Date.now() < snoozedUntil) return false;
  } catch { /* ignore */ }
  if (!lastBackupAt) return true;
  return Date.now() - new Date(lastBackupAt).getTime() >= BACKUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
}

/** "Remind me later" — hide the popup for one day on this device. */
export function snoozeBackupReminder() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
  } catch { /* ignore */ }
}

export const daysSince = (date) => (date ? Math.floor((Date.now() - new Date(date).getTime()) / 86400000) : null);

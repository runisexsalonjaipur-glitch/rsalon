import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  IndianRupee, 
  Users, 
  CreditCard, 
  Gift, 
  Download, 
  TrendingUp, 
  Activity, 
  Scissors, 
  HelpCircle,
  Clock
} from 'lucide-react';
import apiCall from '../api';
import { toast } from 'react-hot-toast';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Load from cache for instant display
  const cachedReport = (() => { try { return JSON.parse(localStorage.getItem('dash_report') || 'null'); } catch { return null; } })();

  // Default to past week
  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!cachedReport) setLoading(true);
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const res = await apiCall(`/reports?${params.toString()}`);
        setReport(res);
        // Cache only when no date filter (default range)
        if (!startDate && !endDate) {
          localStorage.setItem('dash_report', JSON.stringify(res));
        }
      } catch (err) {
        if (!cachedReport) toast.error('Failed to compile reports');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Show cached data immediately, then fetch fresh
    if (cachedReport && !startDate && !endDate) setReport(cachedReport);
    fetchReport();
  }, [startDate, endDate]);

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleExport = () => {
    if (!report) {
      toast.error('No report data available');
      return;
    }

    const { summary, staffPerformance = [], serviceSales = [] } = report;

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = val.toString();
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    };

    const lines = [];

    // Header Info
    lines.push(escapeCSV('R UNISEX SALON - BUSINESS PERFORMANCE REPORT'));
    lines.push(`${escapeCSV('Selected Timeframe:')},${escapeCSV(startDate || 'Beginning')} to ${escapeCSV(endDate || 'Today')}`);
    lines.push(`${escapeCSV('Exported On:')},${escapeCSV(new Date().toLocaleString('en-IN'))}`);
    lines.push(''); // blank separator

    // 1. KPI Summary Block
    lines.push(escapeCSV('--- BUSINESS KPI SUMMARY ---'));
    lines.push(`${escapeCSV('Key Performance Indicator')},${escapeCSV('Value')}`);
    lines.push(`${escapeCSV('Total Revenue Generated (INR)')},${summary.revenue}`);
    lines.push(`${escapeCSV('Total Visit Entries')},${summary.customerCount}`);
    lines.push(`${escapeCSV('Average Spend Per Ticket')},${summary.averageBill}`);
    lines.push(`${escapeCSV('Promotional Discounts Deducted')},${summary.discountTotal}`);
    lines.push(`${escapeCSV('Cash Collections')},${summary.payments?.cash || 0}`);
    lines.push(`${escapeCSV('UPI Digital Transfers')},${summary.payments?.upi || 0}`);
    lines.push(`${escapeCSV('Card Settlements')},${summary.payments?.card || 0}`);
    lines.push(''); // blank separator

    // 2. Stylist Rankings Block
    lines.push(escapeCSV('--- STYLIST PERFORMANCE RANKINGS ---'));
    lines.push(`${escapeCSV('Rank')},${escapeCSV('Stylist Name')},${escapeCSV('Visits Handled')},${escapeCSV('Total Revenue Contribution (INR)')}`);
    staffPerformance.forEach((st, idx) => {
      lines.push(`${idx + 1},${escapeCSV(st.name)},${st.count},${st.revenue}`);
    });
    lines.push(''); // blank separator

    // 3. Service Distribution Block
    lines.push(escapeCSV('--- SERVICE SALES DISTRIBUTION ---'));
    lines.push(`${escapeCSV('Service Description')},${escapeCSV('Sales Frequency')},${escapeCSV('Total Revenue Generated (INR)')}`);
    serviceSales.forEach(svc => {
      lines.push(`${escapeCSV(svc.name)},${svc.count},${svc.revenue}`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rsalon_business_report_${startDate || 'all'}_to_${endDate || 'today'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Business intelligence report exported successfully!');
  };

  // Formatting helpers
  const formatAmt = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (loading && !report) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-3xl" />)}
        </div>
        <div className="h-72 bg-slate-200 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!report) return null;

  const { summary, staffPerformance = [], serviceSales = [], chartData = [] } = report;

  // Payments split calculations
  const cashVal = summary.payments?.cash || 0;
  const upiVal = summary.payments?.upi || 0;
  const cardVal = summary.payments?.card || 0;
  const totalPayments = cashVal + upiVal + cardVal;
  const divisor = totalPayments || 1;
  const cashPct = Math.round((cashVal / divisor) * 100);
  const upiPct = Math.round((upiVal / divisor) * 100);
  const cardPct = Math.round((cardVal / divisor) * 100);

  // SVG Chart sizing
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1000);
  const chartHeight = 150;
  const chartWidth = 550;
  const points = chartData.map((d, index) => {
    const x = (index / (chartData.length - 1 || 1)) * (chartWidth - 50) + 25;
    const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 40) - 20;
    return { x, y, date: d.date, revenue: d.revenue };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Intelligence</h2>
          <p className="text-sm text-slate-500 font-medium">Verify salon cash flow breakdowns, stylist contributions, and treatment popularities.</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary shrink-0 shadow-sm text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Date Range Selection Bar */}
      <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 text-xs rounded-xl focus:outline-none focus:border-accent text-slate-800 font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 text-xs rounded-xl focus:outline-none focus:border-accent text-slate-800 font-bold"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={handleClearFilter}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition"
          >
            Clear Filters
          </button>
        )}
        <div className="text-xs text-slate-400 font-semibold self-center ml-auto">
          Selected Range: <b>{startDate || 'Beginning'}</b> to <b>{endDate || 'Today'}</b>
        </div>
      </div>

      {/* Summary KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total revenue */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100/60 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight block mt-0.5">{formatAmt(summary.revenue)}</span>
          </div>
        </div>

        {/* Visitor entries */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100/60 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Billed Visits</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight block mt-0.5">{summary.customerCount} entries</span>
          </div>
        </div>

        {/* Ticket average */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100/60 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Spend</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight block mt-0.5">{formatAmt(summary.averageBill)}</span>
          </div>
        </div>

        {/* Promo discount deductions */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100/60 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-650 flex items-center justify-center shadow-sm shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Discounts Given</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight block mt-0.5">{formatAmt(summary.discountTotal)}</span>
          </div>
        </div>
      </div>

      {/* Row 2: SVG Line graph & Payments split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Revenue Progression</h3>
              <p className="text-xs text-slate-400">Total bill values compiled day-by-day</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          {chartData.length > 0 ? (
            <div className="w-full overflow-x-auto mt-4 pb-2">
              <div style={{ minWidth: chartData.length > 10 ? `${chartData.length * 44}px` : '100%' }}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-52 overflow-visible">
                  <defs>
                    <linearGradient id="rpt-bar-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F472B6" />
                      <stop offset="100%" stopColor="#BE185D" />
                    </linearGradient>
                    <linearGradient id="rpt-zero-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FCE7F3" />
                      <stop offset="100%" stopColor="#FDF2F8" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75].map((pct, i) => {
                    const gy = 10 + (1 - pct) * (chartHeight - 30);
                    return <line key={i} x1="10" y1={gy} x2={chartWidth - 10} y2={gy}
                      stroke="#FCE7F3" strokeWidth="1" strokeDasharray="6 4" />;
                  })}
                  <line x1="10" y1={chartHeight - 18} x2={chartWidth - 10} y2={chartHeight - 18}
                    stroke="#FBCFE8" strokeWidth="1.5" />

                  {/* Bars */}
                  {chartData.map((d, idx) => {
                    const paddingX = 24;
                    const avail = chartWidth - paddingX * 2;
                    const bw = Math.min(32, avail / chartData.length - 10);
                    const cw = avail / chartData.length;
                    const bx = paddingX + idx * cw + (cw - bw) / 2;
                    const maxH = chartHeight - 32;
                    const bh = d.revenue > 0 ? Math.max((d.revenue / maxRevenue) * maxH, 6) : 6;
                    const by = chartHeight - bh - 18;
                    return (
                      <g key={idx}>
                        <rect x={bx} y={by} width={bw} height={bh} rx={6}
                          fill={d.revenue > 0 ? 'url(#rpt-bar-grad)' : 'url(#rpt-zero-grad)'}
                          style={{ filter: d.revenue > 0 ? 'drop-shadow(0 4px 6px rgba(219,39,119,0.25))' : 'none' }}
                        />
                        {d.revenue > 0 && (
                          <>
                            <rect x={bx + bw / 2 - 20} y={by - 20} width={40} height={16} rx={6} fill="#BE185D" />
                            <text x={bx + bw / 2} y={by - 9} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800">
                              {d.revenue >= 1000 ? `₹${(d.revenue/1000).toFixed(1)}k` : `₹${d.revenue}`}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
                <div className="flex mt-1" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
                  {chartData.map((d, idx) => {
                    const cw = 100 / chartData.length;
                    return (
                      <div key={idx} className="text-center" style={{ width: `${cw}%` }}>
                        <span className="text-[9px] font-bold text-slate-400">{d.date?.split(' ')[0]}</span>
                        <span className="block text-[8px] text-slate-300 font-medium">{d.date?.split(' ')[1]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-xs text-slate-400 gap-1.5">
              <Clock className="w-8 h-8 text-slate-300" />
              Not enough daily data nodes to build trend graph.
            </div>
          )}
        </div>

        {/* Payments mode split */}
        <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Receipt Categories</h3>
            <p className="text-xs text-slate-400">Total collections by payment modes</p>
          </div>

          <div className="space-y-4 my-6">
            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Cash Receipts</span>
                <span>{formatAmt(cashVal)} ({cashPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${cashPct}%` }} />
              </div>
            </div>

            {/* UPI */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>UPI Transfers</span>
                <span>{formatAmt(upiVal)} ({upiPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${upiPct}%` }} />
              </div>
            </div>

            {/* Card */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Credit/Debit Card</span>
                <span>{formatAmt(cardVal)} ({cardPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${cardPct}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-extrabold text-slate-900">
            <span>Aggregated Gross</span>
            <span>{formatAmt(totalPayments)}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Staff performance & Service sales distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stylist Rankings */}
        <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60">
          <div className="mb-5">
            <h3 className="font-bold text-slate-800 text-sm">Stylist Performance</h3>
            <p className="text-xs text-slate-400">Total revenue generated by stylist team</p>
          </div>

          {staffPerformance.length > 0 ? (
            <div className="space-y-4">
              {staffPerformance.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pb-3.5 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{st.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{st.count} visits registered</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-800">{formatAmt(st.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No staff performance data compiled.</div>
          )}
        </div>

        {/* Popular Treatments */}
        <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60">
          <div className="mb-5">
            <h3 className="font-bold text-slate-800 text-sm">Service Sales Breakdown</h3>
            <p className="text-xs text-slate-400">Most requested treatment items and sales</p>
          </div>

          {serviceSales.length > 0 ? (
            <div className="space-y-4">
              {serviceSales.map((svc, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pb-3.5 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent-dark shrink-0">
                      <Scissors className="w-4.5 h-4.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{svc.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{svc.count} sales registered</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-800 shrink-0">{formatAmt(svc.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No service sales records compiled.</div>
          )}
        </div>

      </div>
    </div>
  );
}

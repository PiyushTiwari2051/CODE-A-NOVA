import React, { useState, useEffect } from 'react';
import { 
  FileDown, Calendar, TrendingUp, DollarSign, 
  Percent, ArrowRight, ShieldAlert, BarChart3, ListFilter 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sales' | 'inventory' | 'pandl'
  const [loading, setLoading] = useState(true);

  // General Filter Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Overview Tab states
  const [overviewKPIs, setOverviewKPIs] = useState({
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    profitMargin: 0,
    purchaseExpenses: 0,
    netProfit: 0
  });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  // Sales Tab states
  const [salesList, setSalesList] = useState([]);
  const [salesTotals, setSalesTotals] = useState({ subtotal: 0, discount: 0, tax: 0, netTotal: 0 });

  // Inventory Tab states
  const [inventoryValuation, setInventoryValuation] = useState(0);
  const [valuationTable, setValuationTable] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profit & Loss values (which doubles as KPI summary)
      const plRes = await api.get('/reports/profit-loss', { params: { startDate, endDate } });
      if (plRes.data.success) {
        setOverviewKPIs(plRes.data);
        setCategoryBreakdown(plRes.data.revenueByCategory || []);
      }

      // 2. Fetch Daily revenue trend (from charts endpoint)
      const chartRes = await api.get('/reports/charts');
      if (chartRes.data.success) {
        setRevenueTrend(chartRes.data.revenueExpensesLine);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/sales', { params: { startDate, endDate } });
      if (res.data.success) {
        setSalesList(res.data.sales);
        setSalesTotals(res.data.totals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/inventory');
      if (res.data.success) {
        setInventoryValuation(res.data.totalValuation);
        setValuationTable(res.data.valuationTable);
        setStockMovements(res.data.stockMovements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'pandl') {
      fetchOverviewData();
    } else if (activeTab === 'sales') {
      fetchSalesData();
    } else if (activeTab === 'inventory') {
      fetchInventoryData();
    }
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = (type) => {
    let headers = '';
    let rows = '';
    let filename = '';

    if (type === 'sales') {
      headers = 'Invoice,Customer,Date,Method,Discount,Tax,Total\r\n';
      rows = salesList.map(s => 
        `"${s.invoiceNumber}","${s.customer.name.replace(/"/g, '""')}","${new Date(s.createdAt).toLocaleDateString()}","${s.paymentMethod}",${s.discount},${s.tax},${s.netTotal}`
      ).join('\r\n');
      filename = 'Precision_Ledger_Sales_Report.csv';
    } else if (type === 'inventory') {
      headers = 'SKU,Product Name,Quantity,Buying Price,Total Value\r\n';
      rows = valuationTable.map(v => 
        `"${v.sku}","${v.name.replace(/"/g, '""')}",${v.stockQty},${v.buyingPrice},${v.totalValue}`
      ).join('\r\n');
      filename = 'Precision_Ledger_Inventory_Valuation.csv';
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPL = () => {
    window.print();
  };

  return (
    <div className="space-y-24">
      
      {/* --- TABS --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-16 border-b border-customBorder dark:border-[#2d2d2a] pb-4">
        <div className="flex gap-24">
          {['overview', 'sales', 'inventory', 'pandl'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-12 text-sm font-bold border-b-2 transition-all capitalize ${
                activeTab === tab 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary'
              }`}
            >
              {tab === 'pandl' ? 'Profit & Loss' : `${tab} report`}
            </button>
          ))}
        </div>

        {/* Date Filters */}
        {activeTab !== 'inventory' && (
          <div className="flex items-center gap-12 text-xs text-text-secondary dark:text-gray-300">
            <Calendar size={14} className="text-text-muted" />
            <input 
              type="date"
              className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#383834] rounded-sm px-6 py-4 focus:outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>to</span>
            <input 
              type="date"
              className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#383834] rounded-sm px-6 py-4 focus:outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* --- TAB 1: OVERVIEW ANALYTICS --- */}
      {activeTab === 'overview' && (
        <div className="space-y-24 animate-[fadeInUp_0.2s_ease-out]">
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
            <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] p-16 rounded-md shadow-xs card-texture-overlay">
              <span className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase">Revenue</span>
              <p className="font-mono text-lg font-bold text-primary dark:text-white mt-4">${overviewKPIs.revenue.toFixed(2)}</p>
            </div>
            <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] p-16 rounded-md shadow-xs card-texture-overlay">
              <span className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase">Cost of Goods (COGS)</span>
              <p className="font-mono text-lg font-bold text-primary dark:text-white mt-4">${overviewKPIs.cogs.toFixed(2)}</p>
            </div>
            <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] p-16 rounded-md shadow-xs card-texture-overlay">
              <span className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase">Gross Profit</span>
              <p className="font-mono text-lg font-bold text-accent mt-4">${overviewKPIs.grossProfit.toFixed(2)}</p>
            </div>
            <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] p-16 rounded-md shadow-xs card-texture-overlay">
              <span className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase">Margin Profit</span>
              <p className="font-mono text-lg font-bold text-success mt-4">{overviewKPIs.profitMargin.toFixed(1)}%</p>
            </div>
          </div>

          {/* Area revenue chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
            <div className="lg:col-span-8 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] p-16 md:p-24 rounded-md shadow-xs space-y-16">
              <h4 className="font-serif text-base font-bold text-primary dark:text-white">Daily Revenue Progression</h4>
              <div className="h-240 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E07B39" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#E07B39" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EFE9" />
                    <XAxis dataKey="date" stroke="#9A9A9A" fontSize={10} />
                    <YAxis stroke="#9A9A9A" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A2B4A', border: 'none', color: 'white' }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#E07B39" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown bar */}
            <div className="lg:col-span-4 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] p-16 md:p-24 rounded-md shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="font-serif text-base font-bold text-primary dark:text-white">Segment Revenues</h4>
                <p className="text-[11px] text-text-secondary mt-2">Revenue contribution grouped by catalog tags.</p>
              </div>
              <div className="h-180 w-full text-[10px] pt-8">
                {categoryBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-text-muted">No sales logs to aggregate.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBreakdown} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <XAxis type="number" stroke="#9A9A9A" fontSize={9} />
                      <YAxis dataKey="name" type="category" stroke="#9A9A9A" fontSize={9} width={70} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1A2B4A" barSize={10} radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 2: SALES JOURNAL REPORT --- */}
      {activeTab === 'sales' && (
        <div className="space-y-20 animate-[fadeInUp_0.2s_ease-out]">
          <div className="flex justify-end">
            <button
              onClick={() => handleExportCSV('sales')}
              className="px-16 py-8 text-xs font-bold border border-customBorder dark:border-[#2d2d2a] bg-surface-card dark:bg-[#1c1c1a] hover:bg-surface dark:hover:bg-[#252522] rounded-sm transition-colors flex items-center gap-8 uppercase tracking-wider"
            >
              <FileDown size={14} /> Export Sales CSV
            </button>
          </div>

          <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs overflow-hidden">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-customBorder dark:border-[#2d2d2a] bg-surface dark:bg-[#252522] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-12 px-16">Invoice</th>
                    <th className="py-12">Customer</th>
                    <th className="py-12">Date</th>
                    <th className="py-12">Method</th>
                    <th className="py-12 text-right">Discount</th>
                    <th className="py-12 text-right">Tax (GST)</th>
                    <th className="py-12 text-right">Net Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-customBorder/60">
                  {salesList.map(s => (
                    <tr key={s._id} className="hover:bg-surface/50">
                      <td className="py-12 px-16 font-mono font-semibold text-primary dark:text-white">{s.invoiceNumber}</td>
                      <td className="py-12 font-bold text-text-primary dark:text-gray-300">{s.customer.name}</td>
                      <td className="py-12 text-text-secondary dark:text-gray-400">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="py-12 text-text-secondary dark:text-gray-400">{s.paymentMethod}</td>
                      <td className="py-12 text-right font-mono text-text-secondary">-${s.discount.toFixed(2)}</td>
                      <td className="py-12 text-right font-mono text-text-secondary">${s.tax.toFixed(2)}</td>
                      <td className="py-12 text-right font-mono font-bold text-text-primary dark:text-white">${s.netTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  {salesList.length > 0 && (
                    <tr className="bg-surface dark:bg-[#252522] border-t-2 border-primary font-bold">
                      <td colSpan="4" className="py-16 px-16 text-text-primary dark:text-white uppercase font-serif">Report Totals:</td>
                      <td className="py-16 text-right font-mono text-warning">-${salesTotals.discount.toFixed(2)}</td>
                      <td className="py-16 text-right font-mono text-text-primary dark:text-white">${salesTotals.tax.toFixed(2)}</td>
                      <td className="py-16 text-right font-mono text-accent text-sm">${salesTotals.netTotal.toFixed(2)}</td>
                    </tr>
                  )}
                  {salesList.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-32 text-center text-text-muted">No sales registered within the requested timeframe.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: INVENTORY VALUATION & MOVEMENTS --- */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start animate-[fadeInUp_0.2s_ease-out] text-xs">
          
          {/* Left: current stock valuation table (7 cols) */}
          <div className="lg:col-span-7 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
            <div className="flex justify-between items-center pb-8 border-b border-customBorder dark:border-[#2d2d2a]">
              <div>
                <h4 className="font-serif text-base font-bold text-primary dark:text-white">Active Valuation Ledger</h4>
                <p className="text-[10px] text-text-secondary mt-2">Calculates total assets locked on active shelves.</p>
              </div>
              <button
                onClick={() => handleExportCSV('inventory')}
                className="px-12 py-6 text-[10px] font-bold border border-customBorder dark:border-[#2d2d2a] bg-surface dark:bg-[#252522] hover:bg-surface-card rounded-sm flex items-center gap-6"
              >
                <FileDown size={12} /> CSV Valuation
              </button>
            </div>

            <div className="overflow-x-auto max-h-360">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-customBorder text-text-secondary dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider bg-surface dark:bg-[#252522] p-8">
                    <th className="py-8 px-8">SKU</th>
                    <th className="py-8">Product Name</th>
                    <th className="py-8 text-center">Qty</th>
                    <th className="py-8 text-right">Cost Price</th>
                    <th className="py-8 text-right pr-8">Asset Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-customBorder/50 font-medium text-text-secondary dark:text-gray-300">
                  {valuationTable.map(item => (
                    <tr key={item._id} className="hover:bg-surface/50">
                      <td className="py-10 px-8 font-mono font-semibold">{item.sku}</td>
                      <td className="py-10 font-serif font-bold text-primary dark:text-white truncate max-w-[150px]">{item.name}</td>
                      <td className="py-10 text-center font-mono">{item.stockQty}</td>
                      <td className="py-10 text-right font-mono">${item.buyingPrice.toFixed(2)}</td>
                      <td className="py-10 text-right font-mono pr-8 font-bold text-text-primary dark:text-white">${item.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total asset label */}
            <div className="bg-primary text-white p-16 rounded-sm flex justify-between items-center border border-primary-light/25">
              <span className="font-serif text-sm font-bold text-white">Total Inventory Value:</span>
              <span className="font-mono text-base font-bold text-accent">${inventoryValuation.toFixed(2)}</span>
            </div>
          </div>

          {/* Right: stock movement logs (5 cols) */}
          <div className="lg:col-span-5 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
            <div>
              <h4 className="font-serif text-base font-bold text-primary dark:text-white font-serif">Stock Movement History</h4>
              <p className="text-[10px] text-text-secondary mt-2">Sequential logs of inventory arrivals and sales.</p>
            </div>

            <div className="space-y-12 max-h-360 overflow-y-auto pr-4">
              {stockMovements.map(m => (
                <div key={m._id} className="p-10 border border-customBorder dark:border-[#2d2d2a] rounded-sm space-y-6 bg-surface dark:bg-[#252522] leading-tight">
                  <div className="flex justify-between items-center font-bold">
                    <span className="truncate max-w-[160px] text-text-primary dark:text-white font-serif">{m.productName}</span>
                    <span className={`font-mono ${m.quantityChange > 0 ? 'text-success' : 'text-danger'}`}>
                      {m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary dark:text-gray-400 font-mono">
                    Before: {m.stockBefore} • After: {m.stockAfter}
                  </p>
                  <div className="flex justify-between items-center text-[9px] text-text-muted pt-4 border-t border-customBorder/30">
                    <span className="capitalize">{m.type.replace('_', ' ')}</span>
                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {stockMovements.length === 0 && (
                <div className="py-32 text-center text-text-muted">No stock movements logged.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 4: PROFIT & LOSS STATEMENTS --- */}
      {activeTab === 'pandl' && (
        <div className="max-w-2xl mx-auto space-y-24 animate-[fadeInUp_0.2s_ease-out]">
          <div className="flex justify-end gap-12 no-print">
            <button
              onClick={handlePrintPL}
              className="px-16 py-8 text-xs font-bold bg-primary hover:bg-primary-light text-white rounded-sm transition-colors flex items-center gap-8 uppercase tracking-wider"
            >
              Print Statement
            </button>
          </div>

          {/* Printable P&L Sheet */}
          <div className="print-area bg-white text-text-primary border border-customBorder rounded-md shadow-md p-24 md:p-32 space-y-24 text-xs font-sans">
            
            {/* Header */}
            <div className="text-center space-y-8 border-b border-customBorder pb-16">
              <h3 className="font-serif text-lg font-bold text-primary">Profit & Loss Statement</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">Artisan Ledger Co.</p>
              <p className="text-[10px] text-text-muted">
                Reporting Interval: {startDate || 'Inception'} — {endDate || 'Present'}
              </p>
            </div>

            {/* Income Section */}
            <div className="space-y-12">
              <h5 className="font-serif text-sm font-bold text-primary border-b border-primary pb-4">1. Operating Revenues</h5>
              <div className="space-y-6 pl-12 font-medium text-text-secondary">
                <div className="flex justify-between">
                  <span>Gross Sales Income (excl. Tax):</span>
                  <span className="font-mono">${overviewKPIs.revenue.toFixed(2)}</span>
                </div>
                {/* Categorized lines */}
                {categoryBreakdown.map(cat => (
                  <div key={cat.name} className="flex justify-between text-[11px] italic text-text-muted pl-12">
                    <span>{cat.name} segment sales:</span>
                    <span className="font-mono">${cat.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t border-customBorder pt-6 font-mono pl-12 text-text-primary">
                <span>Total Revenue:</span>
                <span>${overviewKPIs.revenue.toFixed(2)}</span>
              </div>
            </div>

            {/* Cost Section */}
            <div className="space-y-12">
              <h5 className="font-serif text-sm font-bold text-primary border-b border-primary pb-4">2. Cost of Sales (COGS)</h5>
              <div className="space-y-6 pl-12 font-medium text-text-secondary">
                <div className="flex justify-between">
                  <span>Wholesale Inventory Cost:</span>
                  <span className="font-mono">${overviewKPIs.cogs.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold border-t border-customBorder pt-6 font-mono pl-12 text-text-primary">
                <span>Total Cost of Sales (COGS):</span>
                <span>-${overviewKPIs.cogs.toFixed(2)}</span>
              </div>
            </div>

            {/* Gross Profit Summary */}
            <div className="bg-surface p-12 border border-customBorder font-bold flex justify-between items-center text-text-primary">
              <span className="font-serif text-sm">Gross Profit Margin:</span>
              <span className="font-mono text-accent text-sm">${overviewKPIs.grossProfit.toFixed(2)}</span>
            </div>

            {/* Operational Expenses */}
            <div className="space-y-12">
              <h5 className="font-serif text-sm font-bold text-primary border-b border-primary pb-4">3. Operational Expenditures</h5>
              <div className="space-y-6 pl-12 font-medium text-text-secondary">
                <div className="flex justify-between">
                  <span>Procured Deliveries Received (PO value):</span>
                  <span className="font-mono">${overviewKPIs.purchaseExpenses.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold border-t border-customBorder pt-6 font-mono pl-12 text-text-primary">
                <span>Total Operating Expenses:</span>
                <span>-${overviewKPIs.purchaseExpenses.toFixed(2)}</span>
              </div>
            </div>

            {/* Net profit summary */}
            <div className="bg-primary text-white p-16 border border-primary-light rounded-sm font-bold flex justify-between items-center">
              <span className="font-serif text-sm">Net Operating Surplus:</span>
              <span className="font-mono text-accent text-base">${overviewKPIs.netProfit.toFixed(2)}</span>
            </div>

            {/* Accounting footer */}
            <div className="text-center pt-24 border-t border-customBorder text-[9px] text-text-muted">
              Precision Ledger &copy; Internal Audits Node • Monospaced digits verified
            </div>

          </div>
        </div>
      )}

      {/* Printable P&L A4 css overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
            color: black !important;
          }
        }
      `}</style>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, Package, AlertTriangle, FileSpreadsheet, 
  ArrowUpRight, ArrowDownRight, ArrowRight, ShieldAlert,
  CheckCircle, Plus 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, 
  Pie, Cell, BarChart, Bar 
} from 'recharts';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();

  // Metrics states
  const [stats, setStats] = useState({
    revenueToday: 0,
    revenueThisMonth: 0,
    totalProducts: 0,
    lowStockItems: 0,
    pendingPOs: 0
  });
  
  const [revenuePeriod, setRevenuePeriod] = useState('month'); // 'today' or 'month'
  const [chartPeriod, setChartPeriod] = useState(30); // 7, 30, 90 days

  // Charts states
  const [lineChartData, setLineChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  // Activity panels states
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [supplierActivity, setSupplierActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch KPI Stats
      const statsRes = await api.get('/reports/overview');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // 2. Fetch Charts Data
      const chartsRes = await api.get('/reports/charts');
      if (chartsRes.data.success) {
        setLineChartData(chartsRes.data.revenueExpensesLine);
        setPieChartData(chartsRes.data.stockDistribution);
        setBarChartData(chartsRes.data.topProductsBar);
      }

      // 3. Fetch Recent Sales
      const salesRes = await api.get('/sales');
      if (salesRes.data.success) {
        setRecentSales(salesRes.data.sales.slice(0, 5));
      }

      // 4. Fetch Low Stock Alerts
      const alertsRes = await api.get('/products/low-stock');
      if (alertsRes.data.success) {
        setLowStockAlerts(alertsRes.data.products.slice(0, 5));
      }

      // 5. Fetch Supplier outstanding logs
      const suppRes = await api.get('/suppliers');
      if (suppRes.data.success) {
        setSupplierActivity(suppRes.data.suppliers.slice(0, 5));
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Could not populate dashboard data metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateQuickPO = (productId) => {
    navigate('/dashboard/purchases', { state: { quickProductId: productId } });
  };

  // KPI animations count-up simulation
  const [animatedRev, setAnimatedRev] = useState(0);
  useEffect(() => {
    if (loading) return;
    const target = revenuePeriod === 'today' ? stats.revenueToday : stats.revenueThisMonth;
    let start = 0;
    const duration = 800; // ms
    const stepTime = Math.abs(Math.floor(duration / (target || 1)));
    
    const timer = setInterval(() => {
      start += Math.ceil(target / 25);
      if (start >= target) {
        setAnimatedRev(target);
        clearInterval(timer);
      } else {
        setAnimatedRev(start);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [revenuePeriod, stats.revenueToday, stats.revenueThisMonth, loading]);

  if (loading) {
    return (
      <div className="space-y-24">
        {/* Shimmer loading layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-96 rounded-md skeleton-shimmer border border-customBorder" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
          <div className="lg:col-span-8 h-320 rounded-md skeleton-shimmer border border-customBorder" />
          <div className="lg:col-span-4 h-320 rounded-md skeleton-shimmer border border-customBorder" />
        </div>
      </div>
    );
  }

  // Segment colors for Stock pie chart
  const COLORS = ['#2E7D32', '#B45309', '#C0392B'];

  return (
    <div className="space-y-24 animate-[fadeInUp_0.4s_ease-out]">
      
      {/* --- KPI SECTION ROW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
        
        {/* Card 1: Revenue */}
        <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 flex flex-col justify-between card-texture-overlay relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="font-mono text-xl font-bold text-primary dark:text-white mt-4">
                ${animatedRev.toFixed(2)}
              </h3>
            </div>
            <div className="p-6 bg-success/10 text-success rounded-full">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-12 flex justify-between items-center text-[10px]">
            {/* Toggle button */}
            <div className="flex border border-customBorder dark:border-[#2d2d2a] rounded-sm overflow-hidden font-bold">
              <button 
                onClick={() => setRevenuePeriod('today')}
                className={`px-8 py-2 ${revenuePeriod === 'today' ? 'bg-primary text-white' : 'bg-surface dark:bg-[#252522] text-text-secondary'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setRevenuePeriod('month')}
                className={`px-8 py-2 ${revenuePeriod === 'month' ? 'bg-primary text-white' : 'bg-surface dark:bg-[#252522] text-text-secondary'}`}
              >
                Month
              </button>
            </div>
            <span className="text-success font-bold flex items-center gap-2">
              <ArrowUpRight size={10} /> +8.4%
            </span>
          </div>
        </div>

        {/* Card 2: Total Products */}
        <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 flex flex-col justify-between card-texture-overlay">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Artisan Catalog</p>
              <h3 className="font-mono text-xl font-bold text-primary dark:text-white mt-4">
                {stats.totalProducts} items
              </h3>
            </div>
            <div className="p-6 bg-primary/10 text-primary dark:text-gray-300 rounded-full">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-12 flex items-center justify-between text-[10px] text-text-secondary dark:text-gray-400">
            <span>Active items on shelves</span>
            <span className="text-success font-bold flex items-center gap-2">
              <ArrowUpRight size={10} /> +1.2%
            </span>
          </div>
        </div>

        {/* Card 3: Low Stock Items */}
        <div 
          onClick={() => navigate('/dashboard/products', { state: { filterStock: 'Low Stock' } })}
          className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 flex flex-col justify-between cursor-pointer hover:border-warning/60 transition-all card-texture-overlay"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Low Stock Warnings</p>
              <h3 className="font-mono text-xl font-bold text-primary dark:text-white mt-4">
                {stats.lowStockItems} alerts
              </h3>
            </div>
            <div className={`p-6 rounded-full ${stats.lowStockItems > 0 ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-12 flex items-center justify-between text-[10px]">
            <span className="text-text-secondary dark:text-gray-400">Items below safety limits</span>
            {stats.lowStockItems > 0 ? (
              <span className="text-warning font-bold flex items-center gap-2">
                <ShieldAlert size={10} /> Restock needed
              </span>
            ) : (
              <span className="text-success font-bold flex items-center gap-2">
                <CheckCircle size={10} /> All healthy
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Pending Purchase Orders */}
        <div 
          onClick={() => navigate('/dashboard/purchases')}
          className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 flex flex-col justify-between cursor-pointer hover:border-primary-light/60 transition-all card-texture-overlay"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Pending Orders</p>
              <h3 className="font-mono text-xl font-bold text-primary dark:text-white mt-4">
                {stats.pendingPOs} PO logs
              </h3>
            </div>
            <div className="p-6 bg-info/10 text-info rounded-full">
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <div className="mt-12 flex items-center justify-between text-[10px] text-text-secondary dark:text-gray-400">
            <span>Outstanding cargo orders</span>
            <span className="text-info font-bold flex items-center gap-2">
              <Plus size={10} /> PO list
            </span>
          </div>
        </div>

      </div>

      {/* --- CHARTS MATRIX ROW (2-COLUMN) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
        
        {/* Left: Dual Line Revenue vs Expense */}
        <div className="lg:col-span-8 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
            <div>
              <h4 className="font-serif text-base font-bold text-primary dark:text-white">Revenue vs Cost Performance</h4>
              <p className="text-[11px] text-text-secondary dark:text-gray-400">Daily sales income vs wholesale procurement costs.</p>
            </div>
            <div className="flex border border-customBorder dark:border-[#2d2d2a] rounded-sm overflow-hidden text-[10px] font-bold">
              <button 
                onClick={() => setChartPeriod(7)}
                className={`px-8 py-4 ${chartPeriod === 7 ? 'bg-primary text-white' : 'bg-surface dark:bg-[#252522] text-text-secondary'}`}
              >
                7d
              </button>
              <button 
                onClick={() => setChartPeriod(30)}
                className={`px-8 py-4 ${chartPeriod === 30 ? 'bg-primary text-white' : 'bg-surface dark:bg-[#252522] text-text-secondary'}`}
              >
                30d
              </button>
            </div>
          </div>

          <div className="h-280 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={lineChartData.slice(-chartPeriod)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFE9" />
                <XAxis dataKey="date" stroke="#9A9A9A" fontSize={11} />
                <YAxis stroke="#9A9A9A" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A2B4A', 
                    borderRadius: '4px', 
                    border: 'none', 
                    color: 'white',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono'
                  }} 
                />
                <Legend iconSize={8} iconType="square" fontSize={11} />
                <Line type="monotone" dataKey="Revenue" stroke="#E07B39" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#1A2B4A" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pie Distribution Chart */}
        <div className="lg:col-span-4 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-base font-bold text-primary dark:text-white">Stock Allocation</h4>
            <p className="text-[11px] text-text-secondary dark:text-gray-400">Total catalog broken down by shelf safety limits.</p>
          </div>

          <div className="h-180 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`]} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Catalog</span>
              <span className="font-mono text-base font-bold text-primary dark:text-white">{stats.totalProducts}</span>
            </div>
          </div>

          {/* Color Indicators */}
          <div className="grid grid-cols-3 gap-8 text-[10px] border-t border-customBorder dark:border-[#2d2d2a] pt-12">
            {pieChartData.map((entry, idx) => (
              <div key={entry.name} className="text-center space-y-4">
                <div className="flex items-center justify-center gap-6">
                  <span className="w-8 h-8 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="font-semibold text-text-secondary dark:text-gray-400">{entry.name}</span>
                </div>
                <p className="font-mono font-bold text-primary dark:text-white">{entry.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- RECENT ACTIVITY SECTION (2-COLUMN) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
        
        {/* Left: Recent Sales Table */}
        <div className="lg:col-span-7 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
          <div className="flex justify-between items-center">
            <h4 className="font-serif text-base font-bold text-primary dark:text-white">Recent Store Sales</h4>
            <button 
              onClick={() => navigate('/dashboard/sales')}
              className="text-[10px] text-accent hover:underline flex items-center gap-4 font-bold uppercase tracking-wider"
            >
              View Journal <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-customBorder dark:border-[#2d2d2a] text-text-secondary dark:text-gray-400 font-bold">
                  <th className="pb-8">INVOICE</th>
                  <th className="pb-8">CUSTOMER</th>
                  <th className="pb-8">DATE</th>
                  <th className="pb-8 text-right">NET TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-customBorder/50 dark:divide-[#2d2d2a]/50">
                {recentSales.map((sale) => (
                  <tr key={sale._id} className="table-row-accent">
                    <td className="py-12 pl-12 font-mono font-semibold text-primary dark:text-white">{sale.invoiceNumber}</td>
                    <td className="py-12 text-text-secondary dark:text-gray-300">{sale.customer.name}</td>
                    <td className="py-12 text-text-secondary dark:text-gray-400">{new Date(sale.createdAt).toLocaleDateString()}</td>
                    <td className="py-12 text-right font-mono font-semibold">${sale.netTotal.toFixed(2)}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-24 text-center text-text-muted">No sales registered today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Low Stock Alert Actions Panel */}
        <div className="lg:col-span-5 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
          <h4 className="font-serif text-base font-bold text-primary dark:text-white">Low Stock Warnings</h4>
          
          <div className="space-y-12 overflow-y-auto max-h-240 pr-4">
            {lowStockAlerts.map((prod) => (
              <div 
                key={prod._id} 
                className="flex items-center justify-between p-12 bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#2d2d2a] rounded-sm"
              >
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-text-primary dark:text-white truncate">{prod.name}</h5>
                  <p className="text-[10px] text-text-secondary dark:text-gray-400 font-mono mt-2">
                    SKU: {prod.sku} • Stock: <span className="text-danger font-bold">{prod.stockQty} {prod.unit}</span> (Min: {prod.reorderPoint})
                  </p>
                </div>
                <button
                  onClick={() => handleCreateQuickPO(prod._id)}
                  className="px-12 py-6 bg-accent hover:bg-accent/90 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm shadow-xs transition-all flex-shrink-0"
                >
                  Create PO
                </button>
              </div>
            ))}
            {lowStockAlerts.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-12">
                <CheckCircle size={28} className="text-success" />
                <p className="text-xs text-text-secondary">All catalog items are well above safety lines.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- TOP PRODUCTS & SUPPLIERS OUTSTANDINGS (2-COLUMN) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
        
        {/* Left: Top Selling Horizontal Bar */}
        <div className="lg:col-span-7 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
          <div>
            <h4 className="font-serif text-base font-bold text-primary dark:text-white">Top Best-Selling Items</h4>
            <p className="text-[11px] text-text-secondary dark:text-gray-400">Highest volume items sold in the current period.</p>
          </div>

          <div className="h-200 w-full text-xs">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted">No sales registered yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFE9" />
                  <XAxis type="number" stroke="#9A9A9A" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#9A9A9A" fontSize={10} width={90} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1A2B4A', 
                      borderRadius: '4px', 
                      border: 'none', 
                      color: 'white',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="unitsSold" fill="#E07B39" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Supplier Invoices List */}
        <div className="lg:col-span-5 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
          <h4 className="font-serif text-base font-bold text-primary dark:text-white">Wholesale Distributors</h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-customBorder dark:border-[#2d2d2a] text-text-secondary dark:text-gray-400 font-bold">
                  <th className="pb-8">COMPANY</th>
                  <th className="pb-8">TERMS</th>
                  <th className="pb-8 text-right">OUTSTANDING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-customBorder/50 dark:divide-[#2d2d2a]/50">
                {supplierActivity.map((supp) => (
                  <tr key={supp._id} className="hover:bg-surface/50 dark:hover:bg-[#252522]/50">
                    <td className="py-10 font-bold text-text-primary dark:text-white truncate max-w-[120px]">{supp.companyName}</td>
                    <td className="py-10 text-text-secondary dark:text-gray-400 font-mono text-[11px]">{supp.paymentTerms}</td>
                    <td className="py-10 text-right font-mono font-semibold text-warning">
                      ${supp.outstandingBalance ? supp.outstandingBalance.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

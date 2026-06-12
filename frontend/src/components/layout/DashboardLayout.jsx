import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, Package, FolderClosed, Truck, 
  ShoppingCart, FileText, Settings, LogOut, Menu, 
  Search, Bell, Moon, Sun, ChevronLeft, ArrowRight,
  TrendingDown, RefreshCw
} from 'lucide-react';
import { 
  logout, toggleSidebar, toggleMobileSidebar, 
  closeMobileSidebar, toggleDarkMode, initDarkMode 
} from '../../store';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user } = useSelector((state) => state.auth);
  const { sidebarCollapsed, mobileSidebarOpen, darkMode } = useSelector((state) => state.ui);
  
  const [lowStockCount, setLowStockCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellSwinging, setBellSwinging] = useState(false);
  
  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Initialize Dark Mode Class
  useEffect(() => {
    dispatch(initDarkMode());
  }, [dispatch]);

  // Fetch low stock products to show alert indicator
  const fetchAlerts = async () => {
    try {
      if (!user) return;
      const res = await api.get('/products/low-stock');
      if (res.data.success) {
        setLowStockCount(res.data.products.length);
        
        // Populate system notification messages
        const alertsList = res.data.products.map(p => ({
          id: p._id,
          title: 'Low Stock Alert',
          text: `${p.name} is running low (${p.stockQty} ${p.unit} remaining)`,
          type: 'warning',
          link: '/dashboard/products'
        }));
        
        setNotifications(alertsList);
        
        // Swing the bell if there are active warnings
        if (alertsList.length > 0) {
          setBellSwinging(true);
          setTimeout(() => setBellSwinging(false), 800);
        }
      }
    } catch (err) {
      console.error('Failed to retrieve stock alerts:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll alerts every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle Outside Clicks for Global Search and Notifications Dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce global query search (simulated debounced query across multiple indices)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        // Query products, suppliers, sales
        const [prodRes, suppRes, salesRes] = await Promise.all([
          api.get(`/products?search=${searchQuery}`),
          api.get('/suppliers'),
          api.get('/sales')
        ]);

        const products = prodRes.data.products || [];
        // Filter suppliers & sales locally for the query
        const suppliers = (suppRes.data.suppliers || []).filter(s => 
          s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const sales = (salesRes.data.sales || []).filter(s => 
          s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setSearchResults({
          products: products.slice(0, 3),
          suppliers: suppliers.slice(0, 3),
          sales: sales.slice(0, 3)
        });
      } catch (err) {
        console.error('Global search error:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(logout());
      toast.success('Successfully logged out.');
      navigate('/login');
    } catch (err) {
      // Force logout in frontend anyway
      dispatch(logout());
      navigate('/login');
    }
  };

  // Resolve active page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    if (path === '/dashboard/products') return 'Products Directory';
    if (path === '/dashboard/categories') return 'Categories Registry';
    if (path === '/dashboard/suppliers') return 'Suppliers Directory';
    if (path === '/dashboard/sales') return 'POS & Sales Journal';
    if (path === '/dashboard/purchases') return 'Purchase Logs';
    if (path === '/dashboard/returns') return 'Returns Journal';
    if (path === '/dashboard/reports') return 'Ledger & Analytics';
    if (path === '/dashboard/settings') return 'Preferences';
    return 'Dashboard';
  };

  // Nav menu definition
  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Products', path: '/dashboard/products', icon: <Package size={18} /> },
    { label: 'Categories', path: '/dashboard/categories', icon: <FolderClosed size={18} /> },
    { label: 'Suppliers', path: '/dashboard/suppliers', icon: <Truck size={18} /> },
    { label: 'Sales Records', path: '/dashboard/sales', icon: <ShoppingCart size={18} /> },
    { label: 'Purchases PO', path: '/dashboard/purchases', icon: <FileText size={18} /> },
    { label: 'Returns', path: '/dashboard/returns', icon: <RefreshCw size={18} /> },
    { label: 'Reports', path: '/dashboard/reports', icon: <TrendingDown size={18} /> },
    { label: 'Settings', path: '/dashboard/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-surface dark:bg-[#121210] flex text-text-primary dark:text-gray-200 transition-colors duration-200">
      
      {/* --- SIDEBAR CONTAINER --- */}
      {/* Desktop view */}
      <aside 
        className={`hidden md:flex flex-col bg-primary dark:bg-[#181816] text-white border-r border-primary-light/30 transition-all duration-300 fixed top-0 bottom-0 z-30 ${
          sidebarCollapsed ? 'w-64' : 'w-[260px]' // Collapsible: true = collapsed (64px icon only), false = expanded (260px)
        }`}
        style={{ width: sidebarCollapsed ? '64px' : '260px' }}
      >
        {/* Brand Header */}
        <div className="h-64 border-b border-primary-light/20 flex items-center justify-between px-16">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-8">
              <Package size={20} className="text-accent" />
              <span className="font-serif italic text-lg font-bold tracking-tight text-surface">
                Precision Ledger
              </span>
            </div>
          ) : (
            <Package size={20} className="text-accent mx-auto" />
          )}
          <button 
            onClick={() => dispatch(toggleSidebar())}
            className="hidden md:block text-primary-light hover:text-white p-4 rounded-sm hover:bg-primary-light/10 transition-colors"
          >
            <ChevronLeft size={16} className={`transform transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Store Title */}
        {!sidebarCollapsed && user && (
          <div className="px-16 py-12 bg-primary-light/10 border-b border-primary-light/10">
            <p className="text-xs text-text-muted dark:text-gray-400 font-semibold tracking-wider uppercase">Active Store</p>
            <p className="text-sm font-medium text-surface truncate">{user.shopName || 'Artisan Ledger Co.'}</p>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-8 py-16 space-y-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link-hover flex items-center gap-12 px-12 py-10 rounded-sm text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary-light/30 text-white active' 
                    : 'text-gray-300 hover:bg-primary-light/15 hover:text-white'
                }`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                
                {/* Low stock indicators */}
                {!sidebarCollapsed && item.label === 'Products' && lowStockCount > 0 && (
                  <span className="ml-auto bg-accent text-white font-mono text-[11px] font-bold px-6 py-2 rounded-pill badge-pulse">
                    {lowStockCount}
                  </span>
                )}
                {sidebarCollapsed && item.label === 'Products' && lowStockCount > 0 && (
                  <span className="absolute top-4 right-4 w-8 h-8 bg-accent rounded-full badge-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-12 border-t border-primary-light/20 bg-primary-light/5">
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-accent/20 border border-accent flex items-center justify-center font-serif text-sm font-bold text-accent uppercase">
              {user ? user.name.charAt(0) : 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-none">{user ? user.name : 'Administrator'}</p>
                <p className="text-[10px] text-gray-400 font-mono capitalize leading-none mt-4">{user ? user.role : 'admin'}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-danger p-4 rounded-sm hover:bg-primary-light/10 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Slide Drawer */}
      <div className={`md:hidden fixed inset-0 z-40 flex bg-primary/45 backdrop-blur-sm transition-opacity duration-300 ${
        mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <aside className={`w-[260px] bg-primary flex flex-col transition-transform duration-300 transform ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-64 border-b border-primary-light/25 flex items-center justify-between px-16 text-white">
            <div className="flex items-center gap-8">
              <Package size={20} className="text-accent" />
              <span className="font-serif italic text-lg font-bold tracking-tight">Precision Ledger</span>
            </div>
            <button 
              onClick={() => dispatch(closeMobileSidebar())}
              className="text-gray-300 hover:text-white p-4"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 px-8 py-16 space-y-4 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => dispatch(closeMobileSidebar())}
                  className={`flex items-center gap-12 px-12 py-10 rounded-sm text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary-light/30 text-white border-l-3 border-accent' 
                      : 'text-gray-300 hover:bg-primary-light/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.label === 'Products' && lowStockCount > 0 && (
                    <span className="ml-auto bg-accent text-white font-mono text-[11px] font-bold px-6 py-2 rounded-pill badge-pulse">
                      {lowStockCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-16 border-t border-primary-light/20 text-white flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center font-serif text-sm font-bold text-accent uppercase">
                {user ? user.name.charAt(0) : 'A'}
              </div>
              <div>
                <p className="text-xs font-semibold leading-none">{user ? user.name : 'Admin'}</p>
                <p className="text-[10px] text-gray-400 font-mono capitalize leading-none mt-4">{user ? user.role : 'admin'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-danger p-4">
              <LogOut size={18} />
            </button>
          </div>
        </aside>
        {/* Overlay closing */}
        <div className="flex-1" onClick={() => dispatch(closeMobileSidebar())} />
      </div>

      {/* --- MAIN PAGE WRAPPER --- */}
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ paddingLeft: sidebarCollapsed ? '0px' : '0px' }} // Adjusted below for dynamic margins
      >
        
        {/* --- TOP HEADER (Fixed) --- */}
        <header className="h-64 border-b border-customBorder dark:border-[#2d2d2a] bg-surface-card dark:bg-[#1c1c1a] flex items-center justify-between px-16 md:px-24 sticky top-0 z-20 transition-colors duration-200 md:ml-[260px]"
          style={{ marginLeft: sidebarCollapsed ? '64px' : '260px' }}>
          
          <div className="flex items-center gap-12">
            <button 
              onClick={() => dispatch(toggleMobileSidebar())}
              className="md:hidden text-text-secondary dark:text-gray-300 hover:text-text-primary p-4"
            >
              <Menu size={20} />
            </button>
            
            {/* Title / Breadcrumbs */}
            <div className="hidden sm:block">
              <h2 className="font-serif text-lg font-bold text-text-primary dark:text-white leading-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Global Categorized Search & Toolbar */}
          <div className="flex items-center gap-16 md:gap-24">
            
            {/* Global Search Bar */}
            <div className="relative" ref={searchRef}>
              <div className="flex items-center bg-surface dark:bg-[#252522] rounded-sm border border-customBorder dark:border-[#383834] px-12 py-6 w-160 md:w-240 transition-all focus-within:border-accent">
                <Search size={16} className="text-text-muted" />
                <input
                  type="text"
                  placeholder="Global search..."
                  className="bg-transparent border-none text-xs text-text-primary dark:text-white focus:outline-none ml-8 w-full placeholder:text-text-muted"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                />
              </div>

              {/* Categorized Dropdown Results */}
              {searchFocused && (searchQuery.trim().length >= 2) && (
                <div className="absolute right-0 mt-8 w-320 md:w-360 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-lg p-12 z-50 text-xs text-text-primary dark:text-gray-200">
                  {!searchResults ? (
                    <div className="py-16 text-center text-text-muted">Searching records...</div>
                  ) : (
                    <div className="space-y-12">
                      {/* Products segment */}
                      <div>
                        <p className="font-serif text-[11px] font-bold text-accent border-b border-customBorder dark:border-[#2d2d2a] pb-4 uppercase tracking-wider">Products</p>
                        {searchResults.products.length === 0 ? (
                          <p className="py-4 text-text-muted">No products found</p>
                        ) : (
                          searchResults.products.map(p => (
                            <Link 
                              key={p._id} 
                              to="/dashboard/products" 
                              onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                              className="block py-6 px-4 hover:bg-surface dark:hover:bg-[#252522] rounded-sm transition-colors"
                            >
                              <div className="flex justify-between font-medium">
                                <span className="truncate">{p.name}</span>
                                <span className="font-mono">${p.sellingPrice.toFixed(2)}</span>
                              </div>
                              <p className="text-[10px] text-text-secondary dark:text-gray-400 font-mono mt-2">SKU: {p.sku} • Stock: {p.stockQty}</p>
                            </Link>
                          ))
                        )}
                      </div>

                      {/* Suppliers segment */}
                      <div>
                        <p className="font-serif text-[11px] font-bold text-accent border-b border-customBorder dark:border-[#2d2d2a] pb-4 uppercase tracking-wider">Suppliers</p>
                        {searchResults.suppliers.length === 0 ? (
                          <p className="py-4 text-text-muted">No suppliers found</p>
                        ) : (
                          searchResults.suppliers.map(s => (
                            <Link 
                              key={s._id} 
                              to="/dashboard/suppliers"
                              onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                              className="block py-6 px-4 hover:bg-surface dark:hover:bg-[#252522] rounded-sm transition-colors"
                            >
                              <div className="font-medium truncate">{s.companyName}</div>
                              <p className="text-[10px] text-text-secondary dark:text-gray-400 mt-2">Contact: {s.contactPerson} • {s.city}</p>
                            </Link>
                          ))
                        )}
                      </div>

                      {/* Sales segment */}
                      <div>
                        <p className="font-serif text-[11px] font-bold text-accent border-b border-customBorder dark:border-[#2d2d2a] pb-4 uppercase tracking-wider">Sales Records</p>
                        {searchResults.sales.length === 0 ? (
                          <p className="py-4 text-text-muted">No transactions found</p>
                        ) : (
                          searchResults.sales.map(s => (
                            <Link 
                              key={s._id} 
                              to="/dashboard/sales"
                              onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                              className="block py-6 px-4 hover:bg-surface dark:hover:bg-[#252522] rounded-sm transition-colors"
                            >
                              <div className="flex justify-between font-medium">
                                <span>{s.invoiceNumber}</span>
                                <span className="font-mono">${s.netTotal.toFixed(2)}</span>
                              </div>
                              <p className="text-[10px] text-text-secondary dark:text-gray-400 mt-2">{s.customer.name} • {new Date(s.createdAt).toLocaleDateString()}</p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-text-secondary dark:text-gray-300 hover:text-text-primary p-4 rounded-sm hover:bg-surface dark:hover:bg-[#252522]"
              >
                <Bell size={18} className={bellSwinging ? 'bell-swing' : ''} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-8 h-8 bg-accent rounded-full badge-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-8 w-280 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-lg p-12 z-50 text-xs">
                  <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-6 mb-8">
                    <span className="font-bold text-text-primary dark:text-white">Active Alerts</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => setNotifications([])}
                        className="text-text-muted hover:text-text-primary"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-text-muted">All items are well-stocked.</div>
                  ) : (
                    <div className="max-h-200 overflow-y-auto space-y-6">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => { setShowNotifications(false); navigate(n.link); }}
                          className="p-8 hover:bg-surface dark:hover:bg-[#252522] rounded-sm cursor-pointer border-l-2 border-accent transition-colors"
                        >
                          <p className="font-semibold text-text-primary dark:text-white">{n.title}</p>
                          <p className="text-text-secondary dark:text-gray-400 mt-2 leading-snug">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => dispatch(toggleDarkMode())}
              className="text-text-secondary dark:text-gray-300 hover:text-text-primary p-4 rounded-sm hover:bg-surface dark:hover:bg-[#252522]"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* --- MAIN INNER CONTENT AREA --- */}
        <main 
          className="flex-1 p-16 md:p-24 md:ml-[260px] overflow-y-auto transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? '64px' : '260px' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

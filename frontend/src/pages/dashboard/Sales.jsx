import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, ShoppingCart, Trash2, Printer, 
  Send, DollarSign, X, Check, Eye, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Sales() {
  const [activeTab, setActiveTab] = useState('journal'); // 'journal' or 'pos'
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [storeTaxRate, setStoreTaxRate] = useState(8.25);
  const [storeCurrency, setStoreCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  // POS Checkout Cart state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState([]); // items: { product, qty, discount, unitPrice, name, maxStock }
  const [posDiscount, setPosDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [posNotes, setPosNotes] = useState('');

  // Invoice display popup
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Search product inside POS
  const [productQuery, setProductQuery] = useState('');
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Filter Sales Journal
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales', {
        params: { startDate, endDate }
      });
      if (res.data.success) {
        setSales(res.data.sales);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve sales records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 100 } });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStoreConfig = async () => {
    try {
      const res = await api.get('/settings/store');
      if (res.data.success) {
        setStoreTaxRate(res.data.shop.taxRate || 8.25);
        setStoreCurrency(res.data.shop.currency || 'USD');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'journal') {
      fetchSales();
    } else {
      fetchProducts();
      fetchStoreConfig();
    }
  }, [activeTab, startDate, endDate]);

  // Product Query Search within POS
  useEffect(() => {
    if (productQuery.trim().length === 0) {
      setProductSearchResults([]);
      return;
    }
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(productQuery.toLowerCase())
    );
    setProductSearchResults(filtered.slice(0, 5));
  }, [productQuery, products]);

  // POS Add to Cart
  const handleAddToCart = (product) => {
    if (product.stockQty <= 0) {
      toast.error(`'${product.name}' is currently out of stock.`);
      return;
    }

    const existing = cart.find(item => item.product === product._id);
    if (existing) {
      if (existing.qty >= product.stockQty) {
        toast.error(`Cannot add more. Only ${product.stockQty} items available in inventory.`);
        return;
      }
      setCart(cart.map(item => 
        item.product === product._id 
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product: product._id,
        name: product.name,
        qty: 1,
        discount: 0,
        unitPrice: product.sellingPrice,
        maxStock: product.stockQty
      }]);
    }
    setProductQuery('');
    setShowSearchDropdown(false);
  };

  const handleUpdateQty = (productId, newQty) => {
    const qtyVal = Number(newQty);
    const item = cart.find(i => i.product === productId);
    if (!item) return;

    if (qtyVal > item.maxStock) {
      toast.error(`Only ${item.maxStock} items available in inventory.`);
      return;
    }
    if (qtyVal <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCart(cart.map(i => i.product === productId ? { ...i, qty: qtyVal } : i));
  };

  const handleUpdateItemDiscount = (productId, val) => {
    const disc = Math.max(0, Number(val));
    setCart(cart.map(i => i.product === productId ? { ...i, discount: disc } : i));
  };

  const handleRemoveItem = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
  };

  // Live POS totals calculation
  const getSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
  };

  const getItemDiscountsTotal = () => {
    return cart.reduce((acc, item) => acc + Number(item.discount || 0), 0);
  };

  const getTaxAmount = () => {
    const sub = getSubtotal();
    const itemDiscounts = getItemDiscountsTotal();
    const finalDisc = Number(posDiscount || 0);
    const taxable = Math.max(0, sub - itemDiscounts - finalDisc);
    return Math.round((taxable * (storeTaxRate / 100)) * 100) / 100;
  };

  const getNetTotal = () => {
    const sub = getSubtotal();
    const itemDiscounts = getItemDiscountsTotal();
    const finalDisc = Number(posDiscount || 0);
    const tax = getTaxAmount();
    return Math.max(0, sub - itemDiscounts - finalDisc) + tax;
  };

  // POS Checkout Trigger
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error('Cart is empty.');
      return;
    }

    try {
      const itemsPayload = cart.map(item => ({
        product: item.product,
        productName: item.name,
        qty: item.qty,
        discount: Number(item.discount || 0)
      }));

      // Combine individual item discounts + total discount
      const totalDisc = Number(posDiscount || 0) + getItemDiscountsTotal();

      const res = await api.post('/sales', {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: itemsPayload,
        discount: totalDisc,
        paymentMethod,
        notes: posNotes
      });

      if (res.data.success) {
        toast.success(`Checkout complete! Invoice ${res.data.sale.invoiceNumber} generated.`);
        // Open Invoice Slips
        setInvoiceToPrint(res.data.sale);
        setShowInvoiceModal(true);

        // Reset Cart states
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setPosDiscount('');
        setPosNotes('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-24">
      
      {/* --- TABS --- */}
      <div className="flex border-b border-customBorder dark:border-[#2d2d2a] pb-4 gap-24">
        <button
          onClick={() => setActiveTab('journal')}
          className={`pb-12 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'journal' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary'
          }`}
        >
          Sales Journal
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`pb-12 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'pos' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary'
          }`}
        >
          POS Checkout Register
        </button>
      </div>

      {/* --- VIEW 1: SALES JOURNAL --- */}
      {activeTab === 'journal' && (
        <div className="space-y-20 animate-[fadeInUp_0.2s_ease-out]">
          {/* Filters */}
          <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 flex flex-wrap items-center gap-16 text-xs text-text-secondary dark:text-gray-300">
            <div className="flex items-center gap-8">
              <span>From:</span>
              <input 
                type="date" 
                className="bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#383834] rounded-sm px-8 py-4 focus:outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-8">
              <span>To:</span>
              <input 
                type="date" 
                className="bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#383834] rounded-sm px-8 py-4 focus:outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-accent hover:underline font-bold"
              >
                Clear Dates
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-customBorder dark:border-[#2d2d2a] bg-surface dark:bg-[#252522] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-12 px-16">Invoice</th>
                    <th className="py-12">Customer</th>
                    <th className="py-12">Date</th>
                    <th className="py-12">Method</th>
                    <th className="py-12 text-right">Discount</th>
                    <th className="py-12 text-right">Tax (GST)</th>
                    <th className="py-12 text-right">Net Total</th>
                    <th className="py-12 pr-16 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-customBorder/60 dark:divide-[#2d2d2a]/60">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-32 text-center text-text-muted">Populating sales data logs...</td>
                    </tr>
                  ) : sales.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-32 text-center text-text-muted">No transactions registered.</td>
                    </tr>
                  ) : (
                    sales.map(s => (
                      <tr key={s._id} className="table-row-accent">
                        <td className="py-12 px-16 font-mono font-semibold text-primary dark:text-white">{s.invoiceNumber}</td>
                        <td className="py-12 font-bold text-text-primary dark:text-gray-300">{s.customer.name}</td>
                        <td className="py-12 text-text-secondary dark:text-gray-400">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="py-12 text-text-secondary dark:text-gray-400">{s.paymentMethod}</td>
                        <td className="py-12 text-right font-mono text-text-secondary dark:text-gray-400">${s.discount.toFixed(2)}</td>
                        <td className="py-12 text-right font-mono text-text-secondary dark:text-gray-400">${s.tax.toFixed(2)}</td>
                        <td className="py-12 text-right font-mono font-bold text-text-primary dark:text-white">${s.netTotal.toFixed(2)}</td>
                        <td className="py-12 pr-16 text-right">
                          <button
                            onClick={() => { setInvoiceToPrint(s); setShowInvoiceModal(true); }}
                            className="p-6 text-text-secondary hover:text-accent rounded-sm hover:bg-surface dark:hover:bg-[#252522] transition-colors"
                            title="Print Invoice"
                          >
                            <Printer size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW 2: POINT OF SALE CHECKOUT --- */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start animate-[fadeInUp_0.2s_ease-out]">
          
          {/* Left: Cart items config (8 cols) */}
          <div className="lg:col-span-8 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
            
            {/* Search items bar */}
            <div className="relative">
              <div className="flex items-center bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#2d2d2a] rounded-sm px-12 py-8 focus-within:border-accent text-xs">
                <Search size={14} className="text-text-muted mr-8" />
                <input
                  type="text"
                  placeholder="Type product name or SKU..."
                  className="bg-transparent border-none focus:outline-none w-full placeholder:text-text-muted text-text-primary dark:text-white"
                  value={productQuery}
                  onChange={(e) => { setProductQuery(e.target.value); setShowSearchDropdown(true); }}
                  onFocus={() => setShowSearchDropdown(true)}
                />
              </div>

              {/* Search results dropdown overlay */}
              {showSearchDropdown && productSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-4 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-lg p-8 z-50 text-xs text-text-primary dark:text-gray-300">
                  {productSearchResults.map(p => (
                    <div 
                      key={p._id}
                      onClick={() => handleAddToCart(p)}
                      className="p-8 hover:bg-surface dark:hover:bg-[#252522] rounded-sm cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-serif font-bold text-primary dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-text-secondary dark:text-gray-400 font-mono mt-2">SKU: {p.sku} • Stock: {p.stockQty} {p.unit}</p>
                      </div>
                      <span className="font-mono font-bold text-accent">${p.sellingPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart checkout listing */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-customBorder dark:border-[#2d2d2a] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-8 w-240">Item</th>
                    <th className="pb-8 text-center w-80">Qty</th>
                    <th className="pb-8 text-right w-100">Unit Price</th>
                    <th className="pb-8 text-right w-100">Discount</th>
                    <th className="pb-8 text-right w-120">Total</th>
                    <th className="pb-8 text-right w-60"></th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-customBorder/60 dark:divide-[#2d2d2a]/60">
                  {cart.map((item) => {
                    const rowTotal = (item.unitPrice * item.qty) - (item.discount || 0);
                    return (
                      <tr key={item.product} className="align-middle">
                        {/* Name */}
                        <td className="py-12 font-serif text-sm font-bold text-primary dark:text-white truncate max-w-[200px]">
                          {item.name}
                        </td>

                        {/* Qty edit input */}
                        <td className="py-12 text-center">
                          <input
                            type="number"
                            min="1"
                            max={item.maxStock}
                            className="w-64 px-4 py-2 border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white rounded-sm text-center font-mono focus:outline-none"
                            value={item.qty}
                            onChange={(e) => handleUpdateQty(item.product, e.target.value)}
                          />
                        </td>

                        {/* Price */}
                        <td className="py-12 text-right font-mono text-text-secondary dark:text-gray-400">
                          ${item.unitPrice.toFixed(2)}
                        </td>

                        {/* Discount input */}
                        <td className="py-12 text-right">
                          <input
                            type="number"
                            min="0"
                            className="w-80 px-6 py-2 border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white rounded-sm text-right font-mono focus:outline-none"
                            placeholder="0.00"
                            value={item.discount || ''}
                            onChange={(e) => handleUpdateItemDiscount(item.product, e.target.value)}
                          />
                        </td>

                        {/* Net row total */}
                        <td className="py-12 text-right font-mono font-bold text-text-primary dark:text-white">
                          ${rowTotal.toFixed(2)}
                        </td>

                        {/* Delete icon */}
                        <td className="py-12 text-right">
                          <button
                            onClick={() => handleRemoveItem(item.product)}
                            className="text-text-muted hover:text-danger p-4"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-32 text-center text-text-muted">Add items from the search bar to record a checkout sale.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right: Cart summaries and customer configs (4 cols) */}
          <div className="lg:col-span-4 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16 text-xs text-text-secondary dark:text-gray-300">
            
            <h4 className="font-serif text-base font-bold text-primary dark:text-white border-b border-customBorder dark:border-[#2d2d2a] pb-8 mb-12">POS Invoice Summary</h4>

            <form onSubmit={handleCheckout} className="space-y-12">
              
              {/* Customer Name */}
              <div className="space-y-4">
                <label className="block font-bold">Customer Name</label>
                <input
                  type="text"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                  placeholder="Walking Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-4">
                <label className="block font-bold">Phone Connection</label>
                <input
                  type="text"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                  placeholder="+1-555-0100"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {/* Overall Discount */}
              <div className="space-y-4">
                <label className="block font-bold">Cart Discount ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none font-mono"
                  placeholder="0.00"
                  value={posDiscount}
                  onChange={(e) => setPosDiscount(e.target.value)}
                />
              </div>

              {/* Payment Method selection */}
              <div className="space-y-4">
                <label className="block font-bold">Payment Channel</label>
                <div className="grid grid-cols-3 gap-8">
                  {['Cash', 'Credit Card', 'Bank Transfer'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-8 text-[10px] font-bold border rounded-sm transition-colors focus:outline-none ${
                        paymentMethod === method
                          ? 'border-accent bg-accent/10 text-accent font-semibold'
                          : 'border-customBorder dark:border-[#383834] hover:bg-surface dark:hover:bg-[#252522]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* POS Notes */}
              <div className="space-y-4">
                <label className="block font-bold">Order Notes</label>
                <textarea
                  rows="2"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none resize-none"
                  placeholder="Additional order terms..."
                  value={posNotes}
                  onChange={(e) => setPosNotes(e.target.value)}
                />
              </div>

              {/* Running Totals */}
              <div className="divide-y divide-customBorder dark:divide-[#2d2d2a] bg-surface dark:bg-[#252522] p-12 rounded-sm space-y-4 border border-customBorder dark:border-[#2d2d2a]">
                <div className="flex justify-between py-4">
                  <span>Subtotal:</span>
                  <span className="font-mono">${getSubtotal().toFixed(2)}</span>
                </div>
                {getItemDiscountsTotal() > 0 && (
                  <div className="flex justify-between py-4 text-warning">
                    <span>Item Discounts:</span>
                    <span className="font-mono">-${getItemDiscountsTotal().toFixed(2)}</span>
                  </div>
                )}
                {posDiscount > 0 && (
                  <div className="flex justify-between py-4 text-warning">
                    <span>Overall Discount:</span>
                    <span className="font-mono">-${Number(posDiscount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-4">
                  <span>Sales Tax ({storeTaxRate}%):</span>
                  <span className="font-mono">${getTaxAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-6 font-serif text-sm font-bold text-primary dark:text-white pt-6">
                  <span>Grand Total:</span>
                  <span className="font-mono text-accent">${getNetTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout submit */}
              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full py-12 bg-accent hover:bg-accent/90 disabled:bg-accent/40 text-white font-bold tracking-wider uppercase rounded-sm shadow-xs transition-all flex items-center justify-center gap-8"
              >
                <ShoppingCart size={14} /> Checkout Order
              </button>
            </form>

          </div>

        </div>
      )}

      {/* --- A4 INVOICE PRINT MODAL --- */}
      {showInvoiceModal && invoiceToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 backdrop-blur-sm p-16 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-customBorder rounded-md shadow-lg p-24 md:p-32 flex flex-col justify-between modal-animate-open max-h-screen overflow-y-auto">
            
            {/* Modal actions (hidden during printing) */}
            <div className="flex justify-between items-center border-b border-customBorder pb-12 mb-16 no-print">
              <span className="font-serif text-sm font-bold text-primary">Invoice Preview slip</span>
              <div className="flex items-center gap-12">
                <button
                  onClick={handlePrint}
                  className="px-12 py-6 bg-primary hover:bg-primary-light text-white font-bold text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-6"
                >
                  <Printer size={12} /> Print Invoice
                </button>
                <button 
                  onClick={() => setShowInvoiceModal(false)} 
                  className="text-text-muted hover:text-text-primary p-4"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* A4 Printable Area */}
            <div className="print-area font-sans text-xs text-text-primary p-16 space-y-20 bg-white">
              
              {/* Slips Top header details */}
              <div className="flex justify-between items-start border-b border-customBorder pb-16">
                <div>
                  <h3 className="font-serif text-lg font-bold text-primary">Precision Ledger</h3>
                  <p className="text-[10px] text-text-secondary mt-2">Artisan Shop Owner Portal</p>
                  <p className="text-[10px] text-text-secondary">Boston, Massachusetts</p>
                </div>
                <div className="text-right">
                  <h4 className="font-mono text-base font-bold text-primary">{invoiceToPrint.invoiceNumber}</h4>
                  <p className="text-[10px] text-text-secondary mt-4">Date: {new Date(invoiceToPrint.createdAt).toLocaleString()}</p>
                  <p className="text-[10px] text-text-secondary">Method: {invoiceToPrint.paymentMethod}</p>
                </div>
              </div>

              {/* Customer details */}
              <div className="space-y-4">
                <p className="font-bold text-text-secondary uppercase text-[10px]">Bill To:</p>
                <p className="text-sm font-bold text-primary">{invoiceToPrint.customer.name}</p>
                {invoiceToPrint.customer.phone && (
                  <p className="text-[10px] text-text-secondary">Phone: {invoiceToPrint.customer.phone}</p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-customBorder text-text-secondary font-bold uppercase text-[9px] tracking-wider bg-surface">
                    <th className="py-8 px-8">Product Name</th>
                    <th className="py-8 text-center">Qty</th>
                    <th className="py-8 text-right">Price</th>
                    <th className="py-8 text-right">Discount</th>
                    <th className="py-8 text-right pr-8">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-customBorder/40">
                  {invoiceToPrint.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-8 px-8 font-serif font-bold text-primary">{item.productName}</td>
                      <td className="py-8 text-center font-mono">{item.qty}</td>
                      <td className="py-8 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-8 text-right font-mono text-text-secondary">-${item.discount.toFixed(2)}</td>
                      <td className="py-8 text-right font-mono pr-8 font-semibold">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Running Summaries */}
              <div className="flex justify-end pt-12">
                <div className="w-200 divide-y divide-customBorder/60 space-y-4 font-semibold text-text-secondary">
                  <div className="flex justify-between py-4">
                    <span>Subtotal:</span>
                    <span className="font-mono text-text-primary">${invoiceToPrint.subtotal.toFixed(2)}</span>
                  </div>
                  {invoiceToPrint.discount > 0 && (
                    <div className="flex justify-between py-4 text-warning">
                      <span>Discount:</span>
                      <span className="font-mono">-${invoiceToPrint.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-4">
                    <span>Sales Tax:</span>
                    <span className="font-mono text-text-primary">${invoiceToPrint.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-6 font-serif text-sm font-bold text-primary pt-6 border-t border-primary">
                    <span>Grand Total:</span>
                    <span className="font-mono text-accent">${invoiceToPrint.netTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer slip */}
              <div className="text-center pt-32 border-t border-customBorder text-[10px] text-text-muted space-y-4">
                <p className="font-serif italic text-primary">Thank you for your artisan procurement!</p>
                <p>Invoices audited by Precision Ledger Client Node.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CSS print utility overlay for printing invoices cleanly */}
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

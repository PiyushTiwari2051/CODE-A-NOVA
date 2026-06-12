import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, Search, FileText, Truck, Trash2, 
  CheckCircle, ArrowRight, Save, X, Calendar, Edit 
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Purchases() {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create PO form states
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poItems, setPoItems] = useState([]); // { product, name, qty, unitCost }
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [poNotes, setPoNotes] = useState('');

  // PO Product selection lookup inside create
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases');
      if (res.data.success) {
        setPurchaseOrders(res.data.purchases);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [suppRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products')
      ]);
      if (suppRes.data.success) setSuppliers(suppRes.data.suppliers);
      if (prodRes.data.success) setProducts(prodRes.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchLookups();
  }, [activeTab]);

  // Handle Quick PO redirect parameters from low stock warnings
  useEffect(() => {
    if (location.state?.quickProductId && products.length > 0) {
      const prod = products.find(p => String(p._id) === String(location.state.quickProductId));
      if (prod) {
        setActiveTab('create');
        setSelectedSupplier(prod.supplier);
        setPoItems([{
          product: prod._id,
          name: prod.name,
          qty: prod.reorderPoint * 2, // suggest twice the limit
          unitCost: prod.buyingPrice
        }]);
      }
    }
  }, [location.state, products]);

  // Typeahead query selection within Create PO
  useEffect(() => {
    if (productQuery.trim().length === 0) {
      setProductResults([]);
      return;
    }
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(productQuery.toLowerCase())
    );
    setProductResults(filtered.slice(0, 5));
  }, [productQuery, products]);

  const handleAddPoItem = (product) => {
    const existing = poItems.find(item => item.product === product._id);
    if (existing) {
      setPoItems(poItems.map(item => 
        item.product === product._id 
          ? { ...item, qty: item.qty + 10 } // increment by block sizing
          : item
      ));
    } else {
      setPoItems([...poItems, {
        product: product._id,
        name: product.name,
        qty: 10,
        unitCost: product.buyingPrice
      }]);
    }
    setProductQuery('');
    setShowDropdown(false);
  };

  const handleUpdateQty = (productId, qty) => {
    const qtyVal = Math.max(1, Number(qty));
    setPoItems(poItems.map(i => i.product === productId ? { ...i, qty: qtyVal } : i));
  };

  const handleUpdateCost = (productId, cost) => {
    const costVal = Math.max(0, Number(cost));
    setPoItems(poItems.map(i => i.product === productId ? { ...i, unitCost: costVal } : i));
  };

  const handleRemovePoItem = (productId) => {
    setPoItems(poItems.filter(item => item.product !== productId));
  };

  const getPoTotalValue = () => {
    return poItems.reduce((acc, item) => acc + (item.unitCost * item.qty), 0);
  };

  const handleSavePO = async (status) => {
    if (!selectedSupplier) {
      toast.error('Please select a supplier.');
      return;
    }
    if (poItems.length === 0) {
      toast.error('Add at least one item to procure.');
      return;
    }

    try {
      const payload = {
        supplierId: selectedSupplier,
        items: poItems,
        expectedDelivery,
        paymentTerms,
        status, // 'Draft' or 'Sent'
        notes: poNotes
      };

      const res = await api.post('/purchases', payload);
      if (res.data.success) {
        toast.success(`Purchase order ${res.data.purchaseOrder.poNumber} saved as ${status}.`);
        setActiveTab('list');
        // Reset states
        setSelectedSupplier('');
        setPoItems([]);
        setExpectedDelivery('');
        setPoNotes('');
      }
    } catch (err) {
      toast.error('Failed to create purchase order.');
    }
  };

  const handleReceivePO = async (poId) => {
    if (window.confirm('Mark this purchase order as received? This will automatically increment inventory levels.')) {
      try {
        const res = await api.patch(`/purchases/${poId}/receive`);
        if (res.data.success) {
          toast.success(`Cargo received. Stock limits incremented.`);
          fetchPurchases();
        }
      } catch (err) {
        toast.error('Failed to process PO receipt.');
      }
    }
  };

  const handleDeletePO = async (poId) => {
    if (window.confirm('Delete this draft purchase order?')) {
      try {
        const res = await api.delete(`/purchases/${poId}`);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchPurchases();
        }
      } catch (err) {
        toast.error('Failed to delete PO.');
      }
    }
  };

  return (
    <div className="space-y-24">
      
      {/* --- TABS --- */}
      <div className="flex border-b border-customBorder dark:border-[#2d2d2a] pb-4 gap-24">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-12 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'list' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary'
          }`}
        >
          Procurement Logs
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-12 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'create' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary'
          }`}
        >
          Draft Purchase Order
        </button>
      </div>

      {/* --- VIEW 1: PROCUREMENT PO LIST --- */}
      {activeTab === 'list' && (
        <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-customBorder dark:border-[#2d2d2a] bg-surface dark:bg-[#252522] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-12 px-16">PO Number</th>
                  <th className="py-12">Supplier</th>
                  <th className="py-12">Date Issued</th>
                  <th className="py-12">Expected Delivery</th>
                  <th className="py-12 text-right">Cargo Items</th>
                  <th className="py-12 text-right">Value</th>
                  <th className="py-12 text-center">Status</th>
                  <th className="py-12 pr-16 text-right">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-customBorder/60 dark:divide-[#2d2d2a]/60">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-32 text-center text-text-muted">Loading purchase files...</td>
                  </tr>
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-32 text-center text-text-muted">No purchase orders registered.</td>
                  </tr>
                ) : (
                  purchaseOrders.map(po => {
                    const suppName = suppliers.find(s => String(s._id) === String(po.supplier))?.companyName || 'Unknown Supplier';
                    return (
                      <tr key={po._id} className="table-row-accent">
                        <td className="py-12 px-16 font-mono font-semibold text-primary dark:text-white">{po.poNumber}</td>
                        <td className="py-12 font-bold text-text-primary dark:text-gray-300">{suppName}</td>
                        <td className="py-12 text-text-secondary dark:text-gray-400">{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td className="py-12 text-text-secondary dark:text-gray-400">{po.expectedDelivery || 'Not set'}</td>
                        <td className="py-12 text-right font-mono font-semibold text-text-secondary dark:text-gray-400">{po.items.length} items</td>
                        <td className="py-12 text-right font-mono font-bold text-text-primary dark:text-white">${po.totalValue.toFixed(2)}</td>
                        <td className="py-12 text-center">
                          <span className={`text-[9px] font-bold px-6 py-2 rounded-pill uppercase tracking-wider ${
                            po.status === 'Received' 
                              ? 'bg-success/10 text-success' 
                              : po.status === 'Sent' 
                                ? 'bg-info/10 text-info' 
                                : 'bg-warning/10 text-warning'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="py-12 pr-16 text-right space-x-8">
                          {po.status === 'Sent' && (
                            <button
                              onClick={() => handleReceivePO(po._id)}
                              className="px-10 py-4 bg-success hover:bg-success/90 text-white font-bold text-[9px] rounded-sm uppercase tracking-wider flex items-center gap-4 inline-flex"
                            >
                              <Truck size={10} /> Receive
                            </button>
                          )}
                          {po.status === 'Draft' && (
                            <button
                              onClick={() => handleDeletePO(po._id)}
                              className="p-6 text-text-secondary hover:text-danger rounded-sm hover:bg-surface dark:hover:bg-[#252522] transition-colors"
                              title="Delete Draft PO"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- VIEW 2: CREATE PURCHASE ORDER --- */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start animate-[fadeInUp_0.2s_ease-out] text-xs text-text-secondary dark:text-gray-300">
          
          {/* Left: items setup */}
          <div className="lg:col-span-8 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
            
            {/* Search typeahead */}
            <div className="relative">
              <label className="block font-bold mb-6 text-text-primary dark:text-white">Add Products to PO</label>
              <div className="flex items-center bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#2d2d2a] rounded-sm px-12 py-8 focus-within:border-accent">
                <Search size={14} className="text-text-muted mr-8" />
                <input
                  type="text"
                  placeholder="Type product name or SKU..."
                  className="bg-transparent border-none focus:outline-none w-full placeholder:text-text-muted text-text-primary dark:text-white"
                  value={productQuery}
                  onChange={(e) => { setProductQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                />
              </div>

              {/* Search dropdown list */}
              {showDropdown && productResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-4 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-lg p-8 z-50">
                  {productResults.map(p => (
                    <div 
                      key={p._id}
                      onClick={() => handleAddPoItem(p)}
                      className="p-8 hover:bg-surface dark:hover:bg-[#252522] rounded-sm cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <p className="font-serif font-bold text-primary dark:text-white">{p.name}</p>
                        <p className="text-[10px] text-text-secondary dark:text-gray-400 font-mono mt-2">SKU: {p.sku} • Cost: ${p.buyingPrice.toFixed(2)}</p>
                      </div>
                      <Plus size={14} className="text-accent" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PO items list */}
            <div className="overflow-x-auto pt-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-customBorder dark:border-[#2d2d2a] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-8 w-240">Item</th>
                    <th className="pb-8 text-center w-80">Qty</th>
                    <th className="pb-8 text-right w-100">Unit Cost</th>
                    <th className="pb-8 text-right w-120">Total</th>
                    <th className="pb-8 text-right w-60"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-customBorder/60 dark:divide-[#2d2d2a]/60">
                  {poItems.map((item) => {
                    const rowTotal = item.unitCost * item.qty;
                    return (
                      <tr key={item.product} className="align-middle">
                        <td className="py-12 font-serif text-sm font-bold text-primary dark:text-white truncate max-w-[200px]">{item.name}</td>
                        <td className="py-12 text-center">
                          <input
                            type="number"
                            min="1"
                            className="w-64 px-4 py-2 border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white rounded-sm text-center font-mono focus:outline-none"
                            value={item.qty}
                            onChange={(e) => handleUpdateQty(item.product, e.target.value)}
                          />
                        </td>
                        <td className="py-12 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-80 px-6 py-2 border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white rounded-sm text-right font-mono focus:outline-none"
                            value={item.unitCost}
                            onChange={(e) => handleUpdateCost(item.product, e.target.value)}
                          />
                        </td>
                        <td className="py-12 text-right font-mono font-bold text-text-primary dark:text-white">
                          ${rowTotal.toFixed(2)}
                        </td>
                        <td className="py-12 text-right">
                          <button
                            onClick={() => handleRemovePoItem(item.product)}
                            className="text-text-muted hover:text-danger p-4"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {poItems.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-32 text-center text-text-muted">Search and select items to build purchase draft list.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right: summaries config (4 cols) */}
          <div className="lg:col-span-4 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
            <h4 className="font-serif text-base font-bold text-primary dark:text-white border-b border-customBorder dark:border-[#2d2d2a] pb-8 mb-12">PO Configuration</h4>

            <div className="space-y-12">
              {/* Supplier Selection */}
              <div className="space-y-4">
                <label className="block font-bold">Select Supplier *</label>
                <select
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                  value={selectedSupplier}
                  onChange={(e) => {
                    setSelectedSupplier(e.target.value);
                    // Autofill supplier payment terms if present
                    const supp = suppliers.find(s => String(s._id) === String(e.target.value));
                    if (supp) setPaymentTerms(supp.paymentTerms || 'Net 30');
                  }}
                >
                  <option value="">Choose Supplier</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.companyName}</option>
                  ))}
                </select>
              </div>

              {/* Expected Delivery */}
              <div className="space-y-4">
                <label className="block font-bold">Expected Delivery Date</label>
                <input
                  type="date"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </div>

              {/* Payment Terms */}
              <div className="space-y-4">
                <label className="block font-bold">Payment Terms</label>
                <select
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                >
                  <option>Net 7</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Cash on Delivery</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <label className="block font-bold">PO Notes</label>
                <textarea
                  rows="2"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none resize-none"
                  placeholder="Procurement guidelines..."
                  value={poNotes}
                  onChange={(e) => setPosNotes(e.target.value)}
                />
              </div>

              {/* PO Total Value */}
              <div className="bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#2d2d2a] p-16 rounded-sm text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Total PO Value</span>
                <p className="font-serif text-base font-bold text-accent mt-4 font-mono">${getPoTotalValue().toFixed(2)}</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-12 pt-8">
                <button
                  onClick={() => handleSavePO('Draft')}
                  className="py-10 border border-customBorder hover:bg-surface rounded-sm font-bold uppercase tracking-wider text-[10px]"
                >
                  Draft PO
                </button>
                <button
                  onClick={() => handleSavePO('Sent')}
                  className="py-10 bg-accent hover:bg-accent/90 text-white font-bold rounded-sm uppercase tracking-wider text-[10px]"
                >
                  Mark as Sent
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

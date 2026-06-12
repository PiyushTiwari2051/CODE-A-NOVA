import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, ArrowRight, Trash2, CheckCircle2, XCircle, X, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Returns() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [returnType, setReturnType] = useState('sale_return'); // 'sale_return' or 'purchase_return'
  const [referenceQuery, setReferenceQuery] = useState('');
  const [referenceResults, setReferenceResults] = useState([]);
  const [selectedReference, setSelectedReference] = useState(null); // original transaction

  const [returnItems, setReturnItems] = useState([]); // { product, name, qty, reason }
  const [returnNotes, setReturnNotes] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns');
      if (res.data.success) {
        setReturns(res.data.returns);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load returns records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  // Search original invoice/PO references
  useEffect(() => {
    if (referenceQuery.trim().length === 0) {
      setReferenceResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        if (returnType === 'sale_return') {
          // search sales
          const res = await api.get('/sales');
          const filtered = res.data.sales.filter(s => 
            s.invoiceNumber.toLowerCase().includes(referenceQuery.toLowerCase())
          );
          setReferenceResults(filtered.slice(0, 5));
        } else {
          // search POs
          const res = await api.get('/purchases');
          const filtered = res.data.purchases.filter(p => 
            p.poNumber.toLowerCase().includes(referenceQuery.toLowerCase())
          );
          setReferenceResults(filtered.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(delaySearch);
  }, [referenceQuery, returnType]);

  const handleSelectReference = (tx) => {
    setSelectedReference(tx);
    // Auto populate items from original transaction
    const items = tx.items.map(item => ({
      product: item.product,
      name: item.productName,
      qty: 1, // default return qty
      maxQty: item.qty, // original purchase qty
      reason: 'Damaged' // Damaged, Wrong Item, Expired, Customer Changed Mind
    }));
    setReturnItems(items);
    setReferenceQuery('');
    setReferenceResults([]);
  };

  const handleUpdateItemQty = (productId, val) => {
    const qty = Math.max(1, Number(val));
    const targetItem = returnItems.find(i => i.product === productId);
    if (!targetItem) return;

    if (qty > targetItem.maxQty) {
      toast.error(`Return quantity cannot exceed original transaction amount of ${targetItem.maxQty}.`);
      return;
    }
    setReturnItems(returnItems.map(i => i.product === productId ? { ...i, qty } : i));
  };

  const handleUpdateItemReason = (productId, reason) => {
    setReturnItems(returnItems.map(i => i.product === productId ? { ...i, reason } : i));
  };

  const handleRemoveItem = (productId) => {
    setReturnItems(returnItems.filter(i => i.product !== productId));
  };

  const handleSaveReturn = async (e) => {
    e.preventDefault();
    if (!selectedReference) {
      toast.error('Please select an invoice or PO reference.');
      return;
    }
    if (returnItems.length === 0) {
      toast.error('No items to return.');
      return;
    }

    try {
      const payload = {
        type: returnType,
        referenceId: selectedReference._id,
        items: returnItems.map(i => ({
          product: i.product,
          qty: i.qty,
          reason: i.reason
        })),
        notes: returnNotes
      };

      const res = await api.post('/returns', payload);
      if (res.data.success) {
        toast.success(`Return request ${res.data.returnRecord.returnNumber} registered successfully.`);
        setActiveTab('list');
        // Reset states
        setSelectedReference(null);
        setReturnItems([]);
        setReturnNotes('');
      }
    } catch (err) {
      toast.error('Failed to submit return request.');
    }
  };

  const handleProcessStatus = async (returnId, status) => {
    if (window.confirm(`Mark this return as ${status}? This will adjust product inventory totals accordingly.`)) {
      try {
        const res = await api.patch(`/returns/${returnId}/status`, { status });
        if (res.data.success) {
          toast.success(`Return status updated to ${status}. Stock limits synchronized.`);
          fetchReturns();
        }
      } catch (err) {
        toast.error('Failed to process return status.');
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
          Returns Registry
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-12 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'create' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary'
          }`}
        >
          Log Return Slips
        </button>
      </div>

      {/* --- VIEW 1: RETURNS LIST --- */}
      {activeTab === 'list' && (
        <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-customBorder dark:border-[#2d2d2a] bg-surface dark:bg-[#252522] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-12 px-16">Return ID</th>
                  <th className="py-12">Type</th>
                  <th className="py-12">Date Logged</th>
                  <th className="py-12 text-right">Items Returned</th>
                  <th className="py-12 text-center">Status</th>
                  <th className="py-12 pr-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-customBorder/60 dark:divide-[#2d2d2a]/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-32 text-center text-text-muted">Loading returns registry...</td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-32 text-center text-text-muted">No returns logged.</td>
                  </tr>
                ) : (
                  returns.map(ret => (
                    <tr key={ret._id} className="table-row-accent">
                      <td className="py-12 px-16 font-mono font-semibold text-primary dark:text-white">{ret.returnNumber}</td>
                      <td className="py-12 text-text-secondary dark:text-gray-300">
                        <span className={`text-[9px] font-bold px-6 py-2 rounded-sm font-mono uppercase ${
                          ret.type === 'sale_return' ? 'bg-primary/10 text-primary dark:text-gray-300' : 'bg-warning/10 text-warning'
                        }`}>
                          {ret.type === 'sale_return' ? 'Customer Sale' : 'Supplier Purchase'}
                        </span>
                      </td>
                      <td className="py-12 text-text-secondary dark:text-gray-400">{new Date(ret.createdAt).toLocaleString()}</td>
                      <td className="py-12 text-right font-mono font-semibold text-text-secondary dark:text-gray-400">{ret.items.length} lines</td>
                      <td className="py-12 text-center">
                        <span className={`text-[9px] font-bold px-6 py-2 rounded-pill uppercase tracking-wider ${
                          ret.status === 'Approved' 
                            ? 'bg-success/10 text-success' 
                            : ret.status === 'Pending' 
                              ? 'bg-info/10 text-info' 
                              : 'bg-danger/10 text-danger'
                        }`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="py-12 pr-16 text-right space-x-8">
                        {ret.status === 'Pending' && (
                          <div className="inline-flex gap-8">
                            <button
                              onClick={() => handleProcessStatus(ret._id, 'Approved')}
                              className="p-6 text-success hover:bg-success/5 rounded-sm"
                              title="Approve & Sync Stock"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => handleProcessStatus(ret._id, 'Rejected')}
                              className="p-6 text-danger hover:bg-danger/5 rounded-sm"
                              title="Reject request"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- VIEW 2: LOG RETURN SLIP --- */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start animate-[fadeInUp_0.2s_ease-out] text-xs text-text-secondary dark:text-gray-300">
          
          {/* Left panel: Returned items details (8 cols) */}
          <div className="lg:col-span-8 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
            
            {/* Search Reference */}
            <div className="space-y-4">
              <label className="block font-bold text-text-primary dark:text-white">
                Search Original {returnType === 'sale_return' ? 'Invoice Number' : 'PO Number'}
              </label>
              
              <div className="relative">
                <div className="flex items-center bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#2d2d2a] rounded-sm px-12 py-8 focus-within:border-accent">
                  <Search size={14} className="text-text-muted mr-8" />
                  <input
                    type="text"
                    placeholder={returnType === 'sale_return' ? "Type INV-..." : "Type PO-..."}
                    className="bg-transparent border-none focus:outline-none w-full placeholder:text-text-muted text-text-primary dark:text-white"
                    value={referenceQuery}
                    onChange={(e) => setReferenceQuery(e.target.value)}
                  />
                </div>

                {/* Dropdown Reference List */}
                {referenceResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-4 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-lg p-8 z-50">
                    {referenceResults.map(tx => (
                      <div 
                        key={tx._id}
                        onClick={() => handleSelectReference(tx)}
                        className="p-8 hover:bg-surface dark:hover:bg-[#252522] rounded-sm cursor-pointer flex justify-between items-center"
                      >
                        <p className="font-mono font-bold text-primary dark:text-white">
                          {returnType === 'sale_return' ? tx.invoiceNumber : tx.poNumber}
                        </p>
                        <span className="text-[10px] text-text-muted">
                          {new Date(tx.createdAt).toLocaleDateString()} • ${tx.netTotal || tx.totalValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* List items returned */}
            <div className="overflow-x-auto pt-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-customBorder dark:border-[#2d2d2a] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-8">Product Name</th>
                    <th className="pb-8 text-center w-80">Qty</th>
                    <th className="pb-8 w-160">Reason</th>
                    <th className="pb-8 text-right w-60"></th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-customBorder/60 dark:divide-[#2d2d2a]/60">
                  {returnItems.map(item => (
                    <tr key={item.product} className="align-middle">
                      <td className="py-12 font-serif text-sm font-bold text-primary dark:text-white truncate max-w-[200px]">{item.name}</td>
                      <td className="py-12 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.maxQty}
                          className="w-64 px-4 py-2 border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white rounded-sm text-center font-mono focus:outline-none"
                          value={item.qty}
                          onChange={(e) => handleUpdateItemQty(item.product, e.target.value)}
                        />
                        <p className="text-[9px] text-text-muted mt-2 font-mono">Max: {item.maxQty}</p>
                      </td>
                      <td className="py-12">
                        <select
                          className="bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#383834] rounded-sm px-8 py-4 w-full"
                          value={item.reason}
                          onChange={(e) => handleUpdateItemReason(item.product, e.target.value)}
                        >
                          <option>Damaged</option>
                          <option>Wrong Item</option>
                          <option>Expired</option>
                          <option>Customer Changed Mind</option>
                        </select>
                      </td>
                      <td className="py-12 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.product)}
                          className="text-text-muted hover:text-danger p-4"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {returnItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-32 text-center text-text-muted">Select an invoice/PO reference above to load returnable items.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right panel: general configs (4 cols) */}
          <div className="lg:col-span-4 bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
            <h4 className="font-serif text-base font-bold text-primary dark:text-white border-b border-customBorder dark:border-[#2d2d2a] pb-8 mb-12">Return Configuration</h4>

            <form onSubmit={handleSaveReturn} className="space-y-12">
              
              {/* Return Type Toggle */}
              <div className="space-y-4">
                <label className="block font-bold">Return Target Type</label>
                <div className="grid grid-cols-2 gap-8">
                  <button
                    type="button"
                    onClick={() => { setReturnType('sale_return'); setSelectedReference(null); setReturnItems([]); }}
                    className={`py-8 text-[10px] font-bold border rounded-sm transition-colors focus:outline-none ${
                      returnType === 'sale_return'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-customBorder dark:border-[#383834] hover:bg-surface dark:hover:bg-[#252522]'
                    }`}
                  >
                    Customer Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReturnType('purchase_return'); setSelectedReference(null); setReturnItems([]); }}
                    className={`py-8 text-[10px] font-bold border rounded-sm transition-colors focus:outline-none ${
                      returnType === 'purchase_return'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-customBorder dark:border-[#383834] hover:bg-surface dark:hover:bg-[#252522]'
                    }`}
                  >
                    Supplier PO
                  </button>
                </div>
              </div>

              {/* Selected Reference details */}
              {selectedReference && (
                <div className="p-12 bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#2d2d2a] rounded-sm space-y-4">
                  <span className="text-[10px] text-text-muted uppercase">Selected Reference:</span>
                  <p className="font-mono font-bold text-primary dark:text-white">
                    {returnType === 'sale_return' ? selectedReference.invoiceNumber : selectedReference.poNumber}
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    Logged: {new Date(selectedReference.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-4">
                <label className="block font-bold">Return Notes</label>
                <textarea
                  rows="3"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none resize-none"
                  placeholder="Reasoning, damage reports..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                />
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={!selectedReference || returnItems.length === 0}
                className="w-full py-12 bg-accent hover:bg-accent/90 disabled:bg-accent/40 text-white font-bold tracking-wider uppercase rounded-sm shadow-xs transition-all flex items-center justify-center gap-8"
              >
                Log Return Document
              </button>

            </form>
          </div>

        </div>
      )}

    </div>
  );
}

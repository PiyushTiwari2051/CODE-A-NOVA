import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, X, Phone, Mail, 
  MapPin, Clock, Save, FileText, FileSpreadsheet, Check
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail drawer state
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierPOs, setSupplierPOs] = useState([]);

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    taxId: '',
    paymentTerms: 'Net 30',
    notes: '',
    isActive: true
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.suppliers);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load suppliers directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      city: '',
      address: '',
      taxId: '',
      paymentTerms: 'Net 30',
      notes: '',
      isActive: true
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (supp, e) => {
    if (e) e.stopPropagation();
    setEditMode(true);
    setFormData({
      _id: supp._id,
      companyName: supp.companyName,
      contactPerson: supp.contactPerson,
      email: supp.email,
      phone: supp.phone,
      city: supp.city,
      address: supp.address,
      taxId: supp.taxId || '',
      paymentTerms: supp.paymentTerms,
      notes: supp.notes,
      isActive: supp.isActive
    });
    setFormOpen(true);
    setSelectedSupplier(null); // Close detail panel
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error('Supplier company name is required.');
      return;
    }

    try {
      let res;
      if (editMode) {
        res = await api.put(`/suppliers/${formData._id}`, formData);
      } else {
        res = await api.post('/suppliers', formData);
      }

      if (res.data.success) {
        toast.success(`Supplier profile successfully ${editMode ? 'updated' : 'created'}`);
        setFormOpen(false);
        fetchSuppliers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier details.');
    }
  };

  const handleDeleteSupplier = async (supp, e) => {
    if (e) e.stopPropagation();
    if (supp.totalPurchases > 0) {
      toast.error('Cannot delete supplier. There are active Purchase Orders logged for this vendor.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove '${supp.companyName}'?`)) {
      try {
        const res = await api.delete(`/suppliers/${supp._id}`);
        if (res.data.success) {
          toast.success(res.data.message);
          setSelectedSupplier(null);
          fetchSuppliers();
        }
      } catch (err) {
        toast.error('Failed to delete supplier.');
      }
    }
  };

  const handleRowClick = async (supp) => {
    setSelectedSupplier(supp);
    try {
      const res = await api.get(`/suppliers/${supp._id}`);
      if (res.data.success) {
        setSupplierPOs(res.data.purchaseOrders);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not fetch supplier purchase order history.');
    }
  };

  return (
    <div className="space-y-24">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-16">
        <div>
          <h3 className="font-serif text-xl font-bold text-primary dark:text-white leading-tight">Supplier Directory</h3>
          <p className="text-xs text-text-secondary dark:text-gray-400">Total active wholesale distributors: {suppliers.length} vendors</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-16 py-8 text-xs font-bold bg-accent hover:bg-accent/90 text-white rounded-sm transition-all flex items-center gap-8 uppercase tracking-wider"
        >
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      {/* --- SUPPLIERS TABLE --- */}
      <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-customBorder dark:border-[#2d2d2a] bg-surface dark:bg-[#252522] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-12 px-16">Company</th>
                <th className="py-12">Contact Person</th>
                <th className="py-12">Phone</th>
                <th className="py-12">Email</th>
                <th className="py-12 font-mono">Payment Terms</th>
                <th className="py-12 text-right">Total Purchases</th>
                <th className="py-12 text-right">Outstanding Balance</th>
                <th className="py-12 text-center">Status</th>
                <th className="py-12 pr-16 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-customBorder/60 dark:divide-[#2d2d2a]/60">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-32 text-center text-text-muted">Populating distributor records...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-32 text-center text-text-muted">No suppliers registered.</td>
                </tr>
              ) : (
                suppliers.map((supp) => (
                  <tr 
                    key={supp._id}
                    onClick={() => handleRowClick(supp)}
                    className="table-row-accent cursor-pointer"
                  >
                    <td className="py-12 px-16 font-serif text-sm font-bold text-primary dark:text-white">
                      {supp.companyName}
                    </td>
                    <td className="py-12 text-text-secondary dark:text-gray-300">{supp.contactPerson || 'N/A'}</td>
                    <td className="py-12 text-text-secondary dark:text-gray-400 font-mono">{supp.phone || 'N/A'}</td>
                    <td className="py-12 text-text-secondary dark:text-gray-400">{supp.email || 'N/A'}</td>
                    <td className="py-12 text-text-secondary dark:text-gray-400 font-mono">{supp.paymentTerms}</td>
                    <td className="py-12 text-right font-mono font-semibold text-text-secondary dark:text-gray-400">
                      ${supp.totalPurchases ? supp.totalPurchases.toFixed(2) : '0.00'}
                    </td>
                    <td className="py-12 text-right font-mono font-bold text-warning">
                      ${supp.outstandingBalance ? supp.outstandingBalance.toFixed(2) : '0.00'}
                    </td>
                    <td className="py-12 text-center">
                      <span className={`text-[9px] font-bold px-6 py-2 rounded-pill uppercase tracking-wider ${
                        supp.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                        {supp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-12 pr-16 text-right space-x-8">
                      <button
                        onClick={(e) => handleOpenEdit(supp, e)}
                        className="p-6 text-text-secondary hover:text-accent rounded-sm hover:bg-surface dark:hover:bg-[#252522] transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSupplier(supp, e)}
                        className="p-6 text-text-secondary hover:text-danger rounded-sm hover:bg-surface dark:hover:bg-[#252522] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT SUPPLIER FORM MODAL --- */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 backdrop-blur-sm p-16">
          <div className="w-full max-w-md bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-lg p-24 md:p-32 modal-animate-open">
            
            <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-12 mb-16">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">
                {editMode ? 'Modify Supplier Profile' : 'Register Wholesale Supplier'}
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-text-muted hover:text-text-primary p-4">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-12 text-xs">
              
              {/* Company Name */}
              <div className="space-y-4">
                <label className="block font-bold text-text-secondary dark:text-gray-300">Company Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                  placeholder="Vermont Artisan Distributors"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>

              {/* Contact Person & Tax ID Row */}
              <div className="grid grid-cols-2 gap-16">
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Contact Person</label>
                  <input
                    type="text"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    placeholder="Sarah Jenkins"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Tax Registration ID</label>
                  <input
                    type="text"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none font-mono"
                    placeholder="TX-904-88A"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-16">
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Phone</label>
                  <input
                    type="text"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none font-mono"
                    placeholder="+1-802-555-0143"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    placeholder="sarah@vermont.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* City & Address */}
              <div className="grid grid-cols-3 gap-16">
                <div className="space-y-4 col-span-1">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">City</label>
                  <input
                    type="text"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    placeholder="Burlington"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                
                <div className="space-y-4 col-span-2">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Address</label>
                  <input
                    type="text"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    placeholder="120 Pine Street"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment terms & Status */}
              <div className="grid grid-cols-2 gap-16">
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Payment Terms</label>
                  <select
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  >
                    <option>Net 7</option>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Cash on Delivery</option>
                  </select>
                </div>

                <div className="space-y-4 flex items-center justify-center pt-12">
                  <label className="flex items-center gap-8 cursor-pointer text-text-secondary dark:text-gray-300 font-bold">
                    <input
                      type="checkbox"
                      className="rounded-sm border-customBorder text-accent focus:ring-accent"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Active Vendor</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <label className="block font-bold text-text-secondary dark:text-gray-300">Operational Notes</label>
                <textarea
                  rows="2"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none resize-none"
                  placeholder="Additional logistics notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-12 pt-16 border-t border-customBorder dark:border-[#2d2d2a] mt-16">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-16 py-8 border border-customBorder rounded-sm text-text-secondary hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-16 py-8 bg-accent hover:bg-accent/90 text-white rounded-sm font-bold flex items-center gap-6"
                >
                  <Save size={12} /> Save Vendor
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- DETAIL PANEL DRAWER --- */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/45 backdrop-blur-sm p-16">
          <div className="w-full max-w-lg bg-surface-card dark:bg-[#1c1c1a] border-l border-customBorder dark:border-[#2d2d2a] shadow-lg p-24 md:p-32 overflow-y-auto flex flex-col justify-between modal-animate-open">
            
            <div className="space-y-24">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-12">
                <h3 className="font-serif text-base font-bold text-primary dark:text-white">Supplier Profile</h3>
                <button onClick={() => setSelectedSupplier(null)} className="text-text-muted hover:text-text-primary p-4">
                  <X size={20} />
                </button>
              </div>

              {/* Specs */}
              <div className="space-y-16 text-xs text-text-secondary dark:text-gray-300">
                <h4 className="font-serif text-lg font-bold text-primary dark:text-white">{selectedSupplier.companyName}</h4>
                
                {/* Contact info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#2d2d2a] p-16 rounded-sm">
                  <div className="flex items-center gap-8">
                    <Phone size={14} className="text-accent" />
                    <span>{selectedSupplier.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <Mail size={14} className="text-accent" />
                    <span className="truncate">{selectedSupplier.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-8 col-span-2">
                    <MapPin size={14} className="text-accent" />
                    <span className="truncate">{selectedSupplier.address}, {selectedSupplier.city}</span>
                  </div>
                </div>

                {/* Logistics PO history */}
                <div className="space-y-8">
                  <h5 className="font-serif font-bold text-primary dark:text-white border-b border-customBorder dark:border-[#2d2d2a] pb-4">
                    Purchase Order History ({supplierPOs.length} logs)
                  </h5>
                  
                  <div className="max-h-200 overflow-y-auto border border-customBorder rounded-sm bg-surface-card divide-y divide-customBorder">
                    {supplierPOs.map(po => (
                      <div key={po._id} className="p-10 flex justify-between items-center hover:bg-surface/50">
                        <div className="space-y-4">
                          <p className="font-mono font-bold text-primary dark:text-white">{po.poNumber}</p>
                          <p className="text-[10px] text-text-muted">{new Date(po.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right space-y-4">
                          <p className="font-mono font-bold text-text-primary dark:text-white">${po.totalValue.toFixed(2)}</p>
                          <span className={`text-[9px] font-bold px-6 py-2 rounded-pill uppercase tracking-wider ${
                            po.status === 'Received' 
                              ? 'bg-success/10 text-success' 
                              : po.status === 'Sent' 
                                ? 'bg-info/10 text-info' 
                                : 'bg-warning/10 text-warning'
                          }`}>
                            {po.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {supplierPOs.length === 0 && (
                      <div className="py-24 text-center text-text-muted">No historical purchases found.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-12 pt-24 border-t border-customBorder mt-24">
              <button
                onClick={(e) => handleDeleteSupplier(selectedSupplier, e)}
                className="w-1/2 py-10 font-bold border border-danger text-danger hover:bg-danger/5 rounded-sm transition-colors uppercase tracking-wider"
              >
                Delete Vendor
              </button>
              <button
                onClick={(e) => handleOpenEdit(selectedSupplier, e)}
                className="w-1/2 py-10 font-bold bg-accent hover:bg-accent/90 text-white rounded-sm transition-all uppercase tracking-wider"
              >
                Edit Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

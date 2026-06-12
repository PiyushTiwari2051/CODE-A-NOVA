import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileDown, Search, Filter, Edit, Trash2, 
  ChevronRight, ArrowUpDown, X, HelpCircle, 
  Check, ArrowRight, ShieldAlert, Image, Upload
} from 'lucide-react';
import api from '../../api/axios';
import { ConfirmModal } from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function Products() {
  const location = useLocation();

  // Primary data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort, Pagination states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState(location.state?.filterStock || '');
  const [sortField, setSortField] = useState('Recently Added');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Detail panel drawer state
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Modals / forms states
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    sku: '',
    description: '',
    category: '',
    supplier: '',
    buyingPrice: 0,
    sellingPrice: 0,
    stockQty: 0,
    reorderPoint: 5,
    unit: 'pcs',
    image: '',
    tags: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Deletion Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Bulk select states
  const [selectedRows, setSelectedRows] = useState([]);

  // Fetch initial lookups and product list
  const fetchLookups = async () => {
    try {
      const [catRes, suppRes] = await Promise.all([
        api.get('/categories'),
        api.get('/suppliers')
      ]);
      if (catRes.data.success) setCategories(catRes.data.categories);
      if (suppRes.data.success) setSuppliers(suppRes.data.suppliers);
    } catch (err) {
      console.error('Failed to load category/supplier lists:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          search: search,
          category: categoryFilter,
          stockStatus: stockFilter,
          sort: sortField,
          page: page,
          limit: pageSize
        }
      });
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalPages(res.data.pagination.totalPages);
        setTotalProducts(res.data.pagination.totalProducts);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
      toast.error('Could not fetch products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  // Trigger product fetch on search/filter/pagination changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 250); // debounce input queries
    return () => clearTimeout(delayDebounce);
  }, [search, categoryFilter, stockFilter, sortField, page, pageSize]);

  // Bulk selection handling
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(products.map(p => p._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (productId) => {
    if (selectedRows.includes(productId)) {
      setSelectedRows(selectedRows.filter(id => id !== productId));
    } else {
      setSelectedRows([...selectedRows, productId]);
    }
  };

  const handleRowClick = (product, e) => {
    // Avoid drawer opening if clicking checkbox or action button
    if (e.target.type === 'checkbox' || e.target.closest('button')) return;
    setSelectedProduct(product);
  };

  const handleOpenAddForm = () => {
    setEditMode(false);
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: categories[0]?._id || '',
      supplier: suppliers[0]?._id || '',
      buyingPrice: '',
      sellingPrice: '',
      stockQty: 0,
      reorderPoint: 5,
      unit: 'pcs',
      image: '',
      tags: ''
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleOpenEditForm = (product, e) => {
    if (e) e.stopPropagation();
    setEditMode(true);
    setFormData({
      _id: product._id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      category: product.category,
      supplier: product.supplier,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      stockQty: product.stockQty,
      reorderPoint: product.reorderPoint,
      unit: product.unit,
      image: product.image,
      tags: product.tags.join(', ')
    });
    setFormErrors({});
    setFormOpen(true);
    setSelectedProduct(null); // Close detail panel
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.category) errors.category = 'Category assignment is required';
    if (!formData.supplier) errors.supplier = 'Supplier assignment is required';
    if (formData.buyingPrice === '' || Number(formData.buyingPrice) < 0) errors.buyingPrice = 'Provide valid cost';
    if (formData.sellingPrice === '' || Number(formData.sellingPrice) < 0) errors.sellingPrice = 'Provide valid retail';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const body = {
        ...formData,
        buyingPrice: Number(formData.buyingPrice),
        sellingPrice: Number(formData.sellingPrice),
        stockQty: Number(formData.stockQty),
        reorderPoint: Number(formData.reorderPoint),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      let res;
      if (editMode) {
        res = await api.put(`/products/${formData._id}`, body);
      } else {
        res = await api.post('/products', body);
      }

      if (res.data.success) {
        toast.success(`Product successfully ${editMode ? 'updated' : 'created'}`);
        setFormOpen(false);
        fetchProducts();
      }
    } catch (err) {
      const errMsg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Failed to save product details.';
      toast.error(errMsg);
    }
  };

  const handleOpenDelete = (product, e) => {
    if (e) e.stopPropagation();
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      const res = await api.delete(`/products/${productToDelete._id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setDeleteModalOpen(false);
        setProductToDelete(null);
        setSelectedProduct(null);
        fetchProducts();
      }
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    // Custom state confirm (simulating deletion dialog)
    if (window.confirm(`Bulk delete ${selectedRows.length} items?`)) {
      try {
        await Promise.all(selectedRows.map(id => api.delete(`/products/${id}`)));
        toast.success('Selected products deleted successfully.');
        setSelectedRows([]);
        fetchProducts();
      } catch (err) {
        toast.error('Failed to complete bulk operations.');
      }
    }
  };

  const handleExportCSV = () => {
    // Generate simple comma list
    const headers = 'SKU,Name,Category,Buying Price,Selling Price,Stock Qty,Unit,Status\r\n';
    const rows = products.map(p => {
      const cat = categories.find(c => String(c._id) === String(p.category))?.name || 'Unassigned';
      const status = p.stockQty <= 0 ? 'Out of Stock' : (p.stockQty <= p.reorderPoint ? 'Low Stock' : 'In Stock');
      return `"${p.sku}","${p.name.replace(/"/g, '""')}","${cat}",${p.buyingPrice},${p.sellingPrice},${p.stockQty},"${p.unit}","${status}"`;
    }).join('\r\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Precision_Ledger_Products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper values for forms
  const profitMarginPercent = () => {
    const buy = Number(formData.buyingPrice || 0);
    const sell = Number(formData.sellingPrice || 0);
    if (!sell) return 0;
    return Math.round(((sell - buy) / sell) * 100);
  };

  // Stock warning pills helper
  const getStockStatusPill = (qty, reorder) => {
    if (qty <= 0) {
      return <span className="bg-danger/10 text-danger text-[10px] font-bold px-8 py-2 rounded-pill uppercase tracking-wider">Out of Stock</span>;
    }
    if (qty <= reorder) {
      return <span className="bg-warning/10 text-warning text-[10px] font-bold px-8 py-2 rounded-pill uppercase tracking-wider">Low Stock</span>;
    }
    return <span className="bg-success/10 text-success text-[10px] font-bold px-8 py-2 rounded-pill uppercase tracking-wider">In Stock</span>;
  };

  return (
    <div className="space-y-24">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-16 border-b border-customBorder dark:border-[#2d2d2a] pb-16">
        <div>
          <h3 className="font-serif text-xl font-bold text-primary dark:text-white leading-tight">Artisan Inventory</h3>
          <p className="text-xs text-text-secondary dark:text-gray-400">Total catalog inventory: {totalProducts} registered lines</p>
        </div>
        <div className="flex items-center gap-12 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial px-16 py-8 text-xs font-bold border border-customBorder dark:border-[#2d2d2a] bg-surface-card dark:bg-[#1c1c1a] hover:bg-surface dark:hover:bg-[#252522] rounded-sm transition-colors flex items-center justify-center gap-8 uppercase tracking-wider"
          >
            <FileDown size={14} /> Export CSV
          </button>
          <button
            onClick={handleOpenAddForm}
            className="flex-grow sm:flex-initial px-16 py-8 text-xs font-bold bg-accent hover:bg-accent/90 text-white rounded-sm transition-all flex items-center justify-center gap-8 uppercase tracking-wider"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 flex flex-col md:flex-row items-center justify-between gap-16 text-xs">
        
        {/* Search */}
        <div className="flex items-center bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#2d2d2a] rounded-sm px-12 py-8 w-full md:w-280 focus-within:border-accent">
          <Search size={14} className="text-text-muted mr-8" />
          <input
            type="text"
            placeholder="Search by SKU, name, tags..."
            className="bg-transparent border-none focus:outline-none w-full placeholder:text-text-muted text-text-primary dark:text-white"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-12 w-full md:w-auto justify-end">
          
          {/* Category selection */}
          <select
            className="bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#383834] rounded-sm px-12 py-8 text-text-secondary dark:text-gray-300 focus:outline-none"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          {/* Stock selection */}
          <select
            className="bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#383834] rounded-sm px-12 py-8 text-text-secondary dark:text-gray-300 focus:outline-none"
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Stock Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* Sort selection */}
          <select
            className="bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#383834] rounded-sm px-12 py-8 text-text-secondary dark:text-gray-300 focus:outline-none font-bold"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option>Recently Added</option>
            <option>Name A-Z</option>
            <option>Price Low-High</option>
            <option>Stock Low-High</option>
          </select>
        </div>
      </div>

      {/* --- TABLE LAYOUT --- */}
      <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs overflow-hidden">
        
        {/* Bulk Action Bar (Overlay at bottom/top) */}
        {selectedRows.length > 0 && (
          <div className="bg-accent-soft border-b border-customBorder px-16 py-10 flex items-center justify-between animate-[fadeInUp_0.2s_ease-out]">
            <span className="text-xs font-bold text-warning font-mono">{selectedRows.length} items selected</span>
            <button 
              onClick={handleBulkDelete}
              className="px-12 py-6 bg-danger hover:bg-danger/90 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm shadow-xs transition-colors flex items-center gap-6"
            >
              <Trash2 size={12} /> Delete Selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-customBorder dark:border-[#2d2d2a] bg-surface dark:bg-[#252522] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-12 px-16 w-32">
                  <input
                    type="checkbox"
                    className="rounded-sm border-customBorder text-accent focus:ring-accent"
                    checked={products.length > 0 && selectedRows.length === products.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="py-12">Image</th>
                <th className="py-12">SKU</th>
                <th className="py-12">Product Name</th>
                <th className="py-12">Category</th>
                <th className="py-12 text-right">Buying Cost</th>
                <th className="py-12 text-right">Selling Price</th>
                <th className="py-12 text-center">Stock</th>
                <th className="py-12 text-center">Status</th>
                <th className="py-12 pr-16 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-customBorder/60 dark:divide-[#2d2d2a]/60">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-48 text-center text-text-muted">Populating records...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-48 text-center text-text-muted">No products match the search query.</td>
                </tr>
              ) : (
                products.map((prod, index) => {
                  const isChecked = selectedRows.includes(prod._id);
                  const catName = categories.find(c => String(c._id) === String(prod.category))?.name || 'Unassigned';
                  
                  return (
                    <tr 
                      key={prod._id}
                      onClick={(e) => handleRowClick(prod, e)}
                      className={`table-row-accent cursor-pointer ${isChecked ? 'bg-accent-soft/30' : ''}`}
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      {/* Checkbox */}
                      <td className="py-12 px-16">
                        <input
                          type="checkbox"
                          className="rounded-sm border-customBorder text-accent focus:ring-accent"
                          checked={isChecked}
                          onChange={() => handleSelectRow(prod._id)}
                        />
                      </td>

                      {/* Thumbnail Image */}
                      <td className="py-12">
                        <div className="w-40 h-40 rounded-sm overflow-hidden bg-surface border border-customBorder/60 flex items-center justify-center text-text-muted">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <Image size={16} />
                          )}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-12 font-mono font-semibold text-text-primary dark:text-gray-300">
                        {prod.sku}
                      </td>

                      {/* Name */}
                      <td className="py-12 font-serif text-sm font-bold text-primary dark:text-white max-w-[180px] truncate">
                        {prod.name}
                      </td>

                      {/* Category */}
                      <td className="py-12 text-text-secondary dark:text-gray-400">
                        {catName}
                      </td>

                      {/* Cost */}
                      <td className="py-12 text-right font-mono text-text-secondary dark:text-gray-400">
                        ${prod.buyingPrice.toFixed(2)}
                      </td>

                      {/* Price */}
                      <td className="py-12 text-right font-mono font-bold text-text-primary dark:text-white">
                        ${prod.sellingPrice.toFixed(2)}
                      </td>

                      {/* Stock */}
                      <td className="py-12 text-center font-mono font-bold text-text-primary dark:text-white">
                        {prod.stockQty} <span className="text-[10px] text-text-muted font-normal">{prod.unit}</span>
                      </td>

                      {/* Status */}
                      <td className="py-12 text-center">
                        {getStockStatusPill(prod.stockQty, prod.reorderPoint)}
                      </td>

                      {/* Actions */}
                      <td className="py-12 pr-16 text-right space-x-8">
                        <button
                          onClick={(e) => handleOpenEditForm(prod, e)}
                          className="p-6 text-text-secondary hover:text-accent rounded-sm hover:bg-surface dark:hover:bg-[#252522] transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => handleOpenDelete(prod, e)}
                          className="p-6 text-text-secondary hover:text-danger rounded-sm hover:bg-surface dark:hover:bg-[#252522] transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION CONTROL --- */}
        {!loading && totalProducts > 0 && (
          <div className="bg-surface dark:bg-[#252522] border-t border-customBorder dark:border-[#2d2d2a] px-16 py-12 flex flex-col sm:flex-row items-center justify-between gap-12 text-xs text-text-secondary dark:text-gray-400 font-semibold">
            <div>
              Showing <span className="font-mono text-text-primary dark:text-white">{Math.min((page - 1) * pageSize + 1, totalProducts)}</span> to{' '}
              <span className="font-mono text-text-primary dark:text-white">{Math.min(page * pageSize, totalProducts)}</span> of{' '}
              <span className="font-mono text-text-primary dark:text-white">{totalProducts}</span> entries
            </div>
            
            <div className="flex items-center gap-16">
              {/* Page selector */}
              <div className="flex items-center gap-6">
                <span>Page size:</span>
                <select
                  className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#383834] rounded-sm px-8 py-4"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-10 py-6 border border-customBorder bg-surface-card hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                >
                  Prev
                </button>
                <span className="font-mono text-text-primary dark:text-white font-bold">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-10 py-6 border border-customBorder bg-surface-card hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT PRODUCT DRAWER MODAL --- */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/45 backdrop-blur-sm p-16">
          <div className="w-full max-w-lg bg-surface-card dark:bg-[#1c1c1a] border-l border-customBorder dark:border-[#2d2d2a] shadow-lg p-24 md:p-32 overflow-y-auto flex flex-col justify-between modal-animate-open">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-12 mb-16">
                <h3 className="font-serif text-lg font-bold text-primary dark:text-white">
                  {editMode ? 'Edit Product Parameters' : 'Register New Product'}
                </h3>
                <button onClick={() => setFormOpen(false)} className="text-text-muted hover:text-text-primary p-4">
                  <X size={20} />
                </button>
              </div>

              {/* Form container */}
              <form className="space-y-12 text-xs">
                
                {/* Product Name */}
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Product Name *</label>
                  <input
                    type="text"
                    required
                    className={`w-full px-12 py-8 rounded-sm border ${
                      formErrors.name ? 'border-danger' : 'border-customBorder dark:border-[#383834]'
                    } bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent`}
                    placeholder="Organic Ceremonial Matcha Tin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <p className="text-[10px] text-danger">{formErrors.name}</p>}
                </div>

                {/* SKU & Category Row */}
                <div className="grid grid-cols-2 gap-16">
                  <div className="space-y-4">
                    <label className="block font-bold text-text-secondary dark:text-gray-300">SKU (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent font-mono"
                      placeholder="MAT-GOUR-8902"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block font-bold text-text-secondary dark:text-gray-300">Category *</label>
                    <select
                      className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Description</label>
                  <textarea
                    rows="3"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none resize-none"
                    placeholder="Stone-ground organic ceremonial matcha. Keep sealed."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Buying price, Selling price, Margin percentage */}
                <div className="grid grid-cols-3 gap-16 items-start">
                  
                  {/* Buying cost */}
                  <div className="space-y-4">
                    <label className="block font-bold text-text-secondary dark:text-gray-300">Buying Cost ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none font-mono"
                      value={formData.buyingPrice}
                      onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                    />
                  </div>

                  {/* Selling retail */}
                  <div className="space-y-4">
                    <label className="block font-bold text-text-secondary dark:text-gray-300">Selling Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none font-mono"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    />
                  </div>

                  {/* Margin preview calculation */}
                  <div className="space-y-4">
                    <label className="block font-bold text-text-secondary dark:text-gray-300">Profit Margin</label>
                    <div className="w-full px-12 py-8 bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#383834] rounded-sm font-mono font-bold text-center">
                      <span className={profitMarginPercent() < 0 ? 'text-danger' : 'text-success'}>
                        {profitMarginPercent()}%
                      </span>
                    </div>
                  </div>
                </div>
                {/* Warning indicator for negative profit */}
                {profitMarginPercent() < 0 && (
                  <div className="p-8 bg-danger/10 text-danger rounded-sm flex items-center gap-8">
                    <ShieldAlert size={14} />
                    <span>Warning: Retail price is less than buying cost!</span>
                  </div>
                )}

                {/* Stock Quantity, Reorder point, Unit */}
                <div className="grid grid-cols-3 gap-16">
                  <div className="space-y-4">
                    <label className="block font-bold text-text-secondary dark:text-gray-300">Initial Stock</label>
                    <input
                      type="number"
                      disabled={editMode} // Disable stock modification inside edit form (must use manual adjustments endpoint)
                      className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] disabled:opacity-50 disabled:cursor-not-allowed text-text-primary dark:text-white focus:outline-none font-mono"
                      value={formData.stockQty}
                      onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block font-bold text-text-secondary dark:text-gray-300">Reorder Alert Limit</label>
                    <input
                      type="number"
                      className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none font-mono"
                      value={formData.reorderPoint}
                      onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block font-bold text-text-secondary dark:text-gray-300">Unit Label</label>
                    <input
                      type="text"
                      className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                      placeholder="tin, pcs, box"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>

                {/* Supplier lookup */}
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Wholesale Supplier *</label>
                  <select
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  >
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.companyName}</option>
                    ))}
                  </select>
                </div>

                {/* Image upload preview */}
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Product Image URL</label>
                  <input
                    type="text"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none font-mono"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <label className="block font-bold text-text-secondary dark:text-gray-300">Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    placeholder="organic, matcha, spice"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>

              </form>
            </div>

            {/* Actions */}
            <div className="flex gap-12 pt-24 border-t border-customBorder dark:border-[#2d2d2a] mt-24">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="w-1/2 py-10 font-bold border border-customBorder text-text-secondary hover:bg-surface dark:hover:bg-[#252522] rounded-sm transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="w-1/2 py-10 font-bold bg-accent hover:bg-accent/90 text-white rounded-sm transition-all uppercase tracking-wider"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- RIGHT DETAIL PANEL DRAWER --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/45 backdrop-blur-sm p-16">
          <div className="w-full max-w-md bg-surface-card dark:bg-[#1c1c1a] border-l border-customBorder dark:border-[#2d2d2a] shadow-lg p-24 md:p-32 overflow-y-auto flex flex-col justify-between modal-animate-open">
            
            <div className="space-y-24">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-12">
                <h3 className="font-serif text-base font-bold text-primary dark:text-white">Product Specsheet</h3>
                <button onClick={() => setSelectedProduct(null)} className="text-text-muted hover:text-text-primary p-4">
                  <X size={20} />
                </button>
              </div>

              {/* Specs body */}
              <div className="space-y-16 text-xs">
                
                {/* Photo */}
                <div className="h-200 bg-surface rounded-md border border-customBorder overflow-hidden flex items-center justify-center text-text-muted relative">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image size={32} />
                  )}
                  {/* Status Overlay */}
                  <div className="absolute bottom-12 right-12">
                    {getStockStatusPill(selectedProduct.stockQty, selectedProduct.reorderPoint)}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-serif text-base font-bold text-primary dark:text-white leading-tight">{selectedProduct.name}</h4>
                  <p className="font-mono text-[10px] text-text-muted uppercase">SKU: {selectedProduct.sku}</p>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <p className="p-12 bg-surface dark:bg-[#252522] rounded-sm border border-customBorder dark:border-[#383834] text-text-secondary dark:text-gray-400 italic">
                    {selectedProduct.description}
                  </p>
                )}

                {/* Specs Table */}
                <div className="divide-y divide-customBorder dark:divide-[#2d2d2a]">
                  <div className="flex justify-between py-8">
                    <span className="font-bold text-text-secondary dark:text-gray-400">Stock Available:</span>
                    <span className="font-mono font-bold text-text-primary dark:text-white">
                      {selectedProduct.stockQty} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between py-8">
                    <span className="font-bold text-text-secondary dark:text-gray-400">Wholesale Cost:</span>
                    <span className="font-mono text-text-primary dark:text-white">${selectedProduct.buyingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-8">
                    <span className="font-bold text-text-secondary dark:text-gray-400">Retail Value:</span>
                    <span className="font-mono font-bold text-text-primary dark:text-white">${selectedProduct.sellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-8">
                    <span className="font-bold text-text-secondary dark:text-gray-400">Margin Profit:</span>
                    <span className="font-mono text-success font-bold">
                      ${(selectedProduct.sellingPrice - selectedProduct.buyingPrice).toFixed(2)} ({Math.round(((selectedProduct.sellingPrice - selectedProduct.buyingPrice) / selectedProduct.sellingPrice) * 100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between py-8">
                    <span className="font-bold text-text-secondary dark:text-gray-400">Supplier Assigned:</span>
                    <span className="text-text-primary dark:text-white font-semibold">
                      {suppliers.find(s => String(s._id) === String(selectedProduct.supplier))?.companyName || 'Unknown Vendor'}
                    </span>
                  </div>
                </div>

                {/* Tags Chips */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-8 pt-8">
                    {selectedProduct.tags.map(t => (
                      <span key={t} className="bg-surface dark:bg-[#252522] border border-customBorder dark:border-[#383834] text-text-secondary dark:text-gray-300 font-mono text-[10px] px-8 py-4 rounded-sm">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-12 pt-24 border-t border-customBorder mt-24">
              <button
                onClick={(e) => handleOpenDelete(selectedProduct, e)}
                className="w-1/2 py-10 font-bold border border-danger text-danger hover:bg-danger/5 rounded-sm transition-colors uppercase tracking-wider"
              >
                Delete Item
              </button>
              <button
                onClick={(e) => handleOpenEditForm(selectedProduct, e)}
                className="w-1/2 py-10 font-bold bg-accent hover:bg-accent/90 text-white rounded-sm transition-all uppercase tracking-wider"
              >
                Modify Specs
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- CONFIRM DELETION MODAL (GITHUB STYLE) --- */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Approve Destructive Operation"
        message={`This will permanently soft-delete '${productToDelete ? productToDelete.name : 'this item'}' from active tables and journals. This transaction cannot be undone.`}
        confirmText="Execute Deletion"
        cancelText="Retreat"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
        matchText={productToDelete ? productToDelete.name : ''}
        isDanger={true}
      />

    </div>
  );
}

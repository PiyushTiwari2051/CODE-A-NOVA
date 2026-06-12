import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, FolderClosed, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [inlineOpen, setInlineOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    color: '#E07B39'
  });

  const colorPresets = ['#1A2B4A', '#2D4172', '#E07B39', '#B45309', '#C0392B', '#2E7D32', '#1565C0', '#7B1FA2'];

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({ _id: '', name: '', color: '#E07B39' });
    setInlineOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditMode(true);
    setFormData({
      _id: cat._id,
      name: cat.name,
      // Unwrap standard JSON structure if color object is customized
      color: cat.color || '#E07B39'
    });
    setInlineOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    try {
      let res;
      if (editMode) {
        res = await api.put(`/categories/${formData._id}`, formData);
      } else {
        res = await api.post('/categories', formData);
      }

      if (res.data.success) {
        toast.success(`Category ${editMode ? 'updated' : 'created'} successfully`);
        setInlineOpen(false);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    }
  };

  const handleDelete = async (cat) => {
    // Prevent delete if count > 0 (verified on backend, double check here)
    if (cat.productCount > 0) {
      toast.error(`Cannot remove category. ${cat.productCount} products are still active under this index.`);
      return;
    }

    if (window.confirm(`Are you sure you want to remove the category '${cat.name}'?`)) {
      try {
        const res = await api.delete(`/categories/${cat._id}`);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchCategories();
        }
      } catch (err) {
        toast.error('Failed to delete category.');
      }
    }
  };

  return (
    <div className="space-y-24">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-16">
        <div>
          <h3 className="font-serif text-xl font-bold text-primary dark:text-white leading-tight">Classification Logs</h3>
          <p className="text-xs text-text-secondary dark:text-gray-400">Inventory categorizations: {categories.length} segments loaded</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-16 py-8 text-xs font-bold bg-accent hover:bg-accent/90 text-white rounded-sm transition-all flex items-center gap-8 uppercase tracking-wider"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* --- INLINE EDIT CARD --- */}
      {inlineOpen && (
        <div className="bg-surface-card dark:bg-[#1c1c1a] border-2 border-accent/20 rounded-md shadow-sm p-20 max-w-md animate-[fadeInUp_0.2s_ease-out]">
          <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-8 mb-12">
            <h4 className="font-serif text-sm font-bold text-primary dark:text-white">
              {editMode ? 'Modify Group Parameters' : 'Register New Catalog Group'}
            </h4>
            <button onClick={() => setInlineOpen(false)} className="text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSaveCategory} className="space-y-12 text-xs">
            <div className="space-y-4">
              <label className="block font-bold text-text-secondary dark:text-gray-300">Category Name</label>
              <input
                type="text"
                required
                className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                placeholder="Stationery & Leather, Gourmet Foods..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Custom Color Selector Preset swatch */}
            <div className="space-y-4">
              <label className="block font-bold text-text-secondary dark:text-gray-300">Ledger Swatch Accent</label>
              <div className="flex flex-wrap gap-8">
                {colorPresets.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className="w-24 h-24 rounded-full border border-customBorder focus:outline-none relative flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-12 pt-8">
              <button
                type="button"
                onClick={() => setInlineOpen(false)}
                className="px-16 py-8 border border-customBorder rounded-sm text-text-secondary hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-16 py-8 bg-accent hover:bg-accent/90 text-white rounded-sm font-bold flex items-center gap-6"
              >
                <Save size={12} /> Save Group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- CATEGORIES LIST GRID --- */}
      {loading ? (
        <div className="text-center py-48 text-text-muted text-xs">Loading categories registry...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
          {categories.map((cat) => (
            <div 
              key={cat._id}
              className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 flex flex-col justify-between hover:shadow-sm hover:border-accent/40 transition-all card-texture-overlay relative"
            >
              {/* Category Color Strip indicator */}
              <div 
                className="absolute top-0 left-0 right-0 h-4 rounded-t-md" 
                style={{ backgroundColor: cat.color }}
              />

              <div className="flex justify-between items-start pt-8">
                <div>
                  <h4 className="font-serif text-sm font-bold text-primary dark:text-white leading-tight">{cat.name}</h4>
                  <p className="font-mono text-[10px] text-text-secondary dark:text-gray-400 mt-6">{cat.productCount || 0} product lines</p>
                </div>
                <FolderClosed size={18} className="text-text-muted" />
              </div>

              {/* Action buttons */}
              <div className="mt-16 flex justify-end gap-12 border-t border-customBorder/50 dark:border-[#2d2d2a]/50 pt-12 text-xs">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="text-text-secondary hover:text-accent font-semibold flex items-center gap-4 transition-colors"
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="text-text-secondary hover:text-danger font-semibold flex items-center gap-4 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

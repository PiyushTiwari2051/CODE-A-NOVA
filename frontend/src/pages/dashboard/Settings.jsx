import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Save, User, Shield, Bell, Store, Key, Plus, 
  Trash2, ToggleLeft, ToggleRight, Check, ShieldCheck 
} from 'lucide-react';
import api from '../../api/axios';
import { updateShopName } from '../../store';
import toast from 'react-hot-toast';

export default function Settings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'store' | 'users' | 'notifications'
  const [loading, setLoading] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Store Settings States
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [storeReg, setStoreReg] = useState('');
  const [storeTax, setStoreTax] = useState(8.25);
  const [storePrefix, setStorePrefix] = useState('INV');
  const [storeThreshold, setStoreThreshold] = useState(10);
  const [storeAlertEmail, setStoreAlertEmail] = useState('');

  // Team management (Admin only)
  const [teamUsers, setTeamUsers] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('cashier');

  // Notifications toggles states
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifDailySales, setNotifDailySales] = useState(false);
  const [notifLoginAlerts, setNotifLoginAlerts] = useState(true);

  const fetchStoreSettings = async () => {
    try {
      const res = await api.get('/settings/store');
      if (res.data.success) {
        const s = res.data.shop;
        setStoreName(s.name);
        setStoreAddress(s.address || '');
        setStoreCity(s.city || '');
        setStoreReg(s.registrationNumber || '');
        setStoreTax(s.taxRate || 8.25);
        setStorePrefix(s.invoicePrefix || 'INV');
        setStoreThreshold(s.lowStockThreshold || 10);
        setStoreAlertEmail(s.alertEmail || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeamUsers = async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await api.get('/settings/users');
      if (res.data.success) {
        setTeamUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStoreSettings();
    fetchTeamUsers();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    toast.success('Simulated saving profile settings!');
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/settings/store', {
        name: storeName,
        address: storeAddress,
        city: storeCity,
        registrationNumber: storeReg,
        taxRate: Number(storeTax),
        invoicePrefix: storePrefix,
        lowStockThreshold: Number(storeThreshold),
        alertEmail: storeAlertEmail
      });

      if (res.data.success) {
        dispatch(updateShopName(res.data.shop.name));
        toast.success('Store parameters saved successfully!');
        fetchStoreSettings();
      }
    } catch (err) {
      toast.error('Failed to save store configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail || !invitePassword) {
      toast.error('Fill in all fields to register employee.');
      return;
    }

    try {
      const res = await api.post('/settings/users/invite', {
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
        role: inviteRole
      });

      if (res.data.success) {
        toast.success(`User ${inviteName} successfully added to shop.`);
        setInviteOpen(false);
        // Reset invite form
        setInviteName('');
        setInviteEmail('');
        setInvitePassword('');
        setInviteRole('cashier');
        fetchTeamUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add user.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to deactivate and remove '${userName}'?`)) {
      try {
        const res = await api.delete(`/settings/users/${userId}`);
        if (res.data.success) {
          toast.success(res.data.message);
          fetchTeamUsers();
        }
      } catch (err) {
        toast.error('Failed to remove user account.');
      }
    }
  };

  // Roles permissions mapping matrix
  const permissionsMatrix = [
    { module: 'Overview Dashboard', admin: true, manager: true, cashier: true },
    { module: 'Product Catalog view', admin: true, manager: true, cashier: true },
    { module: 'Product Catalog edits', admin: true, manager: true, cashier: false },
    { module: 'Wholesale Purchase Orders', admin: true, manager: true, cashier: false },
    { module: 'POS Sales Checkout', admin: true, manager: true, cashier: true },
    { module: 'P&L Reports Audits', admin: true, manager: true, cashier: false },
    { module: 'Store General Settings', admin: true, manager: false, cashier: false },
    { module: 'Team Employee Invites', admin: true, manager: false, cashier: false }
  ];

  return (
    <div className="space-y-24 animate-[fadeInUp_0.2s_ease-out]">
      
      {/* --- TABS --- */}
      <div className="flex border-b border-customBorder dark:border-[#2d2d2a] pb-4 gap-24 text-sm font-bold text-text-secondary dark:text-gray-400">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-12 border-b-2 transition-all flex items-center gap-8 ${
            activeTab === 'profile' ? 'border-accent text-accent' : 'border-transparent hover:text-text-primary'
          }`}
        >
          <User size={16} /> Profile Specs
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`pb-12 border-b-2 transition-all flex items-center gap-8 ${
            activeTab === 'store' ? 'border-accent text-accent' : 'border-transparent hover:text-text-primary'
          }`}
        >
          <Store size={16} /> Store Profile
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-12 border-b-2 transition-all flex items-center gap-8 ${
              activeTab === 'users' ? 'border-accent text-accent' : 'border-transparent hover:text-text-primary'
            }`}
          >
            <Shield size={16} /> Employee Directory
          </button>
        )}
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-12 border-b-2 transition-all flex items-center gap-8 ${
            activeTab === 'notifications' ? 'border-accent text-accent' : 'border-transparent hover:text-text-primary'
          }`}
        >
          <Bell size={16} /> Notifications
        </button>
      </div>

      {/* --- TAB 1: PROFILE SPECS --- */}
      {activeTab === 'profile' && (
        <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 max-w-md space-y-16 text-xs text-text-secondary dark:text-gray-300">
          <h4 className="font-serif text-base font-bold text-primary dark:text-white border-b border-customBorder dark:border-[#2d2d2a] pb-8 mb-12">User Profile</h4>
          
          <form onSubmit={handleUpdateProfile} className="space-y-16">
            <div className="space-y-4">
              <label className="block font-bold">Full Name</label>
              <input
                type="text"
                className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="block font-bold">Email Address</label>
              <input
                type="email"
                disabled
                className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none opacity-50 cursor-not-allowed"
                value={profileEmail}
              />
            </div>

            {/* Change Password Block */}
            <div className="border-t border-customBorder dark:border-[#2d2d2a] pt-16 space-y-12">
              <h5 className="font-serif font-bold text-primary dark:text-white">Altering Password Keys</h5>
              <div className="space-y-4">
                <label className="block font-bold text-text-muted">Current Password</label>
                <input
                  type="password"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <label className="block font-bold text-text-muted">New Password</label>
                <input
                  type="password"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-10 bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-wider rounded-sm shadow-xs transition-all flex items-center justify-center gap-8"
            >
              <Save size={14} /> Update profile
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 2: STORE SETTINGS --- */}
      {activeTab === 'store' && (
        <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 max-w-lg space-y-16 text-xs text-text-secondary dark:text-gray-300">
          <h4 className="font-serif text-base font-bold text-primary dark:text-white border-b border-customBorder dark:border-[#2d2d2a] pb-8 mb-12">Store Profile</h4>

          <form onSubmit={handleSaveStore} className="space-y-12">
            <div className="space-y-4">
              <label className="block font-bold">Shop Name *</label>
              <input
                type="text"
                required
                className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-16">
              <div className="space-y-4 col-span-2">
                <label className="block font-bold">Business Address</label>
                <input
                  type="text"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>
              <div className="space-y-4 col-span-1">
                <label className="block font-bold">City</label>
                <input
                  type="text"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-4">
                <label className="block font-bold">VAT / Registration ID</label>
                <input
                  type="text"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent font-mono"
                  placeholder="US-REG-10492"
                  value={storeReg}
                  onChange={(e) => setStoreReg(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <label className="block font-bold">Sales Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent font-mono"
                  value={storeTax}
                  onChange={(e) => setStoreTax(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-4">
                <label className="block font-bold">Invoice Prefix</label>
                <input
                  type="text"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent font-mono"
                  value={storePrefix}
                  onChange={(e) => setStorePrefix(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <label className="block font-bold">Low Stock Warning Limit</label>
                <input
                  type="number"
                  className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent font-mono"
                  value={storeThreshold}
                  onChange={(e) => setStoreThreshold(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block font-bold">Alert Recipient Email</label>
              <input
                type="email"
                className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none focus:border-accent"
                value={storeAlertEmail}
                onChange={(e) => setStoreAlertEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-12 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-bold uppercase tracking-wider rounded-sm shadow-xs transition-all flex items-center justify-center gap-8"
            >
              <Save size={14} /> {loading ? 'Saving parameters...' : 'Save Parameters'}
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 3: USER INVITES & ROLE MATRIX (ADMIN ONLY) --- */}
      {activeTab === 'users' && user?.role === 'admin' && (
        <div className="space-y-24 animate-[fadeInUp_0.2s_ease-out] text-xs text-text-secondary dark:text-gray-300">
          
          {/* Invite user form inline */}
          {inviteOpen ? (
            <div className="bg-surface-card dark:bg-[#1c1c1a] border border-accent/20 rounded-md p-16 md:p-24 max-w-md space-y-16">
              <div className="flex justify-between items-center border-b border-customBorder dark:border-[#2d2d2a] pb-8 mb-12">
                <h4 className="font-serif text-sm font-bold text-primary dark:text-white">Register Shop Employee</h4>
                <button onClick={() => setInviteOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleInviteUser} className="space-y-12">
                <div className="space-y-4">
                  <label className="block font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    placeholder="Clara Oswald"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="block font-bold">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    placeholder="clara@precision.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="block font-bold">Temporary Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    placeholder="••••••••"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="block font-bold">Role Privilege</label>
                  <select
                    className="w-full px-12 py-8 rounded-sm border border-customBorder dark:border-[#383834] bg-surface dark:bg-[#252522] text-text-primary dark:text-white focus:outline-none"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="cashier">Cashier (POS Checkout only)</option>
                    <option value="manager">Manager (Stock, POS, PO entries)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-12 pt-8">
                  <button
                    type="button"
                    onClick={() => setInviteOpen(false)}
                    className="px-16 py-8 border border-customBorder rounded-sm text-text-secondary hover:bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-16 py-8 bg-accent hover:bg-accent/90 text-white rounded-sm font-bold"
                  >
                    Register User
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setInviteOpen(true)}
                className="px-16 py-8 text-xs font-bold bg-accent hover:bg-accent/90 text-white rounded-sm transition-all flex items-center gap-8 uppercase tracking-wider"
              >
                <Plus size={14} /> Add User
              </button>
            </div>
          )}

          {/* User List Table */}
          <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-customBorder dark:border-[#2d2d2a] bg-surface dark:bg-[#252522] text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-12 px-16">Name</th>
                  <th className="py-12">Email</th>
                  <th className="py-12">Role</th>
                  <th className="py-12 text-center">Status</th>
                  <th className="py-12 pr-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-customBorder/60">
                {teamUsers.map(u => (
                  <tr key={u._id} className="hover:bg-surface/50">
                    <td className="py-12 px-16 font-serif font-bold text-primary dark:text-white">{u.name}</td>
                    <td className="py-12 text-text-secondary dark:text-gray-300">{u.email}</td>
                    <td className="py-12 text-text-secondary dark:text-gray-400 uppercase font-mono text-[10px]">{u.role}</td>
                    <td className="py-12 text-center">
                      <span className={`text-[9px] font-bold px-6 py-2 rounded-pill uppercase tracking-wider ${
                        u.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-12 pr-16 text-right">
                      {String(u._id) !== String(user.id) && (
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="p-6 text-text-secondary hover:text-danger rounded-sm transition-colors"
                          title="Remove Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Permissions Matrix display */}
          <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 space-y-16">
            <h4 className="font-serif text-base font-bold text-primary dark:text-white flex items-center gap-8">
              <ShieldCheck size={18} className="text-accent" /> Role Privileges Matrix
            </h4>
            <p className="text-[11px] text-text-secondary">Review permissions maps associated with cashier and manager role assignments.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border border-customBorder/60">
                <thead>
                  <tr className="border-b border-customBorder bg-surface dark:bg-[#252522] text-text-secondary dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-8 px-12">SYSTEM MODULE</th>
                    <th className="py-8 text-center">ADMIN</th>
                    <th className="py-8 text-center">MANAGER</th>
                    <th className="py-8 text-center">CASHIER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-customBorder">
                  {permissionsMatrix.map((p, idx) => (
                    <tr key={idx} className="hover:bg-surface/50">
                      <td className="py-8 px-12 font-medium">{p.module}</td>
                      <td className="py-8 text-center">{p.admin ? <Check size={14} className="text-success mx-auto" /> : '—'}</td>
                      <td className="py-8 text-center">{p.manager ? <Check size={14} className="text-success mx-auto" /> : '—'}</td>
                      <td className="py-8 text-center">{p.cashier ? <Check size={14} className="text-success mx-auto" /> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 4: NOTIFICATIONS TOGGLES --- */}
      {activeTab === 'notifications' && (
        <div className="bg-surface-card dark:bg-[#1c1c1a] border border-customBorder dark:border-[#2d2d2a] rounded-md shadow-xs p-16 md:p-24 max-w-md space-y-20 text-xs text-text-secondary dark:text-gray-300">
          <h4 className="font-serif text-base font-bold text-primary dark:text-white border-b border-customBorder dark:border-[#2d2d2a] pb-8 mb-12">System Alert Preferences</h4>
          
          <div className="space-y-16">
            {/* Low stock alerts */}
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-text-primary dark:text-white">Low Stock Email Alarms</p>
                <p className="text-[10px] text-text-muted mt-2">Sends warnings when item values drop below limits.</p>
              </div>
              <button 
                onClick={() => setNotifLowStock(!notifLowStock)}
                className="focus:outline-none"
              >
                {notifLowStock ? <ToggleRight size={28} className="text-accent" /> : <ToggleLeft size={28} className="text-text-muted" />}
              </button>
            </div>

            {/* Daily summary */}
            <div className="flex justify-between items-center border-t border-customBorder/40 pt-12">
              <div>
                <p className="font-bold text-text-primary dark:text-white">Daily Sales Journal summaries</p>
                <p className="text-[10px] text-text-muted mt-2">Dispatches revenue reports at closing time.</p>
              </div>
              <button 
                onClick={() => setNotifDailySales(!notifDailySales)}
                className="focus:outline-none"
              >
                {notifDailySales ? <ToggleRight size={28} className="text-accent" /> : <ToggleLeft size={28} className="text-text-muted" />}
              </button>
            </div>

            {/* Login warnings */}
            <div className="flex justify-between items-center border-t border-customBorder/40 pt-12">
              <div>
                <p className="font-bold text-text-primary dark:text-white">Employee Login Alerts</p>
                <p className="text-[10px] text-text-muted mt-2">Warns administrator on any device login.</p>
              </div>
              <button 
                onClick={() => setNotifLoginAlerts(!notifLoginAlerts)}
                className="focus:outline-none"
              >
                {notifLoginAlerts ? <ToggleRight size={28} className="text-accent" /> : <ToggleLeft size={28} className="text-text-muted" />}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, TrendingUp, Users, Check, HelpCircle, 
  ChevronDown, ChevronUp, Lock, RefreshCcw 
} from 'lucide-react';

export default function Services() {
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    if (expandedFaq === index) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(index);
    }
  };

  const services = [
    {
      title: 'Stock Management',
      icon: <Package size={32} className="text-accent" />,
      desc: 'Complete control over product logs, stock quantities, and low limit alerts.',
      bullets: ['Automated reorder triggers', 'Unit size specifications (Kg, Litre, tin)', 'Manual stock logs adjustments']
    },
    {
      title: 'Sales Analytics',
      icon: <TrendingUp size={32} className="text-accent" />,
      desc: 'Point of Sale integration immediately computes profit margins and aggregates revenue trends.',
      bullets: ['Live margin percentage warnings', 'Printable A4 invoice slips', 'Detailed P&L accounting sheets']
    },
    {
      title: 'Supplier Logistics',
      icon: <Users size={32} className="text-accent" />,
      desc: 'Manage distributor profiles, trace purchase order logs, and track outstanding invoices.',
      bullets: ['Supplier-specific terms (Net 30)', 'Purchase cargo receipt updates', 'Outstanding balance indicators']
    }
  ];

  const faqItems = [
    { q: 'Is my ledger data encrypted and secure?', a: 'Yes. All data stored in Precision Ledger is transmitted using SSL 256-bit encryption. Real-time database replicas protect against failure or data loss.' },
    { q: 'Can I invite cashiers with restricted access?', a: 'Yes. The system utilizes role-based authentication. Managers can manage items, while cashiers are restricted to POS checkouts and invoice printing.' },
    { q: 'How does the low stock alert system work?', a: 'You set a reorder threshold on each item. When sales checkout drives quantities below this limit, a visual alert appears and an automated email warns your procurement team.' },
    { q: 'Can I export inventory reports for accounting?', a: 'Absolutely. All tables, sales journals, and stock lists can be downloaded as CSV sheets. P&L sheets print out as customized PDF ledgers.' },
    { q: 'Is there support for multiple branches or shops?', a: 'Yes, our Enterprise tier supports unified multi-warehouse tracking and global permissions management.' },
    { q: 'Do you offer a self-hosted offline database option?', a: 'Currently we support cloud sync for instant multi-device operations, but we are developing an offline-first desktop synchronization client.' }
  ];

  return (
    <div className="bg-surface text-text-primary min-h-screen flex flex-col font-sans transition-colors duration-200">
      
      {/* Navbar static duplicate */}
      <header className="bg-surface/85 backdrop-blur-md border-b border-customBorder shadow-xs h-64 flex items-center justify-between px-20 md:px-48 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="w-10 h-10 bg-accent rounded-sm flex-shrink-0" />
          <Link to="/" className="font-serif italic text-lg font-bold text-primary tracking-tight">Precision Ledger</Link>
        </div>
        <nav className="hidden md:flex items-center gap-32 text-xs font-semibold tracking-wider uppercase">
          <Link to="/" className="text-text-secondary hover:text-accent transition-colors">Home</Link>
          <Link to="/about" className="text-text-secondary hover:text-accent transition-colors">About</Link>
          <Link to="/services" className="text-text-primary hover:text-accent transition-colors">Services</Link>
          <Link to="/products" className="text-text-secondary hover:text-accent transition-colors">Products</Link>
          <Link to="/contact" className="text-text-secondary hover:text-accent transition-colors">Contact</Link>
        </nav>
        <div>
          <Link to="/login" className="px-20 py-8 text-xs font-bold tracking-wider uppercase border border-primary text-primary hover:bg-primary hover:text-white rounded-sm transition-all">
            Login Portal
          </Link>
        </div>
      </header>

      {/* --- PAGE HERO --- */}
      <section className="bg-primary text-white py-48 px-20 md:px-48 text-center space-y-12 card-texture-overlay">
        <span className="text-accent text-xs font-bold uppercase tracking-wider font-mono">System Modules & Pricing</span>
        <h1 className="font-serif text-[34px] leading-tight text-white">Authoritative Operations Ledger</h1>
        <p className="text-gray-300 text-xs max-w-md mx-auto leading-relaxed">
          Inspect our three standard modules and pricing structures. Custom-designed for artisan retail shops.
        </p>
      </section>

      {/* --- SERVICES GRID --- */}
      <section className="py-64 px-20 md:px-48 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
          {services.map((s, idx) => (
            <div key={idx} className="bg-surface-card p-24 border border-customBorder rounded-md shadow-xs hover:-translate-y-4 hover:shadow-sm transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="mb-16">{s.icon}</div>
                <h3 className="font-serif text-base font-bold text-primary mb-12">{s.title}</h3>
                <p className="text-text-secondary text-xs leading-relaxed mb-20">{s.desc}</p>
              </div>
              <ul className="space-y-8 border-t border-customBorder pt-16 text-xs text-text-secondary">
                {s.bullets.map((bullet, bidx) => (
                  <li key={bidx} className="flex items-center gap-8">
                    <Check size={14} className="text-accent flex-shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* --- PRICING PLANS --- */}
      <section className="py-64 bg-[#F2F1EC] border-y border-customBorder px-20 md:px-48">
        <div className="max-w-5xl mx-auto w-full space-y-36">
          <div className="text-center space-y-12">
            <h2 className="font-serif text-2xl text-primary">Simple Transparent Rates</h2>
            
            {/* Toggle Switch */}
            <div className="flex items-center justify-center gap-12 pt-8">
              <span className={`text-xs font-bold ${billingPeriod === 'monthly' ? 'text-primary' : 'text-text-muted'}`}>Monthly</span>
              <button 
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="w-40 h-24 bg-primary rounded-pill p-2 relative flex items-center transition-colors focus:outline-none"
              >
                <span className={`w-18 h-18 bg-accent rounded-full shadow-sm transform transition-transform duration-200 ${
                  billingPeriod === 'yearly' ? 'translate-x-16' : 'translate-x-0'
                }`} />
              </button>
              <div className="flex items-center gap-6">
                <span className={`text-xs font-bold ${billingPeriod === 'yearly' ? 'text-primary' : 'text-text-muted'}`}>Yearly</span>
                <span className="bg-accent-soft text-warning text-[9px] font-bold px-6 py-2 rounded-sm font-mono uppercase">Save 20%</span>
              </div>
            </div>
          </div>

          {/* Plan Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-24 items-stretch max-w-4xl mx-auto">
            {/* Tier 1 */}
            <div className="bg-surface-card p-24 border border-customBorder rounded-md flex flex-col justify-between shadow-xs">
              <div className="space-y-12">
                <h4 className="font-serif text-sm font-bold text-text-secondary">Starter</h4>
                <p className="text-text-muted text-[11px]">Best for small home operations</p>
                <div className="py-12 border-y border-customBorder">
                  <span className="font-serif text-[26px] font-bold text-primary">$0</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-mono"> / forever</span>
                </div>
                <ul className="space-y-8 pt-8 text-xs text-text-secondary">
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>50 Products limit</span></li>
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>1 Cashier user</span></li>
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>Standard POS Sales</span></li>
                </ul>
              </div>
              <button onClick={() => setBillingPeriod('monthly')} className="w-full mt-24 py-10 text-xs font-bold bg-surface border border-customBorder hover:bg-surface-card rounded-sm transition-colors uppercase tracking-wider">
                Select Free Plan
              </button>
            </div>

            {/* Tier 2 (Highlighted) */}
            <div className="bg-surface-card p-24 border-2 border-accent rounded-md flex flex-col justify-between shadow-md relative scale-105">
              <span className="absolute -top-12 right-24 bg-accent text-white font-mono text-[9px] font-bold px-8 py-2 rounded-pill uppercase tracking-wider">
                Most Popular
              </span>
              <div className="space-y-12">
                <h4 className="font-serif text-sm font-bold text-primary">Professional</h4>
                <p className="text-text-muted text-[11px]">Complete log audit coverage</p>
                <div className="py-12 border-y border-customBorder">
                  <span className="font-serif text-[26px] font-bold text-primary">
                    {billingPeriod === 'monthly' ? '$29.99' : '$23.99'}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-mono"> / month</span>
                </div>
                <ul className="space-y-8 pt-8 text-xs text-text-secondary font-medium">
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>Unlimited Products</span></li>
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>5 Shop Users & Roles</span></li>
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>Real-time Stock Alerts</span></li>
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>P&L PDF Ledger Exports</span></li>
                </ul>
              </div>
              <Link to="/login" className="w-full mt-24 py-10 text-xs font-bold text-center bg-accent hover:bg-accent/90 text-white rounded-sm transition-all uppercase tracking-wider">
                Start Demo Trial
              </Link>
            </div>

            {/* Tier 3 */}
            <div className="bg-surface-card p-24 border border-customBorder rounded-md flex flex-col justify-between shadow-xs">
              <div className="space-y-12">
                <h4 className="font-serif text-sm font-bold text-text-secondary">Enterprise</h4>
                <p className="text-text-muted text-[11px]">Multi-branch warehouse configurations</p>
                <div className="py-12 border-y border-customBorder">
                  <span className="font-serif text-[26px] font-bold text-primary">Custom</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-mono"> / contract</span>
                </div>
                <ul className="space-y-8 pt-8 text-xs text-text-secondary">
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>Multi-warehouse Sync</span></li>
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>Dedicated Account Manager</span></li>
                  <li className="flex items-center gap-8"><Check size={12} className="text-accent" /> <span>Tailored ERP integration</span></li>
                </ul>
              </div>
              <button onClick={() => navigate('/contact')} className="w-full mt-24 py-10 text-xs font-bold bg-surface border border-customBorder hover:bg-surface-card rounded-sm transition-colors uppercase tracking-wider">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-64 px-20 md:px-48 max-w-4xl mx-auto w-full">
        <div className="text-center mb-48">
          <HelpCircle size={32} className="text-accent mx-auto mb-12" />
          <h2 className="font-serif text-xl md:text-2xl text-primary">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-12">
          {faqItems.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="border-b border-customBorder pb-12 transition-colors">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex justify-between items-center text-left text-sm font-bold text-text-primary py-8 focus:outline-none"
                >
                  <span>{item.q}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className={`mt-8 text-xs text-text-secondary leading-relaxed transition-all duration-200 overflow-hidden ${
                  isExpanded ? 'max-h-120 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}>
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="bg-primary text-gray-500 py-24 text-center text-xs mt-auto border-t border-primary-light/10">
        &copy; {new Date().getFullYear()} Precision Ledger. All rights reserved.
      </footer>
    </div>
  );
}

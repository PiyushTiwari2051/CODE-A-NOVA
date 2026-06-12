import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Eye, DollarSign, Activity } from 'lucide-react';

export default function ProductsShowcase() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Gourmet Foods', 'Stationery & Leather', 'Specialty Apparel', 'Organic Cosmetics'];

  const showcaseProducts = [
    { name: 'Organic Ceremonial Matcha Powder', category: 'Gourmet Foods', price: 28.00, stock: 'In Stock', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=300&auto=format&fit=crop' },
    { name: 'Smoked Spanish Paprika Jar', category: 'Gourmet Foods', price: 8.50, stock: 'Low Stock', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=300&auto=format&fit=crop' },
    { name: 'Handcrafted Grain Leather Journal', category: 'Stationery & Leather', price: 35.00, stock: 'In Stock', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop' },
    { name: 'Heavyweight Cotton Vintage Tee', category: 'Specialty Apparel', price: 22.00, stock: 'In Stock', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300&auto=format&fit=crop' },
    { name: 'Cold Pressed Olive Oil', category: 'Gourmet Foods', price: 24.00, stock: 'Out of Stock', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=300&auto=format&fit=crop' },
    { name: 'Organic French Lavender Soap Bar', category: 'Organic Cosmetics', price: 5.50, stock: 'In Stock', image: 'https://images.unsplash.com/photo-1607006342445-5207b8cc7c62?q=80&w=300&auto=format&fit=crop' },
  ];

  const filteredProducts = selectedCategory === 'All' 
    ? showcaseProducts 
    : showcaseProducts.filter(p => p.category === selectedCategory);

  return (
    <div className="bg-surface text-text-primary min-h-screen flex flex-col font-sans transition-colors duration-200">
      
      {/* Navbar duplicate static layout */}
      <header className="bg-surface/85 backdrop-blur-md border-b border-customBorder shadow-xs h-64 flex items-center justify-between px-20 md:px-48 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="w-10 h-10 bg-accent rounded-sm flex-shrink-0" />
          <Link to="/" className="font-serif italic text-lg font-bold text-primary tracking-tight">Precision Ledger</Link>
        </div>
        <nav className="hidden md:flex items-center gap-32 text-xs font-semibold tracking-wider uppercase">
          <Link to="/" className="text-text-secondary hover:text-accent transition-colors">Home</Link>
          <Link to="/about" className="text-text-secondary hover:text-accent transition-colors">About</Link>
          <Link to="/services" className="text-text-secondary hover:text-accent transition-colors">Services</Link>
          <Link to="/products" className="text-text-primary hover:text-accent transition-colors">Products</Link>
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
        <span className="text-accent text-xs font-bold uppercase tracking-wider font-mono">Catalog Showcase</span>
        <h1 className="font-serif text-[34px] leading-tight text-white">What you can manage</h1>
        <p className="text-gray-300 text-xs max-w-md mx-auto leading-relaxed">
          See a demonstration of the catalog layout. Shopkeepers can organize items, assign wholesale cost, set sales prices, and monitor stock depletion levels.
        </p>
      </section>

      {/* --- CATEGORIES ROW --- */}
      <section className="pt-32 px-20 md:px-48 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-8 overflow-x-auto pb-8 border-b border-customBorder scrollbar-none">
          <Filter size={14} className="text-text-muted mr-8 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-12 py-6 rounded-pill text-[11px] font-semibold tracking-wide uppercase transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-accent text-white shadow-xs' 
                  : 'bg-surface-card hover:bg-customBorder/30 text-text-secondary border border-customBorder'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* --- SHOWCASE PRODUCT GRID --- */}
      <section className="py-32 px-20 md:px-48 max-w-6xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-24">
          {filteredProducts.map((p, idx) => (
            <div 
              key={idx} 
              className="bg-surface-card border border-customBorder rounded-md overflow-hidden shadow-xs hover:shadow-md group transition-all duration-300"
            >
              {/* Product Image container */}
              <div className="h-160 bg-gray-100 overflow-hidden relative border-b border-customBorder">
                <img 
                  src={p.image} 
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300" 
                />
              </div>

              {/* Product Info */}
              <div className="p-16 space-y-12">
                <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-6 py-2 rounded-sm font-mono uppercase tracking-wider">
                  {p.category}
                </span>
                
                <h4 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors leading-tight line-clamp-1">
                  {p.name}
                </h4>

                <div className="flex items-center justify-between border-t border-customBorder/60 pt-12">
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    ${p.price.toFixed(2)}
                  </span>
                  
                  {/* Stock status badges */}
                  <span className={`text-[9px] font-bold px-6 py-2 rounded-pill uppercase tracking-wider ${
                    p.stock === 'In Stock' 
                      ? 'bg-success/10 text-success' 
                      : p.stock === 'Low Stock' 
                        ? 'bg-warning/10 text-warning' 
                        : 'bg-danger/10 text-danger'
                  }`}>
                    {p.stock}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- PLATFORM PREVIEW HTML/CSS MOCKUP --- */}
      <section className="py-64 bg-[#F2F1EC] border-t border-customBorder px-20 md:px-48">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-48 items-center">
          <div className="lg:col-span-5 space-y-16">
            <h2 className="font-serif text-2xl text-primary leading-tight">Advanced Ledger Metrics</h2>
            <div className="h-2 w-48 bg-accent" />
            <p className="text-text-secondary text-xs leading-relaxed">
              Every detail is modeled to mimic professional trading dashboards. Stat panels are clean, data tables support left-row amber highlights, and reports are paginated server-side for speed.
            </p>
            <ul className="space-y-8 text-xs text-text-secondary">
              <li className="flex items-center gap-8"><Eye size={14} className="text-accent" /> <span>Drawer detail panels for quick views</span></li>
              <li className="flex items-center gap-8"><DollarSign size={14} className="text-accent" /> <span>Dynamic selling margin indicators</span></li>
              <li className="flex items-center gap-8"><Activity size={14} className="text-accent" /> <span>Sequential stock movement histories</span></li>
            </ul>
          </div>

          {/* HTML/CSS Mockup Illustration */}
          <div className="lg:col-span-7 bg-primary rounded-md shadow-md p-16 text-white text-[11px] font-mono border border-primary-light/25 space-y-12">
            <div className="flex justify-between items-center border-b border-primary-light/20 pb-8 text-[9px] text-gray-400 uppercase tracking-wider">
              <span>System UI Mockup</span>
              <span className="w-8 h-8 rounded-full bg-accent" />
            </div>
            
            {/* KPI Card */}
            <div className="grid grid-cols-3 gap-12 pt-8">
              <div className="bg-primary-light/20 border border-primary-light/10 p-12 rounded-sm space-y-4">
                <span className="text-gray-400 text-[10px]">REVENUE</span>
                <p className="text-sm font-bold text-accent">$2,904.50</p>
              </div>
              <div className="bg-primary-light/20 border border-primary-light/10 p-12 rounded-sm space-y-4">
                <span className="text-gray-400 text-[10px]">PRODUCTS</span>
                <p className="text-sm font-bold text-accent">145 items</p>
              </div>
              <div className="bg-primary-light/20 border border-primary-light/10 p-12 rounded-sm space-y-4">
                <span className="text-gray-400 text-[10px]">LOW LIMIT</span>
                <p className="text-sm font-bold text-danger">3 items</p>
              </div>
            </div>

            {/* Table Mock */}
            <div className="bg-[#1c1c1c]/40 rounded-sm border border-primary-light/10 p-12 space-y-8 mt-12">
              <div className="flex justify-between text-gray-400 font-bold border-b border-primary-light/10 pb-4">
                <span>PRODUCT</span>
                <div className="flex gap-24">
                  <span>STOCK</span>
                  <span>PRICE</span>
                </div>
              </div>
              <div className="flex justify-between hover:bg-primary-light/10 py-4 px-4 rounded-sm border-l-2 border-accent transition-colors">
                <span className="truncate max-w-[120px]">Ceremonial Matcha</span>
                <div className="flex gap-24 font-semibold">
                  <span className="text-success">45 tin</span>
                  <span>$28.00</span>
                </div>
              </div>
              <div className="flex justify-between hover:bg-primary-light/10 py-4 px-4 rounded-sm border-l-2 border-accent transition-colors">
                <span className="truncate max-w-[120px]">Leather Journal</span>
                <div className="flex gap-24 font-semibold">
                  <span className="text-success">18 pcs</span>
                  <span>$35.00</span>
                </div>
              </div>
              <div className="flex justify-between hover:bg-primary-light/10 py-4 px-4 rounded-sm border-l-2 border-danger transition-colors">
                <span className="truncate max-w-[120px]">Spanish Paprika</span>
                <div className="flex gap-24 font-semibold">
                  <span className="text-warning">8 jar</span>
                  <span>$8.50</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-primary text-gray-500 py-24 text-center text-xs mt-auto border-t border-primary-light/10">
        &copy; {new Date().getFullYear()} Precision Ledger. All rights reserved.
      </footer>
    </div>
  );
}

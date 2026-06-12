import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Compass, Heart, Shield } from 'lucide-react';

export default function About() {
  const [activeTab, setActiveTab] = useState('mission');

  const team = [
    { name: 'Arthur Pendelton', role: 'Founder & Architect', bio: 'Bespoke retailer with 15 years in logistics.', initials: 'AP' },
    { name: 'Clara Oswald', role: 'Lead Design General', bio: 'Expert in micro-interactions and typographic grids.', initials: 'CO' },
    { name: 'Julian Vance', role: 'Database Engineer', bio: 'Master of transaction isolation and indexed queries.', initials: 'JV' },
  ];

  const milestones = [
    { year: '2024', title: 'The Concept Born', desc: 'Realized that artisan shopkeepers needed an authoritative ledger, not just basic spreadsheets.' },
    { year: '2025', title: 'Private Beta Run', desc: 'Tested with 50 local Boston retailers managing handbound goods and organic pantry items.' },
    { year: '2026', title: 'Version 2.0 Inception', desc: 'Launched full-scale reporting metrics, Profit & Loss summaries, and silent access renewals.' }
  ];

  return (
    <div className="bg-surface text-text-primary min-h-screen flex flex-col font-sans transition-colors duration-200">
      
      {/* Navbar duplicate layout (static) */}
      <header className="bg-surface/85 backdrop-blur-md border-b border-customBorder shadow-xs h-64 flex items-center justify-between px-20 md:px-48 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="w-10 h-10 bg-accent rounded-sm flex-shrink-0" />
          <Link to="/" className="font-serif italic text-lg font-bold text-primary tracking-tight">Precision Ledger</Link>
        </div>
        <nav className="hidden md:flex items-center gap-32 text-xs font-semibold tracking-wider uppercase">
          <Link to="/" className="text-text-secondary hover:text-accent transition-colors">Home</Link>
          <Link to="/about" className="text-text-primary hover:text-accent transition-colors">About</Link>
          <Link to="/services" className="text-text-secondary hover:text-accent transition-colors">Services</Link>
          <Link to="/products" className="text-text-secondary hover:text-accent transition-colors">Products</Link>
          <Link to="/contact" className="text-text-secondary hover:text-accent transition-colors">Contact</Link>
        </nav>
        <div>
          <Link to="/login" className="px-20 py-8 text-xs font-bold tracking-wider uppercase border border-primary text-primary hover:bg-primary hover:text-white rounded-sm transition-all">
            Login Portal
          </Link>
        </div>
      </header>

      {/* --- HERO BANNER --- */}
      <section className="bg-primary text-white py-64 px-20 md:px-48 relative overflow-hidden card-texture-overlay">
        <div className="max-w-4xl mx-auto space-y-12 text-center relative z-10">
          <span className="text-accent text-xs font-bold tracking-wider uppercase font-mono">Our Heritage Story</span>
          <h1 className="font-serif text-[34px] md:text-[46px] leading-tight text-white">
            Built by shopkeepers, for shopkeepers.
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            We understand the delicate balance of artisan commerce. Tracking batch-crafted candles, leather bindings, or organic extracts requires a specific layer of precision that corporate templates neglect.
          </p>
        </div>
      </section>

      {/* --- MISSION SECTION --- */}
      <section className="py-64 px-20 md:px-48 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-48 items-start">
        <div className="md:col-span-5 space-y-16">
          <h2 className="font-serif text-2xl text-primary leading-tight">Authentic Bookkeeping Standards</h2>
          <div className="h-2 w-48 bg-accent" />
          <p className="text-text-secondary text-xs leading-relaxed">
            Our mission lies in restoring authority to shop floor ledgers. Precision Ledger integrates stock records with Point of Sale calculations and supplier purchase pipelines.
          </p>
        </div>

        <div className="md:col-span-7 border-l border-customBorder pl-24 md:pl-48 py-8">
          <p className="font-serif italic text-base md:text-lg text-accent leading-relaxed">
            "A craftsman is only as good as their tools. Precision Ledger is the digital caliper for your shelves. Accuracy is not optional — it is a mandate."
          </p>
          <p className="mt-12 text-xs font-bold text-text-primary">— Arthur Pendelton, Founder</p>
        </div>
      </section>

      {/* --- VALUES GRID --- */}
      <section className="py-48 bg-[#F2F1EC] border-y border-customBorder px-20 md:px-48">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-36">
            <h2 className="font-serif text-xl md:text-2xl text-primary">Our Core Operating Standards</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-24">
            <div className="bg-surface-card p-20 border border-customBorder rounded-sm shadow-xs">
              <Shield className="text-accent mb-12" size={20} />
              <h4 className="font-serif text-sm font-bold text-primary mb-6">Absolute Accuracy</h4>
              <p className="text-text-secondary text-[11px] leading-relaxed">Continuous calculations protect profit logs and stock balances.</p>
            </div>
            <div className="bg-surface-card p-20 border border-customBorder rounded-sm shadow-xs">
              <Target className="text-accent mb-12" size={20} />
              <h4 className="font-serif text-sm font-bold text-primary mb-6">Ledger Simplicity</h4>
              <p className="text-text-secondary text-[11px] leading-relaxed">Authoritative design prioritizes visual layout and monospaced digits.</p>
            </div>
            <div className="bg-surface-card p-20 border border-customBorder rounded-sm shadow-xs">
              <Compass className="text-accent mb-12" size={20} />
              <h4 className="font-serif text-sm font-bold text-primary mb-6">Reliable Sync</h4>
              <p className="text-text-secondary text-[11px] leading-relaxed">Server caching secures records across cash registers instantly.</p>
            </div>
            <div className="bg-surface-card p-20 border border-customBorder rounded-sm shadow-xs">
              <Heart className="text-accent mb-12" size={20} />
              <h4 className="font-serif text-sm font-bold text-primary mb-6">Artisan Growth</h4>
              <p className="text-text-secondary text-[11px] leading-relaxed">Providing deep P&L insights helps local businesses expand.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TEAM SECTION (Transforms 2 degrees on hover) --- */}
      <section className="py-64 px-20 md:px-48 max-w-5xl mx-auto w-full">
        <div className="text-center mb-48">
          <h2 className="font-serif text-xl md:text-2xl text-primary">Craftsmen behind the Code</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
          {team.map((member) => (
            <div 
              key={member.name}
              className="bg-surface-card p-20 border border-customBorder rounded-md shadow-xs transition-transform duration-200 hover:rotate-2 cursor-pointer"
            >
              <div className="w-48 h-48 rounded-full bg-accent/15 flex items-center justify-center text-accent font-serif font-bold text-sm mb-16 mx-auto">
                {member.initials}
              </div>
              <h4 className="text-sm font-bold text-text-primary text-center">{member.name}</h4>
              <p className="text-[11px] text-text-muted text-center font-mono uppercase mt-4">{member.role}</p>
              <p className="text-xs text-text-secondary text-center mt-12 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- VERTICAL TIMELINE --- */}
      <section className="py-64 bg-surface border-t border-customBorder px-20 md:px-48">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-48">
            <h2 className="font-serif text-xl md:text-2xl text-primary">Project Milestones</h2>
          </div>
          
          <div className="relative border-l border-customBorder pl-24 space-y-32 ml-12">
            {milestones.map((milestone) => (
              <div key={milestone.year} className="relative">
                {/* Dotted indicator */}
                <span className="absolute -left-30 top-4 w-12 h-12 rounded-full bg-accent border border-surface shadow-xs" />
                
                <div>
                  <span className="font-mono text-xs font-bold text-accent">{milestone.year}</span>
                  <h4 className="font-serif text-sm font-bold text-primary mt-4">{milestone.title}</h4>
                  <p className="text-xs text-text-secondary mt-8 leading-relaxed">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Footer duplication */}
      <footer className="bg-primary text-gray-500 py-24 text-center text-xs mt-auto border-t border-primary-light/10">
        &copy; {new Date().getFullYear()} Precision Ledger. All rights reserved.
      </footer>
    </div>
  );
}

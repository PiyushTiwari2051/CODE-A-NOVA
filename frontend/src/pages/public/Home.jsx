import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Zap, Smartphone, ChevronRight, Play, 
  ArrowRight, Award, Quote, CheckCircle2 
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Navbar blur transition on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-surface text-text-primary min-h-screen flex flex-col font-sans transition-colors duration-200">
      
      {/* --- NAVBAR --- */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-64 flex items-center justify-between px-20 md:px-48 transition-all ${
        scrolled 
          ? 'bg-surface/85 backdrop-blur-md border-b border-customBorder shadow-xs' 
          : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-8">
          <span className="w-10 h-10 bg-accent rounded-sm flex-shrink-0" />
          <span className="font-serif italic text-lg font-bold text-primary tracking-tight">Precision Ledger</span>
        </div>

        <nav className="hidden md:flex items-center gap-32 text-xs font-semibold tracking-wider uppercase">
          <Link to="/" className="text-text-primary hover:text-accent transition-colors">Home</Link>
          <Link to="/about" className="text-text-secondary hover:text-accent transition-colors">About</Link>
          <Link to="/services" className="text-text-secondary hover:text-accent transition-colors">Services</Link>
          <Link to="/products" className="text-text-secondary hover:text-accent transition-colors">Products</Link>
          <Link to="/contact" className="text-text-secondary hover:text-accent transition-colors">Contact</Link>
        </nav>

        <div>
          <Link 
            to="/login"
            className="px-20 py-8 text-xs font-bold tracking-wider uppercase border border-primary text-primary hover:bg-primary hover:text-white rounded-sm transition-all"
          >
            Login Portal
          </Link>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-96 pb-64 px-20 md:px-48 flex flex-col lg:flex-row items-center gap-48 max-w-7xl mx-auto w-full flex-1">
        {/* Left Copy */}
        <div className="flex-1 space-y-24">
          <span className="inline-block bg-accent-soft text-warning text-xs font-bold px-12 py-4 rounded-pill tracking-wider uppercase">
            Ledger & Stock Operations
          </span>
          <h1 className="font-serif text-[34px] md:text-[46px] text-primary font-extrabold leading-tight">
            Every shelf. Every sale.<br />
            Every supplier. <span className="italic text-accent">All in one place.</span>
          </h1>
          <p className="text-text-secondary text-[15px] md:text-[17px] max-w-lg leading-relaxed">
            Precision Ledger is a premium financial instrument crossed with an artisan ledger. Built to track inventory, optimize procurement, and catalog your sales journal with absolute Swiss fidelity.
          </p>
          
          <div className="flex flex-wrap gap-16 pt-8">
            <button 
              onClick={() => navigate('/login')}
              className="bg-accent hover:bg-accent/90 text-white font-bold text-xs tracking-wider uppercase px-24 py-12 rounded-sm shadow-sm transition-all flex items-center gap-8"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => navigate('/services')}
              className="bg-transparent hover:bg-primary/5 text-primary border border-primary/20 font-bold text-xs tracking-wider uppercase px-24 py-12 rounded-sm transition-all"
            >
              See Pricing Plans
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-24 pt-24 border-t border-customBorder text-xs text-text-secondary font-medium">
            <div className="flex items-center gap-8">
              <ShieldCheck size={16} className="text-accent" />
              <span>256-bit Encrypted Ledger</span>
            </div>
            <div className="flex items-center gap-8">
              <Zap size={16} className="text-accent" />
              <span>Real-Time Inventory Sync</span>
            </div>
            <div className="flex items-center gap-8">
              <Smartphone size={16} className="text-accent" />
              <span>Multi-Device Optimized</span>
            </div>
          </div>
        </div>

        {/* Right Animated Isometric SVG Shelf Illustration */}
        <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center">
          <div className="w-full aspect-[4/3] bg-white rounded-md border border-customBorder shadow-md p-16 flex items-center justify-center relative overflow-hidden card-texture-overlay">
            {/* Custom Isometric SVG with CSS keyframe animation */}
            <svg viewBox="0 0 400 300" className="w-full h-full max-w-[360px]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <style>{`
                  @keyframes blockPulse {
                    0%, 100% { fill: #E4E2DC; }
                    50% { fill: #E07B39; }
                  }
                  @keyframes fillShelf {
                    0% { transform: scaleY(0); }
                    100% { transform: scaleY(1); }
                  }
                  .box-block {
                    animation: blockPulse 4s infinite ease-in-out;
                  }
                  .box-1 { animation-delay: 0s; }
                  .box-2 { animation-delay: 1.3s; }
                  .box-3 { animation-delay: 2.6s; }
                  .shelf-line {
                    stroke-dasharray: 8;
                    animation: dash 30s linear infinite;
                  }
                  @keyframes dash {
                    to { stroke-dashoffset: -1000; }
                  }
                `}</style>
              </defs>
              {/* Ground Isometric grid lines */}
              <path d="M 50,230 L 200,300 L 350,230 L 200,160 Z" fill="#F0EFE9" stroke="#E4E2DC" strokeWidth="1" />
              <path d="M 50,150 L 200,220 L 350,150 L 200,80 Z" fill="#F0EFE9" stroke="#E4E2DC" strokeWidth="1" />
              
              {/* Shelf Framework (Deep Navy) */}
              <line x1="100" y1="260" x2="100" y2="80" stroke="#1A2B4A" strokeWidth="6" strokeLinecap="round" />
              <line x1="300" y1="260" x2="300" y2="80" stroke="#1A2B4A" strokeWidth="6" strokeLinecap="round" />
              
              {/* Horizontal Shelves */}
              <line x1="80" y1="220" x2="320" y2="220" stroke="#1A2B4A" strokeWidth="4" />
              <line x1="80" y1="140" x2="320" y2="140" stroke="#1A2B4A" strokeWidth="4" />

              {/* Box Cargo Items (Handcrafted Isometric Cubes) */}
              {/* Shelf 1 Box Left */}
              <g transform="translate(110, 160)">
                <polygon points="0,20 20,10 40,20 20,30" fill="#2D4172" />
                <polygon points="0,20 20,30 20,50 0,40" fill="#1A2B4A" />
                <polygon points="20,30 40,20 40,40 20,50" fill="#2D4172" opacity="0.8" />
              </g>

              {/* Shelf 1 Box Right (Animates Amber CTA color) */}
              <g transform="translate(230, 160)" className="box-block box-1">
                <polygon points="0,20 20,10 40,20 20,30" fill="#F5E6D8" />
                <polygon points="0,20 20,30 20,50 0,40" fill="#E07B39" />
                <polygon points="20,30 40,20 40,40 20,50" fill="#F5E6D8" opacity="0.8" />
              </g>

              {/* Shelf 2 Box Left */}
              <g transform="translate(130, 85)" className="box-block box-2">
                <polygon points="0,20 20,10 40,20 20,30" fill="#F5E6D8" />
                <polygon points="0,20 20,30 20,50 0,40" fill="#2D4172" />
                <polygon points="20,30 40,20 40,40 20,50" fill="#F5E6D8" opacity="0.8" />
              </g>

              {/* Shelf 2 Box Middle */}
              <g transform="translate(180, 85)">
                <polygon points="0,20 20,10 40,20 20,30" fill="#E07B39" />
                <polygon points="0,20 20,30 20,50 0,40" fill="#B45309" />
                <polygon points="20,30 40,20 40,40 20,50" fill="#E07B39" opacity="0.8" />
              </g>

              {/* Connected dotted scanning line */}
              <line x1="70" y1="180" x2="330" y2="180" stroke="#E07B39" strokeWidth="2" strokeDasharray="4 4" className="shelf-line" />
            </svg>
          </div>
        </div>
      </section>

      {/* --- STATS BAR --- */}
      <section className="bg-primary text-white py-32 px-20 md:px-48">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-24 text-center">
          <div>
            <p className="font-mono text-2xl font-bold text-accent">10,000+</p>
            <p className="text-xs text-gray-300 font-medium tracking-wide uppercase mt-4">Artisan Goods Tracked</p>
          </div>
          <div className="border-t md:border-t-0 md:border-x border-primary-light/30 py-16 md:py-0">
            <p className="font-mono text-2xl font-bold text-accent">99.8%</p>
            <p className="text-xs text-gray-300 font-medium tracking-wide uppercase mt-4">Ledger Accuracy</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-accent">500+</p>
            <p className="text-xs text-gray-300 font-medium tracking-wide uppercase mt-4">Active Shop Owners</p>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-64 px-20 md:px-48 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-8 max-w-xl mx-auto mb-48">
          <h2 className="font-serif text-2xl md:text-3xl text-primary">Operate with Swiss Precision</h2>
          <p className="text-text-secondary text-sm">
            Everything you need to control stock procurement, trace customer receipts, and review profit logs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
          <div className="bg-surface-card p-24 border border-customBorder rounded-md shadow-xs hover:-translate-y-4 hover:shadow-sm transition-all duration-300">
            <div className="w-40 h-40 bg-accent/10 rounded-sm flex items-center justify-center text-accent mb-16">
              <Zap size={20} />
            </div>
            <h3 className="font-serif text-base font-bold text-primary mb-8">Real-Time Stock Alarms</h3>
            <p className="text-text-secondary text-xs leading-relaxed">
              Define reorder thresholds. The system triggers visual warnings and emails when matcha tin counts or soap boxes drop too low.
            </p>
          </div>

          <div className="bg-surface-card p-24 border border-customBorder rounded-md shadow-xs hover:-translate-y-4 hover:shadow-sm transition-all duration-300">
            <div className="w-40 h-40 bg-accent/10 rounded-sm flex items-center justify-center text-accent mb-16">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-serif text-base font-bold text-primary mb-8">Smart Purchase Orders</h3>
            <p className="text-text-secondary text-xs leading-relaxed">
              Create PO documents. Update stock quantities automatically the second the supplier delivery arrives at your bay.
            </p>
          </div>

          <div className="bg-surface-card p-24 border border-customBorder rounded-md shadow-xs hover:-translate-y-4 hover:shadow-sm transition-all duration-300">
            <div className="w-40 h-40 bg-accent/10 rounded-sm flex items-center justify-center text-accent mb-16">
              <Award size={20} />
            </div>
            <h3 className="font-serif text-base font-bold text-primary mb-8">Sales Journals & POS</h3>
            <p className="text-text-secondary text-xs leading-relaxed">
              Deduct item stock and compute margins immediately during cash registry checkout. Generate print-optimized PDF invoice slips.
            </p>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-64 bg-[#F2F1EC] border-y border-customBorder px-20 md:px-48">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center space-y-8 max-w-xl mx-auto mb-48">
            <h2 className="font-serif text-2xl md:text-3xl text-primary">Simple Three-Step Integration</h2>
            <p className="text-text-secondary text-sm">How Precision Ledger streamlines your daily shop operation.</p>
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-32 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex-1 text-center space-y-8 relative z-10">
              <div className="w-48 h-48 bg-primary text-white rounded-full flex items-center justify-center font-mono font-bold text-base mx-auto shadow-sm">
                1
              </div>
              <h4 className="font-serif text-base font-bold text-primary mt-12">Log Artisan Goods</h4>
              <p className="text-text-secondary text-xs max-w-xs mx-auto">
                Create items, select categorization color tabs, and associate specific wholesale suppliers.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex-1 text-center space-y-8 relative z-10">
              <div className="w-48 h-48 bg-primary text-white rounded-full flex items-center justify-center font-mono font-bold text-base mx-auto shadow-sm">
                2
              </div>
              <h4 className="font-serif text-base font-bold text-primary mt-12">Record Transactions</h4>
              <p className="text-text-secondary text-xs max-w-xs mx-auto">
                Deduct quantity limits automatically when sales checkout occurs in your local store register.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex-1 text-center space-y-8 relative z-10">
              <div className="w-48 h-48 bg-accent text-white rounded-full flex items-center justify-center font-mono font-bold text-base mx-auto shadow-sm">
                3
              </div>
              <h4 className="font-serif text-base font-bold text-primary mt-12">Generate Audits</h4>
              <p className="text-text-secondary text-xs max-w-xs mx-auto">
                Inspect P&L gross margins, review stock movements, and export invoices for bookkeeping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-64 px-20 md:px-48 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-8 max-w-xl mx-auto mb-48">
          <h2 className="font-serif text-2xl md:text-3xl text-primary">Trusted by Global Shopkeepers</h2>
          <p className="text-text-secondary text-sm">Read the audit logs of business owners managing local artisan boutiques.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div className="bg-surface-card p-32 border border-customBorder rounded-md shadow-xs relative">
            <Quote size={40} className="absolute right-24 bottom-24 text-accent/5 pointer-events-none" />
            <p className="font-serif italic text-sm text-text-primary leading-relaxed">
              "We manage multiple specialized gourmet spice lines and leather bindings. The interface is clean, monospaced data values are highly legible, and inventory tracking runs seamlessly."
            </p>
            <div className="mt-16 flex items-center gap-12">
              <div className="w-32 h-32 rounded-full bg-primary-light flex items-center justify-center font-serif text-white text-xs font-bold uppercase">
                MC
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Marcus Vance</p>
                <p className="text-[10px] text-text-secondary">Owner, Boston Goods Emporium</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-card p-32 border border-customBorder rounded-md shadow-xs relative">
            <Quote size={40} className="absolute right-24 bottom-24 text-accent/5 pointer-events-none" />
            <p className="font-serif italic text-sm text-text-primary leading-relaxed">
              "Precision Ledger has eliminated our stock calculation errors. Reordering organic bath soaps or pressed oil jars requires a single click, and custom invoices print instantly."
            </p>
            <div className="mt-16 flex items-center gap-12">
              <div className="w-32 h-32 rounded-full bg-primary-light flex items-center justify-center font-serif text-white text-xs font-bold uppercase">
                SL
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Sarah Lansing</p>
                <p className="text-[10px] text-text-secondary">Director, Organic Living Boutique</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA BANNER --- */}
      <section className="bg-accent text-white py-48 px-20 md:px-48 text-center space-y-16">
        <h2 className="font-serif text-2xl md:text-3xl text-white">Start managing your inventory the smart way.</h2>
        <p className="text-xs text-accent-soft max-w-md mx-auto">
          Sign up now to configure your store parameters, invite cashiers, and automate low-stock emails.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-primary hover:bg-primary-light text-white text-xs font-bold tracking-wider uppercase px-24 py-12 rounded-sm shadow-sm transition-all inline-block"
        >
          Sign In Portal
        </button>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-primary text-gray-400 py-48 px-20 md:px-48 border-t border-primary-light/20 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-32">
          <div className="space-y-12">
            <span className="font-serif italic text-white text-base font-bold tracking-tight">Precision Ledger</span>
            <p className="text-gray-400 max-w-xs leading-relaxed">
              Craftsman-focused logistics and inventory control for premium artisan retailers.
            </p>
          </div>
          <div>
            <h5 className="font-serif text-white font-bold mb-12">System Quick Links</h5>
            <ul className="space-y-6">
              <li><Link to="/about" className="hover:text-white transition-colors">Our History</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Pricing Options</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Artisan Showcase</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-serif text-white font-bold mb-12">Information</h5>
            <ul className="space-y-6">
              <li><Link to="/contact" className="hover:text-white transition-colors font-semibold">Technical Support</Link></li>
              <li><span className="text-gray-400">Email: help@precisionledger.com</span></li>
            </ul>
          </div>
          <div>
            <h5 className="font-serif text-white font-bold mb-12">Operational Hours</h5>
            <p className="leading-relaxed">
              Mon - Fri: 9:00 AM - 6:00 PM EST<br />
              Saturday: Closed
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-primary-light/10 mt-32 pt-24 flex flex-col md:flex-row items-center justify-between text-gray-500">
          <span>&copy; {new Date().getFullYear()} Precision Ledger. All rights reserved.</span>
          <span className="mt-8 md:mt-0 font-serif italic text-gray-400">Made with precision and craft</span>
        </div>
      </footer>
    </div>
  );
}

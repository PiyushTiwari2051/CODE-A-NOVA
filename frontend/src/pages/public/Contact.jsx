import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Phone, Clock, MapPin, Send, 
  CheckCircle, MessageSquare, AlertCircle 
} from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="bg-surface text-text-primary min-h-screen flex flex-col font-sans transition-colors duration-200">
      
      {/* Navbar duplicate static */}
      <header className="bg-surface/85 backdrop-blur-md border-b border-customBorder shadow-xs h-64 flex items-center justify-between px-20 md:px-48 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="w-10 h-10 bg-accent rounded-sm flex-shrink-0" />
          <Link to="/" className="font-serif italic text-lg font-bold text-primary tracking-tight">Precision Ledger</Link>
        </div>
        <nav className="hidden md:flex items-center gap-32 text-xs font-semibold tracking-wider uppercase">
          <Link to="/" className="text-text-secondary hover:text-accent transition-colors">Home</Link>
          <Link to="/about" className="text-text-secondary hover:text-accent transition-colors">About</Link>
          <Link to="/services" className="text-text-secondary hover:text-accent transition-colors">Services</Link>
          <Link to="/products" className="text-text-secondary hover:text-accent transition-colors">Products</Link>
          <Link to="/contact" className="text-text-primary hover:text-accent transition-colors">Contact</Link>
        </nav>
        <div>
          <Link to="/login" className="px-20 py-8 text-xs font-bold tracking-wider uppercase border border-primary text-primary hover:bg-primary hover:text-white rounded-sm transition-all">
            Login Portal
          </Link>
        </div>
      </header>

      {/* --- SPLIT GRID SECTION --- */}
      <section className="py-48 px-20 md:px-48 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-48 items-stretch flex-1">
        
        {/* Left: Contact Form */}
        <div className="md:col-span-7 bg-surface-card p-24 md:p-32 border border-customBorder rounded-md shadow-xs flex flex-col justify-center">
          {success ? (
            <div className="text-center space-y-16 py-32">
              <div className="w-64 h-64 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
                {/* SVG path drawing animation */}
                <svg className="w-32 h-32" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-check" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-primary">Inquiry Sent Successfully</h3>
              <p className="text-text-secondary text-xs max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out to Precision Ledger support. Our technicians will inspect your ticket and respond within 12 business hours.
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                }}
                className="px-16 py-8 text-xs font-bold bg-primary hover:bg-primary-light text-white rounded-sm transition-all uppercase tracking-wider"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-16">
              <div>
                <h2 className="font-serif text-lg font-bold text-primary">Contact Support</h2>
                <p className="text-text-secondary text-[11px] mt-4">Required fields are marked with an asterisk (*)</p>
              </div>

              {/* Full Name */}
              <div className="space-y-6">
                <label className="block text-xs font-bold text-text-secondary">Full Name *</label>
                <input
                  type="text"
                  className={`w-full text-xs px-12 py-8 rounded-sm border ${
                    errors.name ? 'border-danger' : 'border-customBorder'
                  } bg-surface focus:outline-none focus:border-accent`}
                  placeholder="Arthur Pendelton"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && (
                  <p className="text-[10px] text-danger flex items-center gap-4 animate-[fadeInUp_0.2s_ease-out]">
                    <AlertCircle size={10} /> {errors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-6">
                <label className="block text-xs font-bold text-text-secondary">Email Address *</label>
                <input
                  type="email"
                  className={`w-full text-xs px-12 py-8 rounded-sm border ${
                    errors.email ? 'border-danger' : 'border-customBorder'
                  } bg-surface focus:outline-none focus:border-accent`}
                  placeholder="arthur@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && (
                  <p className="text-[10px] text-danger flex items-center gap-4 animate-[fadeInUp_0.2s_ease-out]">
                    <AlertCircle size={10} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-6">
                <label className="block text-xs font-bold text-text-secondary">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="w-full text-xs px-12 py-8 rounded-sm border border-customBorder bg-surface focus:outline-none focus:border-accent"
                  placeholder="+1 (802) 555-0143"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Subject */}
              <div className="space-y-6">
                <label className="block text-xs font-bold text-text-secondary">Subject</label>
                <select
                  className="w-full text-xs px-12 py-8 rounded-sm border border-customBorder bg-surface focus:outline-none focus:border-accent"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                  <option>Partnership</option>
                  <option>Demo Request</option>
                </select>
              </div>

              {/* Message */}
              <div className="space-y-6">
                <label className="block text-xs font-bold text-text-secondary">Message * (Min 20 chars)</label>
                <textarea
                  rows="4"
                  className={`w-full text-xs px-12 py-8 rounded-sm border ${
                    errors.message ? 'border-danger' : 'border-customBorder'
                  } bg-surface focus:outline-none focus:border-accent resize-none`}
                  placeholder="Describe your inquiry details here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                {errors.message && (
                  <p className="text-[10px] text-danger flex items-center gap-4 animate-[fadeInUp_0.2s_ease-out]">
                    <AlertCircle size={10} /> {errors.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-12 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-bold text-xs tracking-wider uppercase rounded-sm shadow-xs transition-all flex items-center justify-center gap-8"
              >
                {submitting ? 'Transmitting...' : 'Send Message'}
                {!submitting && <Send size={12} />}
              </button>
            </form>
          )}
        </div>

        {/* Right: Contact Information & Map Skeleton */}
        <div className="md:col-span-5 space-y-24 flex flex-col justify-between">
          <div className="bg-primary text-white p-24 border border-primary-light/35 rounded-md space-y-20 card-texture-overlay flex-1">
            <h3 className="font-serif text-base font-bold text-white border-b border-primary-light/20 pb-12 mb-16">
              Precision Operations HQ
            </h3>

            <div className="space-y-16 text-xs text-gray-300">
              <div className="flex items-start gap-12">
                <MapPin size={16} className="text-accent mt-4 flex-shrink-0" />
                <p className="leading-relaxed">
                  100 Financial District, Suite 400<br />
                  Boston, Massachusetts, 02108
                </p>
              </div>

              <div className="flex items-center gap-12">
                <Phone size={16} className="text-accent flex-shrink-0" />
                <span>+1 (617) 555-8830</span>
              </div>

              <div className="flex items-center gap-12">
                <Mail size={16} className="text-accent flex-shrink-0" />
                <span>support@precisionledger.com</span>
              </div>

              <div className="flex items-start gap-12">
                <Clock size={16} className="text-accent mt-4 flex-shrink-0" />
                <p className="leading-relaxed">
                  Mon - Fri: 9:00 AM - 6:00 PM EST<br />
                  Support tickets evaluated 24/7
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Google Maps Placeholder */}
          <div className="h-160 rounded-md border border-customBorder overflow-hidden relative flex items-center justify-center bg-[#E4E2DC]/30">
            {/* Skeleton Map Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted p-16 text-center space-y-8 z-10 bg-[#e4e2dc]/50 skeleton-shimmer">
              <MapPin size={24} className="text-accent" />
              <span className="text-[10px] font-bold tracking-wide uppercase">Map Interface Loaded</span>
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

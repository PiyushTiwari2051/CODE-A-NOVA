import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, KeyRound } from 'lucide-react';
import { loginStart, loginSuccess, loginFailure } from '../../store';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shake, setShake] = useState(false);

  // Forgot password flow
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState(false); // is sent status
  const [resetEmailVal, setResetEmailVal] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all credentials.');
      triggerShake();
      return;
    }

    dispatch(loginStart());

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password: password
      });

      if (res.data.success) {
        dispatch(loginSuccess(res.data));
        toast.success(`Welcome back, ${res.data.user.name}!`);
        navigate('/dashboard');
      } else {
        dispatch(loginFailure(res.data.message || 'Login failed'));
        triggerShake();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Invalid email or password credentials.';
      dispatch(loginFailure(errMsg));
      toast.error(errMsg);
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleDemoLogin = () => {
    // Fill credentials and click submit
    setEmail('admin@precisionledger.com');
    setPassword('password123');
    // We run it after state update commits
    setTimeout(async () => {
      dispatch(loginStart());
      try {
        const res = await api.post('/auth/login', {
          email: 'admin@precisionledger.com',
          password: 'password123'
        });
        if (res.data.success) {
          dispatch(loginSuccess(res.data));
          toast.success('Signed in using Demo Administrator credentials!');
          navigate('/dashboard');
        }
      } catch (err) {
        toast.error('Demo connection failed. Running locally?');
        dispatch(loginFailure('Demo failed'));
      }
    }, 100);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmailVal) {
      toast.error('Please enter your email.');
      return;
    }
    try {
      const res = await api.post('/auth/forgot-password', { email: resetEmailVal });
      if (res.data.success) {
        setForgotEmail(true);
        toast.success('Simulated email reset link printed to console!');
      }
    } catch (err) {
      toast.error('Failed to trigger reset flow');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-[#0f172a] flex items-center justify-center p-16 relative overflow-hidden card-texture-overlay">
      
      {/* Background SVG Grid design element */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="w-full max-w-md space-y-20 relative z-10">
        
        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-accent transition-colors font-mono uppercase tracking-wider">
            &larr; Return to main site
          </Link>
        </div>

        {/* Login Card */}
        <div className={`bg-surface-card rounded-md border border-customBorder shadow-lg p-24 md:p-32 space-y-24 ${
          shake ? 'animate-[shake_0.5s_ease-in-out]' : ''
        }`}>
          {/* Header */}
          <div className="text-center space-y-8">
            <div className="w-40 h-40 bg-accent/10 text-accent rounded-sm flex items-center justify-center mx-auto">
              <KeyRound size={20} />
            </div>
            <h2 className="font-serif text-lg md:text-xl text-primary font-bold">Shop Owner Portal</h2>
            <p className="text-xs text-text-secondary">Enter credentials to authenticate session logs.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-16">
            
            {/* Email Field */}
            <div className="space-y-6">
              <label className="block text-xs font-bold text-text-secondary">Email Address</label>
              <div className="flex items-center bg-surface border border-customBorder rounded-sm px-12 py-8 focus-within:border-accent">
                <Mail size={14} className="text-text-muted mr-8" />
                <input
                  type="email"
                  className="bg-transparent border-none text-xs text-text-primary focus:outline-none w-full"
                  placeholder="admin@precisionledger.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-text-secondary">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[10px] text-accent hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center bg-surface border border-customBorder rounded-sm px-12 py-8 focus-within:border-accent">
                <Lock size={14} className="text-text-muted mr-8" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="bg-transparent border-none text-xs text-text-primary focus:outline-none w-full"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-muted hover:text-text-primary p-2"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-8 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded-sm border-customBorder text-accent focus:ring-accent"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-12 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-bold text-xs tracking-wider uppercase rounded-sm shadow-xs transition-all"
            >
              {loading ? 'Authenticating...' : 'Login to Ledger'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-8 items-center">
            <div className="flex-grow border-t border-customBorder"></div>
            <span className="flex-shrink mx-16 text-text-muted text-[10px] uppercase font-mono tracking-wider">or</span>
            <div className="flex-grow border-t border-customBorder"></div>
          </div>

          {/* Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-10 bg-primary hover:bg-primary-light text-white font-bold text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center justify-center gap-8"
          >
            One-Click Demo Login
          </button>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-xs text-gray-500 font-mono uppercase tracking-wider">
          Precision Ledger &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* Forgot Password Modal (Custom Overlay instead of alert) */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 backdrop-blur-sm p-16">
          <div className="relative w-full max-w-sm bg-surface-card rounded-md border border-customBorder shadow-lg p-24 modal-animate-open">
            <h3 className="font-serif text-base font-bold text-primary mb-12">Recover Credentials</h3>
            
            {forgotEmail ? (
              <div className="space-y-12 py-12 text-center">
                <div className="w-40 h-40 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
                  <CheckCircle size={20} />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  A reset link has been dispatched to your console. Check your server terminal logs for the crypto reset URL.
                </p>
                <button
                  onClick={() => { setForgotModalOpen(false); setForgotEmail(false); setResetEmailVal(''); }}
                  className="px-16 py-8 text-xs bg-primary text-white rounded-sm"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-16">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Enter your registered address. An onboarding link will be printed to the backend server log stream.
                </p>
                <div className="space-y-6">
                  <label className="block text-[11px] font-bold text-text-secondary">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full text-xs px-12 py-8 rounded-sm border border-customBorder bg-surface focus:outline-none focus:border-accent"
                    placeholder="admin@precisionledger.com"
                    value={resetEmailVal}
                    onChange={(e) => setResetEmailVal(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-12 pt-8">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-12 py-8 text-xs border border-customBorder rounded-sm text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-12 py-8 text-xs bg-accent text-white rounded-sm font-bold"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Shake Keyframe CSS injected locally */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

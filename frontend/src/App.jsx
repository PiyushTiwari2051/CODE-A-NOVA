import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Redux Store
import store from './store';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import ProductsShowcase from './pages/public/Products';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';

// Protected Pages
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/dashboard/Products';
import Categories from './pages/dashboard/Categories';
import Suppliers from './pages/dashboard/Suppliers';
import Sales from './pages/dashboard/Sales';
import Purchases from './pages/dashboard/Purchases';
import Returns from './pages/dashboard/Returns';
import Reports from './pages/dashboard/Reports';
import Settings from './pages/dashboard/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000, // cache for 60 seconds
    },
  },
});

// Protected Route Guard Middleware
function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Custom 404 View
function NotFound() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-24 text-center text-white card-texture-overlay">
      <h1 className="font-serif text-[46px] text-accent font-extrabold mb-12">404</h1>
      <h3 className="font-serif text-lg font-bold mb-16">Document Not Found</h3>
      <p className="text-gray-300 text-xs max-w-sm mx-auto leading-relaxed mb-24">
        The ledger index you requested does not exist or has been archived. Check spelling or return home.
      </p>
      <Link 
        to="/" 
        className="px-20 py-10 bg-accent hover:bg-accent/90 text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-xs transition-all"
      >
        Return Home
      </Link>
    </div>
  );
}

// Add Link to NotFound
import { Link } from 'react-router-dom';

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/products" element={<ProductsShowcase />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/dashboard/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/dashboard/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path="/dashboard/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
        <Route path="/dashboard/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
        <Route path="/dashboard/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
        <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Fallbacks */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A2B4A',
              color: 'white',
              fontSize: '12px',
              fontFamily: 'Inter',
              borderRadius: '4px',
              border: '1px solid #E4E2DC'
            },
            success: {
              iconTheme: {
                primary: '#E07B39',
                secondary: 'white',
              },
            },
          }}
        />
      </QueryClientProvider>
    </Provider>
  );
}

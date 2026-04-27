
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutGrid, Users, User, BarChart3, Package, Layers, Image as ImageIcon, Calendar, LogOut, Crown, Search, Menu as MenuIcon, Share2, X, Loader2, AlertCircle, PlusCircle, LogIn, Store, ChevronRight, Settings, ArrowLeft, Shield, Camera, Palette } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import Home from './pages/Home.tsx';
import BusinessDetail from './pages/BusinessDetail.tsx';
import Dashboard from './pages/Dashboard.tsx';
import OwnerMenu from './pages/OwnerMenu.tsx';
import OwnerPricing from './pages/OwnerPricing.tsx';
import OwnerBanners from './pages/OwnerBanners.tsx';
import OwnerEvents from './pages/OwnerEvents.tsx';
import OwnerSettings from './pages/OwnerSettings.tsx';
import SuperAdmin from './pages/SuperAdmin.tsx';
import Onboarding from './pages/Onboarding.tsx';
import Auth from './pages/Auth.tsx';

import { supabase } from './lib/supabase.ts';
import { Business } from './types.ts';
import { useBusinesses, useBusiness } from './hooks/useBusinesses.ts';

const App: React.FC = () => {
  const queryClient = useQueryClient();
  const [loggedInId, setLoggedInId] = useState<string | null>(localStorage.getItem('gallery_menus_biz_id'));

  // Fetch all businesses for the main list
  const { 
    data: businesses = [], 
    isLoading: loadingBusinesses, 
    error: businessesError,
    refetch: refetchBusinesses
  } = useBusinesses();

  // Fetch active business details if logged in
  const {
    data: activeBusiness,
    isLoading: loadingActive,
    error: activeError,
    refetch: refetchActive
  } = useBusiness(loggedInId || undefined);

  const loading = loadingBusinesses || (!!loggedInId && loadingActive);
  const error = businessesError?.message || activeError?.message || null;

  // Background check for expired plans removed to allow Dashboard to handle it with a popup
  
  const handleOnboardingComplete = async (businessId: string) => {
    localStorage.setItem('gallery_menus_biz_id', businessId);
    setLoggedInId(businessId);
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
  };

  const handleLogin = (id: string) => {
    localStorage.setItem('gallery_menus_biz_id', id);
    setLoggedInId(id);
    queryClient.invalidateQueries({ queryKey: ['business', id] });
  };

  const handleLogout = () => {
    localStorage.removeItem('gallery_menus_biz_id');
    setLoggedInId(null);
    queryClient.setQueryData(['business', loggedInId], null);
  };

  const updateActiveBusiness = async (updated: Business) => {
    // Optimistic update
    queryClient.setQueryData(['business', updated.id], updated);
    queryClient.setQueryData(['businesses'], (prev: Business[] | undefined) => 
      prev?.map(b => b.id === updated.id ? updated : b)
    );
    
    const dbData: any = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      type: updated.type,
      province: updated.province,
      municipality: updated.municipality,
      address: updated.address,
      phone: updated.phone,
      whatsapp: updated.whatsapp,
      instagram: updated.instagram,
      facebook: updated.facebook,
      email: updated.email,
      logo_url: updated.logoUrl,
      cover_photos: updated.coverPhotos,
      is_visible: updated.isVisible,
      is_pro: updated.isPro,
      product_types: updated.cuisineTypes,
      delivery_enabled: updated.deliveryEnabled,
      delivery_price_inside: updated.deliveryPriceInside,
      delivery_price_outside: updated.deliveryPriceOutside,
      average_rating: updated.averageRating,
      ratings_count: updated.ratingsCount,
      schedule: updated.schedule,
      stats: updated.stats,
      role: updated.role
    };
    
    try {
      const { error } = await supabase.from('businesses').upsert(dbData);
      if (error) throw error;
    } catch (err) {
      console.error("Error upserting business:", err);
      queryClient.invalidateQueries({ queryKey: ['business', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    }
  };

  const deleteBusiness = async (id: string) => {
    try {
      await supabase.from('products').delete().eq('businessId', id);
      await supabase.from('categories').delete().eq('businessId', id);
      await supabase.from('events').delete().eq('businessId', id);
      await supabase.from('banners').delete().eq('businessId', id);
      
      const { error } = await supabase.from('businesses').delete().eq('id', id);
      if (error) throw error;
      
      handleLogout();
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    } catch (err) {
      console.error("Error deleting business:", err);
      throw err;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white uppercase tracking-tight">Error de Conexión</h1>
            <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black px-8 py-4 rounded-2xl font-extrabold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<PublicLayout loggedInBusinessId={loggedInId}><Home businesses={businesses} loading={loading} /></PublicLayout>} />
        <Route path="/negocio/:id" element={<PublicLayout loggedInBusinessId={loggedInId}><BusinessDetail businesses={businesses} /></PublicLayout>} />
        <Route path="/crear-negocio" element={<PublicLayout loggedInBusinessId={loggedInId}><Onboarding onComplete={handleOnboardingComplete} /></PublicLayout>} />
        <Route path="/login" element={loggedInId && activeBusiness ? <Navigate to="/admin" replace /> : <PublicLayout loggedInBusinessId={loggedInId}><Auth onLogin={handleLogin} /></PublicLayout>} />
        <Route path="/admin/*" element={
          !activeBusiness && (loading || loggedInId) ? (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-amber-500 gap-4">
              <Loader2 className="animate-spin" size={48} />
              <span className="text-xs font-extrabold uppercase tracking-widest animate-pulse">Cargando Panel...</span>
            </div>
          ) : !activeBusiness ? (
            <Navigate to="/login" replace />
          ) : (
            <AdminLayout business={activeBusiness} onLogout={handleLogout}>
              <Routes>
                <Route index element={<Dashboard business={activeBusiness} onUpdate={updateActiveBusiness} />} />
                <Route path="menu" element={<OwnerMenu business={activeBusiness} onUpdate={updateActiveBusiness} />} />
                <Route path="banners" element={<OwnerBanners business={activeBusiness} onUpdate={updateActiveBusiness} />} />
                <Route path="events" element={<OwnerEvents business={activeBusiness} onUpdate={updateActiveBusiness} />} />
                <Route path="pricing" element={<OwnerPricing business={activeBusiness} />} />
                <Route path="settings" element={<OwnerSettings business={activeBusiness} onUpdate={updateActiveBusiness} onDelete={() => deleteBusiness(activeBusiness.id)} />} />
              </Routes>
            </AdminLayout>
          )
        } />
        <Route path="/super-admin" element={<SuperAdmin businesses={businesses} onRefresh={refetchBusinesses} />} />
      </Routes>
    </HashRouter>
  );
};

const PublicHeader: React.FC<{ loggedInBusinessId: string | null }> = ({ loggedInBusinessId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isBusinessDetail = location.pathname.startsWith('/negocio/');
  const [clickCount, setClickCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSecretClick = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const newCount = clickCount + 1;
    if (newCount >= 7) {
      setClickCount(0);
      const password = window.prompt("Acceso de Desarrollador - Ingrese PIN:");
      if (password === "2024") {
        navigate('/super-admin');
      }
    } else {
      setClickCount(newCount);
      timerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  };

  return (
    <header className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md h-16 flex items-center justify-between px-6 border-b border-white/5">
      <div className="flex items-center gap-4">
        {isBusinessDetail && (
          <Link to="/" className="text-white hover:text-amber-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
        )}
        <div 
          onClick={handleSecretClick}
          className="flex items-center gap-2 text-white font-semibold text-lg cursor-default select-none active:scale-95 transition-transform"
        >
          Gallery menus
        </div>
        {!loggedInBusinessId && (
          <Link to="/admin" className="text-white text-xs font-semibold hover:text-amber-500 transition-colors">
            Ingresar
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {loggedInBusinessId ? (
          <Link 
            to="/admin" 
            className="bg-green-500 text-black px-5 py-2 rounded-xl font-medium text-xs hover:bg-green-400 transition-all flex items-center gap-2"
          >
            Ir a mi Panel
          </Link>
        ) : null}
      </div>
    </header>
  );
};

const PublicLayout: React.FC<{ children: React.ReactNode, loggedInBusinessId: string | null }> = ({ children, loggedInBusinessId }) => (
  <div className="min-h-screen flex flex-col bg-black">
    <PublicHeader loggedInBusinessId={loggedInBusinessId} />
    <main className="flex-1">{children}</main>
  </div>
);

const AdminLayout: React.FC<{ children: React.ReactNode, business: Business, onLogout: () => void }> = ({ children, business, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const isAdmin = business?.role === 'admin';

  const handleSecretClick = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const newCount = clickCount + 1;
    if (newCount >= 7) {
      setClickCount(0);
      const password = window.prompt("Acceso de Desarrollador - Ingrese PIN:");
      if (password === "2024") {
        navigate('/super-admin');
      }
    } else {
      setClickCount(newCount);
      timerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  };

  return (
    <div className="flex min-h-screen bg-black overflow-x-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`w-64 bg-black border-r border-gray-800 fixed h-full flex flex-col z-50 transition-transform md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div 
            onClick={handleSecretClick}
            className="flex items-center gap-2 text-amber-500 font-semibold text-xl mb-8 cursor-default select-none active:scale-95 transition-transform"
          >
            Gallery menus
          </div>
          <div className="bg-black border border-gray-800 p-3 rounded-xl mb-6 flex items-center gap-3">
            <img src={business.logoUrl || 'https://via.placeholder.com/150'} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div className="overflow-hidden">
              <h3 className="text-sm font-semibold text-white truncate">{business.name}</h3>
              <div className="flex gap-1 flex-wrap">
                {isAdmin && <span className="bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-tighter">Admin</span>}
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto no-scrollbar">
            {[
              { to: '/admin', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
              { to: '/admin/settings', icon: <Settings size={20} />, label: 'Mi Perfil' },
              { to: '/admin/menu', icon: <Package size={20} />, label: 'Productos' },
              { to: '/admin/banners', icon: <ImageIcon size={20} />, label: 'Banners' },
              { to: '/admin/events', icon: <Calendar size={20} />, label: 'Eventos' },
              { to: '/admin/pricing', icon: <Crown size={20} />, label: 'Estadísticas' },
            ].map(link => (
              <Link key={link.to} to={link.to} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-black hover:text-white transition-all mb-1 text-sm font-medium border border-transparent hover:border-white/5">
                {link.icon} <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-gray-800">
            <Link to={`/negocio/${business.id}`} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors mb-4 text-sm">
               <Share2 size={20} /> Ver sitio público
            </Link>
            <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors font-medium text-sm"
            >
                <LogOut size={20} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>
      <main className={`flex-1 md:ml-64 p-4 md:p-8 w-full`}>
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-400 bg-gray-800 rounded-lg"><MenuIcon size={20} /></button>
          </div>
          <div className="flex items-center gap-4">
             {isAdmin && (
               <Link to="/super-admin" className="bg-white text-black px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors">
                 Administrar
               </Link>
             )}
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                </div>
                <span className="text-xs font-semibold text-white hidden sm:block">Dueño</span>
             </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutGrid, Users, User, BarChart3, Package, Layers, Image as ImageIcon, Calendar, LogOut, Crown, Search, Menu as MenuIcon, Share2, X, Loader2, AlertCircle, PlusCircle, LogIn, Store, ChevronRight, Settings, ArrowLeft, Shield } from 'lucide-react';

import Home from './pages/Home.tsx';
import BusinessDetail from './pages/BusinessDetail.tsx';
import Dashboard from './pages/Dashboard.tsx';
import OwnerMenu from './pages/OwnerMenu.tsx';
import OwnerCategories from './pages/OwnerCategories.tsx';
import OwnerLeads from './pages/OwnerLeads.tsx';
import OwnerPricing from './pages/OwnerPricing.tsx';
import OwnerBanners from './pages/OwnerBanners.tsx';
import OwnerEvents from './pages/OwnerEvents.tsx';
import OwnerSettings from './pages/OwnerSettings.tsx';
import SuperAdmin from './pages/SuperAdmin.tsx';
import Onboarding from './pages/Onboarding.tsx';
import Auth from './pages/Auth.tsx';

import { supabase } from './lib/supabase.ts';
import { Business, PlanType } from './types.ts';

const App: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedInId, setLoggedInId] = useState<string | null>(localStorage.getItem('bravo_menu_biz_id'));

  const checkAndDowngradeExpiredPlans = async (data: any[]) => {
    const now = new Date();
    const expiredIds = data
      .filter(b => {
        const plan = b.plan;
        const expiry = b.planExpiresAt || b.plan_expires_at;
        return plan === PlanType.PRO && expiry && new Date(expiry) < now;
      })
      .map(b => b.id);

    if (expiredIds.length > 0) {
      try {
        await supabase
          .from('businesses')
          .update({ plan: PlanType.FREE, planExpiresAt: null, plan_expires_at: null })
          .in('id', expiredIds);
        
        return data.map(b => 
          expiredIds.includes(b.id) 
            ? { ...b, plan: PlanType.FREE, planExpiresAt: null, plan_expires_at: null } 
            : b
        );
      } catch (err) {
        console.error("Error degradando planes:", err);
        return data;
      }
    }
    return data;
  };

  const fetchInitialData = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('businesses').select('*');
      if (error) throw error;
      if (data) {
        const cleanedData = await checkAndDowngradeExpiredPlans(data);
        const formatted = cleanedData.map(biz => ({
          ...biz,
          isVisible: biz.isVisible ?? biz.is_visible ?? true,
          logoUrl: biz.logoUrl ?? biz.logo_url,
          coverPhotos: biz.coverPhotos ?? biz.cover_photos ?? [],
          averageRating: biz.averageRating ?? biz.average_rating ?? 0,
          ratingsCount: biz.ratingsCount ?? biz.ratings_count ?? 0,
          planExpiresAt: biz.planExpiresAt ?? biz.plan_expires_at,
          cuisineTypes: biz.cuisineTypes ?? biz.cuisine_types ?? [],
          deliveryEnabled: biz.deliveryEnabled ?? biz.delivery_enabled ?? false,
          deliveryPriceInside: biz.deliveryPriceInside ?? biz.delivery_price_inside ?? 0,
          deliveryPriceOutside: biz.deliveryPriceOutside ?? biz.delivery_price_outside ?? 0,
          
          products: biz.products || [],
          categories: biz.categories || [],
          events: biz.events || [],
          banners: biz.banners || [],
          leads: biz.leads || [],
          stats: biz.stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
        } as Business));
        setBusinesses(formatted);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActiveBusiness = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .select('*, products(*), categories(*), events(*), banners(*)')
        .eq('id', id)
        .single();
      
      if (bizError) throw bizError;

      if (bizData) {
        const now = new Date();
        const expiry = bizData.planExpiresAt || bizData.plan_expires_at;
        if (bizData.plan === PlanType.PRO && expiry && new Date(expiry) < now) {
          await supabase.from('businesses').update({ plan: PlanType.FREE, planExpiresAt: null, plan_expires_at: null }).eq('id', id);
          bizData.plan = PlanType.FREE;
          bizData.planExpiresAt = null;
        }

        setActiveBusiness({
          ...bizData,
          isVisible: bizData.isVisible ?? bizData.is_visible ?? true,
          logoUrl: bizData.logoUrl ?? bizData.logo_url,
          coverPhotos: bizData.coverPhotos ?? bizData.cover_photos ?? [],
          averageRating: bizData.averageRating ?? bizData.average_rating ?? 0,
          ratingsCount: bizData.ratingsCount ?? bizData.ratings_count ?? 0,
          planExpiresAt: bizData.planExpiresAt ?? bizData.plan_expires_at,
          cuisineTypes: bizData.cuisineTypes ?? bizData.cuisine_types ?? [],
          deliveryEnabled: bizData.deliveryEnabled ?? bizData.delivery_enabled ?? false,
          deliveryPriceInside: bizData.deliveryPriceInside ?? bizData.delivery_price_inside ?? 0,
          deliveryPriceOutside: bizData.deliveryPriceOutside ?? bizData.delivery_price_outside ?? 0,
          leads: [], 
          stats: bizData.stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
        } as Business);
      }
    } catch (e: any) {
      console.error("Load active error:", e);
      if (e.code === 'PGRST116') {
         setLoggedInId(null);
         localStorage.removeItem('bravo_menu_biz_id');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (loggedInId) loadActiveBusiness(loggedInId);
    else {
      setActiveBusiness(null);
      setLoading(false);
    }
  }, [loggedInId, loadActiveBusiness]);

  const handleOnboardingComplete = async (businessId: string) => {
    localStorage.setItem('bravo_menu_biz_id', businessId);
    setLoggedInId(businessId);
    await fetchInitialData();
  };

  const handleLogin = (id: string) => {
    localStorage.setItem('bravo_menu_biz_id', id);
    setLoggedInId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem('bravo_menu_biz_id');
    setLoggedInId(null);
    setActiveBusiness(null);
  };

  const updateActiveBusiness = async (updated: Business) => {
    setActiveBusiness(updated);
    setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
    
    const { products, categories, events, banners, leads, ...businessData } = updated;
    
    // Mapeo a snake_case para Supabase
    const dbData = {
      ...businessData,
      is_visible: businessData.isVisible,
      logo_url: businessData.logoUrl,
      cover_photos: businessData.coverPhotos,
      plan_expires_at: businessData.planExpiresAt,
      cuisine_types: businessData.cuisineTypes,
      delivery_enabled: businessData.deliveryEnabled,
      delivery_price_inside: businessData.deliveryPriceInside,
      delivery_price_outside: businessData.deliveryPriceOutside,
      average_rating: businessData.averageRating,
      ratings_count: businessData.ratingsCount
    };

    // Eliminar las versiones camelCase para evitar conflictos o ruido en la DB
    delete (dbData as any).isVisible;
    delete (dbData as any).logoUrl;
    delete (dbData as any).coverPhotos;
    delete (dbData as any).planExpiresAt;
    delete (dbData as any).cuisineTypes;
    delete (dbData as any).deliveryEnabled;
    delete (dbData as any).deliveryPriceInside;
    delete (dbData as any).deliveryPriceOutside;
    delete (dbData as any).averageRating;
    delete (dbData as any).ratingsCount;
    
    try {
      await supabase.from('businesses').upsert(dbData);
    } catch (err) {
      console.error("Error upserting business:", err);
    }
  };

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<PublicLayout loggedInBusinessId={loggedInId}><Home businesses={businesses} /></PublicLayout>} />
        <Route path="/negocio/:id" element={<PublicLayout loggedInBusinessId={loggedInId}><BusinessDetail businesses={businesses} /></PublicLayout>} />
        <Route path="/crear-negocio" element={<PublicLayout loggedInBusinessId={loggedInId}><Onboarding onComplete={handleOnboardingComplete} /></PublicLayout>} />
        <Route path="/login" element={loggedInId && activeBusiness ? <Navigate to="/admin" replace /> : <PublicLayout loggedInBusinessId={loggedInId}><Auth onLogin={handleLogin} /></PublicLayout>} />
        <Route path="/admin/*" element={
          !activeBusiness && (loading || loggedInId) ? (
            <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center text-amber-500 gap-4">
              <Loader2 className="animate-spin" size={48} />
              <span className="text-xs font-black uppercase tracking-widest animate-pulse">Cargando Panel...</span>
            </div>
          ) : !activeBusiness ? (
            <Navigate to="/login" replace />
          ) : (
            <AdminLayout business={activeBusiness} onLogout={handleLogout}>
              <Routes>
                <Route index element={<Dashboard business={activeBusiness} />} />
                <Route path="menu" element={<OwnerMenu business={activeBusiness} onUpdate={updateActiveBusiness} />} />
                <Route path="categories" element={<OwnerCategories business={activeBusiness} onUpdate={updateActiveBusiness} />} />
                <Route path="banners" element={<OwnerBanners business={activeBusiness} onUpdate={updateActiveBusiness} />} />
                <Route path="events" element={<OwnerEvents business={activeBusiness} onUpdate={updateActiveBusiness} />} />
                <Route path="leads" element={<OwnerLeads business={activeBusiness} />} />
                <Route path="pricing" element={<OwnerPricing business={activeBusiness} />} />
                <Route path="settings" element={<OwnerSettings business={activeBusiness} onUpdate={updateActiveBusiness} />} />
              </Routes>
            </AdminLayout>
          )
        } />
        <Route path="/super-admin" element={<SuperAdmin businesses={businesses} onRefresh={fetchInitialData} />} />
      </Routes>
    </HashRouter>
  );
};

const PublicHeader: React.FC<{ loggedInBusinessId: string | null }> = ({ loggedInBusinessId }) => {
  const location = useLocation();
  const isBusinessDetail = location.pathname.startsWith('/negocio/');

  return (
    <header className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md h-16 flex items-center justify-between px-6 border-b border-white/5">
      <div className="flex items-center gap-4">
        {isBusinessDetail && (
          <Link to="/" className="text-white hover:text-amber-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
        )}
        <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
          <span className="text-amber-500 text-2xl">🍴</span> Bravo Menú
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {loggedInBusinessId ? (
          <Link 
            to="/admin" 
            className="bg-green-500 text-black px-5 py-2 rounded-xl font-medium text-xs hover:bg-green-400 transition-all flex items-center gap-2"
          >
            <LayoutGrid size={16} /> Ir a mi Panel
          </Link>
        ) : (
          <Link 
            to="/login" 
            className="bg-amber-500 text-black px-5 py-2 rounded-xl font-medium text-xs hover:bg-amber-400 transition-all flex items-center gap-2"
          >
            <PlusCircle size={16} /> Crea tu menú
          </Link>
        )}
      </div>
    </header>
  );
};

const PublicLayout: React.FC<{ children: React.ReactNode, loggedInBusinessId: string | null }> = ({ children, loggedInBusinessId }) => (
  <div className="min-h-screen flex flex-col bg-[#0a0a0b]">
    <PublicHeader loggedInBusinessId={loggedInBusinessId} />
    <main className="flex-1">{children}</main>
  </div>
);

const AdminLayout: React.FC<{ children: React.ReactNode, business: Business, onLogout: () => void }> = ({ children, business, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isPro = business?.plan === PlanType.PRO;
  const isAdmin = business?.role === 'admin' || business?.phone === '59631292' || business?.phone === '5359631292';

  return (
    <div className="flex min-h-screen bg-[#0f0f11] overflow-x-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`w-64 bg-[#1a1a1c] border-r border-gray-800 fixed h-full flex flex-col z-50 transition-transform md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <Link to="/" className="flex items-center gap-2 text-amber-500 font-bold text-xl mb-8">🍴 Bravo Menú</Link>
          <div className="bg-[#242426] p-3 rounded-xl mb-6 flex items-center gap-3">
            <img src={business.logoUrl || 'https://via.placeholder.com/150'} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div className="overflow-hidden">
              <h3 className="text-sm font-bold text-white truncate">{business.name}</h3>
              <div className="flex gap-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPro ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300'}`}>{isPro ? '⭐ PRO' : '✨ GRATIS'}</span>
                {isAdmin && <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Admin</span>}
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto no-scrollbar">
            {[
              { to: '/admin/settings', icon: <Settings size={20} />, label: 'Mi Perfil' },
              { to: '/admin', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
              { to: '/admin/menu', icon: <Package size={20} />, label: 'Productos' },
              { to: '/admin/categories', icon: <Layers size={20} />, label: 'Categorías' },
              { to: '/admin/banners', icon: <ImageIcon size={20} />, label: 'Banners' },
              { to: '/admin/events', icon: <Calendar size={20} />, label: 'Eventos' },
              { to: '/admin/leads', icon: <Users size={20} />, label: 'Leads' },
              { to: '/admin/pricing', icon: <Crown size={20} />, label: 'Estadísticas' },
            ].map(link => (
              <Link key={link.to} to={link.to} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all mb-1 text-sm font-medium">
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
            <Link to={`/negocio/${business.id}`} className="text-amber-500 hover:underline text-sm font-bold flex items-center gap-2">
                <Share2 size={14} /> Ver mi página
            </Link>
          </div>
          <div className="flex items-center gap-4">
             {isAdmin && (
               <Link to="/super-admin" className="bg-white text-black px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors">
                 <Shield size={14} /> Administrar
               </Link>
             )}
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <User size={16} />
                </div>
                <span className="text-xs font-bold text-white hidden sm:block">Dueño</span>
             </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default App;

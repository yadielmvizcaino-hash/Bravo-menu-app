
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, LayoutGrid, Crown, Users, Search, 
  Eye, EyeOff, Trash2, ArrowDown, 
  X, Loader2, CheckCircle2, 
  Clock, Calendar, ArrowLeft, Zap, RefreshCw,
  TrendingUp, AlertCircle, ExternalLink, Banknote
} from 'lucide-react';
import { Business, PlanType } from '../types.ts';
import { supabase } from '../lib/supabase.ts';
import { Link } from 'react-router-dom';

const SuperAdmin: React.FC<{ businesses?: Business[], onRefresh?: () => void }> = ({ businesses: initialBusinesses, onRefresh }) => {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses || []);
  const [loading, setLoading] = useState(!initialBusinesses || initialBusinesses.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Estados para el Modal de Activación PRO
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [proDays, setProDays] = useState('30');

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const formatted = (data || []).map(b => ({
        ...b,
        stats: b.stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
      }));
      setBusinesses(formatted);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error fetching businesses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialBusinesses || initialBusinesses.length === 0) {
      fetchBusinesses();
    } else {
      setBusinesses(initialBusinesses);
      setLoading(false);
    }
  }, [initialBusinesses]);

  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    setIsActionLoading(id);
    try {
      const { error } = await supabase.from('businesses').update({ isVisible: !currentStatus }).eq('id', id);
      if (error) throw error;
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, isVisible: !currentStatus } : b));
    } catch (err) {
      alert("Error al cambiar visibilidad");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleOpenProModal = (id: string) => {
    setSelectedBizId(id);
    setIsProModalOpen(true);
  };

  const handleActivatePro = async () => {
    if (!selectedBizId) return;
    const days = parseInt(proDays);
    if (isNaN(days) || days <= 0) {
      alert("Ingresa un número de días válido");
      return;
    }

    setIsActionLoading(selectedBizId);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);
      expiresAt.setDate(expiresAt.getDate() + days);
      
      const { error } = await supabase
        .from('businesses')
        .update({ 
          plan: PlanType.PRO, 
          planExpiresAt: expiresAt.toISOString() 
        })
        .eq('id', selectedBizId);

      if (error) throw error;
      
      setBusinesses(prev => prev.map(b => 
        b.id === selectedBizId 
          ? { ...b, plan: PlanType.PRO, planExpiresAt: expiresAt.toISOString() } 
          : b
      ));
      
      setIsProModalOpen(false);
    } catch (err) {
      alert("Error al activar plan");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDowngradeToFree = async (id: string) => {
    if (!window.confirm("¿Desactivar Plan PRO inmediatamente? El negocio perderá funciones premium.")) return;
    setIsActionLoading(id);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          plan: PlanType.FREE, 
          planExpiresAt: null 
        })
        .eq('id', id);

      if (error) throw error;
      
      // Actualización inmediata del estado local
      setBusinesses(prev => prev.map(b => 
        b.id === id ? { ...b, plan: PlanType.FREE, planExpiresAt: null } : b
      ));
    } catch (err) {
      console.error("Error degradando plan:", err);
      alert("Error al degradar plan");
    } finally {
      setIsActionLoading(null);
    }
  };

  const deleteBusiness = async (id: string) => {
    if (!window.confirm("¿ELIMINAR ESTABLECIMIENTO? Esta acción es irreversible.")) return;
    setIsActionLoading(id);
    try {
      await supabase.from('businesses').delete().eq('id', id);
      setBusinesses(prev => prev.filter(b => b.id !== id));
    } finally {
      setIsActionLoading(null);
    }
  };

  const getTimeRemaining = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return { text: "Vencido", color: "text-red-500" };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return { text: `${days}d restantes`, color: "text-amber-500" };
    return { text: "Vence hoy", color: "text-red-400" };
  };

  const stats = useMemo(() => {
    const activeProCount = businesses.filter(b => b.plan === PlanType.PRO).length;
    // Asumimos 500 CUP por plan PRO según la página de precios
    const estimatedIncome = activeProCount * 500;
    
    return {
      total: businesses.length,
      pro: activeProCount,
      income: estimatedIncome
    };
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => 
      (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.phone || '').includes(searchTerm)
    );
  }, [businesses, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-300 font-sans p-4 md:p-8 selection:bg-amber-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Compacto */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141416] p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="text-amber-500" size={20} />
                <h1 className="text-xl font-black text-white uppercase tracking-tight">Panel Maestro</h1>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Infraestructura Bravo Menú</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o tel..." 
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white outline-none focus:border-amber-500/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
               onClick={fetchBusinesses} 
               className="p-2.5 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
               disabled={loading}
             >
               <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
             </button>
          </div>
        </header>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Total Negocios</p>
              <h3 className="text-2xl font-black text-white">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-[#141416] p-5 rounded-2xl border border-amber-500/10 flex items-center gap-5">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500"><Crown size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Planes PRO</p>
              <h3 className="text-2xl font-black text-white">{stats.pro}</h3>
            </div>
          </div>
          <div className="bg-[#141416] p-5 rounded-2xl border border-green-500/10 flex items-center gap-5">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500"><Banknote size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-0.5">Ingresos Mensuales</p>
              <h3 className="text-2xl font-black text-white">${stats.income.toLocaleString()} <span className="text-xs text-gray-500 font-medium">CUP</span></h3>
            </div>
          </div>
        </div>

        {/* Tabla Principal */}
        <div className="bg-[#141416] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] bg-black/40 border-b border-white/5">
                <tr>
                  <th className="px-6 py-5">Establecimiento</th>
                  <th className="px-6 py-5">Plan Actual</th>
                  <th className="px-6 py-5">Vencimiento</th>
                  <th className="px-6 py-5 text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBusinesses.map((biz) => {
                  const time = getTimeRemaining(biz.planExpiresAt);
                  const isVisible = biz.isVisible !== false;
                  const isBizActionLoading = isActionLoading === biz.id;

                  return (
                    <tr key={biz.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={biz.logoUrl || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-xl object-cover border border-white/5 shadow-inner" alt="logo" />
                          <div>
                            <p className="font-black text-white text-sm tracking-tight leading-tight uppercase">{biz.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">+{biz.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`w-1.5 h-1.5 rounded-full ${isVisible ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                           <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${biz.plan === PlanType.PRO ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-gray-800 text-gray-500'}`}>
                             {biz.plan}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {biz.plan === PlanType.PRO && time ? (
                          <div className={`flex items-center gap-1.5 text-[11px] font-black uppercase ${time.color}`}>
                            <Clock size={12} /> {time.text}
                          </div>
                        ) : (
                          <span className="text-gray-700 text-[10px] font-black tracking-widest">---</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-2.5">
                          <button 
                            onClick={() => toggleVisibility(biz.id, isVisible)} 
                            disabled={isBizActionLoading}
                            className={`p-2.5 rounded-xl transition-all border ${isVisible ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' : 'bg-gray-800 text-gray-500 border-white/5'} hover:scale-105 active:scale-95 disabled:opacity-30`}
                          >
                            {isBizActionLoading ? <Loader2 size={16} className="animate-spin" /> : isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          
                          {biz.plan === PlanType.FREE ? (
                            <button 
                              onClick={() => handleOpenProModal(biz.id)}
                              disabled={isBizActionLoading}
                              className="px-4 py-2 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 flex items-center gap-2"
                            >
                              <Zap size={12} fill="currentColor" />
                              Activar PRO
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleDowngradeToFree(biz.id)}
                              disabled={isBizActionLoading}
                              title="Degradar a Gratis"
                              className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all disabled:opacity-30"
                            >
                              {isBizActionLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDown size={16} />}
                            </button>
                          )}
                          
                          <button 
                            onClick={() => deleteBusiness(biz.id)} 
                            disabled={isBizActionLoading}
                            className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
                          >
                            <Trash2 size={16} />
                          </button>
                          <Link 
                            to={`/negocio/${biz.id}`}
                            className="p-2.5 bg-white/5 text-gray-400 rounded-xl border border-white/5 hover:text-white transition-all"
                          >
                            <ExternalLink size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredBusinesses.length === 0 && !loading && (
            <div className="py-24 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                <AlertCircle size={32} className="text-gray-700" />
              </div>
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron establecimientos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Activación PRO */}
      {isProModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1a1a1c] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Activar Suscripción</h2>
              <button onClick={() => setIsProModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center">Selecciona periodo de validez</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: '1 SEMANA', d: '7' },
                    { l: '1 MES', d: '30' },
                    { l: '3 MESES', d: '90' },
                    { l: '1 AÑO', d: '365' }
                  ].map(p => (
                    <button 
                      key={p.d}
                      onClick={() => setProDays(p.d)}
                      className={`py-3.5 rounded-xl text-[10px] font-black border transition-all tracking-widest ${proDays === p.d ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10'}`}
                    >
                      {p.l}
                    </button>
                  ))}
                </div>

                <div className="relative pt-2">
                  <Calendar className="absolute left-4 top-[62%] -translate-y-1/2 text-gray-600" size={16} />
                  <input 
                    type="number" 
                    placeholder="Días personalizados..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-black outline-none focus:border-amber-500/50 transition-all text-sm tracking-widest"
                    value={proDays}
                    onChange={(e) => setProDays(e.target.value)}
                  />
                </div>
              </div>

              <button 
                onClick={handleActivatePro}
                disabled={isActionLoading === selectedBizId || !proDays}
                className="w-full bg-amber-500 text-black py-4.5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all disabled:opacity-50 active:scale-95"
              >
                {isActionLoading === selectedBizId ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Zap size={16} fill="currentColor" />
                    Confirmar PRO
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
